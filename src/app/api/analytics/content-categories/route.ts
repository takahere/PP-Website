import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { LRUCache } from 'lru-cache'

/**
 * カテゴリ別コンテンツ分析API
 *
 * lab_categoriesとlab_articlesを結合し、カテゴリ別の分析データを提供
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new LRUCache<string, any>({
  max: 100,
  ttl: 5 * 60 * 1000,
})

interface CategoryAnalysis {
  slug: string
  name: string
  description: string | null
  articleCount: number
  publishedCount: number
  latestArticle: {
    slug: string
    title: string
    publishedAt: string | null
  } | null
  oldestArticle: {
    slug: string
    title: string
    publishedAt: string | null
  } | null
  avgArticleAge: number // 平均記事年齢（日数）
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'

    const cacheKey = 'content-categories'
    if (!forceRefresh) {
      const cached = cache.get(cacheKey)
      if (cached) {
        return NextResponse.json({ ...cached as object, cached: true })
      }
    }

    const supabase = createAdminClient()

    // カテゴリとLab記事を取得
    const [categoriesResult, articlesResult] = await Promise.all([
      supabase.from('lab_categories').select('*').order('name'),
      supabase.from('lab_articles').select('slug, title, categories, is_published, published_at'),
    ])

    const categories = categoriesResult.data || []
    const articles = articlesResult.data || []

    const now = new Date()

    // カテゴリ別に記事を集計
    const categoryAnalysis: CategoryAnalysis[] = categories.map(category => {
      // このカテゴリに属する記事をフィルタ
      const categoryArticles = articles.filter(article =>
        (article.categories || []).includes(category.name)
      )

      const publishedArticles = categoryArticles.filter(a => a.is_published)

      // 最新記事と最古記事
      const sortedByDate = categoryArticles
        .filter(a => a.published_at)
        .sort((a, b) =>
          new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
        )

      const latestArticle = sortedByDate[0] || null
      const oldestArticle = sortedByDate[sortedByDate.length - 1] || null

      // 平均記事年齢
      let avgArticleAge = 0
      if (sortedByDate.length > 0) {
        const totalAge = sortedByDate.reduce((sum, article) => {
          const publishedAt = new Date(article.published_at)
          return sum + Math.floor((now.getTime() - publishedAt.getTime()) / (24 * 60 * 60 * 1000))
        }, 0)
        avgArticleAge = Math.round(totalAge / sortedByDate.length)
      }

      return {
        slug: category.slug,
        name: category.name,
        description: category.description,
        articleCount: categoryArticles.length,
        publishedCount: publishedArticles.length,
        latestArticle: latestArticle ? {
          slug: latestArticle.slug,
          title: latestArticle.title,
          publishedAt: latestArticle.published_at,
        } : null,
        oldestArticle: oldestArticle ? {
          slug: oldestArticle.slug,
          title: oldestArticle.title,
          publishedAt: oldestArticle.published_at,
        } : null,
        avgArticleAge,
      }
    })

    // 記事数順にソート
    categoryAnalysis.sort((a, b) => b.articleCount - a.articleCount)

    // カテゴリに属していない記事
    const allCategoryNames = categories.map(c => c.name)
    const uncategorizedArticles = articles.filter(article =>
      !article.categories || article.categories.length === 0 ||
      !article.categories.some((cat: string) => allCategoryNames.includes(cat))
    )

    // サマリー
    const summary = {
      totalCategories: categories.length,
      totalCategorizedArticles: articles.filter(a =>
        a.categories && a.categories.length > 0
      ).length,
      uncategorizedArticles: uncategorizedArticles.length,
      avgArticlesPerCategory: categories.length > 0
        ? Math.round(articles.filter(a => a.categories && a.categories.length > 0).length / categories.length)
        : 0,
      mostPopularCategory: categoryAnalysis[0]?.name || null,
      leastPopularCategory: categoryAnalysis[categoryAnalysis.length - 1]?.name || null,
    }

    const responseData = {
      summary,
      categories: categoryAnalysis,
      uncategorizedArticles: uncategorizedArticles.slice(0, 10).map(a => ({
        slug: a.slug,
        title: a.title,
      })),
    }

    cache.set(cacheKey, responseData)

    return NextResponse.json({ ...responseData, cached: false })
  } catch (error) {
    console.error('Content Categories API Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch content categories',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
