/**
 * 構成パターン抽出サービス
 *
 * 成功記事のH2/H3構成パターンを抽出し、
 * AI Writerの構成生成に活用
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { getSuccessArticles } from './success-article-service'
import type { SEORank } from './types'

// 構成パターン
export interface OutlinePattern {
  // H2構成
  h2Structure: {
    avgCount: number
    minCount: number
    maxCount: number
    commonPatterns: {
      pattern: string
      frequency: number
      examples: string[]
    }[]
  }
  // H3構成
  h3Structure: {
    avgCountPerH2: number
    totalAvgCount: number
    commonPatterns: {
      pattern: string
      frequency: number
      examples: string[]
    }[]
  }
  // 記事構成の流れ
  structureFlow: string[]
  // サンプル構成
  sampleOutlines: {
    slug: string
    title: string
    seoScore: number
    outline: {
      level: 'h2' | 'h3'
      text: string
    }[]
  }[]
}

// H2パターン定義
const H2_PATTERNS = [
  { pattern: 'とは', label: '定義・説明', regex: /とは[？?]?$/ },
  { pattern: 'メリット', label: 'メリット紹介', regex: /メリット|利点|効果/ },
  { pattern: 'デメリット', label: 'デメリット紹介', regex: /デメリット|注意点|課題/ },
  { pattern: '方法', label: '方法・手順', regex: /方法|やり方|手順|ステップ/ },
  { pattern: 'ポイント', label: 'ポイント解説', regex: /ポイント|コツ|秘訣/ },
  { pattern: '事例', label: '事例紹介', regex: /事例|ケース|実例|成功例/ },
  { pattern: '比較', label: '比較・違い', regex: /比較|違い|差/ },
  { pattern: 'まとめ', label: 'まとめ', regex: /まとめ|総括|結論/ },
  { pattern: '選び方', label: '選び方', regex: /選び方|選ぶ|選定/ },
  { pattern: '導入', label: '導入・始め方', regex: /導入|始め方|はじめ方|スタート/ },
]

// 記事構成フローのテンプレート
const STRUCTURE_FLOWS = {
  knowledge: ['導入・概要', '定義・説明', '重要性・背景', 'メリット・効果', '実践方法', '事例・具体例', 'まとめ'],
  howto: ['導入', '準備・前提', 'ステップ1', 'ステップ2', 'ステップ3', '注意点', 'まとめ'],
  comparison: ['導入', '比較対象の概要', '比較ポイント', '詳細比較', 'おすすめの選び方', 'まとめ'],
  casestudy: ['導入', '課題・背景', '解決策', '成果・効果', '成功のポイント', 'まとめ'],
}

/**
 * HTMLから見出し構造を抽出
 */
function extractOutlineFromHTML(html: string): { level: 'h2' | 'h3'; text: string }[] {
  const outline: { level: 'h2' | 'h3'; text: string }[] = []

  // H2とH3を順番に抽出
  const headingRegex = /<h([23])[^>]*>(.*?)<\/h\1>/gi
  let match

  while ((match = headingRegex.exec(html)) !== null) {
    const level = match[1] === '2' ? 'h2' : 'h3'
    const text = match[2].replace(/<[^>]*>/g, '').trim()
    if (text.length > 0) {
      outline.push({ level, text })
    }
  }

  return outline
}

/**
 * H2パターンを分析
 */
function analyzeH2Patterns(h2List: string[]): { pattern: string; frequency: number; examples: string[] }[] {
  const patternCounts = new Map<string, { count: number; examples: string[] }>()

  h2List.forEach((h2) => {
    for (const { pattern, regex } of H2_PATTERNS) {
      if (regex.test(h2)) {
        const existing = patternCounts.get(pattern) || { count: 0, examples: [] }
        existing.count++
        if (existing.examples.length < 3) {
          existing.examples.push(h2)
        }
        patternCounts.set(pattern, existing)
        break
      }
    }
  })

  return Array.from(patternCounts.entries())
    .map(([pattern, data]) => ({
      pattern,
      frequency: Math.round((data.count / h2List.length) * 100),
      examples: data.examples,
    }))
    .sort((a, b) => b.frequency - a.frequency)
}

/**
 * 記事の構成タイプを推定
 */
function estimateStructureType(h2List: string[]): keyof typeof STRUCTURE_FLOWS {
  const h2Text = h2List.join(' ')

  if (/事例|ケース|成功例/.test(h2Text)) return 'casestudy'
  if (/比較|違い|VS/.test(h2Text)) return 'comparison'
  if (/ステップ|手順|方法/.test(h2Text)) return 'howto'
  return 'knowledge'
}

/**
 * 成功記事から構成パターンを抽出
 */
