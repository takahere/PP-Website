'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp,
  Award,
  BarChart2,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ArticleSEOScore {
  slug: string
  title: string
  seoScore: number
  rank: 'S' | 'A' | 'B' | 'C'
  metrics: {
    position: number
    ctr: number
    transitionRate: number
    engagementRate: number
  }
}

interface SEOScoreSummary {
  totalArticles: number
  rankDistribution: { S: number; A: number; B: number; C: number }
  avgScore: number
  topArticles: ArticleSEOScore[]
}

interface SuccessPatternCardProps {
  category?: string
  contentType?: string
  showTopArticles?: boolean
  compact?: boolean
}

export function SuccessPatternCard({
  category,
  contentType,
  showTopArticles = true,
  compact = false,
}: SuccessPatternCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState<SEOScoreSummary | null>(null)
  const [isExpanded, setIsExpanded] = useState(!compact)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (contentType) params.set('contentType', contentType)
      params.set('limit', '10')

      const response = await fetch(`/api/seo/article-scores?${params.toString()}`)

      if (!response.ok) {
        throw new Error('データの取得に失敗しました')
      }

      const data = await response.json()
      setSummary({
        totalArticles: data.articles?.length || 0,
        rankDistribution: data.summary?.rankDistribution || { S: 0, A: 0, B: 0, C: 0 },
        avgScore: data.summary?.avgScore || 0,
        topArticles: data.articles?.slice(0, 5) || [],
      })
    } catch (err) {
      console.error('Failed to load SEO data:', err)
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }, [category, contentType])

  useEffect(() => {
    loadData()
  }, [loadData])

  const getRankColor = (rank: 'S' | 'A' | 'B' | 'C') => {
    switch (rank) {
      case 'S':
        return 'bg-amber-500 hover:bg-amber-600 text-white'
      case 'A':
        return 'bg-blue-500 hover:bg-blue-600 text-white'
      case 'B':
        return 'bg-gray-500 hover:bg-gray-600 text-white'
      case 'C':
        return 'bg-gray-300 text-gray-700'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-amber-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 50) return 'text-gray-600'
    return 'text-gray-400'
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="ghost" size="sm" onClick={loadData} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            再読み込み
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return null
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            SEOパフォーマンス
            {category && (
              <Badge variant="outline" className="ml-2 text-xs">
                {category}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={loadData}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>更新</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* サマリー（常に表示） */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{summary.avgScore}</p>
              <p className="text-xs text-muted-foreground">平均スコア</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{summary.totalArticles}</p>
              <p className="text-xs text-muted-foreground">記事数</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Badge className={getRankColor('S')}>
              <Award className="h-3 w-3 mr-1" />
              {summary.rankDistribution.S}
            </Badge>
            <Badge className={getRankColor('A')}>{summary.rankDistribution.A}</Badge>
            <Badge className={getRankColor('B')}>{summary.rankDistribution.B}</Badge>
            <Badge className={getRankColor('C')}>{summary.rankDistribution.C}</Badge>
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-4">
            {/* ランク分布バー */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <BarChart2 className="h-3 w-3" />
                ランク分布
              </p>
              <div className="flex h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500"
                  style={{ width: `${(summary.rankDistribution.S / summary.totalArticles) * 100}%` }}
                />
                <div
                  className="bg-blue-500"
                  style={{ width: `${(summary.rankDistribution.A / summary.totalArticles) * 100}%` }}
                />
                <div
                  className="bg-gray-500"
                  style={{ width: `${(summary.rankDistribution.B / summary.totalArticles) * 100}%` }}
                />
                <div
                  className="bg-gray-300"
                  style={{ width: `${(summary.rankDistribution.C / summary.totalArticles) * 100}%` }}
                />
              </div>
            </div>

            {/* トップ記事 */}
            {showTopArticles && summary.topArticles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  高パフォーマンス記事
                </p>
                <div className="space-y-2">
                  {summary.topArticles.slice(0, 5).map((article) => (
                    <div
                      key={article.slug}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <Badge className={`${getRankColor(article.rank)} min-w-[28px] justify-center`}>
                        {article.rank}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{article.title}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span>順位: {article.metrics.position.toFixed(1)}</span>
                          <span>CTR: {article.metrics.ctr.toFixed(1)}%</span>
                          <span>遷移: {article.metrics.transitionRate.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${getScoreColor(article.seoScore)}`}>
                          {article.seoScore}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 改善ヒント */}
            <div className="bg-muted/50 rounded-md p-3">
              <p className="text-xs font-medium flex items-center gap-1 mb-2">
                <Zap className="h-3 w-3 text-amber-500" />
                AIライター活用のヒント
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• S/Aランク記事の構成パターンを自動学習</li>
                <li>• 成功記事の文体・トーンを反映</li>
                <li>• 高スコア記事への内部リンクを優先提案</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
