import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { LRUCache } from 'lru-cache'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'

// LRU キャッシュ設定（最大100エントリ、5分TTL）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new LRUCache<string, any>({
  max: 100,
  ttl: 5 * 60 * 1000, // 5分
})

interface GAData {
  date: string
  users: number
  sessions: number
  pageviews: number
  bounceRate: number
  avgSessionDuration: number
  engagementRate: number
  avgEngagementTime: number
}

interface ChannelData {
  channel: string
  users: number
  sessions: number
  percentage: number
}

interface DeviceData {
  device: string
  users: number
  sessions: number
  percentage: number
}

interface UserTypeData {
  userType: string
  users: number
  percentage: number
}

interface PageEngagementData {
  pagePath: string
  pageTitle: string
  pageviews: number
  avgEngagementTime: number
  engagementRate: number
}

interface CategoryData {
  category: string
  pageviews: number
  users: number
  avgEngagementTime: number
  percentage: number
}

interface GASummary {
  totalUsers: number
  totalSessions: number
  totalPageviews: number
  avgBounceRate: number
  avgSessionDuration: number
  avgEngagementRate: number
  avgEngagementTime: number
  usersTrend: number // 前週比 %
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
          summary: generateDemoSummary(),
          channels: generateDemoChannels(),
          devices: generateDemoDevices(),
          userTypes: generateDemoUserTypes(),
          pageEngagement: generateDemoPageEngagement(),
          categories: generateDemoCategories(),
        },
        { status: 200 }
      )
    }

    // パラメータ取得
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'
    const startDate = searchParams.get('startDate') || '30daysAgo'
    const endDate = searchParams.get('endDate') || 'today'

    // キャッシュキーに期間を含める
    const cacheKey = `ga-analytics-data-${startDate}-${endDate}`
    if (!forceRefresh) {
      const cachedResult = cache.get(cacheKey)
      if (cachedResult) {
        return NextResponse.json({ ...cachedResult as object, cached: true })
      }
    }

    const credentials = getGoogleCredentials()
    const propertyId = process.env.GA4_PROPERTY_ID

    const analyticsDataClient = new BetaAnalyticsDataClient({ credentials })

    // 並列でデータを取得
    const [
      dailyResponse,
      channelResponse,
      deviceResponse,
      userTypeResponse,
      pageEngagementResponse,
    ] = await Promise.all([
      // 過去30日のデータ（エンゲージメント指標追加）
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
          { name: 'engagementRate' },
          { name: 'userEngagementDuration' },
        ],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
      // チャネル別データ
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
        ],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      }),
      // デバイス別データ
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
        ],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      }),
      // 新規vsリピーター
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'newVsReturning' }],
        metrics: [{ name: 'activeUsers' }],
      }),
      // ページ別エンゲージメント時間ランキング
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'userEngagementDuration' },
          { name: 'engagementRate' },
          { name: 'activeUsers' },
        ],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 30,
      }),
    ])

    // 日別データ
    const data: GAData[] =
      dailyResponse[0].rows?.map((row) => {
        const users = Number(row.metricValues?.[0]?.value) || 0
        const engagementDuration = Number(row.metricValues?.[6]?.value) || 0
        return {
          date: formatDate(row.dimensionValues?.[0]?.value || ''),
          users,
          sessions: Number(row.metricValues?.[1]?.value) || 0,
          pageviews: Number(row.metricValues?.[2]?.value) || 0,
          bounceRate: Number(row.metricValues?.[3]?.value) || 0,
          avgSessionDuration: Number(row.metricValues?.[4]?.value) || 0,
          engagementRate: Number(row.metricValues?.[5]?.value) || 0,
          avgEngagementTime: users > 0 ? engagementDuration / users : 0,
        }
      }) || []

    // チャネル別データ
    const totalChannelUsers = channelResponse[0].rows?.reduce(
      (sum, row) => sum + Number(row.metricValues?.[0]?.value || 0), 0
    ) || 1
    const channels: ChannelData[] =
      channelResponse[0].rows?.map((row) => {
        const users = Number(row.metricValues?.[0]?.value) || 0
        return {
          channel: translateChannel(row.dimensionValues?.[0]?.value || ''),
          users,
          sessions: Number(row.metricValues?.[1]?.value) || 0,
          percentage: Math.round((users / totalChannelUsers) * 100),
        }
      }) || []

    // デバイス別データ
    const totalDeviceUsers = deviceResponse[0].rows?.reduce(
      (sum, row) => sum + Number(row.metricValues?.[0]?.value || 0), 0
    ) || 1
    const devices: DeviceData[] =
      deviceResponse[0].rows?.map((row) => {
        const users = Number(row.metricValues?.[0]?.value) || 0
        return {
          device: translateDevice(row.dimensionValues?.[0]?.value || ''),
          users,
          sessions: Number(row.metricValues?.[1]?.value) || 0,
          percentage: Math.round((users / totalDeviceUsers) * 100),
        }
      }) || []

    // 新規vsリピーター
    const totalUserTypeUsers = userTypeResponse[0].rows?.reduce(
      (sum, row) => sum + Number(row.metricValues?.[0]?.value || 0), 0
    ) || 1
    const userTypes: UserTypeData[] =
      userTypeResponse[0].rows?.map((row) => {
        const users = Number(row.metricValues?.[0]?.value) || 0
        return {
          userType: translateUserType(row.dimensionValues?.[0]?.value || ''),
          users,
          percentage: Math.round((users / totalUserTypeUsers) * 100),
        }
      }) || []

    // ページ別エンゲージメント
    const pageEngagement: PageEngagementData[] =
      pageEngagementResponse[0].rows?.map((row) => {
        const pageviews = Number(row.metricValues?.[0]?.value) || 0
        const engagementDuration = Number(row.metricValues?.[1]?.value) || 0
        const users = Number(row.metricValues?.[3]?.value) || 0
        return {
          pagePath: row.dimensionValues?.[0]?.value || '',
          pageTitle: row.dimensionValues?.[1]?.value || '',
          pageviews,
          avgEngagementTime: users > 0 ? engagementDuration / users : 0,
          engagementRate: Number(row.metricValues?.[2]?.value) || 0,
        }
      }) || []

    // カテゴリ別集計（URLパスから分類）
    const categories = aggregateByCategory(pageEngagement)

    // レスポンスデータ作成
    const responseData = {
      data,
      summary: calculateSummary(data),
      channels,
      devices,
      userTypes,
      pageEngagement,
      categories,
    }

    // LRU キャッシュ更新
    cache.set(cacheKey, responseData)

    return NextResponse.json({ ...responseData, cached: false })
  } catch (error) {
    console.error('GA API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch Google Analytics data',
        message: error instanceof Error ? error.message : 'Unknown error',
        demo: true,
        data: generateDemoData(),
        summary: generateDemoSummary(),
        channels: generateDemoChannels(),
        devices: generateDemoDevices(),
        userTypes: generateDemoUserTypes(),
        pageEngagement: generateDemoPageEngagement(),
        categories: generateDemoCategories(),
      },
      { status: 200 }
    )
  }
}

