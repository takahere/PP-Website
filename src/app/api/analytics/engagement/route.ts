import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'

// キャッシュ用
let cachedData: { data: EngagementData; timestamp: number } | null = null
const CACHE_DURATION = 10 * 60 * 1000 // 10分

interface EngagementMetrics {
  totalSessions: number
  engagedSessions: number
  engagementRate: number // %
  avgEngagementTime: number // 秒
  avgSessionDuration: number // 秒
  avgPageviewsPerSession: number
  scrollDepth: {
    depth: string // 10%, 25%, 50%, 75%, 90%
    users: number
    percentage: number
  }[]
  timeOnSite: {
    range: string // 0-10s, 10-30s, 30-60s, etc.
    sessions: number
    percentage: number
  }[]
  pageDepth: {
    pages: number // 1, 2-3, 4-5, 6-10, 11+
    sessions: number
    percentage: number
  }[]
  interactions: {
    clicks: number
    scrolls: number
    searches: number
    videoPlays: number
    downloads: number
  }
}

interface EngagementData {
  period: {
    startDate: string
    endDate: string
  }
  overall: EngagementMetrics
  byDevice: {
    desktop: Partial<EngagementMetrics>
    mobile: Partial<EngagementMetrics>
    tablet: Partial<EngagementMetrics>
  }
  topEngagedPages: {
    page: string
    avgEngagementTime: number
    engagementRate: number
    scrollRate: number
  }[]
  insights: {
    avgEngagementQuality: 'high' | 'medium' | 'low'
    bestEngagementDevice: string
    improvementAreas: string[]
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

    console.log('🔍 エンゲージメント詳細分析開始:', { startDate, endDate })

    // 1. 全体のエンゲージメントメトリクス
    const overallMetricsResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'sessions' },
        { name: 'engagedSessions' },
        { name: 'engagementRate' },
        { name: 'userEngagementDuration' },
        { name: 'averageSessionDuration' },
        { name: 'screenPageViewsPerSession' },
        { name: 'activeUsers' },
      ],
    })

    const row = overallMetricsResponse[0].rows?.[0]
    const totalSessions = Number(row?.metricValues?.[0]?.value) || 0
    const engagedSessions = Number(row?.metricValues?.[1]?.value) || 0
    const engagementRate = Math.round((Number(row?.metricValues?.[2]?.value) || 0) * 100)
    const totalEngagementDuration = Number(row?.metricValues?.[3]?.value) || 0
    const avgSessionDuration = Math.round(Number(row?.metricValues?.[4]?.value) || 0)
    const avgPageviewsPerSession = Math.round((Number(row?.metricValues?.[5]?.value) || 0) * 10) / 10
    const activeUsers = Number(row?.metricValues?.[6]?.value) || 1
    const avgEngagementTime = Math.round(totalEngagementDuration / activeUsers)

    // 2. セッション時間の分布
    const timeOnSite = [
      { range: '0-10秒', sessions: 0, percentage: 0 },
      { range: '11-30秒', sessions: 0, percentage: 0 },
      { range: '31-60秒', sessions: 0, percentage: 0 },
      { range: '61-180秒', sessions: 0, percentage: 0 },
      { range: '181-600秒', sessions: 0, percentage: 0 },
      { range: '601秒以上', sessions: 0, percentage: 0 },
    ]

    // GA4では直接セッション時間の分布を取得できないため、推定値を使用
    // エンゲージメントセッション比率から推定
    const engagedRatio = totalSessions > 0 ? engagedSessions / totalSessions : 0
    timeOnSite[0].sessions = Math.round(totalSessions * (1 - engagedRatio) * 0.6)
    timeOnSite[1].sessions = Math.round(totalSessions * (1 - engagedRatio) * 0.4)
    timeOnSite[2].sessions = Math.round(totalSessions * engagedRatio * 0.3)
    timeOnSite[3].sessions = Math.round(totalSessions * engagedRatio * 0.4)
    timeOnSite[4].sessions = Math.round(totalSessions * engagedRatio * 0.2)
    timeOnSite[5].sessions = Math.round(totalSessions * engagedRatio * 0.1)

    timeOnSite.forEach((item) => {
      item.percentage = totalSessions > 0
        ? Math.round((item.sessions / totalSessions) * 10000) / 100
        : 0
    })

    // 3. ページ深度の分布
    const pageDepthResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pageViewsPerSession' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ dimension: { dimensionName: 'pageViewsPerSession' } }],
    })

    const pageDepthMap = new Map<string, number>()
    pageDepthResponse[0].rows?.forEach((row) => {
      const pagesViewed = parseInt(row.dimensionValues?.[0]?.value || '0')
      const sessions = Number(row.metricValues?.[0]?.value) || 0

      let bucket = '11ページ以上'
      if (pagesViewed === 1) bucket = '1ページ'
      else if (pagesViewed >= 2 && pagesViewed <= 3) bucket = '2-3ページ'
      else if (pagesViewed >= 4 && pagesViewed <= 5) bucket = '4-5ページ'
      else if (pagesViewed >= 6 && pagesViewed <= 10) bucket = '6-10ページ'

      pageDepthMap.set(bucket, (pageDepthMap.get(bucket) || 0) + sessions)
    })

    const pageDepth = [
      { pages: 1, sessions: pageDepthMap.get('1ページ') || 0, percentage: 0 },
      { pages: 2, sessions: pageDepthMap.get('2-3ページ') || 0, percentage: 0 },
      { pages: 4, sessions: pageDepthMap.get('4-5ページ') || 0, percentage: 0 },
      { pages: 6, sessions: pageDepthMap.get('6-10ページ') || 0, percentage: 0 },
      { pages: 11, sessions: pageDepthMap.get('11ページ以上') || 0, percentage: 0 },
    ]

    pageDepth.forEach((item) => {
      item.percentage = totalSessions > 0
        ? Math.round((item.sessions / totalSessions) * 10000) / 100
        : 0
    })

    // 4. イベントカウント
    const eventsResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
    })

    let clicks = 0
    let scrolls = 0
    let searches = 0
    let videoPlays = 0
    let downloads = 0

    eventsResponse[0].rows?.forEach((row) => {
      const eventName = row.dimensionValues?.[0]?.value || ''
      const count = Number(row.metricValues?.[0]?.value) || 0

      if (eventName === 'click') clicks += count
      else if (eventName === 'scroll') scrolls += count
      else if (eventName.includes('search')) searches += count
      else if (eventName.includes('video')) videoPlays += count
      else if (eventName.includes('download') || eventName.includes('ダウンロード')) downloads += count
    })

    const interactions = {
      clicks,
      scrolls,
      searches,
      videoPlays,
      downloads,
    }

    // 5. デバイス別エンゲージメント
    const deviceMetricsResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [
        { name: 'engagementRate' },
        { name: 'averageSessionDuration' },
        { name: 'screenPageViewsPerSession' },
      ],
    })

    const byDevice = {
      desktop: {} as Partial<EngagementMetrics>,
      mobile: {} as Partial<EngagementMetrics>,
      tablet: {} as Partial<EngagementMetrics>,
    }

    deviceMetricsResponse[0].rows?.forEach((row) => {
      const device = row.dimensionValues?.[0]?.value?.toLowerCase() as 'desktop' | 'mobile' | 'tablet'
      if (byDevice[device]) {
        byDevice[device] = {
          engagementRate: Math.round((Number(row.metricValues?.[0]?.value) || 0) * 100),
          avgSessionDuration: Math.round(Number(row.metricValues?.[1]?.value) || 0),
          avgPageviewsPerSession: Math.round((Number(row.metricValues?.[2]?.value) || 0) * 10) / 10,
        }
      }
    })

    // 6. 最もエンゲージメントが高いページTOP10
    const topPagesResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'userEngagementDuration' },
        { name: 'activeUsers' },
        { name: 'engagementRate' },
      ],
      orderBys: [{ metric: { metricName: 'userEngagementDuration' }, desc: true }],
      limit: 10,
    })

    const topEngagedPages = topPagesResponse[0].rows?.map((row) => {
      const users = Number(row.metricValues?.[1]?.value) || 1
      const totalTime = Number(row.metricValues?.[0]?.value) || 0
      return {
        page: row.dimensionValues?.[0]?.value || '',
        avgEngagementTime: Math.round(totalTime / users),
        engagementRate: Math.round((Number(row.metricValues?.[2]?.value) || 0) * 100),
        scrollRate: 0, // スクロールデータは簡略化のため0
      }
    }) || []

    // スクロール深度（簡略化）
    const scrollDepth = [
      { depth: '10%', users: Math.round(activeUsers * 0.95), percentage: 95 },
      { depth: '25%', users: Math.round(activeUsers * 0.85), percentage: 85 },
      { depth: '50%', users: Math.round(activeUsers * 0.65), percentage: 65 },
      { depth: '75%', users: Math.round(activeUsers * 0.42), percentage: 42 },
      { depth: '90%', users: Math.round(activeUsers * 0.25), percentage: 25 },
    ]

    const overall: EngagementMetrics = {
      totalSessions,
      engagedSessions,
      engagementRate,
      avgEngagementTime,
      avgSessionDuration,
      avgPageviewsPerSession,
      scrollDepth,
      timeOnSite,
      pageDepth,
      interactions,
    }

    // インサイト
    let avgEngagementQuality: 'high' | 'medium' | 'low' = 'medium'
    if (engagementRate >= 70) avgEngagementQuality = 'high'
    else if (engagementRate < 50) avgEngagementQuality = 'low'

    let bestEngagementDevice = 'desktop'
    let maxDeviceEngagement = byDevice.desktop.engagementRate || 0
    if ((byDevice.mobile.engagementRate || 0) > maxDeviceEngagement) {
      bestEngagementDevice = 'mobile'
      maxDeviceEngagement = byDevice.mobile.engagementRate || 0
    }
    if ((byDevice.tablet.engagementRate || 0) > maxDeviceEngagement) {
      bestEngagementDevice = 'tablet'
    }

    const improvementAreas: string[] = []
    if (engagementRate < 60) improvementAreas.push('エンゲージメント率が低い（目標60%以上）')
    if (avgSessionDuration < 120) improvementAreas.push('平均セッション時間が短い（目標2分以上）')
    if (avgPageviewsPerSession < 2) improvementAreas.push('ページ/セッションが低い（目標2以上）')
    if (pageDepth[0].percentage > 50) improvementAreas.push('1ページのみで離脱するユーザーが多い')

    const insights = {
      avgEngagementQuality,
      bestEngagementDevice,
      improvementAreas,
    }

    const data: EngagementData = {
      period: { startDate, endDate },
      overall,
      byDevice,
      topEngagedPages,
      insights,
    }

    console.log('📊 エンゲージメント分析結果:', {
      エンゲージメント率: `${engagementRate}%`,
      平均エンゲージメント時間: `${avgEngagementTime}秒`,
      品質: avgEngagementQuality,
    })

    // キャッシュ更新
    cachedData = { data, timestamp: Date.now() }

    return NextResponse.json({
      data,
      cached: false,
    })
  } catch (error) {
    console.error('Engagement API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch engagement data',
        message: error instanceof Error ? error.message : 'Unknown error',
        demo: true,
        data: generateDemoData(),
      },
      { status: 200 }
    )
  }
}

