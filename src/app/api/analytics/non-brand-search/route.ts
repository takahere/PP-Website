import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getGoogleCredentials, isGSCConfigured } from '@/lib/google-auth'

// キャッシュ用
let cachedData: { data: NonBrandSearchData; timestamp: number } | null = null
const CACHE_DURATION = 10 * 60 * 1000 // 10分

// ブランドキーワードの定義
const BRAND_KEYWORDS = [
  'partnerprop',
  'パートナープロップ',
  'partner prop',
  'partnerlab',
  'パートナーラボ',
  'partner lab',
]

interface QueryData {
  query: string
  impressions: number
  clicks: number
  ctr: number
  position: number
}

interface NonBrandSummary {
  totalImpressions: number
  nonBrandImpressions: number
  nonBrandPercentage: number
  totalClicks: number
  nonBrandClicks: number
  nonBrandCtr: number
  brandImpressions: number
  brandClicks: number
}

interface NonBrandSearchData {
  period: {
    startDate: string
    endDate: string
  }
  brandKeywords: string[]
  summary: NonBrandSummary
  topNonBrandQueries: QueryData[]
  topBrandQueries: QueryData[]
}

// ブランドキーワードかどうかを判定
function isBrandQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase()
  return BRAND_KEYWORDS.some(brand => lowerQuery.includes(brand.toLowerCase()))
}

export async function GET(request: Request) {
  try {
    // 設定チェック
    if (!isGSCConfigured()) {
      return NextResponse.json(
        {
          error: 'Google Search Console is not configured',
          message: 'Please set GOOGLE_SERVICE_ACCOUNT_JSON and GSC_SITE_URL',
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
    const siteUrl = process.env.GSC_SITE_URL

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    })

    const searchconsole = google.searchconsole({ version: 'v1', auth })

    // 日付範囲（過去28日）
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 28)
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    // 全てのクエリデータを取得
    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDateStr,
        endDate: endDateStr,
        dimensions: ['query'],
        rowLimit: 500,
      },
    })

    // データを分類
    const brandQueries: QueryData[] = []
    const nonBrandQueries: QueryData[] = []

    let totalImpressions = 0
    let totalClicks = 0
    let brandImpressions = 0
    let brandClicks = 0
    let nonBrandImpressions = 0
    let nonBrandClicks = 0

    response.data.rows?.forEach(row => {
      const query = row.keys?.[0] || ''
      const impressions = row.impressions || 0
      const clicks = row.clicks || 0
      const ctr = (row.ctr || 0) * 100
      const position = row.position || 0

      totalImpressions += impressions
      totalClicks += clicks

      const queryData: QueryData = {
        query,
        impressions,
        clicks,
        ctr: Math.round(ctr * 100) / 100,
        position: Math.round(position * 10) / 10,
      }

      if (isBrandQuery(query)) {
        brandQueries.push(queryData)
        brandImpressions += impressions
        brandClicks += clicks
      } else {
        nonBrandQueries.push(queryData)
        nonBrandImpressions += impressions
        nonBrandClicks += clicks
      }
    })

    // 非指名キーワードをクリック数でソート
    nonBrandQueries.sort((a, b) => b.clicks - a.clicks)
    brandQueries.sort((a, b) => b.clicks - a.clicks)

    const summary: NonBrandSummary = {
      totalImpressions,
      nonBrandImpressions,
      nonBrandPercentage: totalImpressions > 0
        ? Math.round((nonBrandImpressions / totalImpressions) * 10000) / 100
        : 0,
      totalClicks,
      nonBrandClicks,
      nonBrandCtr: nonBrandImpressions > 0
        ? Math.round((nonBrandClicks / nonBrandImpressions) * 10000) / 100
        : 0,
      brandImpressions,
      brandClicks,
    }

    const data: NonBrandSearchData = {
      period: {
        startDate: startDateStr,
        endDate: endDateStr,
      },
      brandKeywords: BRAND_KEYWORDS,
      summary,
      topNonBrandQueries: nonBrandQueries.slice(0, 20),
      topBrandQueries: brandQueries.slice(0, 10),
    }

    // キャッシュ更新
    cachedData = { data, timestamp: Date.now() }

    return NextResponse.json({
      data,
      cached: false,
    })
  } catch (error) {
    console.error('Non-Brand Search API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch non-brand search data',
        message: error instanceof Error ? error.message : 'Unknown error',
        demo: true,
        data: generateDemoData(),
      },
      { status: 200 }
    )
  }
}

// デモデータ生成
function generateDemoData(): NonBrandSearchData {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 28)

  return {
    period: {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    },
    brandKeywords: BRAND_KEYWORDS,
    summary: {
      totalImpressions: 12500,
      nonBrandImpressions: 10200,
      nonBrandPercentage: 81.6,
      totalClicks: 485,
      nonBrandClicks: 380,
      nonBrandCtr: 3.73,
      brandImpressions: 2300,
      brandClicks: 105,
    },
    topNonBrandQueries: [
      { query: 'パートナーマーケティング', impressions: 850, clicks: 42, ctr: 4.94, position: 5.2 },
      { query: 'PRM ツール', impressions: 720, clicks: 38, ctr: 5.28, position: 4.8 },
      { query: 'パートナービジネス', impressions: 650, clicks: 32, ctr: 4.92, position: 6.1 },
      { query: 'アライアンス 営業', impressions: 580, clicks: 28, ctr: 4.83, position: 7.3 },
      { query: 'パートナープログラム 管理', impressions: 520, clicks: 25, ctr: 4.81, position: 8.2 },
      { query: '代理店 管理 システム', impressions: 480, clicks: 22, ctr: 4.58, position: 9.5 },
      { query: 'パートナーポータル', impressions: 450, clicks: 20, ctr: 4.44, position: 10.1 },
      { query: '間接販売 効率化', impressions: 420, clicks: 18, ctr: 4.29, position: 11.2 },
      { query: 'チャネルパートナー', impressions: 380, clicks: 15, ctr: 3.95, position: 12.5 },
      { query: 'パートナー エンゲージメント', impressions: 350, clicks: 12, ctr: 3.43, position: 14.3 },
    ],
    topBrandQueries: [
      { query: 'partnerprop', impressions: 1200, clicks: 58, ctr: 4.83, position: 1.2 },
      { query: 'パートナープロップ', impressions: 850, clicks: 35, ctr: 4.12, position: 1.5 },
      { query: 'partner prop', impressions: 250, clicks: 12, ctr: 4.8, position: 1.8 },
    ],
  }
}
