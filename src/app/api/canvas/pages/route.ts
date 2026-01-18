import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

// キャンバス用のページ情報を取得するAPI
export async function GET() {
  const supabase = await createClient()
  
  // 各テーブルから最新のアイテムを取得
  const [labResult, postsResult, pagesResult, membersResult, labCategoriesResult, labTagsResult] = await Promise.all([
    // Lab記事（最新10件）
    supabase
      .from('lab_articles')
      .select('slug, title, categories, tags, content_type')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(10),
    
    // Posts（ブログ、ニュース、セミナー）- 全件取得
    supabase
      .from('posts')
      .select('slug, title, type')
      .eq('is_published', true)
      .order('published_at', { ascending: false }),
    
    // Pages（静的ページ）- 全件取得
    supabase
      .from('pages')
      .select('slug, title, type'),
    
    // Members（メンバー）- 全件取得
    supabase
      .from('members')
      .select('slug, name')
      .eq('is_published', true)
      .order('name'),
    
    // Labカテゴリ一覧（全件取得）
    supabase
      .from('lab_categories')
      .select('slug, name')
      .order('name'),
    
    // Labタグ一覧（全件取得）
    supabase
      .from('lab_tags')
      .select('slug, name')
      .order('name'),
  ])
  
  // Lab記事
  const labArticles = labResult.data?.map(item => ({
    path: buildLabArticleUrl(item.slug),
    label: item.title,
    category: 'lab' as const,
  })) || []
  
  // Labカテゴリページ（データベースから全件取得、重複を除去）
  const categoryMap = new Map<string, string>()
  labCategoriesResult.data?.forEach(cat => {
    const displayName = cat.name.split(/[|｜│]/)[0]?.trim() || cat.name
    // slugベースで重複を除去
    if (!categoryMap.has(cat.slug)) {
      categoryMap.set(cat.slug, displayName)
    }
  })
  
  const labCategories = Array.from(categoryMap.entries()).map(([slug, displayName]) => ({
    path: `/lab/category/${slug}`,
    label: `カテゴリ: ${displayName}`,
    category: 'lab_category' as const,
  }))
  
  // Labタグページ（データベースから全件取得）
  const labTags = labTagsResult.data?.map(tag => {
    const displayName = tag.name.split(/[|｜│]/)[0]?.trim() || tag.name
    return {
      path: `/lab/tag/${tag.slug}`,
      label: `タグ: ${displayName}`,
      category: 'lab_tag' as const,
    }
  }) || []
  
  // Labコンテンツタイプ一覧ページ
  const contentTypeLabels: Record<string, string> = {
    research: 'リサーチ',
    interview: 'インタビュー',
    knowledge: 'ナレッジ',
  }
  const labContentTypes = ['research', 'interview', 'knowledge'].map(type => ({
    path: `/lab/content_type/${type}`,
    label: `コンテンツタイプ: ${contentTypeLabels[type]}`,
    category: 'lab_content_type' as const,
  }))
  
  // News記事（最新5件）
  const newsPosts = postsResult.data
    ?.filter(item => item.type === 'news')
    .slice(0, 5)
    .map(item => ({
      path: `/news/${item.slug}`,
      label: item.title,
      category: 'news' as const,
    })) || []
  
  // セミナー（全件）
  const seminarPosts = postsResult.data
    ?.filter(item => item.type === 'seminar')
    .map(item => ({
      path: `/seminar/${item.slug}`,
      label: item.title,
      category: 'seminar' as const,
    })) || []
  
  // 導入事例（全件）
  const casestudyPages = pagesResult.data
    ?.filter(item => item.type === 'casestudy')
    .map(item => ({
      path: `/casestudy/${item.slug}`,
      label: item.title,
      category: 'casestudy' as const,
    })) || []
  
  // お役立ち資料（全件）
  const knowledgePages = pagesResult.data
    ?.filter(item => item.type === 'knowledge')
    .map(item => ({
      path: `/knowledge/${item.slug}`,
      label: item.title,
      category: 'knowledge' as const,
    })) || []
  
  // メンバー（membersテーブルから全件取得）
  const memberPages = membersResult.data
    ?.map(item => ({
      path: `/member/${item.slug}`,
      label: item.name,
      category: 'member' as const,
    })) || []
  
  // 静的ページ（pageタイプのみ）
  const staticPages = pagesResult.data
    ?.filter(item => item.type === 'page')
    .map(item => ({
      path: `/${item.slug}`,
      label: item.title,
      category: 'static' as const,
    })) || []
  
  return NextResponse.json({
    lab: labArticles,
    labCategories,
    labTags,
    labContentTypes,
    news: newsPosts,
    seminar: seminarPosts,
    casestudy: casestudyPages,
    knowledge: knowledgePages,
    member: memberPages,
    static: staticPages,
  })
}
