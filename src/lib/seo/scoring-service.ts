/**
 * SEOスコアリングサービス
 *
 * GSC + GA4のデータを統合して、記事のSEOスコアを計算
 */

import { google } from 'googleapis'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { getGoogleCredentials, isGoogleConfigured, isGSCConfigured } from '@/lib/google-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  type ArticleSEOMetrics,
  type ArticleSEOScore,
  type SEORank,
  type SEOWeights,
  type GSCPageData,
  type GA4PageData,
  DEFAULT_SEO_WEIGHTS,
} from './types'

// キャッシュ設定
let cachedScores: { data: ArticleSEOScore[]; timestamp: number } | null = null
const CACHE_DURATION = 15 * 60 * 1000 // 15分

/**
 * 検索順位スコアを計算
 */
export function calculateRankScore(position: number): number {
  if (position <= 3) return 100    // トップ3
  if (position <= 5) return 90     // トップ5
  if (position <= 10) return 70    // 1ページ目
  if (position <= 20) return 50    // 2ページ目
  if (position <= 30) return 30    // 3ページ目
  return 10                        // 圏外
}

/**
 * CTRスコアを計算（業界平均3%基準）
 */
export function calculateCtrScore(ctr: number): number {
  if (ctr >= 8) return 100
  if (ctr >= 5) return 90
  if (ctr >= 3) return 70
  if (ctr >= 2) return 50
  if (ctr >= 1) return 30
  return 10
}

/**
 * 遷移率スコアを計算
 */
export function calculateTransitionScore(transitionRate: number): number {
  if (transitionRate >= 5) return 100
  if (transitionRate >= 3) return 85
  if (transitionRate >= 2) return 70
  if (transitionRate >= 1) return 50
  return 30
}

/**
 * エンゲージメントスコアを計算
 */
export function calculateEngagementScore(engagementRate: number): number {
  if (engagementRate >= 70) return 100
  if (engagementRate >= 60) return 85
  if (engagementRate >= 50) return 70
  if (engagementRate >= 40) return 50
  return 30
}

/**
 * 総合SEOスコアを計算
 */
export function calculateSEOScore(
  metrics: Omit<ArticleSEOMetrics, 'slug' | 'title' | 'impressions' | 'clicks' | 'sessions' | 'avgSessionDuration' | 'bounceRate'>,
  weights: SEOWeights = DEFAULT_SEO_WEIGHTS
): { score: number; scores: ArticleSEOScore['scores'] } {
  const rankScore = calculateRankScore(metrics.position)
  const ctrScore = calculateCtrScore(metrics.ctr)
  const transitionScore = calculateTransitionScore(metrics.transitionRate)
  const engagementScore = calculateEngagementScore(metrics.engagementRate)

  const score = Math.round(
    rankScore * weights.rank +
    ctrScore * weights.ctr +
    transitionScore * weights.transition +
    engagementScore * weights.engagement
  )

  return {
    score,
    scores: {
      rankScore,
      ctrScore,
      transitionScore,
      engagementScore,
    },
  }
}

/**
 * SEOスコアからランクを判定
 */
export function determineRank(score: number): SEORank {
  if (score >= 85) return 'S'
  if (score >= 70) return 'A'
  if (score >= 50) return 'B'
  return 'C'
}

/**
 * GSCからページ別データを取得
 */
async function fetchGSCData(): Promise<Map<string, GSCPageData>> {
  if (!isGSCConfigured()) {
    return new Map()
  }

  const credentials = getGoogleCredentials()
  const siteUrl = process.env.GSC_SITE_URL

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  })

  const searchconsole = google.searchconsole({ version: 'v1', auth })

  // 過去28日のデータ
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 28)

  const response = await searchconsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dimensions: ['page'],
      dimensionFilterGroups: [
        {
          filters: [
            {
              dimension: 'page',
              operator: 'contains',
              expression: '/lab/',
            },
          ],
        },
      ],
      rowLimit: 500,
    },
  })

  const dataMap = new Map<string, GSCPageData>()

  response.data.rows?.forEach((row) => {
    const pageUrl = row.keys?.[0] || ''
    try {
      const url = new URL(pageUrl)
      const path = url.pathname
      // /lab/slug 形式のみ抽出（カテゴリやタグページを除外）
      if (
        path.startsWith('/lab/') &&
        path !== '/lab/' &&
        !path.includes('/category/') &&
        !path.includes('/tag/') &&
        !path.includes('/content_type/')
      ) {
        dataMap.set(path, {
          page: path,
          impressions: row.impressions || 0,
          clicks: row.clicks || 0,
          ctr: (row.ctr || 0) * 100,
          position: row.position || 0,
        })
      }
    } catch {
      // URL解析エラーは無視
    }
  })

  return dataMap
}

/**
 * GA4からページ別エンゲージメントデータを取得
 */
