'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createRedirect } from '../actions'

export default function NewRedirectPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    from_path: '',
    to_path: '',
    is_permanent: true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.from_path || !formData.to_path) {
      setError('元のパスと転送先は必須です')
      return
    }

    startTransition(async () => {
      const result = await createRedirect(formData)
      if (result.success) {
        router.push('/admin/redirects')
      } else {
        setError(result.error || '作成に失敗しました')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/redirects">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* フォーム */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>リダイレクト設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="from_path">元のパス</Label>
              <Input
                id="from_path"
                name="from_path"
                value={formData.from_path}
                onChange={handleChange}
                placeholder="/old-page"
                required
              />
              <p className="text-xs text-muted-foreground">
                リダイレクト元のURL（例: /blog/old-post）
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to_path">転送先パス</Label>
              <Input
                id="to_path"
                name="to_path"
                value={formData.to_path}
                onChange={handleChange}
                placeholder="/new-page"
                required
              />
              <p className="text-xs text-muted-foreground">
                リダイレクト先のURL（例: /news/new-post）
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="is_permanent">301（恒久的リダイレクト）</Label>
                <p className="text-xs text-muted-foreground">
                  オフの場合は302（一時的リダイレクト）になります
                </p>
              </div>
              <Switch
                id="is_permanent"
                checked={formData.is_permanent}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_permanent: checked }))
                }
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/redirects">キャンセル</Link>
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                作成
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

