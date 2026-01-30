import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { LabArticleList } from '@/components/admin/LabArticleList'
import { NewLabArticleDialog } from '@/components/admin/NewLabArticleDialog'

// Lab記事一覧を取得
async function getLabArticles() {
  // 認証確認
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  // 管理画面なので未公開記事も含めてすべて取得
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('lab_articles')
    .select('id, slug, title, categories, tags, content_type, is_published, published_at, updated_at')
    .order('published_at', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('Error fetching lab articles:', error)
    return []
  }

  return data || []
}

// カテゴリ名をクリーンアップ（|PartnerLab を削除）
function cleanCategoryName(name: string): string {
  if (!name) return name
  const parts = name.split(/[|｜│]/)
  return parts[0]?.trim() || name
}

// カテゴリ一覧を取得（フィルター用 - 名前のみ）
async function getCategoryNames() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lab_categories')
    .select('name')
    .order('name')

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  // カテゴリ名をクリーンアップし、重複を除去
  const cleanedCategories = (data || []).map((c) => cleanCategoryName(c.name))
  return [...new Set(cleanedCategories)]
}

// カテゴリ一覧を取得（ダイアログ用 - フルデータ）
async function getCategoriesFull() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lab_categories')
    .select('id, slug, name')
    .order('name')

  if (error || !data) {
    return []
  }

  // カテゴリ名をクリーンアップして重複を除去
  const seen = new Set<string>()
  const cleanedCategories: { id: string; slug: string; name: string }[] = []

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

// タグ一覧を取得
async function getTags() {
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

export default async function AdminLabPage() {
  const [articles, categoryNames, categoriesFull, tags] = await Promise.all([
    getLabArticles(),
    getCategoryNames(),
    getCategoriesFull(),
    getTags(),
  ])

  return (
    <div className="space-y-6">
      {/* 記事一覧（フィルター + 新規作成ボタン） */}
      <LabArticleList
        articles={articles}
        categories={categoryNames}
        headerActions={
          <NewLabArticleDialog categories={categoriesFull} tags={tags} />
        }
      />
    </div>
  )
}
