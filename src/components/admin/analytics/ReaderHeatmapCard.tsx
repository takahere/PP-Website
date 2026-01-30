'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  ChevronRight,
  X,
  RefreshCw,
  Loader2,
  BarChart3,
  Users,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  ArrowUpDown,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// 型定義
interface PageHeatmapSummary {
  pagePath: string
  pageTitle: string
  totalUsers: number
  completionRate: number
  avgReadTime: number
  quality: 'excellent' | 'good' | 'needs_improvement' | 'poor'
  mainDropOffDepth: number
}

interface HeatmapSummaryData {
  pages: PageHeatmapSummary[]
  summary: {
    totalPages: number
    avgCompletionRate: number
    excellentCount: number
    goodCount: number
    needsImprovementCount: number
    poorCount: number
  }
}

interface ScrollFunnelPoint {
  depth: number
  users: number
  percentage: number
}

interface DropOffPoint {
  depth: number
  dropRate: number
  estimatedSection: string
  severity: 'high' | 'medium' | 'low'
}

interface PageDetailData {
  pagePath: string
  pageTitle: string
  totalUsers: number
  scrollFunnel: ScrollFunnelPoint[]
  dropOffPoints: DropOffPoint[]
  avgReadTime: number
  completionRate: number
  insights: {
    quality: 'excellent' | 'good' | 'needs_improvement' | 'poor'
    mainDropOffArea: string
    suggestions: string[]
  }
}

