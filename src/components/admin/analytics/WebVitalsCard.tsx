'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Gauge, RefreshCw, Loader2, Monitor, Smartphone, AlertTriangle } from 'lucide-react'

type Rating = 'good' | 'needs-improvement' | 'poor'

interface VitalMetric {
  metric: string
  value: number
  rating: Rating
  threshold: {
    good: number
    needsImprovement: number
  }
  p75: number
  p95: number
}

interface DeviceData {
  device: string
  lcp: number
  fid: number
  cls: number
  score: number
}

interface PageData {
  page: string
  lcp: VitalMetric
  fid: VitalMetric
  cls: VitalMetric
  overallScore: number
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low'
  metric: string
  issue: string
  suggestion: string
}

interface WebVitalsData {
  period: {
    startDate: string
    endDate: string
  }
  overview: {
    avgLCP: number
    avgFID: number
    avgCLS: number
    avgFCP: number
    avgTTFB: number
    overallScore: number
    goodPagePercentage: number
  }
  byPage: PageData[]
  byDevice: DeviceData[]
  insights: {
    slowestPages: string[]
    fastestPages: string[]
    needsAttention: string[]
  }
  recommendations: Recommendation[]
}

const RATING_COLORS: Record<Rating, string> = {
  good: '#10b981',
  'needs-improvement': '#f59e0b',
  poor: '#ef4444',
}

const RATING_LABELS: Record<Rating, string> = {
  good: '良好',
  'needs-improvement': '改善が必要',
  poor: '不良',
}

// ゲージコンポーネント
function VitalGauge({
  label,
  value,
  unit,
  rating,
  threshold,
}: {
  label: string
  value: number
  unit: string
  rating: Rating
  threshold: { good: number; needsImprovement: number }
}) {
  const percentage = Math.min(100, (value / threshold.needsImprovement) * 100)
  const color = RATING_COLORS[rating]

  return (
    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
      <div className="relative w-24 h-24">
        {/* 背景円 */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* 進捗円 */}
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${percentage * 2.51} 251`}
            strokeLinecap="round"
          />
        </svg>
        {/* 中央の値 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold" style={{ color }}>
            {(value ?? 0) < 1 ? (value ?? 0).toFixed(2) : Math.round(value ?? 0)}
          </span>
          <span className="text-xs text-gray-500">{unit}</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="font-medium">{label}</p>
        <Badge
          variant="outline"
          style={{ borderColor: color, color }}
          className="mt-1"
        >
          {RATING_LABELS[rating]}
        </Badge>
      </div>
    </div>
  )
}

export function WebVitalsCard() {
  const [data, setData] = useState<WebVitalsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('30days')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/analytics/web-vitals?period=${period}`)
      if (!response.ok) throw new Error('Failed to fetch Web Vitals data')

      const { data: vitalsData } = await response.json()
      setData(vitalsData)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-500 mb-4">{error || 'データの取得に失敗しました'}</p>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            再試行
          </Button>
        </CardContent>
      </Card>
    )
  }

  // LCP, FID, CLS のレーティング計算
  const getLCPRating = (value: number): Rating => {
    if (value <= 2500) return 'good'
    if (value <= 4000) return 'needs-improvement'
    return 'poor'
  }

  const getFIDRating = (value: number): Rating => {
    if (value <= 100) return 'good'
    if (value <= 300) return 'needs-improvement'
    return 'poor'
  }

  const getCLSRating = (value: number): Rating => {
    if (value <= 0.1) return 'good'
    if (value <= 0.25) return 'needs-improvement'
    return 'poor'
  }

  const overallColor =
    data.overview.overallScore >= 80
      ? RATING_COLORS.good
      : data.overview.overallScore >= 50
      ? RATING_COLORS['needs-improvement']
      : RATING_COLORS.poor

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Core Web Vitals
            </CardTitle>
            <CardDescription>パフォーマンス指標（Google推奨閾値基準）</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">7日間</SelectItem>
                <SelectItem value="14days">14日間</SelectItem>
                <SelectItem value="30days">30日間</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 総合スコア */}
        <div className="flex items-center justify-center gap-8 py-4">
          <div className="text-center">
            <div
              className="text-6xl font-bold"
              style={{ color: overallColor }}
            >
              {data.overview.overallScore}
            </div>
            <p className="text-muted-foreground mt-1">総合スコア</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600">
              {data.overview.goodPagePercentage}%
            </div>
            <p className="text-muted-foreground mt-1">良好なページ</p>
          </div>
        </div>

        {/* Core Web Vitals ゲージ */}
        <div className="grid grid-cols-3 gap-4">
          <VitalGauge
            label="LCP"
            value={data.overview.avgLCP ?? 0}
            unit="ms"
            rating={getLCPRating(data.overview.avgLCP ?? 0)}
            threshold={{ good: 2500, needsImprovement: 4000 }}
          />
          <VitalGauge
            label="FID"
            value={data.overview.avgFID ?? 0}
            unit="ms"
            rating={getFIDRating(data.overview.avgFID ?? 0)}
            threshold={{ good: 100, needsImprovement: 300 }}
          />
          <VitalGauge
            label="CLS"
            value={data.overview.avgCLS ?? 0}
            unit=""
            rating={getCLSRating(data.overview.avgCLS ?? 0)}
            threshold={{ good: 0.1, needsImprovement: 0.25 }}
          />
        </div>

        {/* デバイス別 */}
        <div>
          <h4 className="font-medium mb-4">デバイス別スコア</h4>
          <div className="grid grid-cols-2 gap-4">
            {data.byDevice.map((device) => (
              <div
                key={device.device}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  {device.device === 'desktop' ? (
                    <Monitor className="h-5 w-5 text-gray-600" />
                  ) : (
                    <Smartphone className="h-5 w-5 text-gray-600" />
                  )}
                  <span className="font-medium capitalize">{device.device}</span>
                </div>
                <div className="text-right">
                  <span
                    className="text-2xl font-bold"
                    style={{
                      color:
                        device.score >= 80
                          ? RATING_COLORS.good
                          : device.score >= 50
                          ? RATING_COLORS['needs-improvement']
                          : RATING_COLORS.poor,
                    }}
                  >
                    {device.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 注意が必要なページ */}
        {data.insights?.needsAttention?.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              注意が必要なページ
            </h4>
            <ul className="text-sm text-amber-700 space-y-1">
              {data.insights.needsAttention.slice(0, 5).map((page, i) => (
                <li key={i} className="font-mono text-xs">
                  {page}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 推奨事項 */}
        {data.recommendations?.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">改善の推奨事項</h4>
            <div className="space-y-3">
              {data.recommendations.map((rec, i) => (
                <div key={i} className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className={
                        rec.priority === 'high'
                          ? 'border-red-300 text-red-700'
                          : rec.priority === 'medium'
                          ? 'border-amber-300 text-amber-700'
                          : 'border-green-300 text-green-700'
                      }
                    >
                      {rec.metric}
                    </Badge>
                    <span className="text-blue-800 font-medium">{rec.issue}</span>
                  </div>
                  <p className="text-blue-700 pl-2">→ {rec.suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 閾値説明 */}
        <div className="text-xs text-muted-foreground bg-gray-50 rounded-lg p-3">
          <p className="font-medium mb-1">Google推奨閾値:</p>
          <div className="flex gap-4 flex-wrap">
            <span>LCP: ≤2.5s (良好)</span>
            <span>FID: ≤100ms (良好)</span>
            <span>CLS: ≤0.1 (良好)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
