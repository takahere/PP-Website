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
import { createPage } from '@/app/admin/pages/new/actions'

const pageTypes = [
  { value: 'page', label: '通常ページ' },
  { value: 'casestudy', label: '導入事例' },
  { value: 'knowledge', label: 'ナレッジ' },
  { value: 'member', label: 'メンバー' },
]

export function NewPageDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [type, setType] = useState('page')
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
        const result = await createPage({ title, slug, type })
        if (result.success) {
          setOpen(false)
          router.push(`/admin/pages/${slug}/edit`)
        } else {
          setError(result.error || 'ページ作成に失敗しました')
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
      setType('page')
      setError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 text-white shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          新規ページ作成
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新しいページを作成</DialogTitle>
          <DialogDescription>
            ページのタイトルとタイプを入力してください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">タイトル *</Label>
            <Input
              id="title"
              value={title}
              onChange={handleTitleChange}
              placeholder="ページのタイトル"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">スラッグ（URL） *</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/</span>
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

          <div className="space-y-2">
            <Label htmlFor="type">ページタイプ</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              タイプに応じてURLパスが変わります（例: 導入事例 → /casestudy/slug）
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
