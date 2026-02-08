import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'

// キャッシュ用
let cachedData: { data: TrendData; timestamp: number } | null = null
const CACHE_DURATION = 10 * 60 * 1000 // 10分

interface DailyMetrics {
  date: string
  users: number
  sessions: number
  pageviews: number
  engagementRate: number
  bounceRate: number
  conversions: number
}

interface WeeklyComparison {
  week: string
  users: number
  sessions: number
  conversions: number
  changeVsPrevious: {
    users: number // %
    sessions: number // %
    conversions: number // %
  }
}

interface MonthlyComparison {
  month: string
  users: number
  sessions: number
  conversions: number
  changeVsPrevious: {
    users: number // %
    sessions: number // %
    conversions: number // %
  }
}

interface TrendData {
  period: {
    startDate: string
    endDate: string
  }
  daily: DailyMetrics[]
  weekly: WeeklyComparison[]
  monthly: MonthlyComparison[]
  trends: {
    userGrowth: 'increasing' | 'stable' | 'decreasing'
    conversionTrend: 'improving' | 'stable' | 'declining'
    seasonality: {
      bestDay: string // Monday, Tuesday, etc.
      bestHour: number // 0-23
      weekendVsWeekday: number // 倍率
    }
  }
  forecasts: {
    nextWeekUsers: number
    nextMonthUsers: number
    confidence: 'high' | 'medium' | 'low'
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

    const startDate = '90daysAgo'
    const endDate = 'today'

    console.log('🔍 時系列トレンド分析開始:', { startDate, endDate })

    // 1. 日別データ（過去90日）
    const dailyResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'engagementRate' },
        { name: 'bounceRate' },
      ],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    })

    const daily: DailyMetrics[] = dailyResponse[0].rows?.map((row) => {
      const dateStr = row.dimensionValues?.[0]?.value || ''
      const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
      
      return {
        date: formattedDate,
        users: Number(row.metricValues?.[0]?.value) || 0,
        sessions: Number(row.metricValues?.[1]?.value) || 0,
        pageviews: Number(row.metricValues?.[2]?.value) || 0,
        engagementRate: Math.round((Number(row.metricValues?.[3]?.value) || 0) * 100),
        bounceRate: Math.round((Number(row.metricValues?.[4]?.value) || 0) * 100),
        conversions: 0, // 後で追加
      }
    }) || []

    // 日別コンバージョン数を取得
    const dailyConversionsResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            value: '資料ダウンロード',
          },
        },
      },
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    })

    const conversionsMap = new Map<string, number>()
    dailyConversionsResponse[0].rows?.forEach((row) => {
      const dateStr = row.dimensionValues?.[0]?.value || ''
      const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
      const conversions = Number(row.metricValues?.[0]?.value) || 0
      conversionsMap.set(formattedDate, conversions)
    })

    // コンバージョンをdailyに追加
    daily.forEach((day) => {
      day.conversions = conversionsMap.get(day.date) || 0
    })

    // 2. 週別データ（過去12週）
    const weeklyResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '84daysAgo', endDate }],
      dimensions: [{ name: 'week' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
      ],
      orderBys: [{ dimension: { dimensionName: 'week' } }],
    })

    const weeklyConversionsResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '84daysAgo', endDate }],
      dimensions: [{ name: 'week' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            value: '資料ダウンロード',
          },
        },
      },
      orderBys: [{ dimension: { dimensionName: 'week' } }],
    })

    const weeklyConversionsMap = new Map<string, number>()
    weeklyConversionsResponse[0].rows?.forEach((row) => {
      const week = row.dimensionValues?.[0]?.value || ''
      const conversions = Number(row.metricValues?.[0]?.value) || 0
      weeklyConversionsMap.set(week, conversions)
    })

    const weekly: WeeklyComparison[] = []
    let previousWeek: { users: number; sessions: number; conversions: number } | null = null

    weeklyResponse[0].rows?.forEach((row) => {
      const week = row.dimensionValues?.[0]?.value || ''
      const users = Number(row.metricValues?.[0]?.value) || 0
      const sessions = Number(row.metricValues?.[1]?.value) || 0
      const conversions = weeklyConversionsMap.get(week) || 0

      const changeVsPrevious = previousWeek ? {
        users: previousWeek.users > 0
          ? Math.round(((users - previousWeek.users) / previousWeek.users) * 10000) / 100
          : 0,
        sessions: previousWeek.sessions > 0
          ? Math.round(((sessions - previousWeek.sessions) / previousWeek.sessions) * 10000) / 100
          : 0,
        conversions: previousWeek.conversions > 0
          ? Math.round(((conversions - previousWeek.conversions) / previousWeek.conversions) * 10000) / 100
          : 0,
      } : { users: 0, sessions: 0, conversions: 0 }

      weekly.push({
        week,
        users,
        sessions,
        conversions,
        changeVsPrevious,
      })

      previousWeek = { users, sessions, conversions }
    })

    // 3. 月別データ（過去12ヶ月）
    const monthlyResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '365daysAgo', endDate }],
      dimensions: [{ name: 'month' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
      ],
      orderBys: [{ dimension: { dimensionName: 'month' } }],
    })

    const monthlyConversionsResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '365daysAgo', endDate }],
      dimensions: [{ name: 'month' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            value: '資料ダウンロード',
          },
        },
      },
      orderBys: [{ dimension: { dimensionName: 'month' } }],
    })

    const monthlyConversionsMap = new Map<string, number>()
    monthlyConversionsResponse[0].rows?.forEach((row) => {
      const month = row.dimensionValues?.[0]?.value || ''
      const conversions = Number(row.metricValues?.[0]?.value) || 0
      monthlyConversionsMap.set(month, conversions)
    })

    const monthly: MonthlyComparison[] = []
    let previousMonth: { users: number; sessions: number; conversions: number } | null = null

    monthlyResponse[0].rows?.forEach((row) => {
      const month = row.dimensionValues?.[0]?.value || ''
      const users = Number(row.metricValues?.[0]?.value) || 0
      const sessions = Number(row.metricValues?.[1]?.value) || 0
      const conversions = monthlyConversionsMap.get(month) || 0

      const changeVsPrevious = previousMonth ? {
        users: previousMonth.users > 0
          ? Math.round(((users - previousMonth.users) / previousMonth.users) * 10000) / 100
          : 0,
        sessions: previousMonth.sessions > 0
          ? Math.round(((sessions - previousMonth.sessions) / previousMonth.sessions) * 10000) / 100
          : 0,
        conversions: previousMonth.conversions > 0
          ? Math.round(((conversions - previousMonth.conversions) / previousMonth.conversions) * 10000) / 100
          : 0,
      } : { users: 0, sessions: 0, conversions: 0 }

      monthly.push({
        month,
        users,
        sessions,
        conversions,
        changeVsPrevious,
      })

      previousMonth = { users, sessions, conversions }
    })

    // 4. 曜日別・時間帯別データ
    const dayOfWeekResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate }],
      dimensions: [{ name: 'dayOfWeek' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    })

    const bestDay = dayOfWeekResponse[0].rows?.[0]?.dimensionValues?.[0]?.value || 'Monday'
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const bestDayName = dayNames[parseInt(bestDay)] || 'Monday'

    const hourResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate }],
      dimensions: [{ name: 'hour' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    })

    const bestHour = parseInt(hourResponse[0].rows?.[0]?.dimensionValues?.[0]?.value || '14')

    // 週末 vs 平日の比較（簡略化）
    const weekendVsWeekday = 0.65 // 週末は平日の65%程度（推定）

    // トレンド判定
    const recentWeeks = weekly.slice(-4)
    const avgRecentGrowth = recentWeeks.reduce((sum, w) => sum + w.changeVsPrevious.users, 0) / recentWeeks.length
    const userGrowth: 'increasing' | 'stable' | 'decreasing' = 
      avgRecentGrowth > 5 ? 'increasing' :
      avgRecentGrowth < -5 ? 'decreasing' : 'stable'

    const avgConversionGrowth = recentWeeks.reduce((sum, w) => sum + w.changeVsPrevious.conversions, 0) / recentWeeks.length
    const conversionTrend: 'improving' | 'stable' | 'declining' =
      avgConversionGrowth > 5 ? 'improving' :
      avgConversionGrowth < -5 ? 'declining' : 'stable'

    // 予測（簡易的な線形予測）
    const last4Weeks = weekly.slice(-4)
    const avgWeeklyUsers = last4Weeks.reduce((sum, w) => sum + w.users, 0) / last4Weeks.length
    const nextWeekUsers = Math.round(avgWeeklyUsers * (1 + avgRecentGrowth / 100))
    const nextMonthUsers = Math.round(nextWeekUsers * 4.3)

    const confidence: 'high' | 'medium' | 'low' =
      Math.abs(avgRecentGrowth) < 10 ? 'high' :
      Math.abs(avgRecentGrowth) < 25 ? 'medium' : 'low'

    const trends = {
      userGrowth,
      conversionTrend,
      seasonality: {
        bestDay: bestDayName,
        bestHour,
        weekendVsWeekday,
      },
    }

    const forecasts = {
      nextWeekUsers,
      nextMonthUsers,
      confidence,
    }

    const data: TrendData = {
      period: { startDate, endDate },
      daily,
      weekly,
      monthly,
      trends,
      forecasts,
    }

    console.log('📊 トレンド分析結果:', {
      日別データ: daily.length,
      ユーザー成長: userGrowth,
      CV傾向: conversionTrend,
      来週予測: `${nextWeekUsers}人`,
    })

    // キャッシュ更新
    cachedData = { data, timestamp: Date.now() }

    return NextResponse.json({
      data,
      cached: false,
    })
  } catch (error) {
    console.error('Trends API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch trends data',
        message: error instanceof Error ? error.message : 'Unknown error',
        demo: true,
        data: generateDemoData(),
      },
      { status: 200 }
    )
  }
}

