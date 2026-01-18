import { MetadataRoute } from 'next'

import { createClient } from '@/lib/supabase/server'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://partner-prop.com'

// スラッグ (category_id) から旧形式URL (/lab/category/id) を生成
function buildLabArticleUrl(slug: string): string {
  const lastUnderscoreIndex = slug.lastIndexOf('_')
  if (lastUnderscoreIndex !== -1) {
    const category = slug.substring(0, lastUnderscoreIndex)
    const id = slug.substring(lastUnderscoreIndex + 1)
    return `/lab/${category}/${id}`
  }
  return `/lab/${slug}`
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  // 静的ページ
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/lab`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/news`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/seminar`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/casestudy`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/knowledge`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/member`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  // pages テーブルから取得
  const { data: pages } = await supabase
    .from('pages')
    .select('slug, type, updated_at')

  const pageEntries: MetadataRoute.Sitemap = (pages || [])
    .filter((page) => page.type !== 'home') // homeは静的ページで追加済み
    .map((page) => {
      // タイプに応じてURLパスを決定
      let path = ''
      switch (page.type) {
        case 'casestudy':
          path = `/casestudy/${page.slug}`
          break
        case 'knowledge':
          path = `/knowledge/${page.slug}`
          break
        case 'member':
          // memberタイプは除外（/member に統合済み）
          return null
        default:
          path = `/${page.slug}`
      }

      return {
        url: `${BASE_URL}${path}`,
        lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)

  // posts テーブルから取得
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, type, updated_at')
    .eq('is_published', true)

  const postEntries: MetadataRoute.Sitemap = (posts || []).map((post) => {
    const path = post.type === 'news'
      ? `/news/${post.slug}`
      : `/seminar/${post.slug}`

    return {
      url: `${BASE_URL}${path}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }
  })

  // lab_articles テーブルから取得
  const { data: labArticles } = await supabase
    .from('lab_articles')
    .select('slug, updated_at')
    .eq('is_published', true)

  const labEntries: MetadataRoute.Sitemap = (labArticles || []).map((article) => ({
    url: `${BASE_URL}${buildLabArticleUrl(article.slug)}`,
    lastModified: article.updated_at ? new Date(article.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // lab_categories テーブルから取得
  const { data: labCategories } = await supabase
    .from('lab_categories')
    .select('slug')

  const labCategoryEntries: MetadataRoute.Sitemap = (labCategories || []).map((category) => ({
    url: `${BASE_URL}/lab/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  // members テーブルから取得
  const { data: members } = await supabase
    .from('members')
    .select('slug, updated_at')
    .eq('is_published', true)

  const memberEntries: MetadataRoute.Sitemap = (members || []).map((member) => ({
    url: `${BASE_URL}/member/${member.slug}`,
    lastModified: member.updated_at ? new Date(member.updated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...pageEntries, ...postEntries, ...labEntries, ...labCategoryEntries, ...memberEntries]
}

