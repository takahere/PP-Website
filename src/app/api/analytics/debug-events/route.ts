import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'

// GA4のイベント名とパスを確認するデバッグ用API
export async function GET() {
  try {
    // 設定チェック
    if (!isGoogleConfigured()) {
      return NextResponse.json(
        {
          error: 'Google Analytics is not configured',
          message: 'Please set GOOGLE_SERVICE_ACCOUNT_JSON and GA4_PROPERTY_ID',
        },
        { status: 500 }
      )
    }

    const credentials = getGoogleCredentials()
    const propertyId = process.env.GA4_PROPERTY_ID

    const analyticsDataClient = new BetaAnalyticsDataClient({ credentials })

    console.log('🔍 GA4デバッグ: イベント一覧を取得中...')

    // 全イベント名を取得
    const allEventsResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 50,
    })

    const allEvents = allEventsResponse[0].rows?.map((row) => ({
      eventName: row.dimensionValues?.[0]?.value || '',
      count: parseInt(row.metricValues?.[0]?.value || '0'),
    })) || []

    console.log('📊 全イベント:', allEvents)

    // /labページからのイベントを取得
    const labEventsResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [
        { name: 'eventName' },
        { name: 'pagePath' },
      ],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'CONTAINS',
            value: 'lab',
          },
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 50,
    })

    const labEvents = labEventsResponse[0].rows?.map((row) => ({
      eventName: row.dimensionValues?.[0]?.value || '',
      pagePath: row.dimensionValues?.[1]?.value || '',
      count: parseInt(row.metricValues?.[0]?.value || '0'),
    })) || []

    console.log('🧪 Labページのイベント:', labEvents)

    // 「資料ダウンロード」イベントの詳細
    const downloadEventsResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [
        { name: 'eventName' },
        { name: 'pagePath' },
      ],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'CONTAINS',
            value: 'ダウンロード',
          },
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 20,
    })

    const downloadEvents = downloadEventsResponse[0].rows?.map((row) => ({
      eventName: row.dimensionValues?.[0]?.value || '',
      pagePath: row.dimensionValues?.[1]?.value || '',
      count: parseInt(row.metricValues?.[0]?.value || '0'),
    })) || []

    console.log('📥 ダウンロードイベント:', downloadEvents)

    // 「取材フォーム」イベントの詳細
    const formEventsResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [
        { name: 'eventName' },
        { name: 'pagePath' },
      ],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'CONTAINS',
            value: 'フォーム',
          },
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 20,
    })

    const formEvents = formEventsResponse[0].rows?.map((row) => ({
      eventName: row.dimensionValues?.[0]?.value || '',
      pagePath: row.dimensionValues?.[1]?.value || '',
      count: parseInt(row.metricValues?.[0]?.value || '0'),
    })) || []

    console.log('📝 フォームイベント:', formEvents)

    return NextResponse.json({
      success: true,
      debug: {
        allEvents: allEvents.slice(0, 20),
        labEvents: labEvents.slice(0, 20),
        downloadEvents,
        formEvents,
      },
      suggestions: {
        downloadEventName: downloadEvents[0]?.eventName || '資料ダウンロード',
        formEventName: formEvents[0]?.eventName || '取材フォーム送信',
        labPaths: [...new Set(labEvents.map(e => e.pagePath))].slice(0, 10),
      },
    })
  } catch (error: any) {
    console.error('❌ GA4デバッグエラー:', error)
    return NextResponse.json(
      {
        error: 'GA4データの取得に失敗しました',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

