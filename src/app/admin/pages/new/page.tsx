'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createPage } from './actions'

const pageTypes = [
  { value: 'page', label: '通常ページ' },
  { value: 'casestudy', label: '導入事例' },
  { value: 'knowledge', label: 'ナレッジ' },
  { value: 'member', label: 'メンバー' },
]

export default function NewPagePage() {
  const router = useRouter()
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
        const result = await createPage({ title, slug, type })
        if (result.success) {
          router.push(`/admin/pages/${slug}/edit`)
        } else {
          setError(result.error || 'ページ作成に失敗しました')
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
          <Link href="/admin/pages">
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
                placeholder="ページのタイトル"
                required
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
                  required
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

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/pages">キャンセル</Link>
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
            <strong>💡 ヒント:</strong> 編集画面では「HTMLエディタ」と「セクションビルダー」を切り替えて使用できます。
            <br />
            <span className="text-blue-600">
              • HTMLエディタ: 自由なHTML/リッチテキスト編集
              <br />
              • セクションビルダー: LP向けのコンポーネントベース編集
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
