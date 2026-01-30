'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Pencil, Eye } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ListFilters, FilterConfig, filterItems } from './ListFilters'
import { useIsDesktop } from '@/hooks/useMediaQuery'

interface LabArticle {
  id: string
  slug: string
  title: string
  categories: string[] | null
  tags: string[] | null
  content_type: string | null
  is_published: boolean
  published_at: string | null
  updated_at: string | null
}

interface LabArticleListProps {
  articles: LabArticle[]
  categories: string[]
  headerActions?: React.ReactNode
}

// スラッグ (category_id) から旧形式URL (/lab/category/id) を生成
function buildLabArticleUrl(slug: string): string {
  const lastUnderscoreIndex = slug.lastIndexOf('_')
  if (lastUnderscoreIndex !== -1) {
    const category = slug.substring(0, lastUnderscoreIndex)
    const id = slug.substring(lastUnderscoreIndex + 1)
    return `/lab/${category}/${id}`
  }
  return `/lab/${slug}`
}

// 日付をフォーマット
function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// コンテンツタイプの表示名
const contentTypeLabels: Record<string, string> = {
  research: 'リサーチ',
  interview: 'インタビュー',
  knowledge: 'ナレッジ',
}

// コンテンツタイプの色
const contentTypeColors: Record<string, string> = {
  research: 'bg-blue-100 text-blue-800',
  interview: 'bg-purple-100 text-purple-800',
  knowledge: 'bg-green-100 text-green-800',
}

