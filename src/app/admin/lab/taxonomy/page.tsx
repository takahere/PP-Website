'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Trash2,
  Loader2,
  Tag,
  FolderOpen,
  AlertCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { createCategory, deleteCategory, createTag, deleteTag } from './actions'
import { createClient } from '@/lib/supabase/client'

interface Category {
  id: string
  slug: string
  name: string
  article_count?: number
}

interface TagItem {
  id: string
  slug: string
  name: string
  article_count?: number
}

interface UsedItem {
  name: string
  count: number
}

// スラッグ生成（日本語対応）
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// カテゴリー名をクリーンアップ（|PartnerLab を削除）
// 複数のパイプ文字に対応: | (通常), ｜ (全角), │ (罫線文字)
function cleanCategoryName(name: string): string {
  if (!name) return name
  const parts = name.split(/[|｜│]/)
  return parts[0]?.trim() || name
}

export default function TaxonomyPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [usedCategories, setUsedCategories] = useState<UsedItem[]>([])
  const [usedTags, setUsedTags] = useState<UsedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // カテゴリー作成ダイアログ
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategorySlug, setNewCategorySlug] = useState('')

  // タグ作成ダイアログ
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagSlug, setNewTagSlug] = useState('')

  // 削除確認ダイアログ
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'category' | 'tag'
    id: string
    name: string
  } | null>(null)

  // データ取得
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)

      try {
        const supabase = createClient()

        // カテゴリー取得
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('lab_categories')
          .select('id, slug, name')
          .order('name')

        if (categoriesError) throw categoriesError

        // タグ取得
        const { data: tagsData, error: tagsError } = await supabase
          .from('lab_tags')
          .select('id, slug, name')
          .order('name')

        if (tagsError) throw tagsError

        // 記事数カウント（カテゴリー）
        const { data: articles } = await supabase
          .from('lab_articles')
          .select('categories, tags')

        const categoryCountMap = new Map<string, number>()
        const tagCountMap = new Map<string, number>()

        if (articles) {
          articles.forEach((article) => {
            if (article.categories) {
              article.categories.forEach((cat: string) => {
                // そのままの名前でカウント（記事に保存されている名前）
                categoryCountMap.set(cat, (categoryCountMap.get(cat) || 0) + 1)
              })
            }
            if (article.tags) {
              article.tags.forEach((tag: string) => {
                // そのままの名前でカウント
                tagCountMap.set(tag, (tagCountMap.get(tag) || 0) + 1)
              })
            }
          })
        }

        // マスターテーブルのカテゴリー/タグにカウントをマッピング
        // クリーンアップした名前と元の名前の両方でマッチング
        const masterCategoryNames = new Set(
          (categoriesData || []).map((cat) => cleanCategoryName(cat.name))
        )
        const masterTagNames = new Set(
          (tagsData || []).map((tag) => cleanCategoryName(tag.name))
        )

        setCategories(
          (categoriesData || []).map((cat) => {
            const cleanedName = cleanCategoryName(cat.name)
            // クリーンアップした名前または元の名前でマッチング
            const count = categoryCountMap.get(cleanedName) || categoryCountMap.get(cat.name) || 0
            return {
              ...cat,
              article_count: count,
            }
          })
        )

        setTags(
          (tagsData || []).map((tag) => {
            const cleanedName = cleanCategoryName(tag.name)
            const count = tagCountMap.get(cleanedName) || tagCountMap.get(tag.name) || 0
            return {
              ...tag,
              article_count: count,
            }
          })
        )

        // 実際に記事で使われているがマスターテーブルにないカテゴリー/タグ
        const usedCats: UsedItem[] = []
        const usedTgs: UsedItem[] = []

        categoryCountMap.forEach((count, name) => {
          if (!masterCategoryNames.has(name) && !masterCategoryNames.has(cleanCategoryName(name))) {
            usedCats.push({ name, count })
          }
        })

        tagCountMap.forEach((count, name) => {
          if (!masterTagNames.has(name) && !masterTagNames.has(cleanCategoryName(name))) {
            usedTgs.push({ name, count })
          }
        })

        setUsedCategories(usedCats.sort((a, b) => b.count - a.count))
        setUsedTags(usedTgs.sort((a, b) => b.count - a.count))
      } catch (err) {
        console.error('Error fetching taxonomy data:', err)
        setError('データの取得に失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // カテゴリー作成
  const handleCreateCategory = () => {
    if (!newCategoryName || !newCategorySlug) return

    startTransition(async () => {
      const result = await createCategory(newCategoryName, newCategorySlug)

      if (result.success) {
        setCategoryDialogOpen(false)
        setNewCategoryName('')
        setNewCategorySlug('')
        router.refresh()
        // 再取得
        window.location.reload()
      } else {
        setError(result.error || 'カテゴリーの作成に失敗しました')
      }
    })
  }

  // タグ作成
  const handleCreateTag = () => {
    if (!newTagName || !newTagSlug) return

    startTransition(async () => {
      const result = await createTag(newTagName, newTagSlug)

      if (result.success) {
        setTagDialogOpen(false)
        setNewTagName('')
        setNewTagSlug('')
        router.refresh()
        // 再取得
        window.location.reload()
      } else {
        setError(result.error || 'タグの作成に失敗しました')
      }
    })
  }

  // 削除
  const handleDelete = () => {
    if (!deleteTarget) return

    startTransition(async () => {
      const result =
        deleteTarget.type === 'category'
          ? await deleteCategory(deleteTarget.id)
          : await deleteTag(deleteTarget.id)

      if (result.success) {
        setDeleteDialogOpen(false)
        setDeleteTarget(null)
        router.refresh()
        // 再取得
        window.location.reload()
      } else {
        setError(result.error || '削除に失敗しました')
      }
    })
  }

  // 名前変更時にスラッグを自動生成
  const handleCategoryNameChange = (value: string) => {
    setNewCategoryName(value)
    setNewCategorySlug(generateSlug(value))
  }

  const handleTagNameChange = (value: string) => {
    setNewTagName(value)
    setNewTagSlug(generateSlug(value))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}

      {/* エラー表示 */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* タブ */}
      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="categories" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            カテゴリー ({categories.length})
          </TabsTrigger>
          <TabsTrigger value="tags" className="gap-2">
            <Tag className="h-4 w-4" />
            タグ ({tags.length})
          </TabsTrigger>
        </TabsList>

        {/* カテゴリータブ */}
        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>カテゴリー一覧</CardTitle>
              <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-red-600 hover:bg-red-700 text-white">
                    <Plus className="h-4 w-4" />
                    新規作成
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>カテゴリーを作成</DialogTitle>
                    <DialogDescription>
                      新しいカテゴリーを作成します
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="category-name">カテゴリー名</Label>
                      <Input
                        id="category-name"
                        value={newCategoryName}
                        onChange={(e) => handleCategoryNameChange(e.target.value)}
                        placeholder="例: パートナーマーケティング"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category-slug">スラッグ</Label>
                      <Input
                        id="category-slug"
                        value={newCategorySlug}
                        onChange={(e) => setNewCategorySlug(e.target.value)}
                        placeholder="例: partner-marketing"
                      />
                      <p className="text-xs text-muted-foreground">
                        URLに使用されます: /lab/category/{newCategorySlug || 'slug'}
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCategoryDialogOpen(false)}
                    >
                      キャンセル
                    </Button>
                    <Button
                      onClick={handleCreateCategory}
                      disabled={isPending || !newCategoryName || !newCategorySlug}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      作成
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="py-8 text-center text-gray-500">
                  カテゴリーがありません
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>カテゴリー名</TableHead>
                      <TableHead>スラッグ</TableHead>
                      <TableHead className="text-right">使用記事数</TableHead>
                      <TableHead className="w-[100px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          {category.name}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {category.slug}
                        </TableCell>
                        <TableCell className="text-right">
                          {category.article_count || 0}件
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => {
                              setDeleteTarget({
                                type: 'category',
                                id: category.id,
                                name: category.name,
                              })
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* 記事で使用中だがマスターテーブルにないカテゴリー */}
          {usedCategories.length > 0 && (
            <Card className="mt-6 border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-amber-800">
                  記事で使用中のカテゴリー（マスター未登録）
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-amber-700">
                  以下のカテゴリーは記事で使用されていますが、マスターテーブルに登録されていません。
                  必要に応じて上記の「新規作成」から登録してください。
                </p>
                <div className="flex flex-wrap gap-2">
                  {usedCategories.map((cat) => (
                    <span
                      key={cat.name}
                      className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-800"
                    >
                      {cat.name}
                      <span className="ml-2 rounded-full bg-amber-200 px-2 py-0.5 text-xs">
                        {cat.count}件
                      </span>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* タグタブ */}
        <TabsContent value="tags" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>タグ一覧</CardTitle>
              <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-red-600 hover:bg-red-700 text-white">
                    <Plus className="h-4 w-4" />
                    新規作成
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>タグを作成</DialogTitle>
                    <DialogDescription>新しいタグを作成します</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="tag-name">タグ名</Label>
                      <Input
                        id="tag-name"
                        value={newTagName}
                        onChange={(e) => handleTagNameChange(e.target.value)}
                        placeholder="例: 戦略"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tag-slug">スラッグ</Label>
                      <Input
                        id="tag-slug"
                        value={newTagSlug}
                        onChange={(e) => setNewTagSlug(e.target.value)}
                        placeholder="例: strategy"
                      />
                      <p className="text-xs text-muted-foreground">
                        URLに使用されます: /lab/tag/{newTagSlug || 'slug'}
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setTagDialogOpen(false)}>
                      キャンセル
                    </Button>
                    <Button
                      onClick={handleCreateTag}
                      disabled={isPending || !newTagName || !newTagSlug}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      作成
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {tags.length === 0 ? (
                <p className="py-8 text-center text-gray-500">タグがありません</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>タグ名</TableHead>
                      <TableHead>スラッグ</TableHead>
                      <TableHead className="text-right">使用記事数</TableHead>
                      <TableHead className="w-[100px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tags.map((tag) => (
                      <TableRow key={tag.id}>
                        <TableCell className="font-medium">{tag.name}</TableCell>
                        <TableCell className="text-gray-500">{tag.slug}</TableCell>
                        <TableCell className="text-right">
                          {tag.article_count || 0}件
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => {
                              setDeleteTarget({
                                type: 'tag',
                                id: tag.id,
                                name: tag.name,
                              })
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* 記事で使用中だがマスターテーブルにないタグ */}
          {usedTags.length > 0 && (
            <Card className="mt-6 border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-amber-800">
                  記事で使用中のタグ（マスター未登録）
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-amber-700">
                  以下のタグは記事で使用されていますが、マスターテーブルに登録されていません。
                  必要に応じて上記の「新規作成」から登録してください。
                </p>
                <div className="flex flex-wrap gap-2">
                  {usedTags.map((tag) => (
                    <span
                      key={tag.name}
                      className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-800"
                    >
                      #{tag.name}
                      <span className="ml-2 rounded-full bg-amber-200 px-2 py-0.5 text-xs">
                        {tag.count}件
                      </span>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteTarget?.type === 'category' ? 'カテゴリー' : 'タグ'}を削除
            </DialogTitle>
            <DialogDescription>
              「{deleteTarget?.name}」を削除しますか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

