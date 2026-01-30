import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { createClient } from '@supabase/supabase-js'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'

// キャッシュ用
let cachedData: { data: HeatmapSummaryResult; timestamp: number } | null = null
const CACHE_DURATION = 10 * 60 * 1000 // 10分

interface PageHeatmapSummary {
  pagePath: string
  pageTitle: string
  totalUsers: number
  completionRate: number
  avgReadTime: number
  quality: 'excellent' | 'good' | 'needs_improvement' | 'poor'
  mainDropOffDepth: number
}

interface HeatmapSummaryResult {
  pages: PageHeatmapSummary[]
  summary: {
    totalPages: number
    avgCompletionRate: number
    excellentCount: number
    goodCount: number
    needsImprovementCount: number
    poorCount: number
  }
}

// Supabaseクライアント
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 50

    // キャッシュチェック
    if (!forceRefresh && cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      const limitedPages = cachedData.data.pages.slice(0, limit)
      return NextResponse.json({
        data: { ...cachedData.data, pages: limitedPages },
        cached: true,
      })
    }

    // GA設定チェック
    if (!isGoogleConfigured()) {
      return NextResponse.json({
        error: 'Google Analytics is not configured',
        demo: true,
        data: generateDemoData(limit),
      })
    }

    const credentials = getGoogleCredentials()
    const propertyId = process.env.GA4_PROPERTY_ID
    const analyticsDataClient = new BetaAnalyticsDataClient({ credentials })

    // 過去30日のデータ
    const startDate = '30daysAgo'
    const endDate = 'today'

    // 1. /lab/ 配下の全ページのメトリクスを取得
    const pageMetricsResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'BEGINS_WITH',
            value: '/lab/',
          },
        },
      },
      metrics: [
        { name: 'activeUsers' },
        { name: 'userEngagementDuration' },
        { name: 'engagementRate' },
      ],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 200, // 最大200ページ取得
    })

    // 2. スクロールイベントデータを取得（全Lab記事）
    const scrollEventsResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'pagePath',
                stringFilter: {
                  matchType: 'BEGINS_WITH',
                  value: '/lab/',
                },
              },
            },
            {
              filter: {
                fieldName: 'eventName',
                stringFilter: {
                  matchType: 'EXACT',
                  value: 'scroll',
                },
              },
            },
          ],
        },
      },
      metrics: [{ name: 'eventCount' }],
      limit: 200,
    })

    // スクロールイベントをマップ化
    const scrollMap = new Map<string, number>()
    for (const row of scrollEventsResponse[0].rows || []) {
      const path = row.dimensionValues?.[0]?.value || ''
      const scrollCount = Number(row.metricValues?.[0]?.value) || 0
      scrollMap.set(path, scrollCount)
    }

    // 3. Supabaseから記事タイトルを取得
    const supabase = getSupabaseClient()
    const titleMap = new Map<string, string>()

    if (supabase) {
      const { data: articles } = await supabase
        .from('lab_articles')
        .select('slug, title')
        .eq('is_published', true)

      if (articles) {
        for (const article of articles) {
          // slugからpathを生成（複数パターン対応）
          titleMap.set(`/lab/${article.slug}`, article.title)
          titleMap.set(`/lab/${article.slug}/`, article.title)

          // category_id形式のslugを旧形式URLに変換
          const lastUnderscoreIndex = article.slug.lastIndexOf('_')
          if (lastUnderscoreIndex !== -1) {
            const category = article.slug.substring(0, lastUnderscoreIndex)
            const id = article.slug.substring(lastUnderscoreIndex + 1)
            titleMap.set(`/lab/${category}/${id}`, article.title)
            titleMap.set(`/lab/${category}/${id}/`, article.title)
          }
        }
      }
    }

    // 4. 各ページのサマリーを計算
    const pages: PageHeatmapSummary[] = []

    for (const row of pageMetricsResponse[0].rows || []) {
      const pagePath = row.dimensionValues?.[0]?.value || ''
      const totalUsers = Number(row.metricValues?.[0]?.value) || 0
      const totalEngagementDuration = Number(row.metricValues?.[1]?.value) || 0
      const engagementRate = Number(row.metricValues?.[2]?.value) || 0

      // 最小ユーザー数フィルター（ノイズ除去）
      if (totalUsers < 10) continue

      // 一覧ページなどを除外
      if (pagePath === '/lab/' || pagePath === '/lab') continue

      const avgReadTime = totalUsers > 0 ? Math.round(totalEngagementDuration / totalUsers) : 0
      const scrollCount = scrollMap.get(pagePath) || 0
      const scrollRate = totalUsers > 0 ? scrollCount / totalUsers : 0

      // 完了率（90%到達推定）
      const completionRate = Math.round(scrollRate * 100)

      // 品質評価
      const quality = evaluateQuality(completionRate, avgReadTime, engagementRate)

      // 主要離脱ポイント推定
      const mainDropOffDepth = estimateMainDropOff(completionRate, engagementRate)

      // タイトル取得
      const pageTitle = titleMap.get(pagePath) || titleMap.get(pagePath.replace(/\/$/, '')) || pagePath

      pages.push({
        pagePath,
        pageTitle,
        totalUsers,
        completionRate,
        avgReadTime,
        quality,
        mainDropOffDepth,
      })
    }

    // 完了率でソート（低い順 = 改善が必要な順）
    pages.sort((a, b) => a.completionRate - b.completionRate)

    // サマリー計算
    const summary = {
      totalPages: pages.length,
      avgCompletionRate: pages.length > 0
        ? Math.round(pages.reduce((sum, p) => sum + p.completionRate, 0) / pages.length)
        : 0,
      excellentCount: pages.filter(p => p.quality === 'excellent').length,
      goodCount: pages.filter(p => p.quality === 'good').length,
      needsImprovementCount: pages.filter(p => p.quality === 'needs_improvement').length,
      poorCount: pages.filter(p => p.quality === 'poor').length,
    }

    const result: HeatmapSummaryResult = { pages, summary }

    // キャッシュ更新
    cachedData = { data: result, timestamp: Date.now() }

    return NextResponse.json({
      data: { ...result, pages: pages.slice(0, limit) },
      cached: false,
    })
  } catch (error) {
    console.error('Reader Heatmap Summary API Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch reader heatmap summary',
      message: error instanceof Error ? error.message : 'Unknown error',
      demo: true,
      data: generateDemoData(50),
    })
  }
}

