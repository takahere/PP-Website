import { createClient } from '@/lib/supabase/server'
import { RedirectList } from '@/components/admin/RedirectList'
import { NewRedirectDialog } from '@/components/admin/NewRedirectDialog'

// リダイレクト一覧を取得
async function getRedirects() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('redirects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching redirects:', error)
    return []
  }

  return data || []
}

export default async function AdminRedirectsPage() {
  const redirects = await getRedirects()

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-end">
        <NewRedirectDialog />
      </div>

      {/* 統計 */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">総数</div>
          <div className="text-2xl font-bold">{redirects.length}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">
            301（恒久）
          </div>
          <div className="text-2xl font-bold text-green-600">
            {redirects.filter((r) => r.is_permanent).length}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">
            302（一時）
          </div>
          <div className="text-2xl font-bold text-yellow-600">
            {redirects.filter((r) => !r.is_permanent).length}
          </div>
        </div>
      </div>

      {/* リダイレクトリスト */}
      <RedirectList redirects={redirects} />
    </div>
  )
}

