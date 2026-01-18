import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'

// キャッシュ用
let cachedData: { data: ConversionPathData; timestamp: number } | null = null
const CACHE_DURATION = 10 * 60 * 1000 // 10分

interface ArticleConversionData {
  pagePath: string
  pageTitle?: string
  usersWhoConverted: number // この記事を見てDLした人数
  totalPageviews: number // この記事の総PV
  conversionRate: number // CVR (%)
  rank: number
}

interface PathPattern {
  path: string // 経路パターン
  count: number // 出現回数
  percentage: number // 割合 (%)
}

interface ConversionPathData {
  period: {
    startDate: string
    endDate: string
  }
  topArticlesByConverters: ArticleConversionData[]
  commonPathPatterns: PathPattern[]
  insights: {
    totalConvertersWithLabVisit: number // /labを見てDLした人の総数
    totalConverters: number // DL総ユーザー数
    labInfluenceRate: number // /labの影響率 (%)
    mostInfluentialArticle: string // 最も影響力のある記事
  }
}

export async function GET(request: Request) {
  try {
    // 設定チェック
    if (!isGoogleConfigured()) {
      return NextResponse.json(
        {
          error: 'Google Analytics is not configured',
          message: 'Please set GOOGLE_SERVICE_ACCOUNT_JSON and GA4_PROPERTY_ID',
          demo: true,
          data: generateDemoData(),
        },
        { status: 200 }
      )
    }

    // キャッシュチェック
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'

    if (!forceRefresh && cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        data: cachedData.data,
        cached: true,
      })
    }

    const credentials = getGoogleCredentials()
    const propertyId = process.env.GA4_PROPERTY_ID

    const analyticsDataClient = new BetaAnalyticsDataClient({ credentials })

    // 過去6ヶ月のデータを分析
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const startDate = sixMonthsAgo.toISOString().split('T')[0]
    const endDate = 'today'

    console.log('🔍 コンバージョンパス分析開始:', { startDate, endDate })

    // 1. /labページをランディングページとしてコンバージョンしたユーザー（実績データ）
    const directConversionsByPageResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'landingPage' },
      ],
      metrics: [
        { name: 'activeUsers' },
        { name: 'eventCount' },
      ],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'eventName',
                stringFilter: {
                  value: '資料ダウンロード',
                },
              },
            },
            {
              filter: {
                fieldName: 'landingPage',
                stringFilter: {
                  matchType: 'BEGINS_WITH',
                  value: '/lab',
                },
              },
            },
          ],
        },
      },
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 20,
    })

    // 2. 各/labページの総PVを取得（比較用）
    const allLabPagesResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'BEGINS_WITH',
            value: '/lab',
          },
        },
      },
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 50,
    })

    // 3. 資料ダウンロードしたユーザー総数
    const totalConvertersResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: 'activeUsers' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            value: '資料ダウンロード',
          },
        },
      },
    })

    const totalConverters = Number(totalConvertersResponse[0].rows?.[0]?.metricValues?.[0]?.value) || 0

    // データを集計
    const labPagesMap = new Map<string, { totalUsers: number; totalPageviews: number }>()
    allLabPagesResponse[0].rows?.forEach((row) => {
      const pagePath = row.dimensionValues?.[0]?.value || ''
      const totalUsers = Number(row.metricValues?.[0]?.value) || 0
      const totalPageviews = Number(row.metricValues?.[1]?.value) || 0
      labPagesMap.set(pagePath, { totalUsers, totalPageviews })
    })

    // 記事別の直接コンバージョン実績
    const topArticlesByConverters: ArticleConversionData[] = []
    let totalConvertersWithLabVisit = 0

    directConversionsByPageResponse[0].rows?.forEach((row, index) => {
      const pagePath = row.dimensionValues?.[0]?.value || ''
      const usersWhoConverted = Number(row.metricValues?.[0]?.value) || 0
      const downloadCount = Number(row.metricValues?.[1]?.value) || 0
      
      // パスの正規化（末尾のスラッシュを除去して比較）
      const normalizedPath = pagePath.replace(/\/$/, '')
      let labPageData = labPagesMap.get(pagePath) || labPagesMap.get(normalizedPath)
      
      // 完全一致しない場合、前方一致で探す
      if (!labPageData) {
        for (const [key, value] of labPagesMap.entries()) {
          const normalizedKey = key.replace(/\/$/, '')
          if (normalizedKey === normalizedPath || normalizedKey.startsWith(normalizedPath)) {
            labPageData = value
            break
          }
        }
      }
      
      const totalUsers = labPageData?.totalUsers || 0
      const totalPageviews = labPageData?.totalPageviews || 0

      totalConvertersWithLabVisit += usersWhoConverted

      // CVR計算：このページを訪問したユーザーのうち、コンバージョンした割合
      const conversionRate = totalUsers > 0
        ? Math.round((usersWhoConverted / totalUsers) * 10000) / 100
        : 0

      topArticlesByConverters.push({
        pagePath,
        usersWhoConverted,
        totalPageviews,
        conversionRate,
        rank: index + 1,
      })
    })

    // よくあるコンバージョンパス（簡易版）
    // GA4 Data APIではパス分析が制限されているため、ランディングページベースで推定
    const commonPathPatterns: PathPattern[] = []

    // ランディングページ別のコンバージョン数を取得
    const landingPageResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'landingPage' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'eventName',
                stringFilter: { value: '資料ダウンロード' },
              },
            },
            {
              filter: {
                fieldName: 'landingPage',
                stringFilter: { matchType: 'BEGINS_WITH', value: '/lab' },
              },
            },
          ],
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 10,
    })

    const totalPathCount = landingPageResponse[0].rows?.reduce(
      (sum, row) => sum + Number(row.metricValues?.[0]?.value || 0),
      0
    ) || 1

    landingPageResponse[0].rows?.forEach((row) => {
      const landingPage = row.dimensionValues?.[0]?.value || ''
      const count = Number(row.metricValues?.[0]?.value) || 0
      const percentage = Math.round((count / totalPathCount) * 10000) / 100

      commonPathPatterns.push({
        path: `${landingPage} → フォーム → DL完了`,
        count,
        percentage,
      })
    })

    // インサイトを計算
    const labInfluenceRate = totalConverters > 0
      ? Math.round((totalConvertersWithLabVisit / totalConverters) * 10000) / 100
      : 0

    const mostInfluentialArticle = topArticlesByConverters[0]?.pagePath || 'なし'

    const insights = {
      totalConvertersWithLabVisit,
      totalConverters,
      labInfluenceRate,
      mostInfluentialArticle,
    }

    const data: ConversionPathData = {
      period: { startDate, endDate },
      topArticlesByConverters,
      commonPathPatterns,
      insights,
    }

    console.log('📊 コンバージョンパス分析結果:', {
      記事数: topArticlesByConverters.length,
      総CV数: totalConverters,
      lab経由CV: totalConvertersWithLabVisit,
      影響率: `${labInfluenceRate}%`,
    })

    // キャッシュ更新
    cachedData = { data, timestamp: Date.now() }

    return NextResponse.json({
      data,
      cached: false,
    })
  } catch (error) {
    console.error('Conversion Paths API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch conversion path data',
        message: error instanceof Error ? error.message : 'Unknown error',
        demo: true,
        data: generateDemoData(),
      },
      { status: 200 }
    )
  }
}

