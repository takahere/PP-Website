import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'

// キャッシュ用
let cachedData: { data: UserSegmentData; timestamp: number } | null = null
const CACHE_DURATION = 10 * 60 * 1000 // 10分

interface SegmentMetrics {
  users: number
  sessions: number
  pageviews: number
  avgSessionDuration: number // 秒
  bounceRate: number // %
  conversionRate: number // %
  conversions: number
}

interface UserSegmentData {
  period: {
    startDate: string
    endDate: string
  }
  byUserType: {
    new: SegmentMetrics
    returning: SegmentMetrics
  }
  byChannel: {
    [key: string]: SegmentMetrics
  }
  byDevice: {
    desktop: SegmentMetrics
    mobile: SegmentMetrics
    tablet: SegmentMetrics
  }
  byRegion: {
    name: string
    metrics: SegmentMetrics
  }[]
  insights: {
    bestConvertingChannel: string
    bestConvertingDevice: string
    newVsReturningConversionGap: number // 倍率
    mobileVsDesktopBounceGap: number // ポイント差
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

    console.log('🔍 セグメント別分析開始:', { startDate, endDate })

    // 1. ユーザータイプ別（新規 vs リピーター）
    const userTypeResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'newVsReturning' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
    })

    // 2. チャネル別
    const channelResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    })

    // 3. デバイス別
    const deviceResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
    })

    // 4. 地域別（TOP10）
    const regionResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'city' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
    })

    // 5. コンバージョン数（ユーザータイプ別）
    const userTypeConversionResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'newVsReturning' }],
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

    // 6. コンバージョン数（チャネル別）
    const channelConversionResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
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

    // 7. コンバージョン数（デバイス別）
    const deviceConversionResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'deviceCategory' }],
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

    // データを集計
    // ユーザータイプ別
    const byUserType = {
      new: {
        users: 0,
        sessions: 0,
        pageviews: 0,
        avgSessionDuration: 0,
        bounceRate: 0,
        conversionRate: 0,
        conversions: 0,
      },
      returning: {
        users: 0,
        sessions: 0,
        pageviews: 0,
        avgSessionDuration: 0,
        bounceRate: 0,
        conversionRate: 0,
        conversions: 0,
      },
    }

    userTypeResponse[0].rows?.forEach((row) => {
      const type = row.dimensionValues?.[0]?.value === 'new' ? 'new' : 'returning'
      byUserType[type] = {
        users: Number(row.metricValues?.[0]?.value) || 0,
        sessions: Number(row.metricValues?.[1]?.value) || 0,
        pageviews: Number(row.metricValues?.[2]?.value) || 0,
        avgSessionDuration: Math.round(Number(row.metricValues?.[3]?.value) || 0),
        bounceRate: Math.round((Number(row.metricValues?.[4]?.value) || 0) * 100),
        conversionRate: 0,
        conversions: 0,
      }
    })

    // コンバージョンを追加
    userTypeConversionResponse[0].rows?.forEach((row) => {
      const type = row.dimensionValues?.[0]?.value === 'new' ? 'new' : 'returning'
      const conversions = Number(row.metricValues?.[0]?.value) || 0
      byUserType[type].conversions = conversions
      byUserType[type].conversionRate = byUserType[type].users > 0
        ? Math.round((conversions / byUserType[type].users) * 10000) / 100
        : 0
    })

    // チャネル別
    const byChannel: { [key: string]: SegmentMetrics } = {}
    channelResponse[0].rows?.forEach((row) => {
      const channel = row.dimensionValues?.[0]?.value || 'Unknown'
      byChannel[channel] = {
        users: Number(row.metricValues?.[0]?.value) || 0,
        sessions: Number(row.metricValues?.[1]?.value) || 0,
        pageviews: Number(row.metricValues?.[2]?.value) || 0,
        avgSessionDuration: Math.round(Number(row.metricValues?.[3]?.value) || 0),
        bounceRate: Math.round((Number(row.metricValues?.[4]?.value) || 0) * 100),
        conversionRate: 0,
        conversions: 0,
      }
    })

    // チャネル別コンバージョンを追加
    channelConversionResponse[0].rows?.forEach((row) => {
      const channel = row.dimensionValues?.[0]?.value || 'Unknown'
      const conversions = Number(row.metricValues?.[0]?.value) || 0
      if (byChannel[channel]) {
        byChannel[channel].conversions = conversions
        byChannel[channel].conversionRate = byChannel[channel].users > 0
          ? Math.round((conversions / byChannel[channel].users) * 10000) / 100
          : 0
      }
    })

    // デバイス別
    const byDevice = {
      desktop: {
        users: 0,
        sessions: 0,
        pageviews: 0,
        avgSessionDuration: 0,
        bounceRate: 0,
        conversionRate: 0,
        conversions: 0,
      },
      mobile: {
        users: 0,
        sessions: 0,
        pageviews: 0,
        avgSessionDuration: 0,
        bounceRate: 0,
        conversionRate: 0,
        conversions: 0,
      },
      tablet: {
        users: 0,
        sessions: 0,
        pageviews: 0,
        avgSessionDuration: 0,
        bounceRate: 0,
        conversionRate: 0,
        conversions: 0,
      },
    }

    deviceResponse[0].rows?.forEach((row) => {
      const device = row.dimensionValues?.[0]?.value?.toLowerCase() as 'desktop' | 'mobile' | 'tablet'
      if (byDevice[device]) {
        byDevice[device] = {
          users: Number(row.metricValues?.[0]?.value) || 0,
          sessions: Number(row.metricValues?.[1]?.value) || 0,
          pageviews: Number(row.metricValues?.[2]?.value) || 0,
          avgSessionDuration: Math.round(Number(row.metricValues?.[3]?.value) || 0),
          bounceRate: Math.round((Number(row.metricValues?.[4]?.value) || 0) * 100),
          conversionRate: 0,
          conversions: 0,
        }
      }
    })

    // デバイス別コンバージョンを追加
    deviceConversionResponse[0].rows?.forEach((row) => {
      const device = row.dimensionValues?.[0]?.value?.toLowerCase() as 'desktop' | 'mobile' | 'tablet'
      const conversions = Number(row.metricValues?.[0]?.value) || 0
      if (byDevice[device]) {
        byDevice[device].conversions = conversions
        byDevice[device].conversionRate = byDevice[device].users > 0
          ? Math.round((conversions / byDevice[device].users) * 10000) / 100
          : 0
      }
    })

    // 地域別
    const byRegion: { name: string; metrics: SegmentMetrics }[] = []
    regionResponse[0].rows?.forEach((row) => {
      const city = row.dimensionValues?.[0]?.value || 'Unknown'
      byRegion.push({
        name: city,
        metrics: {
          users: Number(row.metricValues?.[0]?.value) || 0,
          sessions: Number(row.metricValues?.[1]?.value) || 0,
          pageviews: Number(row.metricValues?.[2]?.value) || 0,
          avgSessionDuration: Math.round(Number(row.metricValues?.[3]?.value) || 0),
          bounceRate: Math.round((Number(row.metricValues?.[4]?.value) || 0) * 100),
          conversionRate: 0,
          conversions: 0,
        },
      })
    })

    // インサイトを計算
    let bestConvertingChannel = ''
    let maxChannelCvr = 0
    Object.entries(byChannel).forEach(([channel, metrics]) => {
      if (metrics.conversionRate > maxChannelCvr && metrics.users > 10) {
        maxChannelCvr = metrics.conversionRate
        bestConvertingChannel = channel
      }
    })

    let bestConvertingDevice = ''
    let maxDeviceCvr = 0
    Object.entries(byDevice).forEach(([device, metrics]) => {
      if (metrics.conversionRate > maxDeviceCvr) {
        maxDeviceCvr = metrics.conversionRate
        bestConvertingDevice = device
      }
    })

    const newVsReturningConversionGap = byUserType.new.conversionRate > 0
      ? Math.round((byUserType.returning.conversionRate / byUserType.new.conversionRate) * 100) / 100
      : 0

    const mobileVsDesktopBounceGap = byDevice.mobile.bounceRate - byDevice.desktop.bounceRate

    const insights = {
      bestConvertingChannel,
      bestConvertingDevice,
      newVsReturningConversionGap,
      mobileVsDesktopBounceGap,
    }

    const data: UserSegmentData = {
      period: { startDate, endDate },
      byUserType,
      byChannel,
      byDevice,
      byRegion,
      insights,
    }

    console.log('📊 セグメント別分析結果:', {
      新規ユーザー: byUserType.new.users,
      リピーター: byUserType.returning.users,
      最高CVRチャネル: bestConvertingChannel,
      最高CVRデバイス: bestConvertingDevice,
    })

    // キャッシュ更新
    cachedData = { data, timestamp: Date.now() }

    return NextResponse.json({
      data,
      cached: false,
    })
  } catch (error) {
    console.error('User Segments API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch user segment data',
        message: error instanceof Error ? error.message : 'Unknown error',
        demo: true,
        data: generateDemoData(),
      },
      { status: 200 }
    )
  }
}

