/**
 * 関連クエリ抽出サービス
 *
 * GSCから関連検索クエリを抽出し、
 * AI Writerの構成・本文に自然に含める
 */

import { google } from 'googleapis'
import { getGoogleCredentials, isGSCConfigured } from '@/lib/google-auth'
import { LRUCache } from 'lru-cache'
import type { RelatedQuery } from './types'

// キャッシュ設定
const cache = new LRUCache<string, RelatedQuery[]>({
  max: 100,
  ttl: 30 * 60 * 1000, // 30分
})

/**
 * キーワードに関連するクエリをGSCから取得
 */
export async function getRelatedQueries(
  keyword: string,
  options?: { limit?: number; minImpressions?: number }
): Promise<RelatedQuery[]> {
  const { limit = 20, minImpressions = 10 } = options || {}

  // キャッシュチェック
  const cacheKey = `related-${keyword}-${limit}`
  const cached = cache.get(cacheKey)
  if (cached) {
    return cached
  }

  if (!isGSCConfigured()) {
    return generateDemoRelatedQueries(keyword)
  }

  try {
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

    // キーワードを含むクエリを検索
    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['query'],
        dimensionFilterGroups: [
          {
            filters: [
              {
                dimension: 'query',
                operator: 'contains',
                expression: keyword,
              },
            ],
          },
        ],
        rowLimit: limit * 2, // フィルタ用に多めに取得
      },
    })

    const queries: RelatedQuery[] = (response.data.rows || [])
      .filter((row) => (row.impressions || 0) >= minImpressions)
      .map((row) => ({
        query: row.keys?.[0] || '',
        impressions: row.impressions || 0,
        clicks: row.clicks || 0,
        ctr: Math.round((row.ctr || 0) * 10000) / 100,
        position: Math.round((row.position || 0) * 10) / 10,
      }))
      .slice(0, limit)

    // キャッシュに保存
    cache.set(cacheKey, queries)

    return queries
  } catch (error) {
    console.error('Failed to fetch related queries:', error)
    return generateDemoRelatedQueries(keyword)
  }
}

/**
 * 記事に最適な関連クエリを選択
 */
export async function selectOptimalQueries(
  keyword: string,
  options?: { maxQueries?: number; preferLongTail?: boolean }
): Promise<RelatedQuery[]> {
  const { maxQueries = 10, preferLongTail = true } = options || {}

  const allQueries = await getRelatedQueries(keyword, { limit: 50 })

  // スコアリング
  const scoredQueries = allQueries.map((q) => {
    let score = 0

    // インプレッション数によるスコア（露出度）
    score += Math.min(q.impressions / 100, 30)

    // CTRによるスコア（クリック率が高い = ユーザーニーズが高い）
    score += Math.min(q.ctr * 5, 25)

    // 順位によるスコア（上位 = 狙いやすい）
    if (q.position <= 10) score += 25
    else if (q.position <= 20) score += 15
    else score += 5

    // ロングテール優先の場合、単語数が多いクエリを優遇
    if (preferLongTail) {
      const wordCount = q.query.split(/\s+/).length
      score += Math.min(wordCount * 3, 15)
    }

    return { ...q, score }
  })

  // スコア順にソートして上位を返す
  return scoredQueries
    .sort((a, b) => b.score - a.score)
    .slice(0, maxQueries)
    .map((q) => ({
      query: q.query,
      impressions: q.impressions,
      clicks: q.clicks,
      ctr: q.ctr,
      position: q.position,
    }))
}

/**
 * 関連クエリからプロンプト用の文字列を生成
 */
export function generateRelatedQueriesPrompt(queries: RelatedQuery[]): string {
  if (queries.length === 0) {
    return ''
  }

  const topQueries = queries.slice(0, 10)

  const queryList = topQueries
    .map((q, i) => `${i + 1}. 「${q.query}」（月間${q.impressions}回表示、順位${q.position}位）`)
    .join('\n')

  return `## ユーザーが実際に検索しているキーワード（GSCより）

以下のキーワードは、実際にユーザーがGoogleで検索し、自社サイトが表示されたクエリです。
これらを記事内に自然に含めることで、SEO効果を高めることができます。

${queryList}

### 活用のポイント
- H2/H3見出しにキーワードを含める
- 本文中で関連キーワードを自然に使用
- ユーザーの検索意図を満たす内容にする`
}

/**
 * カテゴリ別の人気クエリを取得
 */
export async function getPopularQueriesByCategory(
  category: string,
  options?: { limit?: number }
): Promise<RelatedQuery[]> {
  const { limit = 15 } = options || {}

  if (!isGSCConfigured()) {
    return generateDemoRelatedQueries(category)
  }

  try {
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

    // カテゴリページへのクエリを検索
    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['query'],
        dimensionFilterGroups: [
          {
            filters: [
              {
                dimension: 'page',
                operator: 'contains',
                expression: `/lab/category/${category}`,
              },
            ],
          },
        ],
        rowLimit: limit,
      },
    })

    return (response.data.rows || []).map((row) => ({
      query: row.keys?.[0] || '',
      impressions: row.impressions || 0,
      clicks: row.clicks || 0,
      ctr: Math.round((row.ctr || 0) * 10000) / 100,
      position: Math.round((row.position || 0) * 10) / 10,
    }))
  } catch (error) {
    console.error('Failed to fetch category queries:', error)
    return generateDemoRelatedQueries(category)
  }
}

/**
 * デモ用の関連クエリ生成
 */
function generateDemoRelatedQueries(keyword: string): RelatedQuery[] {
  const baseQueries = [
    { suffix: 'とは', impressions: 850, clicks: 45, position: 4.2 },
    { suffix: ' 意味', impressions: 620, clicks: 32, position: 5.8 },
    { suffix: ' メリット', impressions: 480, clicks: 28, position: 6.5 },
    { suffix: ' 事例', impressions: 390, clicks: 22, position: 7.1 },
    { suffix: ' 導入', impressions: 320, clicks: 18, position: 8.3 },
    { suffix: ' ツール', impressions: 280, clicks: 15, position: 9.2 },
    { suffix: ' 比較', impressions: 250, clicks: 12, position: 10.5 },
    { suffix: ' 成功', impressions: 210, clicks: 10, position: 12.3 },
    { suffix: ' 方法', impressions: 180, clicks: 8, position: 15.6 },
    { suffix: ' やり方', impressions: 150, clicks: 6, position: 18.2 },
  ]

  return baseQueries.map((q) => ({
    query: `${keyword}${q.suffix}`,
    impressions: q.impressions,
    clicks: q.clicks,
    ctr: Math.round((q.clicks / q.impressions) * 10000) / 100,
    position: q.position,
  }))
}
