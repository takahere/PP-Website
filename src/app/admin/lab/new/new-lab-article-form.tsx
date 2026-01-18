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
import { CategorySelect } from '@/components/admin/CategorySelect'
import { TagSelect } from '@/components/admin/TagSelect'
import { createLabArticle } from './actions'

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

interface NewLabArticleFormProps {
  categories: Category[]
  tags: Tag[]
}

export function NewLabArticleForm({ categories, tags }: NewLabArticleFormProps) {
  const router = useRouter()
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
        const result = await createLabArticle({
          title,
          slug,
          categories: selectedCategories,
          tags: selectedTags,
          content_type: contentType,
        })
        if (result.success) {
          router.push(`/admin/lab/${slug}/edit`)
        } else {
          setError(result.error || 'Lab記事作成に失敗しました')
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
          <Link href="/admin/lab">
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
              <Label htmlFor="title">タイトル *</Label>
              <Input
                id="title"
                value={title}
                onChange={handleTitleChange}
                placeholder="Lab記事のタイトル"
                required
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
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                URLに使用される識別子です。英数字とハイフンのみ使用できます。
              </p>
            </div>

            <div className="space-y-2">
              <Label>コンテンツタイプ *</Label>
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
              <p className="text-xs text-muted-foreground">
                記事の種類を選択してください。一覧ページの振り分けとデザインに影響します。
              </p>
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

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/lab">キャンセル</Link>
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

      {/* ヒント */}
      <Card className="max-w-xl bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <p className="text-sm text-blue-800">
            <strong>💡 ヒント:</strong> 作成後の編集画面では以下の機能が使えます：
            <br />
            <span className="text-blue-600">
              • AI Writer: キーワードから構成案を自動生成
              <br />
              • リッチテキストエディタ: 見出し・画像・テーブルなど
              <br />
              • カテゴリ設定: 複数カテゴリを選択可能
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

