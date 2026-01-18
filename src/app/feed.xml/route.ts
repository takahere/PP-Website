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

export async function GET() {
  const supabase = await createClient()

  // 最新の記事を取得
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, title, seo_description, published_at, type')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(20)

  const { data: labArticles } = await supabase
    .from('lab_articles')
    .select('slug, title, seo_description, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(20)

  // 記事を統合してソート
  const allItems = [
    ...(posts || []).map((post) => ({
      ...post,
      url: post.type === 'news' ? `/news/${post.slug}` : `/seminar/${post.slug}`,
    })),
    ...(labArticles || []).map((article) => ({
      ...article,
      url: buildLabArticleUrl(article.slug),
    })),
  ]
    .sort((a, b) => {
      const dateA = new Date(a.published_at || 0).getTime()
      const dateB = new Date(b.published_at || 0).getTime()
      return dateB - dateA
    })
    .slice(0, 20)

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>PartnerProp</title>
    <link>${BASE_URL}</link>
    <description>パートナービジネスを科学し仕組みにするPRMツール「PartnerProp」</description>
    <language>ja</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    ${allItems
      .map(
        (item) => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${BASE_URL}${item.url}</link>
      <guid isPermaLink="true">${BASE_URL}${item.url}</guid>
      <description><![CDATA[${item.seo_description || ''}]]></description>
      <pubDate>${new Date(item.published_at || new Date()).toUTCString()}</pubDate>
    </item>`
      )
      .join('')}
  </channel>
</rss>`

  return new Response(rssXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

