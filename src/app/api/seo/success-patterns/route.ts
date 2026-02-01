import { NextResponse } from 'next/server'
import { analyzeSuccessPatterns } from '@/lib/seo/success-article-service'
import { extractOutlinePatterns } from '@/lib/seo/pattern-extractor'
import { analyzeSuccessArticleStyles, generateStylePrompt } from '@/lib/seo/style-analyzer'
import { getRelatedQueries, generateRelatedQueriesPrompt } from '@/lib/seo/related-queries'
import type { SEORank } from '@/lib/seo/types'

/**
 * 成功パターン取得API
 *
 * クエリパラメータ:
 * - category: カテゴリでフィルタ
 * - contentType: コンテンツタイプでフィルタ
 * - minRank: 最低ランク（S, A, B, C）
 * - keyword: 関連クエリ取得用のキーワード
 * - includeStyle: true で文体分析を含める
 * - includeOutline: true で構成パターンを含める
 * - includeQueries: true で関連クエリを含める
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined
    const contentType = searchParams.get('contentType') || undefined
    const minRank = (searchParams.get('minRank') as SEORank) || 'A'
    const keyword = searchParams.get('keyword') || undefined
    const includeStyle = searchParams.get('includeStyle') !== 'false'
    const includeOutline = searchParams.get('includeOutline') !== 'false'
    const includeQueries = searchParams.get('includeQueries') !== 'false' && keyword

    // 並列でデータ取得
    const [basicPatterns, outlinePatterns, styleAnalysis, relatedQueries] = await Promise.all([
      analyzeSuccessPatterns({ category, contentType, minRank }),
      includeOutline ? extractOutlinePatterns({ category, contentType, minRank }) : null,
      includeStyle ? analyzeSuccessArticleStyles({ category, contentType, minRank }) : null,
      includeQueries ? getRelatedQueries(keyword) : null,
    ])

    // プロンプト用の文字列を生成
    const prompts = {
      style: styleAnalysis ? generateStylePrompt(styleAnalysis) : null,
      queries: relatedQueries ? generateRelatedQueriesPrompt(relatedQueries) : null,
    }

    return NextResponse.json({
      patterns: {
        basic: basicPatterns,
        outline: outlinePatterns,
        style: styleAnalysis,
      },
      relatedQueries,
      prompts,
      filters: {
        category,
        contentType,
        minRank,
        keyword,
      },
    })
  } catch (error) {
    console.error('Success Patterns API Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch success patterns',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
