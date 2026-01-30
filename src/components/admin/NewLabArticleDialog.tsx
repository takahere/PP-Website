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
import { CategorySelect } from '@/components/admin/CategorySelect'
import { TagSelect } from '@/components/admin/TagSelect'
import { createLabArticle } from '@/app/admin/lab/new/actions'

// コンテンツタイプの定義
const CONTENT_TYPES = [
  { value: 'knowledge', label: 'ナレッジ', description: 'ノウハウ・解説記事' },
  { value: 'research', label: 'リサーチ', description: 'データ・調査系記事' },
  { value: 'interview', label: 'インタビュー', description: '人物・企業インタビュー' },
] as const

type ContentType = 'research' | 'interview' | 'knowledge' | null

export interface Category {
  id: string
  slug: string
  name: string
}

export interface Tag {
  id: string
  slug: string
  name: string
}

interface NewLabArticleDialogProps {
  categories: Category[]
  tags: Tag[]
}

export function NewLabArticleDialog({ categories, tags }: NewLabArticleDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [contentType, setContentType] = useState<ContentType>(null)
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
        const result = await createLabArticle({
          title,
          slug,
          categories: selectedCategories,
          tags: selectedTags,
          content_type: contentType,
        })
        if (result.success) {
          setOpen(false)
          router.push(`/admin/lab/${slug}/edit`)
        } else {
          setError(result.error || 'Lab記事作成に失敗しました')
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
      setSelectedCategories([])
      setSelectedTags([])
      setContentType(null)
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新しいLab記事を作成</DialogTitle>
          <DialogDescription>
            Lab記事の基本情報を入力してください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">タイトル *</Label>
            <Input
              id="title"
              value={title}
              onChange={handleTitleChange}
              placeholder="Lab記事のタイトル"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">スラッグ（URL） *</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/lab/</span>
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
            <Label>コンテンツタイプ</Label>
            <Select
              value={contentType || ''}
              onValueChange={(value) => setContentType(value as ContentType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="タイプを選択..." />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span>{type.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {type.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>カテゴリー</Label>
            <CategorySelect
              categories={categories}
              selectedCategories={selectedCategories}
              onChange={setSelectedCategories}
            />
            <p className="text-xs text-muted-foreground">
              記事に関連するカテゴリーを選択してください（複数選択可）
            </p>
          </div>

          <div className="space-y-2">
            <Label>タグ</Label>
            <TagSelect
              tags={tags}
              selectedTags={selectedTags}
              onChange={setSelectedTags}
            />
            <p className="text-xs text-muted-foreground">
              記事に関連するタグを選択してください（複数選択可）
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
