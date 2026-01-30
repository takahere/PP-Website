import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { LRUCache } from 'lru-cache'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'

/**
 * チャネル別Lab効果分析API
 *
 * 各流入チャネル（Organic, Paid, Social等）別に：
 * - Labセッション数
 * - Lab→サービスサイト遷移率
 * - CVR
 * を分析
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new LRUCache<string, any>({
  max: 100,
  ttl: 10 * 60 * 1000, // 10分
})

interface ChannelLabData {
  channel: string
  labSessions: number
  transitionSessions: number
  transitionRate: number
  downloads: number
  downloadRate: number
  avgTimeOnLab: number
  bounceRate: number
  topLabArticles: Array<{
    path: string
    title: string
    sessions: number
    transitionRate: number
  }>
}

interface LabChannelEffectData {
  summary: {
    totalLabSessions: number
    totalTransitions: number
    avgTransitionRate: number
    bestChannel: string
    worstChannel: string
  }
  byChannel: ChannelLabData[]
  channelComparison: Array<{
    channel: string
    labShare: number // Lab全体に占めるシェア
    transitionRate: number
    effectiveness: 'high' | 'medium' | 'low'
  }>
  insights: {
    recommendation: string
    underperformingChannels: string[]
    highPotentialChannels: string[]
  }
}

// サービスサイトのパスパターン
const SERVICE_SITE_PATHS = [
  '/partner-marketing',
  '/sales-enablement',
  '/knowledge',
  '/casestudy',
  '/seminar',
]

export async function GET(request: Request) {
  try {
    if (!isGoogleConfigured()) {
      return NextResponse.json({
        error: 'Google Analytics is not configured',
        demo: true,
        data: generateDemoData(),
      }, { status: 200 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || '30daysAgo'
    const endDate = searchParams.get('endDate') || 'today'
    const forceRefresh = searchParams.get('refresh') === 'true'

    const cacheKey = `lab-channel-effect-${startDate}-${endDate}`
    if (!forceRefresh) {
      const cached = cache.get(cacheKey)
      if (cached) {
        return NextResponse.json({ data: cached, cached: true })
      }
    }

    const credentials = getGoogleCredentials()
    const propertyId = process.env.GA4_PROPERTY_ID
    const analyticsDataClient = new BetaAnalyticsDataClient({ credentials })

    console.log('🔍 チャネル別Lab効果分析開始')

    // 1. チャネル別Labセッション数
    const labSessionsResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [
        { name: 'sessions' },
        { name: 'bounceRate' },
        { name: 'userEngagementDuration' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'landingPage',
          stringFilter: { matchType: 'BEGINS_WITH', value: '/lab/' },
        },
      },
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    })

    // 2. チャネル別 Lab→サービスサイト遷移（ページパスでフィルタリング）
    // GA4では複雑なパス遷移分析は制限があるため、近似値を使用
    const transitionResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'sessionDefaultChannelGroup' },
        { name: 'pagePath' },
      ],
      metrics: [{ name: 'sessions' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'landingPage',
                stringFilter: { matchType: 'BEGINS_WITH', value: '/lab/' },
              },
            },
            {
              orGroup: {
                expressions: SERVICE_SITE_PATHS.map(path => ({
                  filter: {
                    fieldName: 'pagePath',
                    stringFilter: { matchType: 'BEGINS_WITH', value: path },
                  },
                })),
              },
            },
          ],
        },
      },
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 100,
    })

    // 3. チャネル別ダウンロードイベント
    const downloadResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'eventName',
                stringFilter: { value: 'file_download' },
              },
            },
            {
              filter: {
                fieldName: 'landingPage',
                stringFilter: { matchType: 'BEGINS_WITH', value: '/lab/' },
              },
            },
          ],
        },
      },
    })

    // データ処理
    const channelMap = new Map<string, ChannelLabData>()
    let totalLabSessions = 0

    // Labセッション数を集計
    for (const row of labSessionsResponse[0].rows || []) {
      const channel = row.dimensionValues?.[0]?.value || ''
      const sessions = Number(row.metricValues?.[0]?.value) || 0
      const bounceRate = Math.round((Number(row.metricValues?.[1]?.value) || 0) * 100)
      const engagementTime = Number(row.metricValues?.[2]?.value) || 0

      totalLabSessions += sessions

      channelMap.set(channel, {
        channel,
        labSessions: sessions,
        transitionSessions: 0,
        transitionRate: 0,
        downloads: 0,
        downloadRate: 0,
        avgTimeOnLab: sessions > 0 ? Math.round(engagementTime / sessions) : 0,
        bounceRate,
        topLabArticles: [],
      })
    }

    // 遷移セッションを集計
    const transitionByChannel = new Map<string, number>()
    for (const row of transitionResponse[0].rows || []) {
      const channel = row.dimensionValues?.[0]?.value || ''
      const sessions = Number(row.metricValues?.[0]?.value) || 0
      transitionByChannel.set(channel, (transitionByChannel.get(channel) || 0) + sessions)
    }

    // ダウンロード数を集計
    for (const row of downloadResponse[0].rows || []) {
      const channel = row.dimensionValues?.[0]?.value || ''
      const downloads = Number(row.metricValues?.[0]?.value) || 0
      const data = channelMap.get(channel)
      if (data) {
        data.downloads = downloads
        data.downloadRate = data.labSessions > 0
          ? Math.round((downloads / data.labSessions) * 10000) / 100
          : 0
      }
    }

    // 遷移率を計算
    let totalTransitions = 0
    for (const [channel, transitions] of transitionByChannel) {
      totalTransitions += transitions
      const data = channelMap.get(channel)
      if (data) {
        data.transitionSessions = transitions
        data.transitionRate = data.labSessions > 0
          ? Math.round((transitions / data.labSessions) * 10000) / 100
          : 0
      }
    }

    const byChannel = Array.from(channelMap.values()).sort((a, b) => b.labSessions - a.labSessions)

    // チャネル比較
    const avgTransitionRate = totalLabSessions > 0
      ? Math.round((totalTransitions / totalLabSessions) * 10000) / 100
      : 0

    const channelComparison = byChannel.map(ch => ({
      channel: ch.channel,
      labShare: totalLabSessions > 0
        ? Math.round((ch.labSessions / totalLabSessions) * 100)
        : 0,
      transitionRate: ch.transitionRate,
      effectiveness: ch.transitionRate > avgTransitionRate * 1.2
        ? 'high' as const
        : ch.transitionRate < avgTransitionRate * 0.8
          ? 'low' as const
          : 'medium' as const,
    }))

    // ベスト/ワーストチャネル
    const sortedByTransition = [...byChannel].sort((a, b) => b.transitionRate - a.transitionRate)
    const bestChannel = sortedByTransition[0]?.channel || ''
    const worstChannel = sortedByTransition[sortedByTransition.length - 1]?.channel || ''

    // インサイト
    const underperformingChannels = channelComparison
      .filter(ch => ch.effectiveness === 'low' && ch.labShare > 5)
      .map(ch => ch.channel)

    const highPotentialChannels = channelComparison
      .filter(ch => ch.effectiveness === 'high' && ch.labShare < 20)
      .map(ch => ch.channel)

    let recommendation = ''
    if (underperformingChannels.length > 0) {
      recommendation = `${underperformingChannels.join(', ')}チャネルの遷移率改善が優先課題です。`
    } else if (highPotentialChannels.length > 0) {
      recommendation = `${highPotentialChannels.join(', ')}チャネルは遷移率が高いため、流入増加施策が効果的です。`
    } else {
      recommendation = '各チャネルのパフォーマンスは均衡しています。'
    }

    const responseData: LabChannelEffectData = {
      summary: {
        totalLabSessions,
        totalTransitions,
        avgTransitionRate,
        bestChannel,
        worstChannel,
      },
      byChannel,
      channelComparison,
      insights: {
        recommendation,
        underperformingChannels,
        highPotentialChannels,
      },
    }

    console.log('📊 チャネル別Lab効果分析結果:', {
      総Labセッション: totalLabSessions,
      平均遷移率: `${avgTransitionRate}%`,
      ベストチャネル: bestChannel,
    })

    cache.set(cacheKey, responseData)

    return NextResponse.json({ data: responseData, cached: false })
  } catch (error) {
    console.error('Lab Channel Effect API Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch lab channel effect data',
      message: error instanceof Error ? error.message : 'Unknown error',
      demo: true,
      data: generateDemoData(),
    }, { status: 200 })
  }
}

function generateDemoData(): LabChannelEffectData {
  return {
    summary: {
      totalLabSessions: 5680,
      totalTransitions: 852,
      avgTransitionRate: 15.0,
      bestChannel: 'Referral',
      worstChannel: 'Paid Search',
    },
    byChannel: [
      {
        channel: 'Organic Search',
        labSessions: 2840,
        transitionSessions: 426,
        transitionRate: 15.0,
        downloads: 142,
        downloadRate: 5.0,
        avgTimeOnLab: 185,
        bounceRate: 35,
        topLabArticles: [],
      },
      {
        channel: 'Direct',
        labSessions: 1136,
        transitionSessions: 182,
        transitionRate: 16.0,
        downloads: 68,
        downloadRate: 6.0,
        avgTimeOnLab: 210,
        bounceRate: 28,
        topLabArticles: [],
      },
      {
        channel: 'Referral',
        labSessions: 852,
        transitionSessions: 162,
        transitionRate: 19.0,
        downloads: 51,
        downloadRate: 6.0,
        avgTimeOnLab: 225,
        bounceRate: 25,
        topLabArticles: [],
      },
      {
        channel: 'Organic Social',
        labSessions: 568,
        transitionSessions: 74,
        transitionRate: 13.0,
        downloads: 28,
        downloadRate: 4.9,
        avgTimeOnLab: 165,
        bounceRate: 42,
        topLabArticles: [],
      },
      {
        channel: 'Paid Search',
        labSessions: 284,
        transitionSessions: 8,
        transitionRate: 2.8,
        downloads: 5,
        downloadRate: 1.8,
        avgTimeOnLab: 95,
        bounceRate: 58,
        topLabArticles: [],
      },
    ],
    channelComparison: [
      { channel: 'Organic Search', labShare: 50, transitionRate: 15.0, effectiveness: 'medium' },
      { channel: 'Direct', labShare: 20, transitionRate: 16.0, effectiveness: 'medium' },
      { channel: 'Referral', labShare: 15, transitionRate: 19.0, effectiveness: 'high' },
      { channel: 'Organic Social', labShare: 10, transitionRate: 13.0, effectiveness: 'low' },
      { channel: 'Paid Search', labShare: 5, transitionRate: 2.8, effectiveness: 'low' },
    ],
    insights: {
      recommendation: 'Paid Searchチャネルの遷移率改善が優先課題です。Referralチャネルは遷移率が高いため、流入増加施策が効果的です。',
      underperformingChannels: ['Paid Search'],
      highPotentialChannels: ['Referral'],
    },
  }
}
