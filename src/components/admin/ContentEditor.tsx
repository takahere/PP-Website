'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Trash2, Eye, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface ContentData {
  id?: string
  slug: string
  title: string
  content_html: string
  thumbnail?: string | null
  seo_description?: string | null
  og_description?: string | null
  is_published?: boolean
  type?: string
}

interface ContentEditorProps {
  initialData: ContentData
  contentType: 'post' | 'page' | 'lab'
  onSave: (data: ContentData) => Promise<{ success: boolean; error?: string }>
  onDelete?: () => Promise<{ success: boolean; error?: string }>
  previewUrl?: string
}

export function ContentEditor({
  initialData,
  contentType,
  onSave,
  onDelete,
  previewUrl,
}: ContentEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<ContentData>(initialData)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
    setSuccess(false)
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_published: checked }))
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await onSave(formData)
      if (result.success) {
        setSuccess(true)
        router.refresh()
      } else {
        setError(result.error || '保存に失敗しました')
      }
    })
  }

  const handleDelete = async () => {
    if (!onDelete) return

    setIsDeleting(true)
    setError(null)

    const result = await onDelete()
    if (result.success) {
      // リスト画面に戻る
      const listPath = {
        post: '/admin/posts',
        page: '/admin/pages',
        lab: '/admin/lab',
      }[contentType]
      router.push(listPath)
    } else {
      setError(result.error || '削除に失敗しました')
      setIsDeleting(false)
    }
    setDeleteDialogOpen(false)
  }

  const typeLabels = {
    post: '記事',
    page: 'ページ',
    lab: 'Lab記事',
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {typeLabels[contentType]}を編集
          </h1>
          <p className="text-sm text-muted-foreground">
            スラッグ: {formData.slug}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {previewUrl && (
            <Button type="button" variant="outline" asChild>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                <Eye className="mr-2 h-4 w-4" />
                プレビュー
              </a>
            </Button>
          )}
          <Button type="submit" disabled={isPending} className="bg-red-600 hover:bg-red-700 text-white">
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            保存
          </Button>
        </div>
      </div>

      {/* エラー/成功メッセージ */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          保存しました
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* メインコンテンツ */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">タイトル</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="タイトルを入力"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">スラッグ</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="url-slug"
                  required
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-muted-foreground">
                  スラッグは変更できません
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail">サムネイルURL</Label>
                <Input
                  id="thumbnail"
                  name="thumbnail"
                  value={formData.thumbnail || ''}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          {/* 本文 */}
          <Card>
            <CardHeader>
              <CardTitle>本文（HTML）</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="content_html"
                name="content_html"
                value={formData.content_html}
                onChange={handleChange}
                placeholder="HTMLコンテンツを入力"
                className="min-h-[400px] font-mono text-sm"
              />
            </CardContent>
          </Card>
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* 公開設定 */}
          {formData.is_published !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle>公開設定</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_published">公開する</Label>
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={handleSwitchChange}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* SEO設定 */}
          <Card>
            <CardHeader>
              <CardTitle>SEO設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo_description">メタディスクリプション</Label>
                <Textarea
                  id="seo_description"
                  name="seo_description"
                  value={formData.seo_description || ''}
                  onChange={handleChange}
                  placeholder="検索結果に表示される説明文"
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="og_description">OG説明文</Label>
                <Textarea
                  id="og_description"
                  name="og_description"
                  value={formData.og_description || ''}
                  onChange={handleChange}
                  placeholder="SNSシェア時の説明文"
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* 削除 */}
          {onDelete && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">危険な操作</CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      削除
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>本当に削除しますか？</DialogTitle>
                      <DialogDescription>
                        「{formData.title}」を削除します。この操作は取り消せません。
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDeleteDialogOpen(false)}
                      >
                        キャンセル
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        削除する
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </form>
  )
}

