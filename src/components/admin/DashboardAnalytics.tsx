'use client'

import {
  Users,
  Eye,
  TrendingUp,
  TrendingDown,
  Search,
  MousePointerClick,
  RefreshCw,
  Loader2,
  AlertCircle,
  BarChart3,
} from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useGAData, useGSCData } from '@/hooks/useAnalytics'

interface GASummary {
  totalUsers: number
  totalSessions: number
  totalPageviews: number
  avgBounceRate: number
  avgSessionDuration: number
  usersTrend: number
}

interface GSCSummary {
  totalClicks: number
  totalImpressions: number
  avgCtr: number
  avgPosition: number
}

// ダッシュボード用のシンプルなアナリティクス表示
export function DashboardAnalytics() {
  const { data: gaData, error: gaError, isLoading: gaLoading, mutate: mutateGA } = useGAData()
  const { data: gscData, error: gscError, isLoading: gscLoading, mutate: mutateGSC } = useGSCData()

  const loading = gaLoading || gscLoading
  const error = gaError || gscError
  const gaSummary: GASummary | null = gaData?.summary || null
  const gscSummary: GSCSummary | null = gscData?.summary || null
  const isDemo = gaData?.demo || gscData?.demo || false

  const handleRefresh = () => {
    mutateGA()
    mutateGSC()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 text-sm text-red-600 py-6">
          <AlertCircle className="h-4 w-4" />
          {error}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          アナリティクス概要
          {isDemo && (
            <Badge variant="outline" className="text-yellow-600 text-xs ml-2">
              デモ
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Link href="/admin/analytics">
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
              詳細を見る
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* ユーザー数 */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-xs">ユーザー</span>
            </div>
            <p className="text-xl font-bold">
              {gaSummary?.totalUsers.toLocaleString() ?? '-'}
            </p>
            {gaSummary && (
              <p className="text-xs flex items-center gap-1">
                {gaSummary.usersTrend >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={gaSummary.usersTrend >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {gaSummary.usersTrend > 0 ? '+' : ''}{gaSummary.usersTrend}%
                </span>
              </p>
            )}
          </div>

          {/* ページビュー */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span className="text-xs">PV</span>
            </div>
            <p className="text-xl font-bold">
              {gaSummary?.totalPageviews.toLocaleString() ?? '-'}
            </p>
            <p className="text-xs text-muted-foreground">過去30日</p>
          </div>

          {/* 検索クリック */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Search className="h-4 w-4" />
              <span className="text-xs">検索クリック</span>
            </div>
            <p className="text-xl font-bold">
              {gscSummary?.totalClicks.toLocaleString() ?? '-'}
            </p>
            <p className="text-xs text-muted-foreground">過去28日</p>
          </div>

          {/* 平均掲載順位 */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MousePointerClick className="h-4 w-4" />
              <span className="text-xs">平均順位</span>
            </div>
            <p className="text-xl font-bold">
              {gscSummary?.avgPosition ?? '-'}
            </p>
            <p className="text-xs text-muted-foreground">検索結果</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

