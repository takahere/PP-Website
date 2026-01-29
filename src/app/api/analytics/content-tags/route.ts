import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { LRUCache } from 'lru-cache'

/**
 * タグ別コンテンツ分析API
 *
 * lab_tagsとlab_articlesを結合し、タグ別の分析データを提供
 * トレンドタグの特定や、タグの使用状況を把握
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new LRUCache<string, any>({
  max: 100,
  ttl: 5 * 60 * 1000,
})

interface TagAnalysis {
  slug: string
  name: string
  articleCount: number
  publishedCount: number
  recentArticles: {
    slug: string
    title: string
    publishedAt: string | null
  }[]
  trend: 'rising' | 'stable' | 'declining' | 'new'
  lastUsedAt: string | null
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const cacheKey = `content-tags-${limit}`
    if (!forceRefresh) {
      const cached = cache.get(cacheKey)
      if (cached) {
        return NextResponse.json({ ...cached as object, cached: true })
      }
    }

    const supabase = createAdminClient()

    // タグとLab記事を取得
    const [tagsResult, articlesResult] = await Promise.all([
      supabase.from('lab_tags').select('*').order('name'),
      supabase.from('lab_articles').select('slug, title, tags, is_published, published_at'),
    ])

    const tags = tagsResult.data || []
    const articles = articlesResult.data || []

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // タグ別に記事を集計
    const tagAnalysis: TagAnalysis[] = tags.map(tag => {
      // このタグを持つ記事をフィルタ
      const tagArticles = articles.filter(article =>
        (article.tags || []).includes(tag.name)
      )

      const publishedArticles = tagArticles.filter(a => a.is_published)

      // 最新記事（3件まで）
      const recentArticles = tagArticles
        .filter(a => a.published_at)
        .sort((a, b) =>
          new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
        )
        .slice(0, 3)
        .map(a => ({
          slug: a.slug,
          title: a.title,
          publishedAt: a.published_at,
        }))

      // 最終使用日
      const lastUsedAt = recentArticles[0]?.publishedAt || null

      // トレンド判定
      let trend: 'rising' | 'stable' | 'declining' | 'new' = 'stable'
      const recentCount = tagArticles.filter(a =>
        a.published_at && new Date(a.published_at) > thirtyDaysAgo
      ).length
      const olderCount = tagArticles.filter(a =>
        a.published_at &&
        new Date(a.published_at) <= thirtyDaysAgo &&
        new Date(a.published_at) > ninetyDaysAgo
      ).length

      if (tagArticles.length === 0) {
        trend = 'stable'
      } else if (recentCount > 0 && olderCount === 0 && tagArticles.length <= 3) {
        trend = 'new'
      } else if (recentCount > olderCount) {
        trend = 'rising'
      } else if (recentCount < olderCount && recentCount === 0) {
        trend = 'declining'
      }

      return {
        slug: tag.slug,
        name: tag.name,
        articleCount: tagArticles.length,
        publishedCount: publishedArticles.length,
        recentArticles,
        trend,
        lastUsedAt,
      }
    })

    // 記事数順にソート
    tagAnalysis.sort((a, b) => b.articleCount - a.articleCount)

    // タグに登録されていないが記事で使用されているタグ
    const registeredTagNames = tags.map(t => t.name)
    const usedTagNames = new Set<string>()
    articles.forEach(article => {
      (article.tags || []).forEach((tag: string) => usedTagNames.add(tag))
    })

    const unregisteredTags = Array.from(usedTagNames)
      .filter(name => !registeredTagNames.includes(name))
      .map(name => {
        const count = articles.filter(a => (a.tags || []).includes(name)).length
        return { name, count }
      })
      .sort((a, b) => b.count - a.count)

    // 使用されていないタグ
    const unusedTags = tags
      .filter(tag => !usedTagNames.has(tag.name))
      .map(t => ({ slug: t.slug, name: t.name }))

    // トレンドタグ（rising）
    const risingTags = tagAnalysis
      .filter(t => t.trend === 'rising')
      .slice(0, 10)
      .map(t => ({ name: t.name, articleCount: t.articleCount }))

    // サマリー
    const summary = {
      totalTags: tags.length,
      usedTags: tags.length - unusedTags.length,
      unusedTags: unusedTags.length,
      unregisteredTags: unregisteredTags.length,
      risingTagsCount: tagAnalysis.filter(t => t.trend === 'rising').length,
      decliningTagsCount: tagAnalysis.filter(t => t.trend === 'declining').length,
      newTagsCount: tagAnalysis.filter(t => t.trend === 'new').length,
      avgArticlesPerTag: tags.length > 0
        ? Math.round(articles.filter(a => a.tags && a.tags.length > 0).reduce((sum, a) => sum + a.tags.length, 0) / tags.length)
        : 0,
    }

    const responseData = {
      summary,
      tags: tagAnalysis.slice(0, limit),
      risingTags,
      unregisteredTags: unregisteredTags.slice(0, 20),
      unusedTags: unusedTags.slice(0, 20),
    }

    cache.set(cacheKey, responseData)

    return NextResponse.json({ ...responseData, cached: false })
  } catch (error) {
    console.error('Content Tags API Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch content tags',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