// URLパスからカテゴリを判定
function getCategoryFromPath(path: string): string {
  if (path.startsWith('/lab/content_type/research')) return 'リサーチ'
  if (path.startsWith('/lab/content_type/interview')) return 'インタビュー'
  if (path.startsWith('/lab/content_type/knowledge')) return 'ナレッジ(Lab)'
  if (path.startsWith('/lab/category/')) return 'Lab カテゴリ'
  if (path.startsWith('/lab/')) return 'Lab 記事'
  if (path.startsWith('/casestudy/')) return '導入事例'
  if (path.startsWith('/seminar/')) return 'セミナー'
  if (path.startsWith('/news/')) return 'ニュース'
  if (path.startsWith('/knowledge/')) return 'お役立ち資料'
  if (path.startsWith('/member/')) return 'メンバー'
  if (path === '/' || path === '') return 'トップページ'
  return 'その他'
}

// カテゴリ別に集計
function aggregateByCategory(pages: PageEngagementData[]): CategoryData[] {
  const categoryMap = new Map<string, { pageviews: number; users: number; totalEngagementTime: number }>()

  pages.forEach((page) => {
    const category = getCategoryFromPath(page.pagePath)
    const existing = categoryMap.get(category) || { pageviews: 0, users: 0, totalEngagementTime: 0 }
    categoryMap.set(category, {
      pageviews: existing.pageviews + page.pageviews,
      users: existing.users + Math.round(page.pageviews * page.engagementRate),
      totalEngagementTime: existing.totalEngagementTime + page.avgEngagementTime * page.pageviews,
    })
  })

  const totalPageviews = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.pageviews, 0) || 1

  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      pageviews: data.pageviews,
      users: data.users,
      avgEngagementTime: data.pageviews > 0 ? data.totalEngagementTime / data.pageviews : 0,
      percentage: Math.round((data.pageviews / totalPageviews) * 100),
    }))
    .sort((a, b) => b.pageviews - a.pageviews)
}