// 品質ラベル・色
const QUALITY_CONFIG = {
  excellent: { label: '優秀', color: '#10b981', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200' },
  good: { label: '良好', color: '#3b82f6', bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  needs_improvement: { label: '要改善', color: '#f59e0b', bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200' },
  poor: { label: '不良', color: '#ef4444', bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' },
}

// 時間フォーマット
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`
}

// サマリーカード
function SummaryMetric({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
      <div className={cn('p-2 rounded-lg', color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

// ページリストアイテム
function PageListItem({
  page,
  onClick,
  isSelected,
}: {
  page: PageHeatmapSummary
  onClick: () => void
  isSelected: boolean
}) {
  const quality = QUALITY_CONFIG[page.quality]

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left',
        isSelected
          ? 'bg-indigo-50 border-indigo-300'
          : 'bg-white hover:bg-gray-50 border-gray-200'
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: quality.color }}
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate" title={page.pageTitle}>
            {page.pageTitle}
          </p>
          <p className="text-xs text-muted-foreground truncate" title={page.pagePath}>
            {page.pagePath}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 shrink-0 ml-2">
        <div className="text-right">
          <p className="text-sm font-medium">{page.completionRate}%</p>
          <p className="text-xs text-muted-foreground">完了率</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">{page.totalUsers.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">users</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  )
}

// スクロールファネルチャート
function ScrollFunnelChart({ data }: { data: ScrollFunnelPoint[] }) {
  const chartData = data.map((point) => ({
    name: `${point.depth}%`,
    percentage: point.percentage,
    users: point.users,
  }))

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <YAxis type="category" dataKey="name" width={50} />
          <Tooltip
            formatter={(value, name) => {
              if (name === 'percentage') {
                return [`${value}%`, '到達率']
              }
              return [value, name]
            }}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.percentage >= 70
                    ? '#10b981'
                    : entry.percentage >= 40
                    ? '#3b82f6'
                    : entry.percentage >= 20
                    ? '#f59e0b'
                    : '#ef4444'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// 詳細ビュー
function DetailView({
  data,
  onClose,
}: {
  data: PageDetailData
  onClose: () => void
}) {
  const quality = QUALITY_CONFIG[data.insights.quality]

  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-lg">{data.pageTitle}</h4>
          <p className="text-xs text-muted-foreground">{data.pagePath}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* メトリクス */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-xl font-bold">{data.totalUsers.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">訪問者数</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-xl font-bold">{data.completionRate}%</p>
          <p className="text-xs text-muted-foreground">完了率</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-xl font-bold">{formatTime(data.avgReadTime)}</p>
          <p className="text-xs text-muted-foreground">平均読了時間</p>
        </div>
        <div className={cn('p-3 rounded-lg text-center', quality.bgColor)}>
          <p className={cn('text-xl font-bold', quality.textColor)}>{quality.label}</p>
          <p className="text-xs text-muted-foreground">品質評価</p>
        </div>
      </div>

      {/* スクロールファネル */}
      <div>
        <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-indigo-600" />
          スクロールファネル
        </h5>
        <ScrollFunnelChart data={data.scrollFunnel} />
      </div>

      {/* 離脱ポイント */}
      {data.dropOffPoints?.length > 0 && (
        <div>
          <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-amber-600" />
            主要離脱ポイント
          </h5>
          <div className="space-y-2">
            {data.dropOffPoints.slice(0, 3).map((point, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center justify-between p-2 rounded-lg border',
                  point.severity === 'high'
                    ? 'bg-red-50 border-red-200'
                    : point.severity === 'medium'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-gray-50 border-gray-200'
                )}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={cn(
                      'h-4 w-4',
                      point.severity === 'high'
                        ? 'text-red-600'
                        : point.severity === 'medium'
                        ? 'text-amber-600'
                        : 'text-gray-600'
                    )}
                  />
                  <span className="text-sm font-medium">{point.depth}% 地点</span>
                  <span className="text-xs text-muted-foreground">
                    ({point.estimatedSection})
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    point.severity === 'high'
                      ? 'border-red-300 text-red-700'
                      : point.severity === 'medium'
                      ? 'border-amber-300 text-amber-700'
                      : 'border-gray-300 text-gray-700'
                  )}
                >
                  {point.dropRate}% 離脱
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 改善提案 */}
      {data.insights?.suggestions?.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-sm mb-2 flex items-center gap-2 text-blue-800">
            <Lightbulb className="h-4 w-4" />
            改善提案
          </h5>
          <ul className="space-y-1">
            {data.insights.suggestions.map((suggestion, i) => (
              <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                <span className="shrink-0">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// メインコンポーネント
export function ReaderHeatmapCard() {
  const [summaryData, setSummaryData] = useState<HeatmapSummaryData | null>(null)
  const [detailData, setDetailData] = useState<PageDetailData | null>(null)
  const [selectedPage, setSelectedPage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'completionRate' | 'users'>('completionRate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // サマリーデータ取得
  const fetchSummary = useCallback(async (refresh = false) => {
    try {
      setLoading(true)
      setError(null)

      const refreshParam = refresh ? '&refresh=true' : ''
      const response = await fetch(`/api/analytics/reader-heatmap-summary?limit=50${refreshParam}`)

      if (!response.ok) throw new Error('Failed to fetch heatmap summary')

      const result = await response.json()

      // データ存在チェック
      if (!result.data || !result.data.pages) {
        throw new Error('Invalid response data')
      }

      setSummaryData(result.data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  // 詳細データ取得
  const fetchDetail = useCallback(async (pagePath: string) => {
    try {
      setDetailLoading(true)

      const response = await fetch(
        `/api/analytics/reader-heatmap?page=${encodeURIComponent(pagePath)}`
      )

      if (!response.ok) throw new Error('Failed to fetch page detail')

      const result = await response.json()

      // データ存在チェック
      if (!result.data) {
        console.warn('No detail data returned')
        return
      }

      setDetailData(result.data)
    } catch (err) {
      console.error('Failed to fetch detail:', err)
      // エラー時は詳細パネルを閉じる
      setSelectedPage(null)
      setDetailData(null)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  // 初回読み込み
  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  // ページ選択時
  const handlePageSelect = (pagePath: string) => {
    if (selectedPage === pagePath) {
      setSelectedPage(null)
      setDetailData(null)
    } else {
      setSelectedPage(pagePath)
      fetchDetail(pagePath)
    }
  }

  // ソート処理（null安全）
  const sortedPages = (summaryData?.pages ?? [])
    .filter((page): page is PageHeatmapSummary => page != null)
    .sort((a, b) => {
      const aValue = sortBy === 'completionRate' ? a.completionRate : a.totalUsers
      const bValue = sortBy === 'completionRate' ? b.completionRate : b.totalUsers
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    })

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error || !summaryData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-500 mb-4">{error || 'データの取得に失敗しました'}</p>
          <Button onClick={() => fetchSummary()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            再試行
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              読者行動ヒートマップ
            </CardTitle>
            <CardDescription>ページごとのスクロール完了率と離脱ポイント</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => fetchSummary(true)}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* サマリー */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryMetric
            label="平均完了率"
            value={`${summaryData.summary.avgCompletionRate}%`}
            icon={BarChart3}
            color="bg-indigo-100 text-indigo-600"
          />
          <SummaryMetric
            label="優秀な記事"
            value={summaryData.summary.excellentCount}
            icon={CheckCircle2}
            color="bg-emerald-100 text-emerald-600"
          />
          <SummaryMetric
            label="要改善"
            value={summaryData.summary.needsImprovementCount + summaryData.summary.poorCount}
            icon={AlertTriangle}
            color="bg-amber-100 text-amber-600"
          />
          <SummaryMetric
            label="総ページ数"
            value={summaryData.summary.totalPages}
            icon={Users}
            color="bg-gray-100 text-gray-600"
          />
        </div>

        {/* ソートコントロール */}
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">ページ一覧</h4>
          <div className="flex items-center gap-2">
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as 'completionRate' | 'users')}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completionRate">完了率</SelectItem>
                <SelectItem value="users">訪問者数</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-8 px-2"
            >
              <ArrowUpDown className="h-3 w-3" />
              <span className="ml-1 text-xs">{sortOrder === 'asc' ? '昇順' : '降順'}</span>
            </Button>
          </div>
        </div>

        {/* ページリスト */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {sortedPages.map((page) => (
            <PageListItem
              key={page.pagePath}
              page={page}
              onClick={() => handlePageSelect(page.pagePath)}
              isSelected={selectedPage === page.pagePath}
            />
          ))}
        </div>

        {/* 詳細ビュー */}
        {selectedPage && detailLoading && (
          <div className="flex items-center justify-center py-8 border-t mt-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {selectedPage && detailData && !detailLoading && (
          <DetailView
            data={detailData}
            onClose={() => {
              setSelectedPage(null)
              setDetailData(null)
            }}
          />
        )}

        {/* 凡例 */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>優秀 (30%+)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>良好 (20-30%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span>要改善 (10-20%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>不良 (&lt;10%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