export async function extractOutlinePatterns(
  options?: { category?: string; contentType?: string; minRank?: SEORank }
): Promise<OutlinePattern> {
  const { category, contentType, minRank = 'A' } = options || {}

  // 成功記事を取得
  const successArticles = await getSuccessArticles({
    minRank,
    category,
    contentType,
    limit: 20,
  })

  if (successArticles.length === 0) {
    return generateDemoOutlinePattern()
  }

  // 記事コンテンツを取得
  const supabase = createAdminClient()
  const slugs = successArticles.map((a) => a.slug)

  const { data: articles } = await supabase
    .from('lab_articles')
    .select('slug, title, content_html')
    .in('slug', slugs)
    .eq('is_published', true)

  if (!articles || articles.length === 0) {
    return generateDemoOutlinePattern()
  }

  // 分析データを収集
  const allH2: string[] = []
  const allH3: string[] = []
  const h2Counts: number[] = []
  const h3PerH2: number[] = []
  const outlines: { slug: string; outline: { level: 'h2' | 'h3'; text: string }[] }[] = []

  articles.forEach((article) => {
    const outline = extractOutlineFromHTML(article.content_html || '')
    outlines.push({ slug: article.slug, outline })

    const h2List = outline.filter((h) => h.level === 'h2')
    const h3List = outline.filter((h) => h.level === 'h3')

    h2Counts.push(h2List.length)
    h2List.forEach((h2) => allH2.push(h2.text))
    h3List.forEach((h3) => allH3.push(h3.text))

    // H2ごとのH3数
    if (h2List.length > 0) {
      h3PerH2.push(h3List.length / h2List.length)
    }
  })

  // 統計計算
  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

  // H2パターン分析
  const h2Patterns = analyzeH2Patterns(allH2)

  // H3パターン分析（簡易版）
  const h3Patterns = analyzeH2Patterns(allH3)

  // 記事構成タイプを推定
  const structureType = estimateStructureType(allH2)
  const structureFlow = STRUCTURE_FLOWS[structureType]

  // サンプル構成を選択（上位3件）
  const sampleOutlines = successArticles.slice(0, 3).map((article) => {
    const outline = outlines.find((o) => o.slug === article.slug)?.outline || []
    return {
      slug: article.slug,
      title: article.title,
      seoScore: article.seoScore,
      outline,
    }
  })

  return {
    h2Structure: {
      avgCount: Math.round(avg(h2Counts) * 10) / 10,
      minCount: Math.min(...h2Counts),
      maxCount: Math.max(...h2Counts),
      commonPatterns: h2Patterns.slice(0, 5),
    },
    h3Structure: {
      avgCountPerH2: Math.round(avg(h3PerH2) * 10) / 10,
      totalAvgCount: Math.round((allH3.length / articles.length) * 10) / 10,
      commonPatterns: h3Patterns.slice(0, 5),
    },
    structureFlow,
    sampleOutlines,
  }
}

/**
 * キーワードに基づいて推奨構成を生成
 */
export function generateRecommendedOutline(
  keyword: string,
  pattern: OutlinePattern
): { level: 'h2' | 'h3'; text: string; keywords?: string[] }[] {
  const outline: { level: 'h2' | 'h3'; text: string; keywords?: string[] }[] = []

  // 構成フローに基づいてH2を生成
  pattern.structureFlow.forEach((flow, index) => {
    let h2Text = ''

    switch (flow) {
      case '導入・概要':
      case '導入':
        h2Text = `${keyword}とは`
        break
      case '定義・説明':
        h2Text = `${keyword}の基本と特徴`
        break
      case '重要性・背景':
        h2Text = `なぜ${keyword}が重要なのか`
        break
      case 'メリット・効果':
        h2Text = `${keyword}のメリット`
        break
      case '実践方法':
        h2Text = `${keyword}の実践方法`
        break
      case '事例・具体例':
        h2Text = `${keyword}の成功事例`
        break
      case 'まとめ':
        h2Text = 'まとめ'
        break
      default:
        h2Text = flow
    }

    outline.push({
      level: 'h2',
      text: h2Text,
      keywords: [keyword],
    })

    // 平均的なH3数を追加
    const h3Count = Math.round(pattern.h3Structure.avgCountPerH2)
    for (let i = 0; i < h3Count; i++) {
      outline.push({
        level: 'h3',
        text: `[H3 ${index + 1}-${i + 1}]`,
      })
    }
  })

  return outline
}

/**
 * デモ用の構成パターン
 */
function generateDemoOutlinePattern(): OutlinePattern {
  return {
    h2Structure: {
      avgCount: 5.2,
      minCount: 4,
      maxCount: 7,
      commonPatterns: [
        { pattern: 'とは', frequency: 85, examples: ['パートナーマーケティングとは', 'PRMツールとは'] },
        { pattern: 'メリット', frequency: 70, examples: ['パートナーマーケティングのメリット', '導入のメリット'] },
        { pattern: '方法', frequency: 65, examples: ['実践方法', '導入方法', '活用方法'] },
        { pattern: 'ポイント', frequency: 55, examples: ['成功のポイント', '選び方のポイント'] },
        { pattern: 'まとめ', frequency: 90, examples: ['まとめ'] },
      ],
    },
    h3Structure: {
      avgCountPerH2: 1.8,
      totalAvgCount: 9.2,
      commonPatterns: [
        { pattern: 'ポイント', frequency: 40, examples: ['重要なポイント', 'チェックポイント'] },
        { pattern: '事例', frequency: 35, examples: ['具体的な事例', '成功事例'] },
        { pattern: '方法', frequency: 30, examples: ['具体的な方法', '実践方法'] },
      ],
    },
    structureFlow: ['導入・概要', '定義・説明', '重要性・背景', 'メリット・効果', '実践方法', '事例・具体例', 'まとめ'],
    sampleOutlines: [
      {
        slug: 'partner-marketing-guide',
        title: 'パートナーマーケティング完全ガイド',
        seoScore: 92,
        outline: [
          { level: 'h2', text: 'パートナーマーケティングとは' },
          { level: 'h3', text: '定義と基本概念' },
          { level: 'h3', text: '従来のマーケティングとの違い' },
          { level: 'h2', text: 'パートナーマーケティングのメリット' },
          { level: 'h3', text: 'コスト効率の向上' },
          { level: 'h3', text: '市場リーチの拡大' },
          { level: 'h2', text: '実践方法' },
          { level: 'h2', text: '成功事例' },
          { level: 'h2', text: 'まとめ' },
        ],
      },
    ],
  }
}