// 日付フォーマット: YYYYMMDD -> YYYY-MM-DD
function formatDate(dateStr: string): string {
  if (dateStr.length !== 8) return dateStr
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
}

// サマリー計算
function calculateSummary(data: GAData[]): GASummary {
  if (data.length === 0) {
    return {
      totalUsers: 0,
      totalSessions: 0,
      totalPageviews: 0,
      avgBounceRate: 0,
      avgSessionDuration: 0,
      avgEngagementRate: 0,
      avgEngagementTime: 0,
      usersTrend: 0,
    }
  }

  const totalUsers = data.reduce((sum, d) => sum + d.users, 0)
  const totalSessions = data.reduce((sum, d) => sum + d.sessions, 0)
  const totalPageviews = data.reduce((sum, d) => sum + d.pageviews, 0)
  const avgBounceRate = data.reduce((sum, d) => sum + d.bounceRate, 0) / data.length
  const avgSessionDuration = data.reduce((sum, d) => sum + d.avgSessionDuration, 0) / data.length
  const avgEngagementRate = data.reduce((sum, d) => sum + d.engagementRate, 0) / data.length
  const avgEngagementTime = data.reduce((sum, d) => sum + d.avgEngagementTime, 0) / data.length

  // 前週比計算（直近7日 vs その前7日）
  const recent7 = data.slice(-7)
  const previous7 = data.slice(-14, -7)
  const recentUsers = recent7.reduce((sum, d) => sum + d.users, 0)
  const previousUsers = previous7.reduce((sum, d) => sum + d.users, 0)
  const usersTrend =
    previousUsers > 0
      ? Math.round(((recentUsers - previousUsers) / previousUsers) * 100)
      : 0

  return {
    totalUsers,
    totalSessions,
    totalPageviews,
    avgBounceRate: Math.round(avgBounceRate * 100) / 100,
    avgSessionDuration: Math.round(avgSessionDuration),
    avgEngagementRate: Math.round(avgEngagementRate * 10000) / 100,
    avgEngagementTime: Math.round(avgEngagementTime),
    usersTrend,
  }
}

// デモデータ生成
function generateDemoData(): GAData[] {
  const data: GAData[] = []
  const today = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // 週末は少なめ
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const baseUsers = isWeekend ? 80 : 150
    const variance = Math.random() * 50 - 25

    data.push({
      date: date.toISOString().split('T')[0],
      users: Math.round(baseUsers + variance),
      sessions: Math.round((baseUsers + variance) * 1.3),
      pageviews: Math.round((baseUsers + variance) * 3.5),
      bounceRate: 0.45 + Math.random() * 0.15,
      avgSessionDuration: 120 + Math.random() * 60,
      engagementRate: 0.55 + Math.random() * 0.2,
      avgEngagementTime: 90 + Math.random() * 60,
    })
  }

  return data
}

function generateDemoSummary(): GASummary {
  return {
    totalUsers: 3850,
    totalSessions: 5005,
    totalPageviews: 13475,
    avgBounceRate: 52.3,
    avgSessionDuration: 145,
    avgEngagementRate: 65.2,
    avgEngagementTime: 120,
    usersTrend: 12,
  }
}

// チャネル名を日本語に変換
function translateChannel(channel: string): string {
  const channelMap: Record<string, string> = {
    'Organic Search': '自然検索',
    'Direct': 'ダイレクト',
    'Referral': '参照元サイト',
    'Organic Social': 'SNS（自然）',
    'Paid Search': '検索広告',
    'Paid Social': 'SNS広告',
    'Email': 'メール',
    'Display': 'ディスプレイ広告',
    'Affiliates': 'アフィリエイト',
    'Other': 'その他',
  }
  return channelMap[channel] || channel
}

// デバイス名を日本語に変換
function translateDevice(device: string): string {
  const deviceMap: Record<string, string> = {
    'desktop': 'デスクトップ',
    'mobile': 'モバイル',
    'tablet': 'タブレット',
  }
  return deviceMap[device] || device
}

