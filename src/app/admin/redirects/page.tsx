import Link from 'next/link'
import { Plus, Trash2, ArrowRight } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DeleteRedirectButton } from './delete-button'

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

// 日付をフォーマット
function formatDate(dateString: string | null): string {
  if (!dateString) return '-'

  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default async function AdminRedirectsPage() {
  const redirects = await getRedirects()

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-end">
        <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
          <Link href="/admin/redirects/new">
            <Plus className="mr-2 h-4 w-4" />
            新規追加
          </Link>
        </Button>
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

      {/* テーブル */}
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">元のパス</TableHead>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead className="w-[300px]">転送先</TableHead>
              <TableHead className="w-[100px]">タイプ</TableHead>
              <TableHead className="w-[120px]">作成日</TableHead>
              <TableHead className="w-[80px] text-right">アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {redirects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  リダイレクトがありません
                </TableCell>
              </TableRow>
            ) : (
              redirects.map((redirect) => (
                <TableRow key={redirect.id}>
                  <TableCell className="font-mono text-sm">
                    {redirect.from_path}
                  </TableCell>
                  <TableCell>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {redirect.to_path}
                  </TableCell>
                  <TableCell>
                    {redirect.is_permanent ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        301
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        302
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(redirect.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DeleteRedirectButton id={redirect.id} fromPath={redirect.from_path} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

