import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { LRUCache } from 'lru-cache'
import { getGoogleCredentials, isGSCConfigured } from '@/lib/google-auth'

/**
 * GSC詳細検索パフォーマンスAPI
 *
 * クエリパラメータ:
 * - searchType: web|image|video|news|discover|googleNews (デフォルト: web)
 * - device: DESKTOP|MOBILE|TABLET (オプション)
 * - country: 国コード (オプション、例: jpn)
 * - dimension: query|page|country|device|date (デフォルト: query)
 * - startDate: 開始日 (デフォルト: 28日前)
 * - endDate: 終了日 (デフォルト: 今日)
 * - limit: 取得件数 (デフォルト: 50)
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new LRUCache<string, any>({
  max: 100,
  ttl: 10 * 60 * 1000,
})

interface GSCDetailedData {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export async function GET(request: Request) {
  try {
    if (!isGSCConfigured()) {
      return NextResponse.json({
        error: 'Google Search Console is not configured',
        demo: true,
        data: generateDemoData(),
      }, { status: 200 })
    }

    const { searchParams } = new URL(request.url)
    const searchType = searchParams.get('searchType') || 'web'
    const device = searchParams.get('device')
    const country = searchParams.get('country')
    const dimension = searchParams.get('dimension') || 'query'
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const forceRefresh = searchParams.get('refresh') === 'true'

    // 日付設定
    const endDate = new Date()
    const startDate = new Date()
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    if (startDateParam) {
      startDate.setTime(Date.parse(startDateParam))
    } else {
      startDate.setDate(startDate.getDate() - 28)
    }
    if (endDateParam) {
      endDate.setTime(Date.parse(endDateParam))
    }

    // キャッシュキー
    const cacheKey = `gsc-detailed-${searchType}-${device}-${country}-${dimension}-${startDate.toISOString()}-${endDate.toISOString()}`
    if (!forceRefresh) {
      const cached = cache.get(cacheKey)
      if (cached) {
        return NextResponse.json({ ...cached as object, cached: true })
      }
    }

    const credentials = getGoogleCredentials()
    const siteUrl = process.env.GSC_SITE_URL

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    })

    const searchconsole = google.searchconsole({ version: 'v1', auth })

    // フィルタ構築
    const dimensionFilterGroups: Array<{ filters: Array<{ dimension: string; expression: string }> }> = []
    if (device) {
      dimensionFilterGroups.push({
        filters: [{ dimension: 'device', expression: device }]
      })
    }
    if (country) {
      dimensionFilterGroups.push({
        filters: [{ dimension: 'country', expression: country }]
      })
    }

    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: [dimension],
        type: searchType,
        dimensionFilterGroups: dimensionFilterGroups.length > 0 ? dimensionFilterGroups : undefined,
        rowLimit: limit,
      },
    })

    const data: GSCDetailedData[] = response.data.rows?.map((row) => ({
      keys: row.keys || [],
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    })) || []

    // サマリー計算
    const summary = {
      totalClicks: data.reduce((sum, d) => sum + d.clicks, 0),
      totalImpressions: data.reduce((sum, d) => sum + d.impressions, 0),
      avgCtr: data.length > 0 ? data.reduce((sum, d) => sum + d.ctr, 0) / data.length : 0,
      avgPosition: data.length > 0 ? data.reduce((sum, d) => sum + d.position, 0) / data.length : 0,
    }

    const responseData = {
      filters: { searchType, device, country, dimension },
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      data,
      summary,
    }

    cache.set(cacheKey, responseData)

    return NextResponse.json({ ...responseData, cached: false })
  } catch (error) {
    console.error('GSC Detailed API Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch GSC detailed data',
      message: error instanceof Error ? error.message : 'Unknown error',
      demo: true,
      data: generateDemoData(),
    }, { status: 200 })
  }
}

function generateDemoData(): GSCDetailedData[] {
  return [
    { keys: ['パートナーマーケティング'], clicks: 45, impressions: 520, ctr: 0.087, position: 4.2 },
    { keys: ['PRM ツール'], clicks: 38, impressions: 410, ctr: 0.093, position: 5.1 },
    { keys: ['パートナービジネス'], clicks: 32, impressions: 380, ctr: 0.084, position: 6.3 },
    { keys: ['代理店管理'], clicks: 28, impressions: 320, ctr: 0.088, position: 7.2 },
    { keys: ['アライアンス営業'], clicks: 22, impressions: 280, ctr: 0.079, position: 8.5 },
  ]
}
