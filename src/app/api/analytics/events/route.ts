import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'

// キャッシュ用
let cachedData: { data: EventData; timestamp: number } | null = null
const CACHE_DURATION = 10 * 60 * 1000 // 10分

interface EventMetrics {
  eventName: string
  eventCount: number
  users: number
  topPages: {
    page: string
    count: number
  }[]
}

interface EventData {
  customEvents: EventMetrics[]
  summary: {
    totalEvents: number
    totalUsers: number
    mostPopularEvent: string
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

    // カスタムイベントの一覧を定義
    const targetEvents = [
      '資料ダウンロード',
      'WPダウンロード',
      '無料デモ申し込み',
      '取材フォーム送信',
      'form_submit',
      'form_start',
    ]

    // カスタムイベントのデータを取得
    const eventDataPromises = targetEvents.map(async (eventName) => {
      try {
        // イベント数とユーザー数を取得
        const eventResponse = await analyticsDataClient.runReport({
          property: `properties/${propertyId}`,
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'eventName' }],
          metrics: [
            { name: 'eventCount' },
            { name: 'activeUsers' },
          ],
          dimensionFilter: {
            filter: {
              fieldName: 'eventName',
              stringFilter: {
                value: eventName,
              },
            },
          },
        })

        const eventCount = Number(eventResponse[0].rows?.[0]?.metricValues?.[0]?.value) || 0
        const users = Number(eventResponse[0].rows?.[0]?.metricValues?.[1]?.value) || 0

        // イベントが発生したページを取得
        const pageResponse = await analyticsDataClient.runReport({
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
                value: eventName,
              },
            },
          },
          orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
          limit: 5,
        })

        const topPages =
          pageResponse[0].rows?.map((row) => ({
            page: row.dimensionValues?.[1]?.value || '',
            count: Number(row.metricValues?.[0]?.value) || 0,
          })) || []

        return {
          eventName,
          eventCount,
          users,
          topPages,
        }
      } catch (error) {
        console.error(`Failed to fetch event data for ${eventName}:`, error)
        return {
          eventName,
          eventCount: 0,
          users: 0,
          topPages: [],
        }
      }
    })

    const customEvents = await Promise.all(eventDataPromises)

    // サマリーを計算
    const totalEvents = customEvents.reduce((sum, e) => sum + e.eventCount, 0)
    const totalUsers = customEvents.reduce((sum, e) => sum + e.users, 0)
    const mostPopularEvent =
      customEvents.sort((a, b) => b.eventCount - a.eventCount)[0]?.eventName || 'なし'

    const data: EventData = {
      customEvents: customEvents.filter((e) => e.eventCount > 0), // イベントがあるもののみ
      summary: {
        totalEvents,
        totalUsers,
        mostPopularEvent,
      },
    }

    // キャッシュ更新
    cachedData = { data, timestamp: Date.now() }

    return NextResponse.json({
      data,
      cached: false,
    })
  } catch (error) {
    console.error('Events API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch events data',
        message: error instanceof Error ? error.message : 'Unknown error',
        demo: true,
        data: generateDemoData(),
      },
      { status: 200 }
    )
  }
}

// デモデータ生成
function generateDemoData(): EventData {
  return {
    customEvents: [
      {
        eventName: '資料ダウンロード',
        eventCount: 128,
        users: 112,
        topPages: [
          { page: '/form-complete-servicedocument/', count: 128 },
        ],
      },
      {
        eventName: 'WPダウンロード',
        eventCount: 286,
        users: 243,
        topPages: [
          { page: '/form-complete-ebook/', count: 198 },
          { page: '/form-complete-ebook-hakusyo25/', count: 42 },
          { page: '/form-complete-ebook-textbook/', count: 16 },
        ],
      },
      {
        eventName: '無料デモ申し込み',
        eventCount: 14,
        users: 13,
        topPages: [
          { page: '/form-complete-demo/', count: 14 },
        ],
      },
      {
        eventName: 'form_submit',
        eventCount: 7,
        users: 7,
        topPages: [
          { page: '/contact/', count: 5 },
          { page: '/lab/inquiry/', count: 2 },
        ],
      },
    ],
    summary: {
      totalEvents: 435,
      totalUsers: 375,
      mostPopularEvent: 'WPダウンロード',
    },
  }
}







