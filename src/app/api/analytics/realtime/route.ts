import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'

interface RealtimeData {
  activeUsers: number
  activeUsersLastMinute: number
  screenPageViews: number
  topPages: {
    page: string
    activeUsers: number
    screenPageViews: number
  }[]
  topReferrers: {
    source: string
    activeUsers: number
  }[]
  topDevices: {
    device: string
    activeUsers: number
    percentage: number
  }[]
  topCities: {
    city: string
    activeUsers: number
  }[]
  topEvents: {
    eventName: string
    eventCount: number
  }[]
  minuteByMinute: {
    minutesAgo: number
    activeUsers: number
  }[]
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

    const credentials = getGoogleCredentials()
    const propertyId = process.env.GA4_PROPERTY_ID

    const analyticsDataClient = new BetaAnalyticsDataClient({ credentials })

    console.log('🔴 リアルタイムデータ取得開始')

    // 1. 現在のアクティブユーザー数
    const activeUsersResponse = await analyticsDataClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
      ],
    })

    const activeUsers = Number(activeUsersResponse[0].rows?.[0]?.metricValues?.[0]?.value) || 0
    const screenPageViews = Number(activeUsersResponse[0].rows?.[0]?.metricValues?.[1]?.value) || 0

    // 2. 過去1分間のアクティブユーザー
    const lastMinuteResponse = await analyticsDataClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [{ name: 'activeUsers' }],
      minuteRanges: [{ name: 'last_minute', startMinutesAgo: 1, endMinutesAgo: 0 }],
    })

    const activeUsersLastMinute = Number(lastMinuteResponse[0].rows?.[0]?.metricValues?.[0]?.value) || 0

    // 3. 現在閲覧されているページTOP10
    const topPagesResponse = await analyticsDataClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      dimensions: [{ name: 'unifiedScreenName' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
      ],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
    })

    const topPages = topPagesResponse[0].rows?.map((row) => ({
      page: row.dimensionValues?.[0]?.value || '',
      activeUsers: Number(row.metricValues?.[0]?.value) || 0,
      screenPageViews: Number(row.metricValues?.[1]?.value) || 0,
    })) || []

    // 4. 流入元TOP5
    const topReferrersResponse = await analyticsDataClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      dimensions: [{ name: 'sessionSource' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 5,
    })

    const topReferrers = topReferrersResponse[0].rows?.map((row) => ({
      source: row.dimensionValues?.[0]?.value || '',
      activeUsers: Number(row.metricValues?.[0]?.value) || 0,
    })) || []

    // 5. デバイス別
    const topDevicesResponse = await analyticsDataClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    })

    const totalDeviceUsers = topDevicesResponse[0].rows?.reduce(
      (sum, row) => sum + (Number(row.metricValues?.[0]?.value) || 0),
      0
    ) || 1

    const topDevices = topDevicesResponse[0].rows?.map((row) => {
      const users = Number(row.metricValues?.[0]?.value) || 0
      return {
        device: row.dimensionValues?.[0]?.value || '',
        activeUsers: users,
        percentage: Math.round((users / totalDeviceUsers) * 10000) / 100,
      }
    }) || []

    // 6. 都市別TOP5
    const topCitiesResponse = await analyticsDataClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      dimensions: [{ name: 'city' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 5,
    })

    const topCities = topCitiesResponse[0].rows?.map((row) => ({
      city: row.dimensionValues?.[0]?.value || '',
      activeUsers: Number(row.metricValues?.[0]?.value) || 0,
    })) || []

    // 7. リアルタイムイベントTOP5
    const topEventsResponse = await analyticsDataClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 5,
    })

    const topEvents = topEventsResponse[0].rows?.map((row) => ({
      eventName: row.dimensionValues?.[0]?.value || '',
      eventCount: Number(row.metricValues?.[0]?.value) || 0,
    })) || []

    // 8. 分単位のアクティブユーザー推移（過去30分）
    const minuteByMinute: { minutesAgo: number; activeUsers: number }[] = []
    
    // 過去30分のデータを5分刻みで取得
    for (let i = 0; i < 30; i += 5) {
      try {
        const minuteResponse = await analyticsDataClient.runRealtimeReport({
          property: `properties/${propertyId}`,
          metrics: [{ name: 'activeUsers' }],
          minuteRanges: [{ 
            name: `minute_${i}`, 
            startMinutesAgo: i + 5, 
            endMinutesAgo: i 
          }],
        })

        minuteByMinute.push({
          minutesAgo: i,
          activeUsers: Number(minuteResponse[0].rows?.[0]?.metricValues?.[0]?.value) || 0,
        })
      } catch (error) {
        console.error(`Failed to fetch minute data for ${i} minutes ago:`, error)
        minuteByMinute.push({
          minutesAgo: i,
          activeUsers: 0,
        })
      }
    }

    const data: RealtimeData = {
      activeUsers,
      activeUsersLastMinute,
      screenPageViews,
      topPages,
      topReferrers,
      topDevices,
      topCities,
      topEvents,
      minuteByMinute,
    }

    console.log('🔴 リアルタイムデータ取得完了:', {
      アクティブユーザー: activeUsers,
      過去1分: activeUsersLastMinute,
      閲覧中のページ: topPages.length,
    })

    return NextResponse.json({
      data,
      timestamp: new Date().toISOString(),
      cached: false,
    })
  } catch (error) {
    console.error('Realtime API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch realtime data',
        message: error instanceof Error ? error.message : 'Unknown error',
        demo: true,
        data: generateDemoData(),
      },
      { status: 200 }
    )
  }
}