async function fetchGA4Data(): Promise<Map<string, GA4PageData>> {
  if (!isGoogleConfigured()) {
    return new Map()
  }

  const credentials = getGoogleCredentials()
  const propertyId = process.env.GA4_PROPERTY_ID

  const analyticsDataClient = new BetaAnalyticsDataClient({ credentials })

  const startDate = '28daysAgo'
  const endDate = 'today'

  // 並列でデータ取得
  const [sessionsResponse, transitionResponse, engagementResponse] = await Promise.all([
    // 1. ページ別セッション数
    analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'sessions' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'BEGINS_WITH',
            value: '/lab/',
          },
        },
      },
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 500,
    }),
    // 2. Lab → サービスサイト遷移
    analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'landingPage' }],
      metrics: [{ name: 'sessions' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'landingPage',
                stringFilter: {
                  matchType: 'BEGINS_WITH',
                  value: '/lab/',
                },
              },
            },
            {
              orGroup: {
                expressions: [
                  {
                    filter: {
                      fieldName: 'pagePath',
                      stringFilter: {
                        matchType: 'EXACT',
                        value: '/partner-marketing',
                      },
                    },
                  },
                  {
                    filter: {
                      fieldName: 'pagePath',
                      stringFilter: {
                        matchType: 'BEGINS_WITH',
                        value: '/casestudy/',
                      },
                    },
                  },
                  {
                    filter: {
                      fieldName: 'pagePath',
                      stringFilter: {
                        matchType: 'BEGINS_WITH',
                        value: '/knowledge/',
                      },
                    },
                  },
                  {
                    filter: {
                      fieldName: 'pagePath',
                      stringFilter: {
                        matchType: 'BEGINS_WITH',
                        value: '/seminar/',
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      limit: 500,
    }),
    // 3. エンゲージメント率
    analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'engagementRate' }],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'BEGINS_WITH',
            value: '/lab/',
          },
        },
      },
      limit: 500,
    }),
  ])

  // セッションデータをMapに格納
  const dataMap = new Map<string, GA4PageData>()

  sessionsResponse[0].rows?.forEach((row) => {
    const path = row.dimensionValues?.[0]?.value || ''
    if (path && path !== '/lab' && path !== '/lab/') {
      dataMap.set(path, {
        pagePath: path,
        sessions: Number(row.metricValues?.[0]?.value) || 0,
        transitionSessions: 0,
        transitionRate: 0,
        engagementRate: 0,
        avgSessionDuration: Number(row.metricValues?.[1]?.value) || 0,
        bounceRate: Number(row.metricValues?.[2]?.value) || 0,
      })
    }
  })

  // 遷移データをマージ
  transitionResponse[0].rows?.forEach((row) => {
    const path = row.dimensionValues?.[0]?.value || ''
    const transitionSessions = Number(row.metricValues?.[0]?.value) || 0

    if (dataMap.has(path)) {
      const existing = dataMap.get(path)!
      existing.transitionSessions = transitionSessions
      existing.transitionRate = existing.sessions > 0
        ? Math.round((transitionSessions / existing.sessions) * 10000) / 100
        : 0
    }
  })

  // エンゲージメント率をマージ
  engagementResponse[0].rows?.forEach((row) => {
    const path = row.dimensionValues?.[0]?.value || ''
    const engagementRate = Number(row.metricValues?.[0]?.value) || 0

    if (dataMap.has(path)) {
      const existing = dataMap.get(path)!
      existing.engagementRate = Math.round(engagementRate * 10000) / 100
    }
  })

  return dataMap
}

/**
 * Supabaseから記事メタデータを取得
 */
async function fetchArticleMetadata(): Promise<Map<string, { title: string; category?: string; tags?: string[]; contentType?: string }>> {
  const supabase = createAdminClient()
  const metadataMap = new Map<string, { title: string; category?: string; tags?: string[]; contentType?: string }>()

  const { data: articles } = await supabase
    .from('lab_articles')
    .select('slug, title, categories, tags, content_type')
    .eq('is_published', true)

  articles?.forEach((article) => {
    metadataMap.set(`/lab/${article.slug}`, {
      title: article.title,
      category: article.categories?.[0] || undefined,
      tags: article.tags || undefined,
      contentType: article.content_type || undefined,
    })
  })

  return metadataMap
}

/**
 * 全記事のSEOスコアを計算
 */
