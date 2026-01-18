'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, FileSpreadsheet } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createSheet } from '../actions'

export default function NewSheetPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setError(null)
    startTransition(async () => {
      const result = await createSheet(title.trim(), description.trim() || undefined)

      if (result.success && result.data) {
        router.push(`/admin/data-analysis/${result.data.id}`)
      } else {
        setError(result.error || 'シートの作成に失敗しました')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/data-analysis">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      {/* フォーム */}
      <form onSubmit={handleSubmit}>
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              シート情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">シート名 *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 週次トラフィックレポート"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">説明（任意）</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例: 毎週のトラフィック推移を分析するためのシート"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/data-analysis">キャンセル</Link>
              </Button>
              <Button
                type="submit"
                disabled={isPending || !title.trim()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    作成中...
                  </>
                ) : (
                  '作成してシートを開く'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* ヒント */}
      <Card className="max-w-xl bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <p className="text-sm text-blue-800">
            <strong>💡 ヒント:</strong> シートを作成後、AIに指示してデータを生成できます。
            <br />
            例: 「過去30日のPV推移を表にして」「検索キーワードTOP10を教えて」
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