// デモデータ生成
function generateDemoData(): RealtimeData {
  return {
    activeUsers: 42,
    activeUsersLastMinute: 38,
    screenPageViews: 156,
    topPages: [
      { page: '/', activeUsers: 15, screenPageViews: 28 },
      { page: '/lab', activeUsers: 12, screenPageViews: 35 },
      { page: '/partner-marketing', activeUsers: 8, screenPageViews: 22 },
      { page: '/knowledge/service-form', activeUsers: 4, screenPageViews: 12 },
      { page: '/seminar', activeUsers: 3, screenPageViews: 8 },
    ],
    topReferrers: [
      { source: 'google', activeUsers: 22 },
      { source: '(direct)', activeUsers: 12 },
      { source: 'yahoo', activeUsers: 5 },
      { source: 'twitter.com', activeUsers: 2 },
      { source: 'linkedin.com', activeUsers: 1 },
    ],
    topDevices: [
      { device: 'desktop', activeUsers: 25, percentage: 59.52 },
      { device: 'mobile', activeUsers: 15, percentage: 35.71 },
      { device: 'tablet', activeUsers: 2, percentage: 4.76 },
    ],
    topCities: [
      { city: 'Tokyo', activeUsers: 18 },
      { city: 'Osaka', activeUsers: 8 },
      { city: 'Nagoya', activeUsers: 5 },
      { city: 'Fukuoka', activeUsers: 4 },
      { city: 'Sapporo', activeUsers: 2 },
    ],
    topEvents: [
      { eventName: 'page_view', eventCount: 156 },
      { eventName: 'scroll', eventCount: 89 },
      { eventName: 'click', eventCount: 45 },
      { eventName: 'session_start', eventCount: 38 },
      { eventName: 'user_engagement', eventCount: 32 },
    ],
    minuteByMinute: [
      { minutesAgo: 0, activeUsers: 42 },
      { minutesAgo: 5, activeUsers: 38 },
      { minutesAgo: 10, activeUsers: 35 },
      { minutesAgo: 15, activeUsers: 40 },
      { minutesAgo: 20, activeUsers: 37 },
      { minutesAgo: 25, activeUsers: 33 },
    ],
  }
}














