import Link from 'next/link'
import { Plus } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { PageList } from '@/components/admin/PageList'

// ページ一覧を取得
async function getPages() {
  const supabase = await createClient()

  const { data, error } = await supabase
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
        headerActions={
          <Button asChild className="bg-red-600 hover:bg-red-700 text-white shrink-0">
            <Link href="/admin/pages/new">
              <Plus className="mr-2 h-4 w-4" />
              新規ページ作成
            </Link>
          </Button>
        }
      />
    </div>
  )
}
