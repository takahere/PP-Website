/**
 * 成功記事抽出サービス
 *
 * SEOスコアに基づいて成功記事を抽出し、
 * AI Writerが参照すべきパターンを提供
 */

import {
  calculateAllArticleSEOScores,
  getArticlesByRank,
  generateDemoSEOScores,
} from './scoring-service'
import { createAdminClient } from '@/lib/supabase/admin'
import { isGoogleConfigured, isGSCConfigured } from '@/lib/google-auth'
import type {
  ArticleSEOScore,
  SuccessPattern,
  SuccessArticleFilter,
  SEORank,
} from './types'

// キャッシュ設定
const cachedPatterns: Map<string, { data: SuccessPattern; timestamp: number }> = new Map()
const CACHE_DURATION = 30 * 60 * 1000 // 30分

/**
 * 成功記事を抽出
 */
export async function getSuccessArticles(
  filter: SuccessArticleFilter = {}
): Promise<ArticleSEOScore[]> {
  const { minRank = 'A', category, contentType, limit = 10 } = filter

  return getArticlesByRank(minRank, { category, contentType, limit })
}

/**
 * 成功記事のコンテンツを取得
 */
async function fetchSuccessArticleContent(
  slugs: string[]
): Promise<Map<string, { title: string; content: string; categories?: string[] }>> {
  const supabase = createAdminClient()
  const contentMap = new Map<string, { title: string; content: string; categories?: string[] }>()

  if (slugs.length === 0) return contentMap

  const { data: articles } = await supabase
    .from('lab_articles')
    .select('slug, title, content_html, categories')
    .in('slug', slugs)
    .eq('is_published', true)

  articles?.forEach((article) => {
    contentMap.set(article.slug, {
      title: article.title,
      content: article.content_html || '',
      categories: article.categories || [],
    })
  })

  return contentMap
}

/**
 * HTMLからH2/H3見出しを抽出
 */
function extractHeadings(html: string): { h2: string[]; h3: string[] } {
  const h2Matches = html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)
  const h3Matches = html.matchAll(/<h3[^>]*>(.*?)<\/h3>/gi)

  const stripTags = (text: string) => text.replace(/<[^>]*>/g, '').trim()

  return {
    h2: Array.from(h2Matches).map((m) => stripTags(m[1])),
    h3: Array.from(h3Matches).map((m) => stripTags(m[1])),
  }
}

/**
 * HTMLから段落を抽出
 */
function extractParagraphs(html: string): string[] {
  const paragraphs: string[] = []
  const regex = /<p[^>]*>([\s\S]*?)<\/p>/gi
  const stripTags = (text: string) => text.replace(/<[^>]*>/g, '').trim()

  let match
  while ((match = regex.exec(html)) !== null) {
    const text = stripTags(match[1])
    if (text.length > 10) {
      paragraphs.push(text)
    }
  }

  return paragraphs
}

/**
 * 箇条書きの使用率を計算
 */
function calculateBulletPointRate(html: string): number {
  const ulCount = (html.match(/<ul[^>]*>/gi) || []).length
  const olCount = (html.match(/<ol[^>]*>/gi) || []).length
  const pCount = (html.match(/<p[^>]*>/gi) || []).length
  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length

  const totalBlocks = pCount + h2Count + ulCount + olCount
  if (totalBlocks === 0) return 0

  return Math.round(((ulCount + olCount) / totalBlocks) * 100)
}

/**
 * 文字数をカウント（HTMLタグ除外）
 */
function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, '')
  return text.length
}

/**
 * 成功パターンを分析
 */
