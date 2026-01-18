'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  Trash2,
  Plus,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Settings,
  FileText,
  Layers,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { RichTextEditor } from './RichTextEditor'
import { SectionEditor } from './SectionEditor'
import {
  type LPSection,
  type LPSectionType,
  sectionTypeLabels,
  sectionTypeDescriptions,
  defaultSectionContent,
} from '@/components/lp'

export interface PageEditorData {
  id: string
  slug: string
  title: string
  content_html: string
  sections?: LPSection[] | null
  thumbnail?: string | null
  seo_description?: string | null
  og_description?: string | null
  type: string
  is_published?: boolean
}

interface PageEditorProps {
  initialData: PageEditorData
  onSave: (data: PageEditorData) => Promise<{ success: boolean; error?: string }>
  onDelete?: () => Promise<{ success: boolean; error?: string }>
  previewUrl?: string
}

export function PageEditor({
  initialData,
  onSave,
  onDelete,
  previewUrl,
}: PageEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addSectionOpen, setAddSectionOpen] = useState(false)
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // 編集モード: 'html' または 'sections'
  const hasSections = initialData.sections && initialData.sections.length > 0
  const [editMode, setEditMode] = useState<'html' | 'sections'>(
    hasSections ? 'sections' : 'html'
  )

  const [formData, setFormData] = useState<PageEditorData>(initialData)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
    setSuccess(false)
  }

  const handleContentChange = (html: string) => {
    setFormData((prev) => ({ ...prev, content_html: html }))
    setError(null)
    setSuccess(false)
  }

  // セクション操作
  const handleAddSection = (type: LPSectionType) => {
    const newSection: LPSection = {
      id: crypto.randomUUID(),
      type,
      variant: 'default',
      content: { ...defaultSectionContent[type] },
      order: (formData.sections || []).length,
    }

    setFormData((prev) => ({
      ...prev,
      sections: [...(prev.sections || []), newSection],
    }))
    setAddSectionOpen(false)
    setEditingSectionId(newSection.id)
  }

  const handleRemoveSection = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      sections: (prev.sections || [])
        .filter((s) => s.id !== id)
        .map((s, i) => ({ ...s, order: i })),
    }))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const sections = [...(formData.sections || [])]
    ;[sections[index - 1], sections[index]] = [sections[index], sections[index - 1]]
    setFormData((prev) => ({
      ...prev,
      sections: sections.map((s, i) => ({ ...s, order: i })),
    }))
  }

  const handleMoveDown = (index: number) => {
    const sections = formData.sections || []
    if (index === sections.length - 1) return
    const newSections = [...sections]
    ;[newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]]
    setFormData((prev) => ({
      ...prev,
      sections: newSections.map((s, i) => ({ ...s, order: i })),
    }))
  }

  const handleUpdateSection = (id: string, content: Record<string, unknown>) => {
    setFormData((prev) => ({
      ...prev,
      sections: (prev.sections || []).map((s) =>
        s.id === id ? { ...s, content } : s
      ),
    }))
  }

  // モード切り替え時の確認
  const handleModeChange = (newMode: string) => {
    if (newMode === 'sections' && editMode === 'html' && formData.content_html) {
      // HTMLからセクションモードへの切り替え（HTMLコンテンツがある場合は確認）
      if (confirm('セクションモードに切り替えると、HTMLコンテンツは使用されなくなります。続けますか？')) {
        setEditMode('sections')
        if (!formData.sections || formData.sections.length === 0) {
          // 初回はデフォルトのHeroセクションを追加
          handleAddSection('hero')
        }
      }
    } else if (newMode === 'html' && editMode === 'sections' && formData.sections && formData.sections.length > 0) {
      // セクションからHTMLモードへの切り替え（セクションがある場合は確認）
      if (confirm('HTMLモードに切り替えると、セクションは使用されなくなります。続けますか？')) {
        setEditMode('html')
      }
    } else {
      setEditMode(newMode as 'html' | 'sections')
    }
  }

  // 保存
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // モードに応じてデータを整理
    const saveData: PageEditorData = {
      ...formData,
      // セクションモードならcontent_htmlは空に、HTMLモードならsectionsは空に
      content_html: editMode === 'html' ? formData.content_html : '',
      sections: editMode === 'sections' ? formData.sections : null,
    }

    startTransition(async () => {
      const result = await onSave(saveData)
      if (result.success) {
        setSuccess(true)
        router.refresh()
      } else {
        setError(result.error || '保存に失敗しました')
      }
    })
  }

  // 削除
  const handleDelete = async () => {
    if (!onDelete) return

    setIsDeleting(true)
    const result = await onDelete()

    if (result.success) {
      router.push('/admin/pages')
    } else {
      setError(result.error || '削除に失敗しました')
      setIsDeleting(false)
    }
    setDeleteDialogOpen(false)
  }

  const editingSection = (formData.sections || []).find((s) => s.id === editingSectionId)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/pages">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ページ編集</h1>
            <p className="text-sm text-muted-foreground">
              /{formData.slug}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {previewUrl && (
            <Button type="button" variant="outline" asChild>
              <Link href={previewUrl} target="_blank">
                <Eye className="mr-2 h-4 w-4" />
                プレビュー
              </Link>
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

      {/* メッセージ */}
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
                  required
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </CardContent>
          </Card>

          {/* コンテンツ編集 */}
          <Card>
            <CardHeader>
              <CardTitle>コンテンツ</CardTitle>
              <CardDescription>
                HTMLエディタまたはセクションビルダーで編集できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={editMode} onValueChange={handleModeChange}>
                <TabsList className="mb-4">
                  <TabsTrigger value="html" className="gap-2">
                    <FileText className="h-4 w-4" />
                    HTMLエディタ
                  </TabsTrigger>
                  <TabsTrigger value="sections" className="gap-2">
                    <Layers className="h-4 w-4" />
                    セクションビルダー
                  </TabsTrigger>
                </TabsList>

                {/* HTMLモード */}
                <TabsContent value="html">
                  <RichTextEditor
                    content={formData.content_html}
                    onChange={handleContentChange}
                  />
                </TabsContent>

                {/* セクションモード */}
                <TabsContent value="sections" className="space-y-4">
                  <div className="flex justify-end">
                    <Dialog open={addSectionOpen} onOpenChange={setAddSectionOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          セクション追加
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>セクションを追加</DialogTitle>
                          <DialogDescription>
                            追加するセクションのタイプを選択してください
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4 md:grid-cols-2">
                          {(Object.keys(sectionTypeLabels) as LPSectionType[]).map(
                            (type) => (
                              <Card
                                key={type}
                                className="cursor-pointer hover:border-[var(--pp-coral)] transition-colors"
                                onClick={() => handleAddSection(type)}
                              >
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-base">
                                    {sectionTypeLabels[type]}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <CardDescription className="text-xs">
                                    {sectionTypeDescriptions[type]}
                                  </CardDescription>
                                </CardContent>
                              </Card>
                            )
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* セクション一覧 */}
                  <div className="space-y-3">
                    {(!formData.sections || formData.sections.length === 0) ? (
                      <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <p className="text-muted-foreground mb-4">
                            セクションがありません
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setAddSectionOpen(true)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            最初のセクションを追加
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      formData.sections.map((section, index) => (
                        <Card key={section.id} className="group">
                          <CardContent className="flex items-center gap-4 p-4">
                            <div className="flex flex-col gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleMoveUp(index)}
                                disabled={index === 0}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <GripVertical className="h-4 w-4 text-muted-foreground mx-auto" />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleMoveDown(index)}
                                disabled={index === (formData.sections?.length || 0) - 1}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="flex-1">
                              <div className="font-medium">
                                {sectionTypeLabels[section.type]}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">
                                {section.type === 'hero' &&
                                  (section.content.headline as string)}
                                {section.type === 'features' &&
                                  (section.content.title as string)}
                                {section.type === 'benefits' &&
                                  (section.content.title as string)}
                                {section.type === 'cta' &&
                                  (section.content.headline as string)}
                                {section.type === 'form' &&
                                  (section.content.title as string)}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Sheet>
                                <SheetTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setEditingSectionId(section.id)}
                                  >
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                </SheetTrigger>
                                <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
                                  <SheetHeader>
                                    <SheetTitle>
                                      {sectionTypeLabels[section.type]}を編集
                                    </SheetTitle>
                                    <SheetDescription>
                                      セクションの内容を編集します
                                    </SheetDescription>
                                  </SheetHeader>
                                  {editingSection && (
                                    <SectionEditor
                                      section={editingSection}
                                      onUpdate={(content) =>
                                        handleUpdateSection(editingSection.id, content)
                                      }
                                    />
                                  )}
                                </SheetContent>
                              </Sheet>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleRemoveSection(section.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
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
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_published">公開ステータス</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.is_published ? '公開中' : '下書き'}
                  </p>
                </div>
                <Switch
                  id="is_published"
                  checked={formData.is_published ?? true}
                  onCheckedChange={(checked) => {
                    setFormData((prev) => ({ ...prev, is_published: checked }))
                    setError(null)
                    setSuccess(false)
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* SEO設定 */}
          <Card>
            <CardHeader>
              <CardTitle>SEO設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="space-y-2">
                <Label htmlFor="seo_description">メタディスクリプション</Label>
                <Textarea
                  id="seo_description"
                  name="seo_description"
                  value={formData.seo_description || ''}
                  onChange={handleChange}
                  placeholder="検索結果に表示される説明文"
                  className="min-h-[80px]"
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
                  className="min-h-[80px]"
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

