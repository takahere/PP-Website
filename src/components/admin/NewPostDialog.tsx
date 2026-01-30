'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createPost } from '@/app/admin/posts/new/actions'

const postTypes = [
  { value: 'news', label: 'ニュース' },
  { value: 'seminar', label: 'セミナー' },
]

export function NewPostDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
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

  const handleSubmit = () => {
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
          setOpen(false)
          router.push(`/admin/posts/${slug}/edit`)
        } else {
          setError(result.error || '記事作成に失敗しました')
        }
      } catch {
        setError('予期せぬエラーが発生しました')
      }
    })
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // ダイアログを閉じるときにフォームをリセット
      setTitle('')
      setSlug('')
      setType('news')
      setError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 text-white shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          新規作成
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新しい記事を作成</DialogTitle>
          <DialogDescription>
            記事のタイプとタイトルを入力してください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">スラッグ（URL） *</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/{type}/</span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="url-slug"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              URLに使用される識別子です。英数字とハイフンのみ使用できます。
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !title || !slug}
            className="bg-red-600 hover:bg-red-700"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
