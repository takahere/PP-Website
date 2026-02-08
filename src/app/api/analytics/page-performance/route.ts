import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'

// キャッシュ用
let cachedData: { data: PagePerformanceData; timestamp: number } | null = null
const CACHE_DURATION = 10 * 60 * 1000 // 10分

interface PageMetrics {
  pagePath: string
  pageTitle?: string
  users: number
  pageviews: number
  avgEngagementTime: number // 秒
  bounceRate: number // %
  exitRate: number // %
  engagementRate: number // %
  scrollRate: number // % (90%以上スクロールした割合)
  topSources: {
    source: string
    users: number
  }[]
  nextPages: {
    page: string
    sessions: number
  }[]
}

interface PagePerformanceData {
  period: {
    startDate: string
    endDate: string
  }
  topPages: PageMetrics[]
  insights: {
    highestEngagement: string
    lowestBounceRate: string
    mostViewed: string
    longestAvgTime: string
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
    const specificPage = searchParams.get('page') // 特定ページの詳細を取得

    if (!forceRefresh && !specificPage && cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
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

    console.log('🔍 ページパフォーマンス分析開始:', { startDate, endDate, specificPage })

    // ページごとの基本メトリクスを取得
    const pageMetricsResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'userEngagementDuration' },
        { name: 'bounceRate' },
        { name: 'engagementRate' },
      ],
      dimensionFilter: specificPage ? {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            value: specificPage,
          },
        },
      } : undefined,
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: specificPage ? 1 : 50,
    })

    // ページごとの流入元を取得
    const pageSourcesResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'pagePath' },
        { name: 'sessionSource' },
      ],
      metrics: [{ name: 'activeUsers' }],
      dimensionFilter: specificPage ? {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            value: specificPage,
          },
        },
      } : undefined,
      orderBys: [
        { dimension: { dimensionName: 'pagePath' } },
        { metric: { metricName: 'activeUsers' }, desc: true }
      ],
      limit: specificPage ? 10 : 200,
    })

    // データを集計
    const pagesMap = new Map<string, PageMetrics>()

    // 基本メトリクスを追加
    pageMetricsResponse[0].rows?.forEach((row) => {
      const pagePath = row.dimensionValues?.[0]?.value || ''
      const users = Number(row.metricValues?.[0]?.value) || 0
      const pageviews = Number(row.metricValues?.[1]?.value) || 0
      const totalEngagementTime = Number(row.metricValues?.[2]?.value) || 0
      const bounceRate = Math.round((Number(row.metricValues?.[3]?.value) || 0) * 100)
      const engagementRate = Math.round((Number(row.metricValues?.[4]?.value) || 0) * 100)

      const avgEngagementTime = users > 0 ? Math.round(totalEngagementTime / users) : 0

      pagesMap.set(pagePath, {
        pagePath,
        users,
        pageviews,
        avgEngagementTime,
        bounceRate,
        exitRate: 0, // GA4では直接取得できないため計算が必要
        engagementRate,
        scrollRate: 0, // スクロールイベントから計算が必要
        topSources: [],
        nextPages: [],
      })
    })

    // 流入元を追加
    const sourcesByPage = new Map<string, { source: string; users: number }[]>()
    pageSourcesResponse[0].rows?.forEach((row) => {
      const pagePath = row.dimensionValues?.[0]?.value || ''
      const source = row.dimensionValues?.[1]?.value || '(direct)'
      const users = Number(row.metricValues?.[0]?.value) || 0

      if (!sourcesByPage.has(pagePath)) {
        sourcesByPage.set(pagePath, [])
      }
      sourcesByPage.get(pagePath)!.push({ source, users })
    })

    // 流入元をpagesMapに統合
    sourcesByPage.forEach((sources, pagePath) => {
      const pageData = pagesMap.get(pagePath)
      if (pageData) {
        pageData.topSources = sources.slice(0, 5) // TOP5のみ
      }
    })

    // 配列に変換
    const topPages = Array.from(pagesMap.values())

    // インサイトを計算
    let highestEngagement = ''
    let maxEngagement = 0
    let lowestBounceRate = ''
    let minBounceRate = 100
    let mostViewed = ''
    let maxPageviews = 0
    let longestAvgTime = ''
    let maxAvgTime = 0

    topPages.forEach((page) => {
      if (page.engagementRate > maxEngagement) {
        maxEngagement = page.engagementRate
        highestEngagement = page.pagePath
      }
      if (page.bounceRate < minBounceRate && page.pageviews > 10) {
        minBounceRate = page.bounceRate
        lowestBounceRate = page.pagePath
      }
      if (page.pageviews > maxPageviews) {
        maxPageviews = page.pageviews
        mostViewed = page.pagePath
      }
      if (page.avgEngagementTime > maxAvgTime) {
        maxAvgTime = page.avgEngagementTime
        longestAvgTime = page.pagePath
      }
    })

    const insights = {
      highestEngagement,
      lowestBounceRate,
      mostViewed,
      longestAvgTime,
    }

    const data: PagePerformanceData = {
      period: { startDate, endDate },
      topPages,
      insights,
    }

    console.log('📊 ページパフォーマンス分析結果:', {
      ページ数: topPages.length,
      最多PV: mostViewed,
      最高エンゲージメント: highestEngagement,
    })

    // キャッシュ更新（特定ページ指定がない場合のみ）
    if (!specificPage) {
      cachedData = { data, timestamp: Date.now() }
    }

    return NextResponse.json({
      data,
      cached: false,
    })
  } catch (error) {
    console.error('Page Performance API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch page performance data',
        message: error instanceof Error ? error.message : 'Unknown error',
        demo: true,
        data: generateDemoData(),
      },
      { status: 200 }
    )
  }
}

// デモデータ生成
function generateDemoData(): PagePerformanceData {
  return {
    period: {
      startDate: '30daysAgo',
      endDate: 'today',
    },
    topPages: [
      {
        pagePath: '/',
        users: 5432,
        pageviews: 8765,
        avgEngagementTime: 125,
        bounceRate: 35,
        exitRate: 28,
        engagementRate: 65,
        scrollRate: 42,
        topSources: [
          { source: 'google', users: 3200 },
          { source: '(direct)', users: 1500 },
          { source: 'yahoo', users: 732 },
        ],
        nextPages: [
          { page: '/partner-marketing', sessions: 856 },
          { page: '/lab', sessions: 623 },
        ],
      },
      {
        pagePath: '/lab',
        users: 3215,
        pageviews: 5890,
        avgEngagementTime: 245,
        bounceRate: 28,
        exitRate: 22,
        engagementRate: 72,
        scrollRate: 58,
        topSources: [
          { source: 'google', users: 2100 },
          { source: '(direct)', users: 800 },
        ],
        nextPages: [
          { page: '/lab/agency/prm/123', sessions: 456 },
        ],
      },
    ],
    insights: {
      highestEngagement: '/lab/agency/prm/123',
      lowestBounceRate: '/partner-marketing',
      mostViewed: '/',
      longestAvgTime: '/lab',
    },
  }
}


















