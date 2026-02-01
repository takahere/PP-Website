/**
 * 文体分析サービス
 *
 * 成功記事の文体特徴を分析し、
 * AI Writerのセクション執筆に活用
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { getSuccessArticles } from './success-article-service'
import type { SEORank } from './types'

// 文体分析結果
export interface StyleAnalysis {
  // 基本特徴
  avgParagraphLength: number     // 平均段落長（文字）
  avgSentenceLength: number      // 平均文長（文字）
  avgSentencesPerParagraph: number // 段落あたりの文数
  // 文末パターン
  sentenceEndingPatterns: {
    pattern: string
    percentage: number
  }[]
  // 構造特徴
  bulletPointRate: number        // 箇条書き使用率（%）
  numberedListRate: number       // 番号付きリスト使用率（%）
  boldRate: number               // 太字使用率（%）
  blockquoteRate: number         // 引用使用率（%）
  // 語彙特徴
  commonPhrases: string[]        // よく使われるフレーズ
  technicalTermRate: number      // 専門用語使用率（推定）
  // サンプル
  styleSamples: {
    slug: string
    title: string
    seoScore: number
    paragraphSample: string      // 段落サンプル（200文字程度）
  }[]
}

// 文末パターン
const SENTENCE_ENDINGS = [
  { pattern: 'です', regex: /です[。！？]?$/ },
  { pattern: 'ます', regex: /ます[。！？]?$/ },
  { pattern: 'でしょう', regex: /でしょう[。！？]?$/ },
  { pattern: 'ください', regex: /ください[。！？]?$/ },
  { pattern: 'しましょう', regex: /しましょう[。！？]?$/ },
  { pattern: 'だ', regex: /だ[。！？]?$/ },
  { pattern: 'である', regex: /である[。！？]?$/ },
]

// よく使われるビジネスフレーズ
const COMMON_BUSINESS_PHRASES = [
  '重要です',
  'ポイントは',
  '具体的には',
  '例えば',
  'そのため',
  'つまり',
  '一方で',
  'また',
  'さらに',
  '特に',
  'まず',
  '次に',
  '最後に',
  '結論として',
  'このように',
]

/**
 * HTMLからプレーンテキストを抽出
 */
function extractPlainText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * 段落を抽出
 */
function extractParagraphs(html: string): string[] {
  const paragraphs: string[] = []

  // <p>タグから抽出
  const regex = /<p[^>]*>([\s\S]*?)<\/p>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]*>/g, '').trim()
    if (text.length > 20) {
      paragraphs.push(text)
    }
  }

  return paragraphs
}

/**
 * 文を抽出
 */
function extractSentences(text: string): string[] {
  return text
    .split(/[。！？]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5)
}

/**
 * 文末パターンを分析
 */
