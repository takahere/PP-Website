'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Users, RefreshCw, Loader2, TrendingUp, TrendingDown } from 'lucide-react'

interface CohortData {
  cohort: string
  cohortLabel: string
  initialUsers: number
  retention: {
    week1: number | null
    week2: number | null
    week4: number | null
    week8: number | null
  }
  acquisitionChannel: string
  conversionRate: number
}

interface CohortInsights {
  bestRetentionCohort: string
  worstRetentionCohort: string
  avgWeek1Retention: number
  avgWeek4Retention: number
  retentionTrend: 'improving' | 'declining' | 'stable'
  bestChannel: string
}

interface CohortAnalysisData {
  period: {
    startDate: string
    endDate: string
    weeksAnalyzed: number
  }
  cohorts: CohortData[]
  insights: CohortInsights
  recommendations: string[]
}

// リテンション率に基づく色を取得
const getRetentionColor = (rate: number | null): string => {
  if (rate === null) return '#e5e7eb'
  if (rate >= 40) return '#10b981' // green
  if (rate >= 25) return '#6366f1' // indigo
  if (rate >= 15) return '#f59e0b' // amber
  return '#ef4444' // red
}

export function CohortAnalysisCard() {
  const [data, setData] = useState<CohortAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/analytics/cohorts?weeks=8')
      if (!response.ok) throw new Error('Failed to fetch cohort data')

      const { data: cohortData } = await response.json()
      setData(cohortData)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

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

  // チャート用データ変換
  const chartData = data.cohorts.map((c) => ({
    name: c.cohortLabel,
    week1: c.retention.week1 ?? 0,
    week2: c.retention.week2 ?? 0,
    week4: c.retention.week4 ?? 0,
    initialUsers: c.initialUsers,
  }))

  const trendIcon =
    data.insights.retentionTrend === 'improving' ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : data.insights.retentionTrend === 'declining' ? (
      <TrendingDown className="h-4 w-4 text-red-500" />
    ) : null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              コホート分析
            </CardTitle>
            <CardDescription>
              週別ユーザーリテンション（{data.period.weeksAnalyzed}週間分析）
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* インサイトサマリー */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-sm text-indigo-600">Week1平均リテンション</p>
            <p className="text-2xl font-bold text-indigo-900">
              {(data.insights.avgWeek1Retention ?? 0).toFixed(1)}%
            </p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-4">
            <p className="text-sm text-emerald-600">Week4平均リテンション</p>
            <p className="text-2xl font-bold text-emerald-900">
              {(data.insights.avgWeek4Retention ?? 0).toFixed(1)}%
            </p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4">
            <p className="text-sm text-amber-600">最良チャネル</p>
            <p className="text-lg font-bold text-amber-900 truncate">
              {data.insights.bestChannel}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 flex items-center gap-1">
              トレンド {trendIcon}
            </p>
            <p className="text-lg font-bold text-purple-900">
              {data.insights.retentionTrend === 'improving'
                ? '改善中'
                : data.insights.retentionTrend === 'declining'
                ? '低下傾向'
                : '安定'}
            </p>
          </div>
        </div>

        {/* リテンションチャート */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" width={80} />
              <Tooltip
                formatter={(value) => [`${(Number(value) || 0).toFixed(1)}%`, '']}
                labelFormatter={(label) => `コホート: ${label}`}
              />
              <Legend />
              <Bar dataKey="week1" name="Week 1" fill="#6366f1" radius={[0, 4, 4, 0]} />
              <Bar dataKey="week2" name="Week 2" fill="#10b981" radius={[0, 4, 4, 0]} />
              <Bar dataKey="week4" name="Week 4" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ヒートマップ形式のテーブル */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">コホート</th>
                <th className="text-center py-2 px-3">初期ユーザー</th>
                <th className="text-center py-2 px-3">Week 1</th>
                <th className="text-center py-2 px-3">Week 2</th>
                <th className="text-center py-2 px-3">Week 4</th>
                <th className="text-center py-2 px-3">Week 8</th>
              </tr>
            </thead>
            <tbody>
              {data.cohorts.slice(0, 6).map((cohort) => (
                <tr key={cohort.cohort} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{cohort.cohortLabel}</td>
                  <td className="text-center py-2 px-3">{cohort.initialUsers.toLocaleString()}</td>
                  <td className="text-center py-2 px-3">
                    <span
                      className="inline-block px-2 py-1 rounded text-white text-xs font-medium"
                      style={{ backgroundColor: getRetentionColor(cohort.retention.week1) }}
                    >
                      {cohort.retention.week1?.toFixed(1) ?? '-'}%
                    </span>
                  </td>
                  <td className="text-center py-2 px-3">
                    <span
                      className="inline-block px-2 py-1 rounded text-white text-xs font-medium"
                      style={{ backgroundColor: getRetentionColor(cohort.retention.week2) }}
                    >
                      {cohort.retention.week2?.toFixed(1) ?? '-'}%
                    </span>
                  </td>
                  <td className="text-center py-2 px-3">
                    <span
                      className="inline-block px-2 py-1 rounded text-white text-xs font-medium"
                      style={{ backgroundColor: getRetentionColor(cohort.retention.week4) }}
                    >
                      {cohort.retention.week4?.toFixed(1) ?? '-'}%
                    </span>
                  </td>
                  <td className="text-center py-2 px-3">
                    <span
                      className="inline-block px-2 py-1 rounded text-white text-xs font-medium"
                      style={{ backgroundColor: getRetentionColor(cohort.retention.week8) }}
                    >
                      {cohort.retention.week8?.toFixed(1) ?? '-'}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 推奨事項 */}
        {data.recommendations?.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">推奨アクション</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              {data.recommendations.map((rec, i) => (
                <li key={i}>• {rec}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
