import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageList } from '@/components/admin/PageList'
import { NewPageDialog } from '@/components/admin/NewPageDialog'

// ページ一覧を取得
async function getPages() {
  // 認証確認
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // 管理画面なので未公開ページも含めてすべて取得
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('pages')
    .select('id, slug, title, type, is_published, published_at, updated_at')
    .order('updated_at', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('Error fetching pages:', error)
    return []
  }

  return data || []
}

export default async function AdminPagesPage() {
  const pages = await getPages()

  return (
    <div className="space-y-6">
      {/* ページ一覧（フィルター + 新規作成ボタン） */}
      <PageList
        pages={pages}
        headerActions={<NewPageDialog />}
      />
    </div>
  )
}
