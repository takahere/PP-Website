'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Pencil } from 'lucide-react'

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

interface Post {
  id: string
  slug: string
  title: string
  type: string
  is_published: boolean
  published_at: string | null
  updated_at: string | null
}

interface PostListProps {
  posts: Post[]
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

// タイプの表示名
const typeLabels: Record<string, string> = {
  news: 'ニュース',
  seminar: 'セミナー',
}

export function PostList({ posts, headerActions }: PostListProps) {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})

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
        options: [
          { value: 'news', label: 'ニュース' },
          { value: 'seminar', label: 'セミナー' },
        ],
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
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // 検索フィルター
      if (search) {
        const searchLower = search.toLowerCase()
        const titleMatch = post.title?.toLowerCase().includes(searchLower)
        const slugMatch = post.slug?.toLowerCase().includes(searchLower)
        if (!titleMatch && !slugMatch) return false
      }

      // タイプフィルター
      if (filters.type && post.type !== filters.type) {
        return false
      }

      // ステータスフィルター
      if (filters.status) {
        const isPublished = filters.status === 'published'
        if (post.is_published !== isPublished) return false
      }

      return true
    })
  }, [posts, search, filters])

  // 統計
  const stats = useMemo(
    () => ({
      total: filteredPosts.length,
      published: filteredPosts.filter((p) => p.is_published).length,
      draft: filteredPosts.filter((p) => !p.is_published).length,
      news: filteredPosts.filter((p) => p.type === 'news').length,
      seminar: filteredPosts.filter((p) => p.type === 'seminar').length,
    }),
    [filteredPosts]
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
      <div className="grid gap-4 md:grid-cols-5">
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
          <div className="text-sm font-medium text-muted-foreground">ニュース</div>
          <div className="text-2xl font-bold">{stats.news}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">セミナー</div>
          <div className="text-2xl font-bold">{stats.seminar}</div>
        </div>
      </div>

      {/* テーブル */}
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[350px]">タイトル</TableHead>
              <TableHead className="w-[100px]">タイプ</TableHead>
              <TableHead className="w-[100px]">ステータス</TableHead>
              <TableHead className="w-[100px]">公開日</TableHead>
              <TableHead className="w-[100px]">更新日</TableHead>
              <TableHead className="w-[80px] text-right">アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {search || Object.keys(filters).length > 0
                    ? '条件に一致する記事がありません'
                    : '記事がありません'}
                </TableCell>
              </TableRow>
            ) : (
              filteredPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">
                    {post.is_published ? (
                      <Link
                        href={post.type === 'news' ? `/news/${post.slug}` : `/seminar/${post.slug}`}
                        className="hover:underline line-clamp-2"
                        target="_blank"
                      >
                        {post.title}
                      </Link>
                    ) : (
                      <Link
                        href={`/admin/posts/${post.slug}/edit`}
                        className="hover:underline line-clamp-2"
                      >
                        {post.title}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{typeLabels[post.type] || post.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {post.is_published ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        公開中
                      </Badge>
                    ) : (
                      <Badge variant="secondary">下書き</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(post.published_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(post.updated_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/posts/${post.slug}/edit`}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">編集</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