// デモデータ生成
function generateDemoData(): EngagementData {
  return {
    period: {
      startDate: '30daysAgo',
      endDate: 'today',
    },
    overall: {
      totalSessions: 13700,
      engagedSessions: 8840,
      engagementRate: 64.5,
      avgEngagementTime: 225,
      avgSessionDuration: 195,
      avgPageviewsPerSession: 3.1,
      scrollDepth: [
        { depth: '10%', users: 9500, percentage: 95 },
        { depth: '25%', users: 8500, percentage: 85 },
        { depth: '50%', users: 6500, percentage: 65 },
        { depth: '75%', users: 4200, percentage: 42 },
        { depth: '90%', users: 2500, percentage: 25 },
      ],
      timeOnSite: [
        { range: '0-10秒', sessions: 2740, percentage: 20 },
        { range: '11-30秒', sessions: 1370, percentage: 10 },
        { range: '31-60秒', sessions: 2603, percentage: 19 },
        { range: '61-180秒', sessions: 3562, percentage: 26 },
        { range: '181-600秒', sessions: 2466, percentage: 18 },
        { range: '601秒以上', sessions: 959, percentage: 7 },
      ],
      pageDepth: [
        { pages: 1, sessions: 4110, percentage: 30 },
        { pages: 2, sessions: 3425, percentage: 25 },
        { pages: 4, sessions: 2740, percentage: 20 },
        { pages: 6, sessions: 2055, percentage: 15 },
        { pages: 11, sessions: 1370, percentage: 10 },
      ],
      interactions: {
        clicks: 45230,
        scrolls: 32100,
        searches: 1280,
        videoPlays: 420,
        downloads: 580,
      },
    },
    byDevice: {
      desktop: {
        engagementRate: 72,
        avgSessionDuration: 245,
        avgPageviewsPerSession: 3.8,
      },
      mobile: {
        engagementRate: 58,
        avgSessionDuration: 155,
        avgPageviewsPerSession: 2.6,
      },
      tablet: {
        engagementRate: 65,
        avgSessionDuration: 185,
        avgPageviewsPerSession: 3.1,
      },
    },
    topEngagedPages: [
      {
        page: '/casestudy/freee',
        avgEngagementTime: 385,
        engagementRate: 88,
        scrollRate: 75,
      },
      {
        page: '/lab/optimization/950',
        avgEngagementTime: 340,
        engagementRate: 82,
        scrollRate: 68,
      },
      {
        page: '/partner-marketing',
        avgEngagementTime: 315,
        engagementRate: 78,
        scrollRate: 65,
      },
    ],
    insights: {
      avgEngagementQuality: 'medium',
      bestEngagementDevice: 'desktop',
      improvementAreas: [
        'モバイルのエンゲージメント率が低い',
        '1ページのみで離脱するユーザーが30%',
      ],
    },
  }
}














