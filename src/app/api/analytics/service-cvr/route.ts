import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { LRUCache } from 'lru-cache'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'

/**
 * サービスサイトCVR API
 *
 * KPI公式: CV = imp × CTR × Transition Rate × サービスサイトCVR
 *
 * サービスサイトCVR = フォーム送信数 / サービスサイトセッション数 × 100
 *
 * サービスサイトの定義:
 * - /partner-marketing, /sales-enablement, /knowledge, /casestudy, /seminar など
 * - Labページ（/lab/）は除外
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new LRUCache<string, any>({
  max: 100,
  ttl: 10 * 60 * 1000, // 10分
})

interface ServiceCVRData {
  summary: {
    serviceSiteSessions: number
    formSubmissions: number
    serviceCvr: number
    trend: number
    previousMonthCvr: number
  }
  byPage: Array<{
    page: string
    pageLabel: string
    sessions: number
    formSubmissions: number
    cvr: number
  }>
  byChannel: Array<{
    channel: string
    sessions: number
    formSubmissions: number
    cvr: number
  }>
  monthly: Array<{
    month: string
    sessions: number
    formSubmissions: number
    cvr: number
  }>
  kpiBreakdown: {
    impressions: number
    ctr: number
    transitionRate: number
    serviceCvr: number
    estimatedCV: number
  }
}

// サービスサイトのパスパターン
const SERVICE_SITE_PATHS = [
  '/partner-marketing',
  '/sales-enablement',
  '/knowledge',
  '/casestudy',
  '/seminar',
  '/about',
  '/contact',
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

    const cacheKey = `service-cvr-${startDate}-${endDate}`
    if (!forceRefresh) {
      const cached = cache.get(cacheKey)
      if (cached) {
        return NextResponse.json({ data: cached, cached: true })
      }
    }

    const credentials = getGoogleCredentials()
    const propertyId = process.env.GA4_PROPERTY_ID
    const analyticsDataClient = new BetaAnalyticsDataClient({ credentials })

    console.log('🔍 サービスサイトCVR分析開始')

    // 1. サービスサイトのセッション数を取得
    const sessionsResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'sessions' }],
      dimensionFilter: {
        orGroup: {
          expressions: SERVICE_SITE_PATHS.map(path => ({
            filter: {
              fieldName: 'pagePath',
              stringFilter: { matchType: 'BEGINS_WITH', value: path },
            },
          })),
        },
      },
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 50,
    })

    // 2. フォーム送信イベントを取得
    const eventsResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'eventName',
                stringFilter: { value: 'form_submit' },
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
    })

    // 3. チャネル別セッション
    const channelResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
      dimensionFilter: {
        orGroup: {
          expressions: SERVICE_SITE_PATHS.map(path => ({
            filter: {
              fieldName: 'pagePath',
              stringFilter: { matchType: 'BEGINS_WITH', value: path },
            },
          })),
        },
      },
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    })

    // 4. 月別データ（過去6ヶ月）
    const monthlyResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '180daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'yearMonth' }],
      metrics: [{ name: 'sessions' }],
      dimensionFilter: {
        orGroup: {
          expressions: SERVICE_SITE_PATHS.map(path => ({
            filter: {
              fieldName: 'pagePath',
              stringFilter: { matchType: 'BEGINS_WITH', value: path },
            },
          })),
        },
      },
      orderBys: [{ dimension: { dimensionName: 'yearMonth' }, desc: false }],
    })

    // データ処理
    let totalSessions = 0
    const byPage: ServiceCVRData['byPage'] = []

    for (const row of sessionsResponse[0].rows || []) {
      const page = row.dimensionValues?.[0]?.value || ''
      const sessions = Number(row.metricValues?.[0]?.value) || 0
      totalSessions += sessions

      // ページラベルを生成
      let pageLabel = page
      if (page.startsWith('/partner-marketing')) pageLabel = 'パートナーマーケティング'
      else if (page.startsWith('/sales-enablement')) pageLabel = 'セールスイネーブルメント'
      else if (page.startsWith('/knowledge')) pageLabel = 'お役立ち資料'
      else if (page.startsWith('/casestudy')) pageLabel = '導入事例'
      else if (page.startsWith('/seminar')) pageLabel = 'セミナー'
      else if (page.startsWith('/contact')) pageLabel = 'お問い合わせ'
      else if (page.startsWith('/about')) pageLabel = '会社情報'

      byPage.push({
        page,
        pageLabel,
        sessions,
        formSubmissions: 0, // 後で更新
        cvr: 0,
      })
    }

    // フォーム送信数をマッピング
    let totalFormSubmissions = 0
    for (const row of eventsResponse[0].rows || []) {
      const page = row.dimensionValues?.[0]?.value || ''
      const submissions = Number(row.metricValues?.[0]?.value) || 0
      totalFormSubmissions += submissions

      const pageData = byPage.find(p => p.page === page)
      if (pageData) {
        pageData.formSubmissions = submissions
        pageData.cvr = pageData.sessions > 0
          ? Math.round((submissions / pageData.sessions) * 10000) / 100
          : 0
      }
    }

    // チャネル別
    const byChannel: ServiceCVRData['byChannel'] = (channelResponse[0].rows || []).map(row => {
      const channel = row.dimensionValues?.[0]?.value || ''
      const sessions = Number(row.metricValues?.[0]?.value) || 0
      // チャネル別のフォーム送信数は簡略化（実際はより詳細なクエリが必要）
      const estimatedSubmissions = Math.floor(sessions * (totalFormSubmissions / totalSessions))
      return {
        channel,
        sessions,
        formSubmissions: estimatedSubmissions,
        cvr: sessions > 0 ? Math.round((estimatedSubmissions / sessions) * 10000) / 100 : 0,
      }
    })

    // 月別データ
    const monthly: ServiceCVRData['monthly'] = (monthlyResponse[0].rows || []).map(row => {
      const month = row.dimensionValues?.[0]?.value || ''
      const sessions = Number(row.metricValues?.[0]?.value) || 0
      // 月別のフォーム送信数は簡略化
      const estimatedSubmissions = Math.floor(sessions * (totalFormSubmissions / totalSessions))
      return {
        month,
        sessions,
        formSubmissions: estimatedSubmissions,
        cvr: sessions > 0 ? Math.round((estimatedSubmissions / sessions) * 10000) / 100 : 0,
      }
    })

    // サマリー計算
    const serviceCvr = totalSessions > 0
      ? Math.round((totalFormSubmissions / totalSessions) * 10000) / 100
      : 0

    // 前月比較（簡略化）
    const previousMonthCvr = monthly.length >= 2 ? monthly[monthly.length - 2]?.cvr || 0 : 0
    const trend = previousMonthCvr > 0
      ? Math.round(((serviceCvr - previousMonthCvr) / previousMonthCvr) * 100)
      : 0

    // KPI分解（GSCデータが必要なため、推定値を使用）
    const estimatedImpressions = totalSessions * 50 // 推定
    const estimatedCtr = 2.5 // 推定CTR%
    const estimatedTransitionRate = 15 // Lab→サービスサイト遷移率

    const responseData: ServiceCVRData = {
      summary: {
        serviceSiteSessions: totalSessions,
        formSubmissions: totalFormSubmissions,
        serviceCvr,
        trend,
        previousMonthCvr,
      },
      byPage: byPage.slice(0, 10),
      byChannel,
      monthly,
      kpiBreakdown: {
        impressions: estimatedImpressions,
        ctr: estimatedCtr,
        transitionRate: estimatedTransitionRate,
        serviceCvr,
        estimatedCV: Math.round(estimatedImpressions * (estimatedCtr / 100) * (estimatedTransitionRate / 100) * (serviceCvr / 100)),
      },
    }

    console.log('📊 サービスサイトCVR分析結果:', {
      セッション: totalSessions,
      フォーム送信: totalFormSubmissions,
      CVR: `${serviceCvr}%`,
    })

    cache.set(cacheKey, responseData)

    return NextResponse.json({ data: responseData, cached: false })
  } catch (error) {
    console.error('Service CVR API Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch service CVR data',
      message: error instanceof Error ? error.message : 'Unknown error',
      demo: true,
      data: generateDemoData(),
    }, { status: 200 })
  }
}

function generateDemoData(): ServiceCVRData {
  return {
    summary: {
      serviceSiteSessions: 8450,
      formSubmissions: 285,
      serviceCvr: 3.37,
      trend: 12,
      previousMonthCvr: 3.01,
    },
    byPage: [
      { page: '/partner-marketing', pageLabel: 'パートナーマーケティング', sessions: 2450, formSubmissions: 142, cvr: 5.8 },
      { page: '/knowledge', pageLabel: 'お役立ち資料', sessions: 1890, formSubmissions: 95, cvr: 5.0 },
      { page: '/casestudy', pageLabel: '導入事例', sessions: 1520, formSubmissions: 38, cvr: 2.5 },
      { page: '/seminar', pageLabel: 'セミナー', sessions: 980, formSubmissions: 8, cvr: 0.8 },
      { page: '/sales-enablement', pageLabel: 'セールスイネーブルメント', sessions: 890, formSubmissions: 2, cvr: 0.2 },
    ],
    byChannel: [
      { channel: 'Organic Search', sessions: 4225, formSubmissions: 156, cvr: 3.7 },
      { channel: 'Direct', sessions: 1690, formSubmissions: 54, cvr: 3.2 },
      { channel: 'Referral', sessions: 1268, formSubmissions: 45, cvr: 3.5 },
      { channel: 'Organic Social', sessions: 845, formSubmissions: 22, cvr: 2.6 },
      { channel: 'Paid Search', sessions: 422, formSubmissions: 8, cvr: 1.9 },
    ],
    monthly: [
      { month: '202409', sessions: 1250, formSubmissions: 35, cvr: 2.8 },
      { month: '202410', sessions: 1380, formSubmissions: 42, cvr: 3.0 },
      { month: '202411', sessions: 1420, formSubmissions: 45, cvr: 3.2 },
      { month: '202412', sessions: 1480, formSubmissions: 48, cvr: 3.2 },
      { month: '202501', sessions: 1520, formSubmissions: 52, cvr: 3.4 },
      { month: '202502', sessions: 1400, formSubmissions: 63, cvr: 4.5 },
    ],
    kpiBreakdown: {
      impressions: 125000,
      ctr: 2.8,
      transitionRate: 15.2,
      serviceCvr: 3.37,
      estimatedCV: 18,
    },
  }
}