export function LabArticleList({ articles, categories, headerActions }: LabArticleListProps) {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const isDesktop = useIsDesktop()

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
  }, [])

  const handleFilterChange = useCallback((newFilters: Record<string, string>) => {
    setFilters(newFilters)
  }, [])

  // フィルター設定
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'content_type',
        label: 'タイプ',
        options: [
          { value: 'research', label: 'リサーチ' },
          { value: 'interview', label: 'インタビュー' },
          { value: 'knowledge', label: 'ナレッジ' },
        ],
      },
      {
        key: 'category',
        label: 'カテゴリ',
        options: categories.map((cat) => ({ value: cat, label: cat })),
      },
      {
        key: 'status',
        label: 'ステータス',
        options: [
          { value: 'published', label: '公開中' },
          { value: 'draft', label: '下書き' },
        ],
      },
    ],
    [categories]
  )

  // フィルタリング処理
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      // 検索フィルター
      if (search) {
        const searchLower = search.toLowerCase()
        const titleMatch = article.title?.toLowerCase().includes(searchLower)
        const categoryMatch = article.categories?.some((c) =>
          c.toLowerCase().includes(searchLower)
        )
        const tagMatch = article.tags?.some((t) =>
          t.toLowerCase().includes(searchLower)
        )
        if (!titleMatch && !categoryMatch && !tagMatch) return false
      }

      // タイプフィルター
      if (filters.content_type && article.content_type !== filters.content_type) {
        return false
      }

      // カテゴリフィルター
      if (filters.category) {
        if (!article.categories?.includes(filters.category)) {
          return false
        }
      }

      // ステータスフィルター
      if (filters.status) {
        const isPublished = filters.status === 'published'
        if (article.is_published !== isPublished) return false
      }

      return true
    })
  }, [articles, search, filters])

  // 統計
  const stats = useMemo(
    () => ({
      total: filteredArticles.length,
      published: filteredArticles.filter((a) => a.is_published).length,
      draft: filteredArticles.filter((a) => !a.is_published).length,
      research: filteredArticles.filter((a) => a.content_type === 'research').length,
      interview: filteredArticles.filter((a) => a.content_type === 'interview').length,
      knowledge: filteredArticles.filter((a) => a.content_type === 'knowledge').length,
    }),
    [filteredArticles]
  )

  return (
    <div className="space-y-6">
      {/* フィルター + アクションボタン */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <ListFilters
            filters={filterConfigs}
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
            searchPlaceholder="タイトル・カテゴリ・タグで検索..."
          />
        </div>
        {headerActions && (
          <div className="flex items-center">
            {headerActions}
          </div>
        )}
      </div>

      {/* 統計 */}
      <div className="grid gap-4 md:grid-cols-6">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">
            {search || Object.keys(filters).length > 0 ? '絞込み結果' : '全記事数'}
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">公開中</div>
          <div className="text-2xl font-bold text-green-600">{stats.published}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">下書き</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">リサーチ</div>
          <div className="text-2xl font-bold">{stats.research}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">インタビュー</div>
          <div className="text-2xl font-bold">{stats.interview}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">ナレッジ</div>
          <div className="text-2xl font-bold">{stats.knowledge}</div>
        </div>
      </div>

      {/* デスクトップ: テーブル / モバイル: カードリスト */}
      {isDesktop ? (
        <div className="rounded-lg border bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>タイトル</TableHead>
              <TableHead>タイプ</TableHead>
              <TableHead>カテゴリ</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>公開日</TableHead>
              <TableHead>更新日</TableHead>
              <TableHead className="text-right">アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredArticles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {search || Object.keys(filters).length > 0
                    ? '条件に一致する記事がありません'
                    : '記事がありません'}
                </TableCell>
              </TableRow>
            ) : (
              filteredArticles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium max-w-[300px]">
                    <span className="line-clamp-2">{article.title}</span>
                  </TableCell>
                  <TableCell>
                    {article.content_type ? (
                      <Badge
                        variant="secondary"
                        className={`text-xs ${contentTypeColors[article.content_type] || ''}`}
                      >
                        {contentTypeLabels[article.content_type] || article.content_type}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {/* 重複を除去してから表示 */}
                      {Array.from(new Set(article.categories || [])).slice(0, 2).map((cat: string, index: number) => (
                        <Badge key={`${article.id}-cat-${index}`} variant="outline" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                      {Array.from(new Set(article.categories || [])).length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{Array.from(new Set(article.categories || [])).length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {article.is_published ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        公開中
                      </Badge>
                    ) : (
                      <Badge variant="secondary">下書き</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(article.published_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(article.updated_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={buildLabArticleUrl(article.slug)} target="_blank">
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">プレビュー</span>
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/lab/${article.slug}/edit`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">編集</span>
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      ) : (
      <div className="space-y-3">
        {filteredArticles.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center text-muted-foreground">
            {search || Object.keys(filters).length > 0
              ? '条件に一致する記事がありません'
              : '記事がありません'}
          </div>
        ) : (
          filteredArticles.map((article) => (
            <div key={article.id} className="rounded-lg border bg-white p-4 space-y-3">
              {/* タイトル */}
              <div className="font-medium line-clamp-2">{article.title}</div>

              {/* タイプ + ステータスバッジ */}
              <div className="flex items-center gap-2 flex-wrap">
                {article.content_type && (
                  <Badge
                    variant="secondary"
                    className={`text-xs ${contentTypeColors[article.content_type] || ''}`}
                  >
                    {contentTypeLabels[article.content_type] || article.content_type}
                  </Badge>
                )}
                {article.is_published ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    公開中
                  </Badge>
                ) : (
                  <Badge variant="secondary">下書き</Badge>
                )}
              </div>

              {/* カテゴリ */}
              {article.categories && article.categories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {Array.from(new Set(article.categories)).slice(0, 2).map((cat: string, index: number) => (
                    <Badge key={`${article.id}-cat-${index}`} variant="outline" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                  {Array.from(new Set(article.categories)).length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{Array.from(new Set(article.categories)).length - 2}
                    </Badge>
                  )}
                </div>
              )}

              {/* 日付 + アクション */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>公開: {formatDate(article.published_at)}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={buildLabArticleUrl(article.slug)} target="_blank">
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">プレビュー</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/lab/${article.slug}/edit`}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">編集</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      )}
    </div>
  )
}

