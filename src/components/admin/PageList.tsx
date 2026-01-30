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
import { ListFilters, FilterConfig } from './ListFilters'
import { useIsDesktop } from '@/hooks/useMediaQuery'

interface Page {
  id: string
  slug: string
  title: string
  type: string
  is_published: boolean
  published_at: string | null
  updated_at: string | null
}

interface PageListProps {
  pages: Page[]
  headerActions?: React.ReactNode
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

// タイプラベル
const typeLabels: Record<string, { label: string; color: string }> = {
  casestudy: { label: '導入事例', color: 'bg-blue-100 text-blue-800' },
  knowledge: { label: 'ナレッジ', color: 'bg-green-100 text-green-800' },
  page: { label: 'ページ', color: 'bg-gray-100 text-gray-800' },
  member: { label: 'メンバー', color: 'bg-purple-100 text-purple-800' },
  home: { label: 'ホーム', color: 'bg-orange-100 text-orange-800' },
}

// プレビューURL生成
function getPreviewUrl(slug: string, type: string): string {
  switch (type) {
    case 'casestudy':
      return `/casestudy/${slug}`
    case 'knowledge':
      return `/knowledge/${slug}`
    case 'member':
      return `/member/${slug}`
    default:
      return `/${slug}`
  }
}

export function PageList({ pages, headerActions }: PageListProps) {
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
        key: 'type',
        label: 'タイプ',
        options: Object.entries(typeLabels).map(([value, { label }]) => ({
          value,
          label,
        })),
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
    []
  )

  // フィルタリング処理
  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      // 検索フィルター
      if (search) {
        const searchLower = search.toLowerCase()
        const titleMatch = page.title?.toLowerCase().includes(searchLower)
        const slugMatch = page.slug?.toLowerCase().includes(searchLower)
        if (!titleMatch && !slugMatch) return false
      }

      // タイプフィルター
      if (filters.type && page.type !== filters.type) {
        return false
      }

      // ステータスフィルター
      if (filters.status) {
        const isPublished = filters.status === 'published'
        if (page.is_published !== isPublished) return false
      }

      return true
    })
  }, [pages, search, filters])

  // タイプ別統計
  const typeCounts = useMemo(() => {
    return filteredPages.reduce(
      (acc, page) => {
        acc[page.type] = (acc[page.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
  }, [filteredPages])

  // 公開ステータス統計
  const statusCounts = useMemo(() => ({
    published: filteredPages.filter((p) => p.is_published).length,
    draft: filteredPages.filter((p) => !p.is_published).length,
  }), [filteredPages])

  return (
    <div className="space-y-6">
      {/* フィルター + アクションボタン */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <ListFilters
            filters={filterConfigs}
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
            searchPlaceholder="タイトル・スラッグで検索..."
          />
        </div>
        {headerActions && (
          <div className="flex items-center">
            {headerActions}
          </div>
        )}
      </div>

      {/* 統計 */}
      <div className="grid gap-4 md:grid-cols-8">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">
            {search || Object.keys(filters).length > 0 ? '絞込み結果' : '全ページ数'}
          </div>
          <div className="text-2xl font-bold">{filteredPages.length}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">公開中</div>
          <div className="text-2xl font-bold text-green-600">{statusCounts.published}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">下書き</div>
          <div className="text-2xl font-bold text-yellow-600">{statusCounts.draft}</div>
        </div>
        {Object.entries(typeLabels).map(([type, { label }]) => (
          <div key={type} className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">{label}</div>
            <div className="text-2xl font-bold">{typeCounts[type] || 0}</div>
          </div>
        ))}
      </div>

      {/* テーブル/カード表示 */}
      {isDesktop ? (
        // デスクトップ: テーブル
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">タイトル</TableHead>
                <TableHead className="w-[100px]">タイプ</TableHead>
                <TableHead className="w-[100px]">ステータス</TableHead>
                <TableHead className="w-[100px]">公開日</TableHead>
                <TableHead className="w-[100px]">更新日</TableHead>
                <TableHead className="w-[100px] text-right">アクション</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {search || Object.keys(filters).length > 0
                      ? '条件に一致するページがありません'
                      : 'ページがありません'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPages.map((page) => {
                  const typeInfo = typeLabels[page.type] || {
                    label: page.type,
                    color: 'bg-gray-100 text-gray-800',
                  }
                  return (
                    <TableRow key={page.id}>
                      <TableCell className="font-medium">
                        {page.is_published ? (
                          <Link
                            href={getPreviewUrl(page.slug, page.type)}
                            className="hover:underline line-clamp-2"
                            target="_blank"
                          >
                            {page.title}
                          </Link>
                        ) : (
                          <Link
                            href={`/admin/pages/${page.slug}/edit`}
                            className="hover:underline line-clamp-2"
                          >
                            {page.title}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${typeInfo.color} hover:${typeInfo.color}`}>
                          {typeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {page.is_published ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            公開中
                          </Badge>
                        ) : (
                          <Badge variant="secondary">下書き</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(page.published_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(page.updated_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={getPreviewUrl(page.slug, page.type)} target="_blank">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">プレビュー</span>
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/pages/${page.slug}/edit`}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">編集</span>
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        // モバイル: カードリスト
        <div className="space-y-3">
          {filteredPages.length === 0 ? (
            <div className="rounded-lg border bg-white p-8 text-center text-muted-foreground">
              {search || Object.keys(filters).length > 0
                ? '条件に一致するページがありません'
                : 'ページがありません'}
            </div>
          ) : (
            filteredPages.map((page) => {
              const typeInfo = typeLabels[page.type] || {
                label: page.type,
                color: 'bg-gray-100 text-gray-800',
              }
              return (
                <div key={page.id} className="rounded-lg border bg-white p-4 space-y-3">
                  {/* タイトル */}
                  <div className="font-medium line-clamp-2">
                    {page.is_published ? (
                      <Link
                        href={getPreviewUrl(page.slug, page.type)}
                        className="hover:underline"
                        target="_blank"
                      >
                        {page.title}
                      </Link>
                    ) : (
                      <Link
                        href={`/admin/pages/${page.slug}/edit`}
                        className="hover:underline"
                      >
                        {page.title}
                      </Link>
                    )}
                  </div>

                  {/* バッジ行 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${typeInfo.color} hover:${typeInfo.color}`}>
                      {typeInfo.label}
                    </Badge>
                    {page.is_published ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        公開中
                      </Badge>
                    ) : (
                      <Badge variant="secondary">下書き</Badge>
                    )}
                  </div>

                  {/* 日付 + アクション */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>公開: {formatDate(page.published_at)}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={getPreviewUrl(page.slug, page.type)} target="_blank">
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">プレビュー</span>
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/pages/${page.slug}/edit`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">編集</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

