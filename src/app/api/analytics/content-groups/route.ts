import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'

// キャッシュ用
let cachedData: { data: ContentGroupData; timestamp: number } | null = null
const CACHE_DURATION = 10 * 60 * 1000 // 10分

interface ContentGroupMetrics {
  group: string
  users: number
  pageviews: number
  avgEngagementTime: number // 秒
  bounceRate: number // %
  conversions: number
  conversionRate: number // %
  topPages: {
    page: string
    pageviews: number
  }[]
}

interface ContentGroupData {
  period: {
    startDate: string
    endDate: string
  }
  groups: ContentGroupMetrics[]
  comparison: {
    highestEngagement: string
    lowestBounceRate: string
    highestConversion: string
    mostPopular: string
  }
  insights: {
    totalGroups: number
    avgConversionRate: number
    bestPerformingGroup: string
    underperformingGroup: string
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

    // 過去30日のデータを分析
    const startDate = '30daysAgo'
    const endDate = 'today'

    console.log('🔍 コンテンツグループ別分析開始:', { startDate, endDate })

    // パスパターンに基づいてコンテンツグループを定義
    const contentGroups = [
      { name: 'トップページ', pattern: '^/$' },
      { name: 'パートナーラボ', pattern: '^/lab' },
      { name: 'ナレッジ', pattern: '^/knowledge' },
      { name: '事例紹介', pattern: '^/casestudy' },
      { name: 'セミナー', pattern: '^/seminar' },
      { name: 'ニュース', pattern: '^/news' },
      { name: '会社情報', pattern: '^/about' },
      { name: 'サービス', pattern: '^/partner-marketing|^/service' },
      { name: 'その他', pattern: '.*' }, // 最後にマッチするもの
    ]

    const groups: ContentGroupMetrics[] = []

    // 各コンテンツグループのメトリクスを取得
    for (const group of contentGroups) {
      // 基本メトリクス
      const metricsResponse = await analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
          { name: 'userEngagementDuration' },
          { name: 'bounceRate' },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'pagePath',
            stringFilter: {
              matchType: 'FULL_REGEXP',
              value: group.pattern,
            },
          },
        },
      })

      let totalUsers = 0
      let totalPageviews = 0
      let totalEngagementTime = 0
      let avgBounceRate = 0
      let pageCount = 0
      const topPagesMap = new Map<string, number>()

      metricsResponse[0].rows?.forEach((row) => {
        const pagePath = row.dimensionValues?.[0]?.value || ''
        const users = Number(row.metricValues?.[0]?.value) || 0
        const pageviews = Number(row.metricValues?.[1]?.value) || 0
        const engagementTime = Number(row.metricValues?.[2]?.value) || 0
        const bounceRate = Number(row.metricValues?.[3]?.value) || 0

        totalUsers += users
        totalPageviews += pageviews
        totalEngagementTime += engagementTime
        avgBounceRate += bounceRate
        pageCount++

        topPagesMap.set(pagePath, pageviews)
      })

      // トップページを抽出（TOP5）
      const topPages = Array.from(topPagesMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([page, pageviews]) => ({ page, pageviews }))

      // コンバージョン数を取得（このグループからの資料ダウンロード）
      const conversionResponse = await analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'activeUsers' }],
        dimensionFilter: {
          andGroup: {
            expressions: [
              {
                filter: {
                  fieldName: 'pagePath',
                  stringFilter: {
                    matchType: 'FULL_REGEXP',
                    value: group.pattern,
                  },
                },
              },
              {
                filter: {
                  fieldName: 'eventName',
                  stringFilter: {
                    value: '資料ダウンロード',
                  },
                },
              },
            ],
          },
        },
      })

      const conversions = conversionResponse[0].rows?.reduce(
        (sum, row) => sum + (Number(row.metricValues?.[0]?.value) || 0),
        0
      ) || 0

      const avgEngagementTime = totalUsers > 0 ? Math.round(totalEngagementTime / totalUsers) : 0
      const bounceRate = pageCount > 0 ? Math.round((avgBounceRate / pageCount) * 100) : 0
      const conversionRate = totalUsers > 0 ? Math.round((conversions / totalUsers) * 10000) / 100 : 0

      // データがあるグループのみ追加
      if (totalUsers > 0 || totalPageviews > 0) {
        groups.push({
          group: group.name,
          users: totalUsers,
          pageviews: totalPageviews,
          avgEngagementTime,
          bounceRate,
          conversions,
          conversionRate,
          topPages,
        })
      }
    }

    // 比較とインサイト
    let highestEngagement = ''
    let maxEngagement = 0
    let lowestBounceRate = ''
    let minBounceRate = 100
    let highestConversion = ''
    let maxConversion = 0
    let mostPopular = ''
    let maxPageviews = 0

    groups.forEach((group) => {
      if (group.avgEngagementTime > maxEngagement) {
        maxEngagement = group.avgEngagementTime
        highestEngagement = group.group
      }
      if (group.bounceRate < minBounceRate && group.users > 10) {
        minBounceRate = group.bounceRate
        lowestBounceRate = group.group
      }
      if (group.conversionRate > maxConversion) {
        maxConversion = group.conversionRate
        highestConversion = group.group
      }
      if (group.pageviews > maxPageviews) {
        maxPageviews = group.pageviews
        mostPopular = group.group
      }
    })

    const totalConversions = groups.reduce((sum, g) => sum + g.conversions, 0)
    const totalUsers = groups.reduce((sum, g) => sum + g.users, 0)
    const avgConversionRate = totalUsers > 0
      ? Math.round((totalConversions / totalUsers) * 10000) / 100
      : 0

    // 最もパフォーマンスが良いグループ（CVR基準）
    const bestPerformingGroup = groups.reduce((best, current) =>
      current.conversionRate > best.conversionRate ? current : best
    , groups[0] || { group: '', conversionRate: 0 }).group

    // パフォーマンスが低いグループ（CVRが平均以下でユーザーが多い）
    const underperformingGroup = groups
      .filter(g => g.conversionRate < avgConversionRate && g.users > 100)
      .sort((a, b) => a.conversionRate - b.conversionRate)[0]?.group || ''

    const comparison = {
      highestEngagement,
      lowestBounceRate,
      highestConversion,
      mostPopular,
    }

    const insights = {
      totalGroups: groups.length,
      avgConversionRate,
      bestPerformingGroup,
      underperformingGroup,
    }

    const data: ContentGroupData = {
      period: { startDate, endDate },
      groups,
      comparison,
      insights,
    }

    console.log('📊 コンテンツグループ別分析結果:', {
      グループ数: groups.length,
      最高CVRグループ: highestConversion,
      平均CVR: `${avgConversionRate}%`,
    })

    // キャッシュ更新
    cachedData = { data, timestamp: Date.now() }

    return NextResponse.json({
      data,
      cached: false,
    })
  } catch (error) {
    console.error('Content Groups API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch content group data',
        message: error instanceof Error ? error.message : 'Unknown error',
        demo: true,
        data: generateDemoData(),
      },
      { status: 200 }
    )
  }
}