// デモデータ生成
function generateDemoData(): ConversionPathData {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const startDate = sixMonthsAgo.toISOString().split('T')[0]

  return {
    period: {
      startDate,
      endDate: new Date().toISOString().split('T')[0],
    },
    topArticlesByConverters: [
      {
        pagePath: '/lab/agency/prm/123',
        pageTitle: 'PRMツール完全ガイド',
        usersWhoConverted: 15,
        totalPageviews: 342,
        conversionRate: 4.39,
        rank: 1,
      },
      {
        pagePath: '/lab/optimization/950',
        pageTitle: 'パートナー最適化戦略',
        usersWhoConverted: 12,
        totalPageviews: 456,
        conversionRate: 2.63,
        rank: 2,
      },
      {
        pagePath: '/lab/strategy-planning/2840',
        pageTitle: '戦略立案フレームワーク',
        usersWhoConverted: 8,
        totalPageviews: 956,
        conversionRate: 0.84,
        rank: 3,
      },
    ],
    commonPathPatterns: [
      {
        path: '/lab/agency/prm/123 → フォーム → DL完了',
        count: 8,
        percentage: 26.67,
      },
      {
        path: '/lab/optimization/950 → フォーム → DL完了',
        count: 7,
        percentage: 23.33,
      },
      {
        path: '/lab/strategy-planning/2840 → フォーム → DL完了',
        count: 5,
        percentage: 16.67,
      },
    ],
    insights: {
      totalConvertersWithLabVisit: 277,
      totalConverters: 281,
      labInfluenceRate: 98.58,
      mostInfluentialArticle: '/lab/agency/prm/123',
    },
  }
}

