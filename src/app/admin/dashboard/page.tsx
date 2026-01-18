import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, File, BookOpen, ExternalLink, Clock } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardAnalytics } from '@/components/admin/DashboardAnalytics'

export const metadata: Metadata = {
  title: 'ダッシュボード',
}

// 日付フォーマット
function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // 各テーブルの件数を並列取得
  const [postsResult, pagesResult, labResult, redirectsResult] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('pages').select('*', { count: 'exact', head: true }),
    supabase.from('lab_articles').select('*', { count: 'exact', head: true }),
    supabase.from('redirects').select('*', { count: 'exact', head: true }),
  ])

  // 最近更新されたコンテンツを取得
  const [recentPosts, recentPages, recentLab] = await Promise.all([
    supabase
      .from('posts')
      .select('slug, title, type, updated_at')
      .order('updated_at', { ascending: false })
      .limit(3),
    supabase
      .from('pages')
      .select('slug, title, type, updated_at')
      .order('updated_at', { ascending: false })
      .limit(3),
    supabase
      .from('lab_articles')
      .select('slug, title, updated_at')
      .order('updated_at', { ascending: false })
      .limit(3),
  ])

  const stats = [
    {
      name: '記事',
      count: postsResult.count ?? 0,
      href: '/admin/posts',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'ページ',
      count: pagesResult.count ?? 0,
      href: '/admin/pages',
      icon: File,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Lab記事',
      count: labResult.count ?? 0,
      href: '/admin/lab',
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      name: 'リダイレクト',
      count: redirectsResult.count ?? 0,
      href: '/admin/redirects',
      icon: ExternalLink,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  // 最近の更新を統合してソート
  const recentUpdates = [
    ...(recentPosts.data || []).map((item) => ({
      ...item,
      contentType: 'posts' as const,
      href: `/admin/posts/${item.slug}/edit`,
    })),
    ...(recentPages.data || []).map((item) => ({
      ...item,
      contentType: 'pages' as const,
      href: `/admin/pages/${item.slug}/edit`,
    })),
    ...(recentLab.data || []).map((item) => ({
      ...item,
      contentType: 'lab' as const,
      type: 'lab',
      href: `/admin/lab/${item.slug}/edit`,
    })),
  ]
    .sort((a, b) => {
      const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0
      const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0
      return dateB - dateA
    })
    .slice(0, 5)

  const typeLabels: Record<string, string> = {
    news: 'ニュース',
    seminar: 'セミナー',
    casestudy: '導入事例',
    knowledge: 'ナレッジ',
    page: 'ページ',
    member: 'メンバー',
    home: 'ホーム',
    lab: 'Lab',
  }

  return (
    <div className="space-y-8">
      {/* 統計カード */}

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stat.count}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 最近の更新 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            最近の更新
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentUpdates.length === 0 ? (
            <p className="text-sm text-muted-foreground">更新はありません</p>
          ) : (
            <div className="space-y-4">
              {recentUpdates.map((item, index) => (
                <Link
                  key={`${item.contentType}-${item.slug}-${index}`}
                  href={item.href}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {typeLabels[item.type] || item.type}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground ml-4">
                    {formatDate(item.updated_at)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* アナリティクス概要 */}
      <DashboardAnalytics />
    </div>
  )
}
