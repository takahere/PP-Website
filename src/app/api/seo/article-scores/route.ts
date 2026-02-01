import { NextResponse } from 'next/server'
import {
  calculateAllArticleSEOScores,
  getArticlesByRank,
  generateDemoSEOScores,
} from '@/lib/seo/scoring-service'
import { isGoogleConfigured, isGSCConfigured } from '@/lib/google-auth'
import type { SEORank } from '@/lib/seo/types'

/**
 * SEOスコア取得API
 *
 * クエリパラメータ:
 * - minRank: 最低ランク（S, A, B, C）
 * - category: カテゴリでフィルタ
 * - contentType: コンテンツタイプでフィルタ
 * - limit: 取得件数上限
 * - refresh: true でキャッシュを無視
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const minRank = searchParams.get('minRank') as SEORank | null
    const category = searchParams.get('category')
    const contentType = searchParams.get('contentType')
    const limit = searchParams.get('limit')
    const forceRefresh = searchParams.get('refresh') === 'true'

    // API設定チェック
    if (!isGoogleConfigured() || !isGSCConfigured()) {
      let demoArticles = generateDemoSEOScores()

      // デモモードでもフィルタを適用
      if (minRank) {
        const rankOrder: Record<SEORank, number> = { S: 4, A: 3, B: 2, C: 1 }
        const minRankValue = rankOrder[minRank]
        demoArticles = demoArticles.filter((a) => rankOrder[a.rank] >= minRankValue)
      }
      if (category) {
        demoArticles = demoArticles.filter((a) => a.category === category)
      }
      if (contentType) {
        demoArticles = demoArticles.filter((a) => a.contentType === contentType)
      }
      if (limit) {
        demoArticles = demoArticles.slice(0, parseInt(limit, 10))
      }

      return NextResponse.json({
        demo: true,
        message: 'Google Analytics/Search Console is not configured',
        articles: demoArticles,
        summary: {
          totalArticles: demoArticles.length,
          rankDistribution: {
            S: demoArticles.filter((a) => a.rank === 'S').length,
            A: demoArticles.filter((a) => a.rank === 'A').length,
            B: demoArticles.filter((a) => a.rank === 'B').length,
            C: demoArticles.filter((a) => a.rank === 'C').length,
          },
          avgScore: demoArticles.length > 0
            ? Math.round(demoArticles.reduce((sum, a) => sum + a.seoScore, 0) / demoArticles.length)
            : 0,
        },
      })
    }

    let articles

    if (minRank) {
      // ランクでフィルタ
      articles = await getArticlesByRank(minRank, {
        category: category || undefined,
        contentType: contentType || undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      })
    } else {
      // 全記事取得
      articles = await calculateAllArticleSEOScores(forceRefresh)

      // フィルタ適用
      if (category) {
        articles = articles.filter((a) => a.category === category)
      }
      if (contentType) {
        articles = articles.filter((a) => a.contentType === contentType)
      }
      if (limit) {
        articles = articles.slice(0, parseInt(limit, 10))
      }
    }

    // サマリー計算
    const summary = {
      totalArticles: articles.length,
      rankDistribution: {
        S: articles.filter((a) => a.rank === 'S').length,
        A: articles.filter((a) => a.rank === 'A').length,
        B: articles.filter((a) => a.rank === 'B').length,
        C: articles.filter((a) => a.rank === 'C').length,
      },
      avgScore: articles.length > 0
        ? Math.round(articles.reduce((sum, a) => sum + a.seoScore, 0) / articles.length)
        : 0,
    }

    return NextResponse.json({
      articles,
      summary,
      cached: !forceRefresh,
    })
  } catch (error) {
    console.error('SEO Article Scores API Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch SEO article scores',
      message: error instanceof Error ? error.message : 'Unknown error',
      demo: true,
      articles: generateDemoSEOScores(),
    }, { status: 200 })
  }
}