export async function analyzeSuccessPatterns(
  options?: { category?: string; contentType?: string; minRank?: SEORank }
): Promise<SuccessPattern> {
  const { category, contentType, minRank = 'A' } = options || {}

  // キャッシュキー
  const cacheKey = `${category || 'all'}-${contentType || 'all'}-${minRank}`

  // キャッシュチェック
  const cached = cachedPatterns.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  // 成功記事を取得
  const successArticles = await getSuccessArticles({
    minRank,
    category,
    contentType,
    limit: 20,
  })

  if (successArticles.length === 0) {
    // デモデータで分析
    return generateDemoSuccessPattern()
  }

  // 記事コンテンツを取得
  const slugs = successArticles.map((a) => a.slug)
  const contentMap = await fetchSuccessArticleContent(slugs)

  // 分析データを収集
  const analysisData = {
    h2Counts: [] as number[],
    h3Counts: [] as number[],
    wordCounts: [] as number[],
    paragraphLengths: [] as number[],
    bulletPointRates: [] as number[],
    sentenceLengths: [] as number[],
    h2Patterns: new Map<string, number>(),
  }

  contentMap.forEach((content) => {
    const headings = extractHeadings(content.content)
    const paragraphs = extractParagraphs(content.content)
    const wordCount = countWords(content.content)
    const bulletPointRate = calculateBulletPointRate(content.content)

    analysisData.h2Counts.push(headings.h2.length)
    analysisData.h3Counts.push(headings.h3.length)
    analysisData.wordCounts.push(wordCount)
    analysisData.bulletPointRates.push(bulletPointRate)

    // 段落長
    paragraphs.forEach((p) => {
      analysisData.paragraphLengths.push(p.length)
      // 文長（。で分割）
      const sentences = p.split(/[。！？]/).filter((s) => s.length > 0)
      sentences.forEach((s) => {
        analysisData.sentenceLengths.push(s.length)
      })
    })

    // H2パターンを収集（最初の2文字で分類）
    headings.h2.forEach((h2) => {
      // パターンを抽出（例：「〜とは」「〜の方法」「〜のメリット」など）
      const patterns = [
        /とは$/,
        /の方法$/,
        /のメリット$/,
        /のポイント$/,
        /の特徴$/,
        /まとめ$/,
        /事例$/,
        /について$/,
      ]

      patterns.forEach((pattern) => {
        if (pattern.test(h2)) {
          const key = pattern.source
          const count = analysisData.h2Patterns.get(key) || 0
          analysisData.h2Patterns.set(key, count + 1)
        }
      })
    })
  })

  // 平均値を計算
  const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0

  // よく使われるH2パターンをソート
  const commonH2Patterns = Array.from(analysisData.h2Patterns.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pattern]) => pattern.replace(/[$^]/g, ''))

  // サンプル記事を選択（上位3件）
  const sampleArticles = successArticles.slice(0, 3).map((article) => {
    const content = contentMap.get(article.slug)
    const text = content?.content.replace(/<[^>]*>/g, '') || ''
    return {
      slug: article.slug,
      title: article.title,
      seoScore: article.seoScore,
      excerpt: text.slice(0, 100),
    }
  })

  const pattern: SuccessPattern = {
    avgH2Count: avg(analysisData.h2Counts),
    avgH3Count: avg(analysisData.h3Counts),
    avgWordCount: avg(analysisData.wordCounts),
    commonH2Patterns,
    avgParagraphLength: avg(analysisData.paragraphLengths),
    bulletPointRate: avg(analysisData.bulletPointRates),
    avgSentenceLength: avg(analysisData.sentenceLengths),
    sampleArticles,
  }

  // キャッシュ更新
  cachedPatterns.set(cacheKey, { data: pattern, timestamp: Date.now() })

  return pattern
}

/**
 * 特定カテゴリの成功記事から文体サンプルを取得
 */
export async function getStyleSamples(
  options?: { category?: string; limit?: number }
): Promise<{ slug: string; title: string; excerpt: string; seoScore: number }[]> {
  const { category, limit = 3 } = options || {}

  const successArticles = await getSuccessArticles({
    minRank: 'S',
    category,
    limit,
  })

  // Sランクが足りない場合はAランクも含める
  if (successArticles.length < limit) {
    const additionalArticles = await getSuccessArticles({
      minRank: 'A',
      category,
      limit: limit - successArticles.length,
    })
    successArticles.push(...additionalArticles)
  }

  const slugs = successArticles.map((a) => a.slug)
  const contentMap = await fetchSuccessArticleContent(slugs)

  return successArticles.map((article) => {
    const content = contentMap.get(article.slug)
    const text = content?.content.replace(/<[^>]*>/g, '') || ''
    return {
      slug: article.slug,
      title: article.title,
      excerpt: text.slice(0, 500), // 文体サンプル用に500文字
      seoScore: article.seoScore,
    }
  })
}

/**
 * 成功記事のSEOスコアサマリーを取得
 */
export async function getSEOScoreSummary(): Promise<{
  totalArticles: number
  rankDistribution: { S: number; A: number; B: number; C: number }
  avgScore: number
  topArticles: ArticleSEOScore[]
}> {
  let allScores: ArticleSEOScore[]

  if (!isGoogleConfigured() || !isGSCConfigured()) {
    allScores = generateDemoSEOScores()
  } else {
    allScores = await calculateAllArticleSEOScores()
  }

  const rankDistribution = { S: 0, A: 0, B: 0, C: 0 }
  allScores.forEach((article) => {
    rankDistribution[article.rank]++
  })

  const avgScore = allScores.length > 0
    ? Math.round(allScores.reduce((sum, a) => sum + a.seoScore, 0) / allScores.length)
    : 0

  return {
    totalArticles: allScores.length,
    rankDistribution,
    avgScore,
    topArticles: allScores.slice(0, 10),
  }
}

/**
 * デモ用の成功パターンを生成
 */
function generateDemoSuccessPattern(): SuccessPattern {
  return {
    avgH2Count: 5,
    avgH3Count: 8,
    avgWordCount: 3500,
    commonH2Patterns: ['とは', 'の方法', 'のメリット', 'のポイント', 'まとめ'],
    avgParagraphLength: 120,
    bulletPointRate: 25,
    avgSentenceLength: 45,
    sampleArticles: [
      {
        slug: 'partner-marketing-guide',
        title: 'パートナーマーケティング完全ガイド',
        seoScore: 92,
        excerpt: 'パートナーマーケティングとは、企業間のパートナーシップを活用して相互に顧客を獲得し、ビジネスを成長させるマーケティング手法です。',
      },
      {
        slug: 'prm-tools-comparison',
        title: 'PRMツール比較：選び方と導入ポイント',
        seoScore: 88,
        excerpt: 'PRM（Partner Relationship Management）ツールは、パートナー企業との関係を効率的に管理するためのソフトウェアです。',
      },
      {
        slug: 'channel-partner-strategy',
        title: 'チャネルパートナー戦略の立て方',
        seoScore: 78,
        excerpt: 'チャネルパートナー戦略とは、販売代理店や再販業者などのパートナー企業を通じて製品やサービスを市場に届けるための戦略です。',
      },
    ],
  }
}
