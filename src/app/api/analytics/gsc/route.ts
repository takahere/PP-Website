import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { LRUCache } from 'lru-cache'
import { getGoogleCredentials, isGSCConfigured } from '@/lib/google-auth'

// LRU キャッシュ設定（最大100エントリ、10分TTL）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new LRUCache<string, any>({
  max: 100,
  ttl: 10 * 60 * 1000, // 10分
})

interface GSCQuery {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface GSCPage {
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface GSCSummary {
  totalClicks: number
  totalImpressions: number
  avgCtr: number
  avgPosition: number
}

export async function GET(request: Request) {
  try {
    // 設定チェック
    if (!isGSCConfigured()) {
      return NextResponse.json(
        {
          error: 'Google Search Console is not configured',
          message: 'Please set GOOGLE_SERVICE_ACCOUNT_JSON and GSC_SITE_URL',
          demo: true,
          queries: generateDemoQueries(),
          pages: generateDemoPages(),
          summary: generateDemoSummary(),
        },
        { status: 200 }
      )
    }

    // キャッシュチェック
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'

    const cacheKey = 'gsc-analytics-data'
    if (!forceRefresh) {
      const cachedResult = cache.get(cacheKey)
      if (cachedResult) {
        return NextResponse.json({ ...cachedResult as object, cached: true })
      }
    }

    const credentials = getGoogleCredentials()
    const siteUrl = process.env.GSC_SITE_URL

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    })

    const searchconsole = google.searchconsole({ version: 'v1', auth })

    // 日付範囲（過去28日）
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 28)

    // クエリ別データ取得
    const queriesResponse = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['query'],
        rowLimit: 20,
      },
    })

    const queries: GSCQuery[] =
      queriesResponse.data.rows?.map((row) => ({
        query: row.keys?.[0] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      })) || []

    // ページ別データ取得
    const pagesResponse = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['page'],
        rowLimit: 20,
      },
    })

    const pages: GSCPage[] =
      pagesResponse.data.rows?.map((row) => ({
        page: row.keys?.[0] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      })) || []

    // レスポンスデータ作成
    const responseData = {
      queries,
      pages,
      summary: calculateSummary(queries),
    }

    // LRU キャッシュ更新
    cache.set(cacheKey, responseData)

    return NextResponse.json({ ...responseData, cached: false })
  } catch (error) {
    console.error('GSC API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch Search Console data',
        message: error instanceof Error ? error.message : 'Unknown error',
        demo: true,
        queries: generateDemoQueries(),
        pages: generateDemoPages(),
        summary: generateDemoSummary(),
      },
      { status: 200 }
    )
  }
}

// サマリー計算
function calculateSummary(queries: GSCQuery[]): GSCSummary {
  if (queries.length === 0) {
    return {
      totalClicks: 0,
      totalImpressions: 0,
      avgCtr: 0,
      avgPosition: 0,
    }
  }

  const totalClicks = queries.reduce((sum, q) => sum + q.clicks, 0)
  const totalImpressions = queries.reduce((sum, q) => sum + q.impressions, 0)
  const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0
  const avgPosition =
    queries.reduce((sum, q) => sum + q.position, 0) / queries.length

  return {
    totalClicks,
    totalImpressions,
    avgCtr: Math.round(avgCtr * 10000) / 100,
    avgPosition: Math.round(avgPosition * 10) / 10,
  }
}

// デモデータ生成
function generateDemoQueries(): GSCQuery[] {
  const demoQueries = [
    'パートナーマーケティング',
    'PRM ツール',
    'パートナービジネス',
    'アライアンス 営業',
    'パートナープログラム 管理',
    '代理店 管理 システム',
    'パートナーポータル',
    '間接販売 効率化',
    'チャネルパートナー',
    'パートナー エンゲージメント',
    'PRM とは',
    'パートナー 関係管理',
    'パートナー戦略',
    'SaaS パートナービジネス',
    'パートナーセールス 自動化',
  ]

  return demoQueries.map((query, i) => ({
    query,
    clicks: Math.round(50 - i * 2.5 + Math.random() * 10),
    impressions: Math.round(500 - i * 25 + Math.random() * 100),
    ctr: (0.1 - i * 0.003 + Math.random() * 0.02),
    position: 5 + i * 1.5 + Math.random() * 3,
  }))
}

function generateDemoPages(): GSCPage[] {
  const demoPages = [
    '/',
    '/partner-marketing',
    '/casestudy/dinii',
    '/lab',
    '/seminar',
    '/knowledge',
    '/casestudy/optemo',
    '/casestudy/moneyforward',
    '/about',
    '/lab/partner-sales-tips',
  ]

  return demoPages.map((page, i) => ({
    page: `https://partner-prop.com${page}`,
    clicks: Math.round(80 - i * 5 + Math.random() * 15),
    impressions: Math.round(800 - i * 50 + Math.random() * 150),
    ctr: (0.1 - i * 0.005 + Math.random() * 0.02),
    position: 4 + i * 1.2 + Math.random() * 2,
  }))
}

function generateDemoSummary(): GSCSummary {
  return {
    totalClicks: 485,
    totalImpressions: 5230,
    avgCtr: 9.27,
    avgPosition: 12.4,
  }
}


















