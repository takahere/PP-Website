'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createPost } from './actions'

const postTypes = [
  { value: 'news', label: 'ニュース' },
  { value: 'seminar', label: 'セミナー' },
]

export default function NewPostPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [type, setType] = useState<'news' | 'seminar'>('news')
  const [error, setError] = useState<string | null>(null)

  // スラッグを自動生成（タイトルから）
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    // スラッグが手動で変更されていなければ自動生成
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(newTitle))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('タイトルを入力してください')
      return
    }

    if (!slug.trim()) {
      setError('スラッグを入力してください')
      return
    }

    startTransition(async () => {
      try {
        const result = await createPost({ title, slug, type })
        if (result.success) {
          router.push(`/admin/posts/${slug}/edit`)
        } else {
          setError(result.error || '記事作成に失敗しました')
        }
      } catch {
        setError('予期せぬエラーが発生しました')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/posts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* エラー */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-xl">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="type">記事タイプ *</Label>
              <Select value={type} onValueChange={(v) => setType(v as 'news' | 'seminar')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {postTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                タイプに応じてURLパスが変わります（ニュース → /news/slug、セミナー → /seminar/slug）
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">タイトル *</Label>
              <Input
                id="title"
                value={title}
                onChange={handleTitleChange}
                placeholder="記事のタイトル"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">スラッグ（URL） *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  /{type}/
                </span>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="url-slug"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                URLに使用される識別子です。英数字とハイフンのみ使用できます。
              </p>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/posts">キャンセル</Link>
              </Button>
              <Button
                type="submit"
                disabled={isPending || !title || !slug}
                className="bg-[var(--pp-coral)] hover:bg-[var(--pp-coral-hover)]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    作成中...
                  </>
                ) : (
                  '作成して編集画面へ'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