// デモデータ生成
function generateDemoData(): ContentGroupData {
  return {
    period: {
      startDate: '30daysAgo',
      endDate: 'today',
    },
    groups: [
      {
        group: 'トップページ',
        users: 5432,
        pageviews: 8765,
        avgEngagementTime: 125,
        bounceRate: 35,
        conversions: 82,
        conversionRate: 1.51,
        topPages: [
          { page: '/', pageviews: 8765 },
        ],
      },
      {
        group: 'パートナーラボ',
        users: 3215,
        pageviews: 5890,
        avgEngagementTime: 245,
        bounceRate: 28,
        conversions: 156,
        conversionRate: 4.85,
        topPages: [
          { page: '/lab', pageviews: 2100 },
          { page: '/lab/agency/prm/123', pageviews: 890 },
          { page: '/lab/optimization/950', pageviews: 750 },
        ],
      },
      {
        group: 'ナレッジ',
        users: 2145,
        pageviews: 3890,
        avgEngagementTime: 180,
        bounceRate: 32,
        conversions: 65,
        conversionRate: 3.03,
        topPages: [
          { page: '/knowledge/service-form', pageviews: 1200 },
          { page: '/knowledge/partner-marketing-3set', pageviews: 980 },
        ],
      },
      {
        group: '事例紹介',
        users: 1820,
        pageviews: 2950,
        avgEngagementTime: 310,
        bounceRate: 22,
        conversions: 92,
        conversionRate: 5.05,
        topPages: [
          { page: '/casestudy/freee', pageviews: 980 },
          { page: '/casestudy/dinii', pageviews: 850 },
        ],
      },
      {
        group: 'セミナー',
        users: 980,
        pageviews: 1650,
        avgEngagementTime: 95,
        bounceRate: 42,
        conversions: 18,
        conversionRate: 1.84,
        topPages: [
          { page: '/seminar', pageviews: 850 },
          { page: '/seminar/1216', pageviews: 450 },
        ],
      },
    ],
    comparison: {
      highestEngagement: '事例紹介',
      lowestBounceRate: '事例紹介',
      highestConversion: '事例紹介',
      mostPopular: 'トップページ',
    },
    insights: {
      totalGroups: 5,
      avgConversionRate: 3.26,
      bestPerformingGroup: '事例紹介',
      underperformingGroup: 'セミナー',
    },
  }
}