// ユーザータイプを日本語に変換
function translateUserType(userType: string): string {
  const typeMap: Record<string, string> = {
    'new': '新規ユーザー',
    'returning': 'リピーター',
  }
  return typeMap[userType] || userType
}

// デモ用チャネルデータ
function generateDemoChannels(): ChannelData[] {
  return [
    { channel: '自然検索', users: 1925, sessions: 2500, percentage: 50 },
    { channel: 'ダイレクト', users: 770, sessions: 1000, percentage: 20 },
    { channel: '参照元サイト', users: 578, sessions: 750, percentage: 15 },
    { channel: 'SNS（自然）', users: 385, sessions: 500, percentage: 10 },
    { channel: 'その他', users: 192, sessions: 255, percentage: 5 },
  ]
}

// デモ用デバイスデータ
function generateDemoDevices(): DeviceData[] {
  return [
    { device: 'デスクトップ', users: 2310, sessions: 3000, percentage: 60 },
    { device: 'モバイル', users: 1348, sessions: 1750, percentage: 35 },
    { device: 'タブレット', users: 192, sessions: 255, percentage: 5 },
  ]
}

// デモ用ユーザータイプデータ
function generateDemoUserTypes(): UserTypeData[] {
  return [
    { userType: '新規ユーザー', users: 2695, percentage: 70 },
    { userType: 'リピーター', users: 1155, percentage: 30 },
  ]
}

// デモ用ページエンゲージメントデータ
function generateDemoPageEngagement(): PageEngagementData[] {
  return [
    { pagePath: '/', pageTitle: 'PartnerProp | パートナービジネスを加速する', pageviews: 2500, avgEngagementTime: 45, engagementRate: 0.72 },
    { pagePath: '/lab', pageTitle: 'PartnerLab | パートナーラボ', pageviews: 1800, avgEngagementTime: 120, engagementRate: 0.68 },
    { pagePath: '/lab/strategy-planning/2175', pageTitle: 'パートナー戦略の立て方 | PartnerLab', pageviews: 850, avgEngagementTime: 240, engagementRate: 0.75 },
    { pagePath: '/casestudy/dinii', pageTitle: 'ダイニー導入事例 | PartnerProp', pageviews: 720, avgEngagementTime: 180, engagementRate: 0.82 },
    { pagePath: '/partner-marketing', pageTitle: 'パートナーマーケティングとは | PartnerProp', pageviews: 680, avgEngagementTime: 150, engagementRate: 0.65 },
    { pagePath: '/seminar', pageTitle: 'セミナー一覧 | PartnerProp', pageviews: 520, avgEngagementTime: 60, engagementRate: 0.55 },
    { pagePath: '/lab/content_type/research', pageTitle: 'リサーチ記事一覧 | PartnerLab', pageviews: 480, avgEngagementTime: 90, engagementRate: 0.62 },
    { pagePath: '/knowledge', pageTitle: 'お役立ち資料 | PartnerProp', pageviews: 420, avgEngagementTime: 75, engagementRate: 0.58 },
    { pagePath: '/casestudy/optemo', pageTitle: 'Optemo導入事例 | PartnerProp', pageviews: 380, avgEngagementTime: 165, engagementRate: 0.78 },
    { pagePath: '/lab/content_type/interview', pageTitle: 'インタビュー記事一覧 | PartnerLab', pageviews: 350, avgEngagementTime: 85, engagementRate: 0.60 },
  ]
}

// デモ用カテゴリデータ
function generateDemoCategories(): CategoryData[] {
  return [
    { category: 'トップページ', pageviews: 2500, users: 1800, avgEngagementTime: 45, percentage: 25 },
    { category: 'Lab 記事', pageviews: 2200, users: 1540, avgEngagementTime: 180, percentage: 22 },
    { category: '導入事例', pageviews: 1800, users: 1440, avgEngagementTime: 170, percentage: 18 },
    { category: 'リサーチ', pageviews: 1200, users: 744, avgEngagementTime: 210, percentage: 12 },
    { category: 'セミナー', pageviews: 800, users: 440, avgEngagementTime: 65, percentage: 8 },
    { category: 'インタビュー', pageviews: 600, users: 360, avgEngagementTime: 195, percentage: 6 },
    { category: 'お役立ち資料', pageviews: 500, users: 290, avgEngagementTime: 80, percentage: 5 },
    { category: 'その他', pageviews: 400, users: 240, avgEngagementTime: 55, percentage: 4 },
  ]
}