// 品質評価
function evaluateQuality(
  completionRate: number,
  avgReadTime: number,
  engagementRate: number
): PageHeatmapSummary['quality'] {
  // スコア計算（各指標を正規化して加重平均）
  const completionScore = Math.min(completionRate / 30, 1) * 40 // 30%で満点、重み40
  const readTimeScore = Math.min(avgReadTime / 180, 1) * 30 // 3分で満点、重み30
  const engagementScore = Math.min(engagementRate / 0.5, 1) * 30 // 50%で満点、重み30

  const totalScore = completionScore + readTimeScore + engagementScore

  if (totalScore >= 75) return 'excellent'
  if (totalScore >= 50) return 'good'
  if (totalScore >= 25) return 'needs_improvement'
  return 'poor'
}

// 主要離脱ポイント推定
function estimateMainDropOff(completionRate: number, engagementRate: number): number {
  // 完了率とエンゲージメント率から主要離脱ポイントを推定
  if (completionRate >= 30) {
    // 読了率が高い = 後半で離脱
    return 70 + Math.round(Math.random() * 20)
  } else if (completionRate >= 15) {
    // 中程度 = 中盤で離脱
    return 40 + Math.round(Math.random() * 20)
  } else {
    // 低い = 前半で離脱
    if (engagementRate < 0.3) {
      return 10 + Math.round(Math.random() * 15) // 導入で離脱
    }
    return 20 + Math.round(Math.random() * 20) // 本文前半で離脱
  }
}

// デモデータ生成
function generateDemoData(limit: number): HeatmapSummaryResult {
  const demoPages: PageHeatmapSummary[] = [
    {
      pagePath: '/lab/knowledge/partner-marketing-guide',
      pageTitle: 'パートナーマーケティング完全ガイド',
      totalUsers: 1250,
      completionRate: 22,
      avgReadTime: 195,
      quality: 'good',
      mainDropOffDepth: 45,
    },
    {
      pagePath: '/lab/research/market-analysis-2024',
      pageTitle: '2024年市場動向レポート',
      totalUsers: 890,
      completionRate: 35,
      avgReadTime: 240,
      quality: 'excellent',
      mainDropOffDepth: 75,
    },
    {
      pagePath: '/lab/interview/success-story-company-a',
      pageTitle: '成功事例インタビュー：A社様',
      totalUsers: 650,
      completionRate: 28,
      avgReadTime: 180,
      quality: 'good',
      mainDropOffDepth: 55,
    },
    {
      pagePath: '/lab/knowledge/channel-strategy',
      pageTitle: 'チャネル戦略の基礎',
      totalUsers: 520,
      completionRate: 12,
      avgReadTime: 85,
      quality: 'needs_improvement',
      mainDropOffDepth: 25,
    },
    {
      pagePath: '/lab/research/competitor-analysis',
      pageTitle: '競合分析レポート',
      totalUsers: 430,
      completionRate: 8,
      avgReadTime: 45,
      quality: 'poor',
      mainDropOffDepth: 15,
    },
    {
      pagePath: '/lab/knowledge/roi-calculation',
      pageTitle: 'ROI計算の方法',
      totalUsers: 380,
      completionRate: 42,
      avgReadTime: 210,
      quality: 'excellent',
      mainDropOffDepth: 80,
    },
    {
      pagePath: '/lab/interview/expert-interview-seo',
      pageTitle: 'SEO専門家インタビュー',
      totalUsers: 340,
      completionRate: 18,
      avgReadTime: 120,
      quality: 'needs_improvement',
      mainDropOffDepth: 35,
    },
    {
      pagePath: '/lab/knowledge/affiliate-basics',
      pageTitle: 'アフィリエイトマーケティング入門',
      totalUsers: 290,
      completionRate: 15,
      avgReadTime: 100,
      quality: 'needs_improvement',
      mainDropOffDepth: 30,
    },
  ]

  const pages = demoPages.slice(0, limit)

  return {
    pages,
    summary: {
      totalPages: demoPages.length,
      avgCompletionRate: Math.round(
        demoPages.reduce((sum, p) => sum + p.completionRate, 0) / demoPages.length
      ),
      excellentCount: demoPages.filter(p => p.quality === 'excellent').length,
      goodCount: demoPages.filter(p => p.quality === 'good').length,
      needsImprovementCount: demoPages.filter(p => p.quality === 'needs_improvement').length,
      poorCount: demoPages.filter(p => p.quality === 'poor').length,
    },
  }
}
