'use client'

import { useState, useCallback } from 'react'
import { Loader2, Sparkles, CheckCircle2, AlertCircle, XCircle, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface QualityCategory {
  score: number
  label: string
  status: 'good' | 'warning' | 'error'
  feedback: string
}

interface QualityResult {
  overall_score: number
  categories: {
    readability: QualityCategory
    seo: QualityCategory
    content_length: QualityCategory
    structure: QualityCategory
  }
  suggestions: string[]
  stats: {
    char_count: number
    heading_count: number
    link_count: number
    has_seo_description: boolean
    has_og_description: boolean
  }
}

interface ContentQualityCardProps {
  title: string
  content_html: string
  seo_description?: string | null
  og_description?: string | null
}

function StatusIcon({ status }: { status: 'good' | 'warning' | 'error' }) {
  switch (status) {
    case 'good':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    case 'warning':
      return <AlertCircle className="h-4 w-4 text-yellow-600" />
    case 'error':
      return <XCircle className="h-4 w-4 text-red-600" />
  }
}

function ScoreRing({ score }: { score: number }) {
  const radius = 40
  const strokeWidth = 8
  const normalizedRadius = radius - strokeWidth / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (score / 100) * circumference

  const getColor = (score: number) => {
    if (score >= 80) return '#16a34a' // green-600
    if (score >= 60) return '#ca8a04' // yellow-600
    return '#dc2626' // red-600
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={getColor(score)}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <span className="absolute text-xl font-bold">{score}</span>
    </div>
  )
}

export function ContentQualityCard({
  title,
  content_html,
  seo_description,
  og_description,
}: ContentQualityCardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<QualityResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const analyzeContent = useCallback(async () => {
    if (!title && !content_html) {
      setError('タイトルまたは本文を入力してください')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/content-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content_html,
          seo_description,
          og_description,
        }),
      })

      if (!response.ok) {
        throw new Error('API request failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError('分析に失敗しました。もう一度お試しください。')
      console.error('Content quality analysis error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }, [title, content_html, seo_description, og_description])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          コンテンツ品質
        </CardTitle>
        {result && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={analyzeContent}
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
              AIがコンテンツを分析し、品質スコアと改善提案を表示します。
            </p>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={analyzeContent}
              disabled={isAnalyzing}
              className="w-full text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              {isAnalyzing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              品質を分析
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* スコアリング */}
            <div className="flex items-center justify-center">
              <ScoreRing score={result.overall_score} />
            </div>

            {/* カテゴリ別スコア */}
            <div className="space-y-2">
              {Object.entries(result.categories).map(([key, category]) => (
                <div
                  key={key}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <StatusIcon status={category.status} />
                    <span>{category.label}</span>
                  </div>
                  <span className="font-medium">{category.score}</span>
                </div>
              ))}
            </div>

            {/* 統計情報 */}
            <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">文字数</span>
                <span>{result.stats.char_count.toLocaleString()}字</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">見出し</span>
                <span>{result.stats.heading_count}個</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">リンク</span>
                <span>{result.stats.link_count}件</span>
              </div>
            </div>

            {/* 改善提案 */}
            {result.suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">改善提案:</p>
                <ul className="space-y-1">
                  {result.suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="text-xs text-muted-foreground flex items-start gap-1"
                    >
                      <span className="text-purple-600">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
