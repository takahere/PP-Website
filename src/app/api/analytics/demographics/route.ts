import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { LRUCache } from 'lru-cache'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'

/**
 * ユーザー属性（デモグラフィック）API
 *
 * 取得データ:
 * - 年齢層 (userAgeBracket)
 * - 性別 (userGender)
 * - 興味関心 (interestOtherCategory)
 *
 * ※ GA4で「Googleシグナル」を有効にする必要があります
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new LRUCache<string, any>({
  max: 100,
  ttl: 10 * 60 * 1000,
})

interface AgeData {
  ageGroup: string
  users: number
  sessions: number
  percentage: number
}

interface GenderData {
  gender: string
  users: number
  sessions: number
  percentage: number
}

interface InterestData {
  category: string
  users: number
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

    const cacheKey = `demographics-${startDate}-${endDate}`
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
    const [ageResponse, genderResponse, interestResponse] = await Promise.all([
      // 年齢層
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'userAgeBracket' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      }),
      // 性別
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'userGender' }],
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      }),
      // 興味関心
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'interestOtherCategory' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 20,
      }),
    ])

    // 年齢層データ処理
    const totalAgeUsers = ageResponse[0].rows?.reduce(
      (sum, row) => sum + Number(row.metricValues?.[0]?.value || 0), 0
    ) || 1

    const ageData: AgeData[] = ageResponse[0].rows?.map((row) => {
      const users = Number(row.metricValues?.[0]?.value) || 0
      return {
        ageGroup: translateAge(row.dimensionValues?.[0]?.value || ''),
        users,
        sessions: Number(row.metricValues?.[1]?.value) || 0,
        percentage: Math.round((users / totalAgeUsers) * 100),
      }
    }) || []

    // 性別データ処理
    const totalGenderUsers = genderResponse[0].rows?.reduce(
      (sum, row) => sum + Number(row.metricValues?.[0]?.value || 0), 0
    ) || 1

    const genderData: GenderData[] = genderResponse[0].rows?.map((row) => {
      const users = Number(row.metricValues?.[0]?.value) || 0
      return {
        gender: translateGender(row.dimensionValues?.[0]?.value || ''),
        users,
        sessions: Number(row.metricValues?.[1]?.value) || 0,
        percentage: Math.round((users / totalGenderUsers) * 100),
      }
    }) || []

    // 興味関心データ処理
    const totalInterestUsers = interestResponse[0].rows?.reduce(
      (sum, row) => sum + Number(row.metricValues?.[0]?.value || 0), 0
    ) || 1

    const interestData: InterestData[] = interestResponse[0].rows?.map((row) => {
      const users = Number(row.metricValues?.[0]?.value) || 0
      return {
        category: row.dimensionValues?.[0]?.value || '',
        users,
        percentage: Math.round((users / totalInterestUsers) * 100),
      }
    }) || []

    const responseData = {
      period: { startDate, endDate },
      age: ageData,
      gender: genderData,
      interests: interestData,
      note: 'Googleシグナルが有効な場合のみ詳細データが表示されます',
    }

    cache.set(cacheKey, responseData)

    return NextResponse.json({ ...responseData, cached: false })
  } catch (error) {
    console.error('Demographics API Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch demographics data',
      message: error instanceof Error ? error.message : 'Unknown error',
      demo: true,
      ...generateDemoData(),
    }, { status: 200 })
  }
}

function translateAge(age: string): string {
  const ageMap: Record<string, string> = {
    '18-24': '18-24歳',
    '25-34': '25-34歳',
    '35-44': '35-44歳',
    '45-54': '45-54歳',
    '55-64': '55-64歳',
    '65+': '65歳以上',
    'unknown': '不明',
  }
  return ageMap[age] || age
}

function translateGender(gender: string): string {
  const genderMap: Record<string, string> = {
    'male': '男性',
    'female': '女性',
    'unknown': '不明',
  }
  return genderMap[gender] || gender
}

function generateDemoData() {
  return {
    age: [
      { ageGroup: '25-34歳', users: 1250, sessions: 1625, percentage: 32 },
      { ageGroup: '35-44歳', users: 1100, sessions: 1430, percentage: 28 },
      { ageGroup: '45-54歳', users: 780, sessions: 1014, percentage: 20 },
      { ageGroup: '18-24歳', users: 390, sessions: 507, percentage: 10 },
      { ageGroup: '55-64歳', users: 312, sessions: 406, percentage: 8 },
      { ageGroup: '65歳以上', users: 78, sessions: 101, percentage: 2 },
    ],
    gender: [
      { gender: '男性', users: 2730, sessions: 3549, percentage: 70 },
      { gender: '女性', users: 1170, sessions: 1521, percentage: 30 },
    ],
    interests: [
      { category: 'Technology/Business Software', users: 1560, percentage: 40 },
      { category: 'Business/Business Services', users: 1170, percentage: 30 },
      { category: 'News/Business News', users: 585, percentage: 15 },
      { category: 'Business/Marketing Services', users: 390, percentage: 10 },
      { category: 'Technology/Software', users: 195, percentage: 5 },
    ],
  }
}