// デモデータ生成
function generateDemoData(): TrendData {
  const today = new Date()
  const daily: DailyMetrics[] = []

  for (let i = 89; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const isWeekend = date.getDay() === 0 || date.getDay() === 6

    daily.push({
      date: dateStr,
      users: isWeekend 
        ? Math.floor(120 + Math.random() * 60)
        : Math.floor(220 + Math.random() * 100),
      sessions: isWeekend
        ? Math.floor(150 + Math.random() * 80)
        : Math.floor(280 + Math.random() * 120),
      pageviews: isWeekend
        ? Math.floor(400 + Math.random() * 200)
        : Math.floor(700 + Math.random() * 300),
      engagementRate: Math.round((55 + Math.random() * 20)),
      bounceRate: Math.round((30 + Math.random() * 20)),
      conversions: Math.floor(Math.random() * 5),
    })
  }

  return {
    period: {
      startDate: '90daysAgo',
      endDate: 'today',
    },
    daily,
    weekly: [
      {
        week: '202501',
        users: 1850,
        sessions: 2400,
        conversions: 18,
        changeVsPrevious: { users: 5.2, sessions: 4.8, conversions: 12.5 },
      },
      {
        week: '202502',
        users: 1950,
        sessions: 2520,
        conversions: 20,
        changeVsPrevious: { users: 5.4, sessions: 5.0, conversions: 11.1 },
      },
    ],
    monthly: [
      {
        month: '202511',
        users: 7850,
        sessions: 10200,
        conversions: 78,
        changeVsPrevious: { users: 3.5, sessions: 4.2, conversions: 8.3 },
      },
      {
        month: '202512',
        users: 8120,
        sessions: 10560,
        conversions: 85,
        changeVsPrevious: { users: 3.4, sessions: 3.5, conversions: 9.0 },
      },
    ],
    trends: {
      userGrowth: 'increasing',
      conversionTrend: 'improving',
      seasonality: {
        bestDay: 'Wednesday',
        bestHour: 14,
        weekendVsWeekday: 0.65,
      },
    },
    forecasts: {
      nextWeekUsers: 2050,
      nextMonthUsers: 8800,
      confidence: 'high',
    },
  }
}


















