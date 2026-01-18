import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import { LabArticleList } from '@/components/admin/LabArticleList'

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

// カテゴリ一覧を取得（フィルター用）
async function getCategories() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lab_categories')
    .select('name')
    .order('name')

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  // カテゴリ名をクリーンアップ（|PartnerLab を削除）し、重複を除去
  const cleanedCategories = (data || []).map((c) => {
    const parts = c.name.split(/[|｜│]/)
    return parts[0]?.trim() || c.name
  })
  // 重複を除去
  return [...new Set(cleanedCategories)]
}

export default async function AdminLabPage() {
  const [articles, categories] = await Promise.all([
    getLabArticles(),
    getCategories(),
  ])

  return (
    <div className="space-y-6">
      {/* 記事一覧（フィルター + 新規作成ボタン） */}
      <LabArticleList 
        articles={articles} 
        categories={categories}
        headerActions={
          <Button asChild className="bg-red-600 hover:bg-red-700 text-white shrink-0">
            <Link href="/admin/lab/new">
              <span className="mr-2">+</span>
              新規作成
            </Link>
          </Button>
        }
      />
    </div>
  )
}
