'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Save,
  Trash2,
  Eye,
  Loader2,
  Upload,
  ImageIcon,
  X,
} from 'lucide-react'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CategorySelect, Category } from './CategorySelect'
import { TagSelect, Tag } from './TagSelect'

// コンテンツタイプの定義
const CONTENT_TYPES = [
  { value: 'knowledge', label: 'ナレッジ', description: 'ノウハウ・解説記事' },
  { value: 'research', label: 'リサーチ', description: 'データ・調査系記事' },
  { value: 'interview', label: 'インタビュー', description: '人物・企業インタビュー' },
] as const

export type ContentType = 'research' | 'interview' | 'knowledge' | null
import { RichTextEditor } from './RichTextEditor'
import { AIWriterPanel } from './AIWriterPanel'

export interface LabArticleData {
  id?: string
  slug: string
  title: string
  content_html: string
  thumbnail?: string | null
  seo_description?: string | null
  og_description?: string | null
  is_published?: boolean
  categories?: string[]
  tags?: string[]
  content_type?: ContentType
}

// CategoryとTagを再エクスポート
export type { Category } from './CategorySelect'
export type { Tag } from './TagSelect'

interface LabArticleEditorProps {
  initialData: LabArticleData
  categories: Category[]
  tags: Tag[]
  onSave: (data: LabArticleData) => Promise<{ success: boolean; error?: string }>
  onDelete?: () => Promise<{ success: boolean; error?: string }>
  previewUrl?: string
}

export function LabArticleEditor({
  initialData,
  categories,
  tags,
  onSave,
  onDelete,
  previewUrl,
}: LabArticleEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<LabArticleData>(initialData)

  // Hydration mismatch を防ぐ
  useEffect(() => {
    setIsMounted(true)
  }, [])

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

  const handleCategoriesChange = (newCategories: string[]) => {
    setFormData((prev) => ({ ...prev, categories: newCategories }))
    setError(null)
    setSuccess(false)
  }

  const handleTagsChange = (newTags: string[]) => {
    setFormData((prev) => ({ ...prev, tags: newTags }))
    setError(null)
    setSuccess(false)
  }

  const handleContentTypeChange = (value: string) => {
    setFormData((prev) => ({ 
      ...prev, 
      content_type: value as ContentType 
    }))
    setError(null)
    setSuccess(false)
  }

  const handleContentChange = (html: string) => {
    setFormData((prev) => ({ ...prev, content_html: html }))
    setError(null)
    setSuccess(false)
  }

  // AI Writer: コンテンツを挿入
  const handleInsertAIContent = (content: string) => {
    // Markdownをシンプルに変換（見出しのみ）
    const htmlContent = content
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[h|p])(.+)$/gm, '<p>$1</p>')
    
    const newContent = formData.content_html + '\n' + htmlContent
    setFormData((prev) => ({ ...prev, content_html: newContent }))
    setError(null)
    setSuccess(false)
  }

  // AI Writer: 構成案を適用
  const handleApplyOutline = (outline: {
    title: string
    description: string
    outline: Array<{ level: string; text: string }>
  }) => {
    // タイトルと説明を設定
    setFormData((prev) => ({
      ...prev,
      title: outline.title,
      seo_description: outline.description,
      og_description: outline.description,
    }))

    // 構成をHTMLに変換してエディタに挿入
    const outlineHtml = outline.outline
      .map((item) => {
        const tag = item.level === 'h2' ? 'h2' : 'h3'
        return `<${tag}>${item.text}</${tag}>\n<p></p>`
      })
      .join('\n')

    setFormData((prev) => ({ ...prev, content_html: outlineHtml }))
    setError(null)
    setSuccess(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setFormData((prev) => ({ ...prev, thumbnail: result.url }))
      setSuccess(false)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました')
    } finally {
      setIsUploading(false)
      // ファイル入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveThumbnail = () => {
    setFormData((prev) => ({ ...prev, thumbnail: null }))
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
      router.push('/admin/lab')
    } else {
      setError(result.error || '削除に失敗しました')
      setIsDeleting(false)
    }
    setDeleteDialogOpen(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lab記事を編集</h1>
          <p className="text-sm text-muted-foreground">
            スラッグ: {formData.slug}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AIWriterPanel
            onInsertContent={handleInsertAIContent}
            onApplyOutline={handleApplyOutline}
            currentContent={formData.content_html}
          />
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
            </CardContent>
          </Card>

          {/* サムネイル設定 */}
          <Card>
            <CardHeader>
              <CardTitle>サムネイル画像</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 現在のサムネイル表示 */}
              {formData.thumbnail ? (
                <div className="relative">
                  <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border bg-gray-100">
                    <Image
                      src={formData.thumbnail}
                      alt="サムネイル"
                      fill
                      className="object-cover"
                      unoptimized
                      priority
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -right-2 -top-2"
                    onClick={handleRemoveThumbnail}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex aspect-video w-full max-w-md items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      サムネイル画像が設定されていません
                    </p>
                  </div>
                </div>
              )}

              {/* アップロードボタン */}
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="thumbnail-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  画像をアップロード
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, WebP, GIF, SVG（最大5MB）
                </p>
              </div>

              {/* URL直接入力 */}
              <div className="space-y-2">
                <Label htmlFor="thumbnail">または画像URLを直接入力</Label>
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
              <CardTitle>本文</CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                content={formData.content_html}
                onChange={handleContentChange}
                placeholder="本文を入力..."
                disabled={isPending}
              />
            </CardContent>
          </Card>
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* 公開設定 */}
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

          {/* コンテンツタイプ */}
          <Card>
            <CardHeader>
              <CardTitle>コンテンツタイプ</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.content_type || ''}
                onValueChange={handleContentTypeChange}
                disabled={isPending}
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
              <p className="mt-2 text-xs text-muted-foreground">
                記事の種類を選択してください。一覧ページの振り分けとデザインに影響します。
              </p>
            </CardContent>
          </Card>

          {/* カテゴリー設定 */}
          <Card>
            <CardHeader>
              <CardTitle>カテゴリー</CardTitle>
            </CardHeader>
            <CardContent>
              {categories.length > 0 ? (
                <CategorySelect
                  categories={categories}
                  selectedCategories={formData.categories || []}
                  onChange={handleCategoriesChange}
                  disabled={isPending}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  カテゴリーがありません
                </p>
              )}
            </CardContent>
          </Card>

          {/* タグ設定 */}
          <Card>
            <CardHeader>
              <CardTitle>タグ</CardTitle>
            </CardHeader>
            <CardContent>
              {tags.length > 0 ? (
                <TagSelect
                  tags={tags}
                  selectedTags={formData.tags || []}
                  onChange={handleTagsChange}
                  disabled={isPending}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  タグがありません
                </p>
              )}
            </CardContent>
          </Card>

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
                {isMounted ? (
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
                ) : (
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    disabled
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    削除
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </form>
  )
}

