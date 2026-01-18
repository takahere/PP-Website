import { createClient } from '@/lib/supabase/server'
import { NewLabArticleForm } from './new-lab-article-form'

export interface Category {
  id: string
  slug: string
  name: string
}

export interface Tag {
  id: string
  slug: string
  name: string
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

export default async function NewLabArticlePage() {
  const [categories, tags] = await Promise.all([
    getCategories(),
    getTags(),
  ])

  return <NewLabArticleForm categories={categories} tags={tags} />
}
