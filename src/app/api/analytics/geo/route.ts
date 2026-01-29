import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { LRUCache } from 'lru-cache'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'

/**
 * 地域データAPI
 *
 * 取得データ:
 * - 国別 (country)
 * - 都道府県別 (region)
 * - 市区町村別 (city)
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new LRUCache<string, any>({
  max: 100,
  ttl: 10 * 60 * 1000,
})

interface GeoData {
  name: string
  users: number
  sessions: number
  pageviews: number
  percentage: number
}

export async function GET(request: Request) {
  try {
    if (!isGoogleConfigured()) {
      return NextResponse.json({
        error: 'Google Analytics is not configured',
        demo: true,
        ...generateDemoData(),
      }, { status: 200 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || '30daysAgo'
    const endDate = searchParams.get('endDate') || 'today'
    const forceRefresh = searchParams.get('refresh') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const cacheKey = `geo-${startDate}-${endDate}`
    if (!forceRefresh) {
      const cached = cache.get(cacheKey)
      if (cached) {
        return NextResponse.json({ ...cached as object, cached: true })
      }
    }

    const credentials = getGoogleCredentials()
    const propertyId = process.env.GA4_PROPERTY_ID
    const analyticsDataClient = new BetaAnalyticsDataClient({ credentials })

    // 並列でデータ取得
    const [countryResponse, regionResponse, cityResponse] = await Promise.all([
      // 国別
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'country' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
        ],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit,
      }),
      // 都道府県別（日本のみ）
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'region' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'country',
            stringFilter: { value: 'Japan' },
          },
        },
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit,
      }),
      // 市区町村別（日本のみ）
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'city' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'country',
            stringFilter: { value: 'Japan' },
          },
        },
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit,
      }),
    ])

    // データ処理関数
    const processGeoData = (response: typeof countryResponse): GeoData[] => {
      const totalUsers = response[0].rows?.reduce(
        (sum, row) => sum + Number(row.metricValues?.[0]?.value || 0), 0
      ) || 1

      return response[0].rows?.map((row) => {
        const users = Number(row.metricValues?.[0]?.value) || 0
        return {
          name: row.dimensionValues?.[0]?.value || '',
          users,
          sessions: Number(row.metricValues?.[1]?.value) || 0,
          pageviews: Number(row.metricValues?.[2]?.value) || 0,
          percentage: Math.round((users / totalUsers) * 100),
        }
      }) || []
    }

    const responseData = {
      period: { startDate, endDate },
      countries: processGeoData(countryResponse),
      regions: processGeoData(regionResponse),
      cities: processGeoData(cityResponse),
    }

    cache.set(cacheKey, responseData)

    return NextResponse.json({ ...responseData, cached: false })
  } catch (error) {
    console.error('Geo API Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch geo data',
      message: error instanceof Error ? error.message : 'Unknown error',
      demo: true,
      ...generateDemoData(),
    }, { status: 200 })
  }
}

function generateDemoData() {
  return {
    countries: [
      { name: 'Japan', users: 3510, sessions: 4563, pageviews: 12285, percentage: 90 },
      { name: 'United States', users: 195, sessions: 254, pageviews: 685, percentage: 5 },
      { name: 'Singapore', users: 78, sessions: 101, pageviews: 273, percentage: 2 },
      { name: 'Taiwan', users: 58, sessions: 75, pageviews: 203, percentage: 1.5 },
      { name: 'Other', users: 59, sessions: 77, pageviews: 207, percentage: 1.5 },
    ],
    regions: [
      { name: 'Tokyo', users: 1755, sessions: 2282, pageviews: 6143, percentage: 50 },
      { name: 'Osaka', users: 526, sessions: 684, pageviews: 1843, percentage: 15 },
      { name: 'Kanagawa', users: 351, sessions: 456, pageviews: 1229, percentage: 10 },
      { name: 'Aichi', users: 280, sessions: 365, pageviews: 983, percentage: 8 },
      { name: 'Fukuoka', users: 211, sessions: 274, pageviews: 737, percentage: 6 },
      { name: 'Hyogo', users: 175, sessions: 228, pageviews: 614, percentage: 5 },
      { name: 'Other', users: 212, sessions: 275, pageviews: 741, percentage: 6 },
    ],
    cities: [
      { name: 'Shibuya', users: 526, sessions: 684, pageviews: 1843, percentage: 15 },
      { name: 'Minato', users: 456, sessions: 593, pageviews: 1598, percentage: 13 },
      { name: 'Shinjuku', users: 386, sessions: 502, pageviews: 1352, percentage: 11 },
      { name: 'Chiyoda', users: 316, sessions: 411, pageviews: 1107, percentage: 9 },
      { name: 'Osaka', users: 280, sessions: 365, pageviews: 983, percentage: 8 },
      { name: 'Chuo', users: 245, sessions: 319, pageviews: 860, percentage: 7 },
      { name: 'Nagoya', users: 175, sessions: 228, pageviews: 614, percentage: 5 },
      { name: 'Other', users: 1126, sessions: 1464, pageviews: 3943, percentage: 32 },
    ],
  }
}
