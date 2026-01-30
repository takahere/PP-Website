'use client'

import { useState, useCallback } from 'react'
import {
  Loader2,
  TrendingUp,
  RefreshCw,
  BarChart3,
  Target,
  Lightbulb,
  FileText,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SimilarArticle {
  slug: string
  title: string
  actualPv30d: number
  similarity: number
}

interface PredictionResult {
  predictedPv30d: number
  predictedEngagement: number
  confidence: 'high' | 'medium' | 'low'
  similarArticles: SimilarArticle[]
  improvementSuggestions: string[]
  features: {
    titleLength: number
    contentLength: number
    headingCount: number
  }
}

interface PerformancePredictionCardProps {
  title: string
  content_html: string
  category?: string
  tags?: string[]
  contentType?: string | null
}

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const config = {
    high: { label: '高信頼度', className: 'bg-green-100 text-green-800' },
    medium: { label: '中信頼度', className: 'bg-yellow-100 text-yellow-800' },
    low: { label: '低信頼度', className: 'bg-gray-100 text-gray-800' },
  }
  const { label, className } = config[confidence]
  return <Badge className={`${className} text-xs`}>{label}</Badge>
}

function PredictionMeter({ value, max, label }: { value: number; max: number; label: string }) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value.toLocaleString()}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export function PerformancePredictionCard({
  title,
  content_html,
  category,
  tags,
  contentType,
}: PerformancePredictionCardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyzePrediction = useCallback(async () => {
    if (!title) {
      setError('タイトルを入力してください')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      // コンテンツからテキストを抽出
      const textContent = content_html.replace(/<[^>]+>/g, '')
      const headingCount = (content_html.match(/<h[2-3][^>]*>/g) || []).length

      const response = await fetch('/api/analytics/performance-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category: category || 'uncategorized',
          tags: tags || [],
          contentLength: textContent.length,
          contentType: contentType || 'knowledge',
          headingCount,
        }),
      })

      if (!response.ok) {
        throw new Error('API request failed')
      }

      const data = await response.json()

      if (data.error && !data.data) {
        throw new Error(data.error)
      }

      setResult(data.data)
    } catch (err) {
      setError('予測に失敗しました。もう一度お試しください。')
      console.error('Performance prediction error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }, [title, content_html, category, tags, contentType])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          パフォーマンス予測
        </CardTitle>
        {result && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={analyzePrediction}
            disabled={isAnalyzing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!result ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              この記事の30日後のパフォーマンスをAIが予測します。
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={analyzePrediction}
              disabled={isAnalyzing}
              className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              {isAnalyzing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BarChart3 className="mr-2 h-4 w-4" />
              )}
              予測を実行
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* メイン予測数値 */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">予測PV（30日）</p>
                <p className="text-2xl font-bold text-blue-600">
                  {result.predictedPv30d.toLocaleString()}
                </p>
              </div>
              <ConfidenceBadge confidence={result.confidence} />
            </div>

            {/* 予測メーター */}
            <div className="space-y-3">
              <PredictionMeter
                value={result.predictedPv30d}
                max={2000}
                label="予測PV"
              />
              <PredictionMeter
                value={result.predictedEngagement}
                max={100}
                label="エンゲージメント率"
              />
            </div>

            {/* 記事の特徴 */}
            <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">タイトル文字数</span>
                <span className={result.features.titleLength >= 30 && result.features.titleLength <= 60 ? 'text-green-600' : 'text-yellow-600'}>
                  {result.features.titleLength}字
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">本文文字数</span>
                <span className={result.features.contentLength >= 2000 ? 'text-green-600' : 'text-yellow-600'}>
                  {result.features.contentLength.toLocaleString()}字
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">見出し数</span>
                <span className={result.features.headingCount >= 5 ? 'text-green-600' : 'text-yellow-600'}>
                  {result.features.headingCount}個
                </span>
              </div>
            </div>

            {/* 類似記事 */}
            {result.similarArticles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  類似記事の実績
                </p>
                <div className="space-y-1.5">
                  {result.similarArticles.slice(0, 3).map((article) => (
                    <div
                      key={article.slug}
                      className="flex items-center justify-between text-xs rounded-md bg-gray-50 px-2 py-1.5"
                    >
                      <span className="truncate flex-1 mr-2" title={article.title}>
                        {article.title.length > 25
                          ? article.title.substring(0, 25) + '...'
                          : article.title}
                      </span>
                      <span className="font-medium text-blue-600 whitespace-nowrap">
                        {article.actualPv30d.toLocaleString()} PV
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 改善提案 */}
            {result.improvementSuggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  改善提案
                </p>
                <ul className="space-y-1">
                  {result.improvementSuggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="text-xs text-muted-foreground flex items-start gap-1"
                    >
                      <Target className="h-3 w-3 mt-0.5 text-blue-600 shrink-0" />
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