// デモデータ生成
function generateDemoData(): UserSegmentData {
  return {
    period: {
      startDate: '30daysAgo',
      endDate: 'today',
    },
    byUserType: {
      new: {
        users: 8142,
        sessions: 9500,
        pageviews: 28000,
        avgSessionDuration: 180,
        bounceRate: 45,
        conversionRate: 2.1,
        conversions: 171,
      },
      returning: {
        users: 2858,
        sessions: 4200,
        pageviews: 15000,
        avgSessionDuration: 310,
        bounceRate: 28,
        conversionRate: 3.8,
        conversions: 109,
      },
    },
    byChannel: {
      'Organic Search': {
        users: 5500,
        sessions: 7000,
        pageviews: 21000,
        avgSessionDuration: 220,
        bounceRate: 38,
        conversionRate: 3.2,
        conversions: 176,
      },
      Direct: {
        users: 2800,
        sessions: 3500,
        pageviews: 10500,
        avgSessionDuration: 195,
        bounceRate: 42,
        conversionRate: 2.5,
        conversions: 70,
      },
      Referral: {
        users: 1500,
        sessions: 1800,
        pageviews: 5400,
        avgSessionDuration: 165,
        bounceRate: 48,
        conversionRate: 1.8,
        conversions: 27,
      },
    },
    byDevice: {
      desktop: {
        users: 6200,
        sessions: 7800,
        pageviews: 24000,
        avgSessionDuration: 285,
        bounceRate: 32,
        conversionRate: 3.5,
        conversions: 217,
      },
      mobile: {
        users: 3600,
        sessions: 4500,
        pageviews: 13500,
        avgSessionDuration: 145,
        bounceRate: 52,
        conversionRate: 1.5,
        conversions: 54,
      },
      tablet: {
        users: 200,
        sessions: 250,
        pageviews: 750,
        avgSessionDuration: 205,
        bounceRate: 40,
        conversionRate: 2.0,
        conversions: 4,
      },
    },
    byRegion: [
      {
        name: 'Tokyo',
        metrics: {
          users: 4500,
          sessions: 5600,
          pageviews: 16800,
          avgSessionDuration: 225,
          bounceRate: 36,
          conversionRate: 3.2,
          conversions: 144,
        },
      },
      {
        name: 'Osaka',
        metrics: {
          users: 1800,
          sessions: 2200,
          pageviews: 6600,
          avgSessionDuration: 210,
          bounceRate: 38,
          conversionRate: 2.9,
          conversions: 52,
        },
      },
    ],
    insights: {
      bestConvertingChannel: 'Organic Search',
      bestConvertingDevice: 'desktop',
      newVsReturningConversionGap: 1.81,
      mobileVsDesktopBounceGap: 20,
    },
  }
}