export async function calculateAllArticleSEOScores(
  forceRefresh = false
): Promise<ArticleSEOScore[]> {
  // キャッシュチェック
  if (!forceRefresh && cachedScores && Date.now() - cachedScores.timestamp < CACHE_DURATION) {
    return cachedScores.data
  }

  // データを並列取得
  const [gscData, ga4Data, articleMetadata] = await Promise.all([
    fetchGSCData(),
    fetchGA4Data(),
    fetchArticleMetadata(),
  ])

  const scores: ArticleSEOScore[] = []

  // GSCとGA4のデータを統合してスコアを計算
  gscData.forEach((gsc, path) => {
    const ga4 = ga4Data.get(path)
    const metadata = articleMetadata.get(path)

    // インプレッション数が少なすぎる記事は除外
    if (gsc.impressions < 10) return

    const metrics = {
      position: gsc.position,
      ctr: gsc.ctr,
      transitionRate: ga4?.transitionRate || 0,
      engagementRate: ga4?.engagementRate || 50, // デフォルト50%
    }

    const { score, scores: scoreBreakdown } = calculateSEOScore(metrics)
    const rank = determineRank(score)

    // slugを抽出（/lab/slug → slug）
    const slug = path.replace('/lab/', '')

    scores.push({
      slug,
      title: metadata?.title || path,
      seoScore: score,
      rank,
      metrics,
      scores: scoreBreakdown,
      category: metadata?.category,
      tags: metadata?.tags,
      contentType: metadata?.contentType,
    })
  })

  // スコア降順でソート
  scores.sort((a, b) => b.seoScore - a.seoScore)

  // キャッシュ更新
  cachedScores = { data: scores, timestamp: Date.now() }

  return scores
}

/**
 * 特定ランク以上の記事を取得
 */
export async function getArticlesByRank(
  minRank: SEORank,
  options?: { category?: string; contentType?: string; limit?: number }
): Promise<ArticleSEOScore[]> {
  const allScores = await calculateAllArticleSEOScores()

  const rankOrder: Record<SEORank, number> = { S: 4, A: 3, B: 2, C: 1 }
  const minRankValue = rankOrder[minRank]

  let filtered = allScores.filter((article) => {
    const articleRankValue = rankOrder[article.rank]
    if (articleRankValue < minRankValue) return false
    if (options?.category && article.category !== options.category) return false
    if (options?.contentType && article.contentType !== options.contentType) return false
    return true
  })

  if (options?.limit) {
    filtered = filtered.slice(0, options.limit)
  }

  return filtered
}

/**
 * デモデータ生成（API未設定時用）
 */
export function generateDemoSEOScores(): ArticleSEOScore[] {
  return [
    {
      slug: 'partner-marketing-guide',
      title: 'パートナーマーケティング完全ガイド',
      seoScore: 92,
      rank: 'S',
      metrics: { position: 3.2, ctr: 5.8, transitionRate: 4.2, engagementRate: 68 },
      scores: { rankScore: 100, ctrScore: 90, transitionScore: 85, engagementScore: 85 },
      category: 'partner-marketing',
      contentType: 'knowledge',
    },
    {
      slug: 'prm-tools-comparison',
      title: 'PRMツール比較：選び方と導入ポイント',
      seoScore: 88,
      rank: 'S',
      metrics: { position: 4.5, ctr: 4.9, transitionRate: 3.8, engagementRate: 65 },
      scores: { rankScore: 90, ctrScore: 85, transitionScore: 85, engagementScore: 85 },
      category: 'prm-tools',
      contentType: 'research',
    },
    {
      slug: 'channel-partner-strategy',
      title: 'チャネルパートナー戦略の立て方',
      seoScore: 78,
      rank: 'A',
      metrics: { position: 6.8, ctr: 4.1, transitionRate: 2.5, engagementRate: 62 },
      scores: { rankScore: 70, ctrScore: 80, transitionScore: 70, engagementScore: 85 },
      category: 'strategy',
      contentType: 'knowledge',
    },
    {
      slug: 'partner-program-design',
      title: 'パートナープログラム設計の基礎',
      seoScore: 72,
      rank: 'A',
      metrics: { position: 8.2, ctr: 3.5, transitionRate: 2.2, engagementRate: 58 },
      scores: { rankScore: 70, ctrScore: 70, transitionScore: 70, engagementScore: 70 },
      category: 'program-design',
      contentType: 'knowledge',
    },
    {
      slug: 'alliance-sales-tips',
      title: 'アライアンス営業のコツ',
      seoScore: 58,
      rank: 'B',
      metrics: { position: 15.5, ctr: 2.8, transitionRate: 1.5, engagementRate: 52 },
      scores: { rankScore: 50, ctrScore: 50, transitionScore: 50, engagementScore: 70 },
      category: 'sales',
      contentType: 'knowledge',
    },
    {
      slug: 'partner-onboarding',
      title: 'パートナーオンボーディング入門',
      seoScore: 45,
      rank: 'C',
      metrics: { position: 25.3, ctr: 1.8, transitionRate: 0.8, engagementRate: 45 },
      scores: { rankScore: 30, ctrScore: 30, transitionScore: 30, engagementScore: 50 },
      category: 'onboarding',
      contentType: 'knowledge',
    },
  ]
}
