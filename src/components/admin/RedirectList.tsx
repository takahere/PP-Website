'use client'

import { ArrowRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DeleteRedirectButton } from '@/app/admin/redirects/delete-button'
import { useIsDesktop } from '@/hooks/useMediaQuery'

interface Redirect {
  id: string
  from_path: string
  to_path: string
  is_permanent: boolean
  created_at: string | null
}

interface RedirectListProps {
  redirects: Redirect[]
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

export function RedirectList({ redirects }: RedirectListProps) {
  const isDesktop = useIsDesktop()

  return (
    <>
      {isDesktop ? (
        // デスクトップ: テーブル
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
      ) : (
        // モバイル: カードリスト
        <div className="space-y-3">
          {redirects.length === 0 ? (
            <div className="rounded-lg border bg-white p-8 text-center text-muted-foreground">
              リダイレクトがありません
            </div>
          ) : (
            redirects.map((redirect) => (
              <div key={redirect.id} className="rounded-lg border bg-white p-4 space-y-2">
                {/* 元パス */}
                <div className="text-xs text-muted-foreground">元のパス</div>
                <div className="font-mono text-sm break-all">{redirect.from_path}</div>

                {/* 矢印 */}
                <div className="flex justify-center py-1">
                  <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                </div>

                {/* 転送先 */}
                <div className="text-xs text-muted-foreground">転送先</div>
                <div className="font-mono text-sm break-all">{redirect.to_path}</div>

                {/* タイプ + 日付 + 削除 */}
                <div className="flex items-center justify-between pt-2 border-t">
                  {redirect.is_permanent ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      301
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                      302
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {formatDate(redirect.created_at)}
                  </span>
                  <DeleteRedirectButton id={redirect.id} fromPath={redirect.from_path} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  )
}
