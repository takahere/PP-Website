import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { LRUCache } from 'lru-cache'

/**
 * コンテンツメタデータAPI
 *
 * Supabaseから全コンテンツのメタデータを集約
 * - pages: 固定ページ (home, page, casestudy, knowledge, member)
 * - posts: 投稿 (news, seminar)
 * - lab_articles: PartnerLab記事
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new LRUCache<string, any>({
  max: 100,
  ttl: 5 * 60 * 1000, // 5分キャッシュ
})

interface ContentTypeSummary {
  type: string
  total: number
  published: number
  unpublished: number
  lastUpdated: string | null
}

interface StaleContent {
  table: string
  slug: string
  title: string
  updatedAt: string
  daysSinceUpdate: number
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'
    const staleDays = parseInt(searchParams.get('staleDays') || '90', 10)

    const cacheKey = `content-metadata-${staleDays}`
    if (!forceRefresh) {
      const cached = cache.get(cacheKey)
      if (cached) {
        return NextResponse.json({ ...cached as object, cached: true })
      }
    }

    const supabase = createAdminClient()

    // 並列でデータ取得
    const [pagesResult, postsResult, labArticlesResult] = await Promise.all([
      supabase.from('pages').select('id, slug, title, type, updated_at, published_at'),
      supabase.from('posts').select('id, slug, title, type, is_published, updated_at, published_at'),
      supabase.from('lab_articles').select('id, slug, title, categories, tags, is_published, updated_at, published_at'),
    ])

    const pages = pagesResult.data || []
    const posts = postsResult.data || []
    const labArticles = labArticlesResult.data || []

    // コンテンツタイプ別集計
    const contentTypes: ContentTypeSummary[] = []

    // Pages タイプ別集計
    const pageTypes = ['home', 'page', 'casestudy', 'knowledge', 'member']
    pageTypes.forEach(type => {
      const filtered = pages.filter(p => p.type === type)
      if (filtered.length > 0) {
        contentTypes.push({
          type: `pages/${type}`,
          total: filtered.length,
          published: filtered.length, // pagesは全て公開
          unpublished: 0,
          lastUpdated: filtered.sort((a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )[0]?.updated_at || null,
        })
      }
    })

    // Posts タイプ別集計
    const postTypes = ['news', 'seminar']
    postTypes.forEach(type => {
      const filtered = posts.filter(p => p.type === type)
      if (filtered.length > 0) {
        const published = filtered.filter(p => p.is_published)
        contentTypes.push({
          type: `posts/${type}`,
          total: filtered.length,
          published: published.length,
          unpublished: filtered.length - published.length,
          lastUpdated: filtered.sort((a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )[0]?.updated_at || null,
        })
      }
    })

    // Lab Articles 集計
    const publishedLab = labArticles.filter(a => a.is_published)
    contentTypes.push({
      type: 'lab_articles',
      total: labArticles.length,
      published: publishedLab.length,
      unpublished: labArticles.length - publishedLab.length,
      lastUpdated: labArticles.sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )[0]?.updated_at || null,
    })

    // カテゴリ別集計
    const categoryCount: Record<string, number> = {}
    labArticles.forEach(article => {
      (article.categories || []).forEach((cat: string) => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1
      })
    })

    // タグ別集計
    const tagCount: Record<string, number> = {}
    labArticles.forEach(article => {
      (article.tags || []).forEach((tag: string) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1
      })
    })

    // 古いコンテンツ一覧
    const now = new Date()
    const staleThreshold = new Date(now.getTime() - staleDays * 24 * 60 * 60 * 1000)

    const staleContent: StaleContent[] = []

    pages.forEach(page => {
      const updatedAt = new Date(page.updated_at)
      if (updatedAt < staleThreshold) {
        staleContent.push({
          table: 'pages',
          slug: page.slug,
          title: page.title,
          updatedAt: page.updated_at,
          daysSinceUpdate: Math.floor((now.getTime() - updatedAt.getTime()) / (24 * 60 * 60 * 1000)),
        })
      }
    })

    posts.forEach(post => {
      const updatedAt = new Date(post.updated_at)
      if (updatedAt < staleThreshold) {
        staleContent.push({
          table: 'posts',
          slug: post.slug,
          title: post.title,
          updatedAt: post.updated_at,
          daysSinceUpdate: Math.floor((now.getTime() - updatedAt.getTime()) / (24 * 60 * 60 * 1000)),
        })
      }
    })

    labArticles.forEach(article => {
      const updatedAt = new Date(article.updated_at)
      if (updatedAt < staleThreshold) {
        staleContent.push({
          table: 'lab_articles',
          slug: article.slug,
          title: article.title,
          updatedAt: article.updated_at,
          daysSinceUpdate: Math.floor((now.getTime() - updatedAt.getTime()) / (24 * 60 * 60 * 1000)),
        })
      }
    })

    // 古い順にソート
    staleContent.sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate)

    // サマリー
    const summary = {
      totalContent: pages.length + posts.length + labArticles.length,
      totalPages: pages.length,
      totalPosts: posts.length,
      totalLabArticles: labArticles.length,
      totalPublished: pages.length + posts.filter(p => p.is_published).length + publishedLab.length,
      totalUnpublished: posts.filter(p => !p.is_published).length + (labArticles.length - publishedLab.length),
      uniqueCategories: Object.keys(categoryCount).length,
      uniqueTags: Object.keys(tagCount).length,
      staleContentCount: staleContent.length,
    }

    const responseData = {
      summary,
      contentTypes,
      categoryCount: Object.entries(categoryCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      tagCount: Object.entries(tagCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 30), // 上位30タグ
      staleContent: staleContent.slice(0, 20), // 上位20件
      staleDaysThreshold: staleDays,
    }

    cache.set(cacheKey, responseData)

    return NextResponse.json({ ...responseData, cached: false })
  } catch (error) {
    console.error('Content Metadata API Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch content metadata',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
