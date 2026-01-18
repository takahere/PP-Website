import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
import {
  LabArticleEditor,
  LabArticleData,
  Category,
  Tag,
} from '@/components/admin/LabArticleEditor'
import { updateLabArticle, deleteLabArticle } from './actions'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  
  // 認証確認
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { title: 'Lab記事を編集' }
  }

  // 未公開記事も読み取れるようadminClientを使用
  const adminClient = createAdminClient()

  const { data: article } = await adminClient
    .from('lab_articles')
    .select('title')
    .eq('slug', slug)
    .single()

  return {
    title: article ? `${article.title} を編集` : 'Lab記事を編集',
  }
}

async function getLabArticle(slug: string) {
  // Verify authentication first
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Use admin client to bypass RLS and read unpublished articles
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('lab_articles')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

// カテゴリー名をクリーンアップ（|PartnerLab を削除）
// 複数のパイプ文字に対応: | (通常), ｜ (全角), │ (罫線文字)
function cleanCategoryName(name: string): string {
  if (!name) return name
  const parts = name.split(/[|｜│]/)
  return parts[0]?.trim() || name
}

async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lab_categories')
    .select('id, slug, name')
    .order('name')

  if (error || !data) {
    return []
  }

  // カテゴリー名をクリーンアップして重複を除去
  const seen = new Set<string>()
  const cleanedCategories: Category[] = []
  
  for (const cat of data) {
    const cleanName = cleanCategoryName(cat.name)
    if (!seen.has(cleanName)) {
      seen.add(cleanName)
      cleanedCategories.push({
        id: cat.id,
        slug: cat.slug,
        name: cleanName,
      })
    }
  }

  return cleanedCategories.sort((a, b) => a.name.localeCompare(b.name, 'ja'))
}

async function getTags(): Promise<Tag[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lab_tags')
    .select('id, slug, name')
    .order('name')

  if (error || !data) {
    return []
  }

  return data
}

export default async function EditLabArticlePage({ params }: Props) {
  const { slug } = await params
  const [article, categories, tags] = await Promise.all([
    getLabArticle(slug),
    getCategories(),
    getTags(),
  ])

  if (!article) {
    notFound()
  }

  const initialData: LabArticleData = {
    id: article.id,
    slug: article.slug,
    title: article.title,
    content_html: article.content_html || '',
    thumbnail: article.thumbnail,
    seo_description: article.seo_description,
    og_description: article.og_description,
    is_published: article.is_published,
    categories: article.categories || [],
    tags: article.tags || [],
    content_type: article.content_type || null,
  }

  const previewUrl = buildLabArticleUrl(article.slug)

  // Server Actionsをラップ
  async function handleSave(data: LabArticleData) {
    'use server'
    return updateLabArticle(data)
  }

  async function handleDelete() {
    'use server'
    return deleteLabArticle(slug)
  }

  return (
    <LabArticleEditor
      initialData={initialData}
      categories={categories}
      tags={tags}
      onSave={handleSave}
      onDelete={handleDelete}
      previewUrl={previewUrl}
    />
  )
}