function analyzeSentenceEndings(sentences: string[]): { pattern: string; percentage: number }[] {
  const counts = new Map<string, number>()

  sentences.forEach((sentence) => {
    for (const { pattern, regex } of SENTENCE_ENDINGS) {
      if (regex.test(sentence)) {
        const current = counts.get(pattern) || 0
        counts.set(pattern, current + 1)
        break
      }
    }
  })

  const total = sentences.length

  return Array.from(counts.entries())
    .map(([pattern, count]) => ({
      pattern,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage)
}

/**
 * 構造要素の使用率を計算
 */
function analyzeStructuralElements(html: string): {
  bulletPointRate: number
  numberedListRate: number
  boldRate: number
  blockquoteRate: number
} {
  const totalBlocks = (html.match(/<(p|ul|ol|h[2-6]|blockquote)[^>]*>/gi) || []).length || 1

  const ulCount = (html.match(/<ul[^>]*>/gi) || []).length
  const olCount = (html.match(/<ol[^>]*>/gi) || []).length
  const boldCount = (html.match(/<(strong|b)[^>]*>/gi) || []).length
  const blockquoteCount = (html.match(/<blockquote[^>]*>/gi) || []).length

  return {
    bulletPointRate: Math.round((ulCount / totalBlocks) * 100),
    numberedListRate: Math.round((olCount / totalBlocks) * 100),
    boldRate: Math.round((boldCount / totalBlocks) * 100),
    blockquoteRate: Math.round((blockquoteCount / totalBlocks) * 100),
  }
}

/**
 * よく使われるフレーズを抽出
 */
function extractCommonPhrases(text: string): string[] {
  return COMMON_BUSINESS_PHRASES.filter((phrase) => text.includes(phrase))
}

/**
 * 専門用語使用率を推定
 */
function estimateTechnicalTermRate(text: string): number {
  // パートナーマーケティング関連の専門用語
  const technicalTerms = [
    'PRM',
    'SaaS',
    'BtoB',
    'B2B',
    'ROI',
    'KPI',
    'MDF',
    'チャネルパートナー',
    'リセラー',
    'ディストリビューター',
    'アライアンス',
    'エコシステム',
    'パイプライン',
    'リードジェネレーション',
    'ファネル',
    'コンバージョン',
    'オンボーディング',
    'イネーブルメント',
  ]

  const textLower = text.toLowerCase()
  const foundTerms = technicalTerms.filter((term) => textLower.includes(term.toLowerCase()))

  // 専門用語の密度を計算（100文字あたり）
  const termDensity = (foundTerms.length / (text.length / 100)) * 100

  return Math.min(Math.round(termDensity * 10), 100)
}

/**
 * 成功記事の文体を分析
 */
export async function analyzeSuccessArticleStyles(
  options?: { category?: string; contentType?: string; minRank?: SEORank }
): Promise<StyleAnalysis> {
  const { category, contentType, minRank = 'A' } = options || {}

  // 成功記事を取得
  const successArticles = await getSuccessArticles({
    minRank,
    category,
    contentType,
    limit: 15,
  })

  if (successArticles.length === 0) {
    return generateDemoStyleAnalysis()
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
    return generateDemoStyleAnalysis()
  }

  // 分析データを収集
  const allParagraphLengths: number[] = []
  const allSentenceLengths: number[] = []
  const allSentencesPerParagraph: number[] = []
  const allSentences: string[] = []
  const allText: string[] = []
  const structuralData: ReturnType<typeof analyzeStructuralElements>[] = []

  const styleSamples: StyleAnalysis['styleSamples'] = []

  articles.forEach((article) => {
    const html = article.content_html || ''
    const paragraphs = extractParagraphs(html)
    const text = extractPlainText(html)

    allText.push(text)

    paragraphs.forEach((p) => {
      allParagraphLengths.push(p.length)
      const sentences = extractSentences(p)
      allSentencesPerParagraph.push(sentences.length)
      sentences.forEach((s) => {
        allSentenceLengths.push(s.length)
        allSentences.push(s)
      })
    })

    structuralData.push(analyzeStructuralElements(html))

    // サンプル収集（上位3件）
    if (styleSamples.length < 3) {
      const seoScore = successArticles.find((a) => a.slug === article.slug)?.seoScore || 0
      const sampleParagraph = paragraphs.find((p) => p.length >= 100 && p.length <= 300) || paragraphs[0] || ''

      styleSamples.push({
        slug: article.slug,
        title: article.title,
        seoScore,
        paragraphSample: sampleParagraph.slice(0, 200),
      })
    }
  })

  // 統計計算
  const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0

  const avgStructural = {
    bulletPointRate: avg(structuralData.map((s) => s.bulletPointRate)),
    numberedListRate: avg(structuralData.map((s) => s.numberedListRate)),
    boldRate: avg(structuralData.map((s) => s.boldRate)),
    blockquoteRate: avg(structuralData.map((s) => s.blockquoteRate)),
  }

  const fullText = allText.join(' ')

  return {
    avgParagraphLength: avg(allParagraphLengths),
    avgSentenceLength: avg(allSentenceLengths),
    avgSentencesPerParagraph: Math.round(avg(allSentencesPerParagraph) * 10) / 10,
    sentenceEndingPatterns: analyzeSentenceEndings(allSentences),
    bulletPointRate: avgStructural.bulletPointRate,
    numberedListRate: avgStructural.numberedListRate,
    boldRate: avgStructural.boldRate,
    blockquoteRate: avgStructural.blockquoteRate,
    commonPhrases: extractCommonPhrases(fullText),
    technicalTermRate: estimateTechnicalTermRate(fullText),
    styleSamples,
  }
}

/**
 * 文体サンプルからプロンプト用の文字列を生成
 */
export function generateStylePrompt(analysis: StyleAnalysis): string {
  const endings = analysis.sentenceEndingPatterns
    .slice(0, 3)
    .map((e) => `「${e.pattern}」(${e.percentage}%)`)
    .join('、')

  const phrases = analysis.commonPhrases.slice(0, 5).join('、')

  return `## 成功記事の文体特徴（SEOスコア上位記事から抽出）

### 基本特徴
- 平均段落長: ${analysis.avgParagraphLength}文字
- 平均文長: ${analysis.avgSentenceLength}文字
- 段落あたりの文数: ${analysis.avgSentencesPerParagraph}文

### 文末パターン
${endings}

### 構造特徴
- 箇条書き使用率: ${analysis.bulletPointRate}%
- 番号付きリスト使用率: ${analysis.numberedListRate}%
- 太字強調使用率: ${analysis.boldRate}%

### よく使われるフレーズ
${phrases}

### 文体サンプル
${analysis.styleSamples.map((s) => `**${s.title}（SEOスコア: ${s.seoScore}）**
「${s.paragraphSample}...」`).join('\n\n')}`
}

/**
 * デモ用の文体分析結果
 */
function generateDemoStyleAnalysis(): StyleAnalysis {
  return {
    avgParagraphLength: 120,
    avgSentenceLength: 45,
    avgSentencesPerParagraph: 3.2,
    sentenceEndingPatterns: [
      { pattern: 'です', percentage: 45 },
      { pattern: 'ます', percentage: 35 },
      { pattern: 'でしょう', percentage: 10 },
      { pattern: 'ください', percentage: 5 },
    ],
    bulletPointRate: 25,
    numberedListRate: 15,
    boldRate: 20,
    blockquoteRate: 5,
    commonPhrases: ['重要です', 'ポイントは', '具体的には', '例えば', 'そのため'],
    technicalTermRate: 15,
    styleSamples: [
      {
        slug: 'partner-marketing-guide',
        title: 'パートナーマーケティング完全ガイド',
        seoScore: 92,
        paragraphSample: 'パートナーマーケティングとは、企業間のパートナーシップを活用して相互に顧客を獲得し、ビジネスを成長させるマーケティング手法です。従来の直販モデルとは異なり、パートナー企業のリソースや顧客基盤を活用することで、より効率的な市場拡大が可能になります。',
      },
      {
        slug: 'prm-tools-comparison',
        title: 'PRMツール比較：選び方と導入ポイント',
        seoScore: 88,
        paragraphSample: 'PRM（Partner Relationship Management）ツールは、パートナー企業との関係を効率的に管理するためのソフトウェアです。リード登録、案件管理、パートナーポータル、研修管理など、パートナービジネスに必要な機能が統合されています。',
      },
    ],
  }
}
