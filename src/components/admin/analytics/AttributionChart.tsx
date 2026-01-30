'use client'

import { useState, useEffect } from 'react'
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { GitBranch, RefreshCw, Loader2 } from 'lucide-react'

type AttributionModel = 'last_touch' | 'first_touch' | 'linear' | 'time_decay'

interface ChannelAttribution {
  channel: string
  conversions: number
  attributedValue: number
  percentage: number
  sessions: number
}

interface ConversionPath {
  path: string[]
  conversions: number
  avgTouchpoints: number
}

interface ModelComparison {
  channel: string
  lastTouch: number
  firstTouch: number
  linear: number
  timeDecay: number
}

interface AttributionData {
  period: {
    startDate: string
    endDate: string
  }
  model: AttributionModel
  modelDescription: string
  channels: ChannelAttribution[]
  paths: ConversionPath[]
  comparison: ModelComparison[]
  summary: {
    totalConversions: number
    totalChannels: number
    avgTouchpoints: number
    topChannel: string
    undervaluedChannel: string | null
  }
  insights: string[]
}

const MODEL_LABELS: Record<AttributionModel, string> = {
  last_touch: 'ラストタッチ',
  first_touch: 'ファーストタッチ',
  linear: 'リニア（均等配分）',
  time_decay: 'タイムデケイ（時間減衰）',
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function AttributionChart() {
  const [data, setData] = useState<AttributionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<AttributionModel>('linear')

  const fetchData = async (model: AttributionModel) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/analytics/attribution?model=${model}`)
      if (!response.ok) throw new Error('Failed to fetch attribution data')

      const { data: attrData } = await response.json()
      setData(attrData)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(selectedModel)
  }, [selectedModel])

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
          <Button onClick={() => fetchData(selectedModel)} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            再試行
          </Button>
        </CardContent>
      </Card>
    )
  }

  // チャネル貢献度グラフ用データ
  const channelData = data.channels.map((c) => ({
    name: c.channel,
    value: c.attributedValue,
    percentage: c.percentage,
    sessions: c.sessions,
  }))

  // モデル比較用データ
  const comparisonData = data.comparison.map((c) => ({
    channel: c.channel,
    'ラストタッチ': c.lastTouch,
    'ファーストタッチ': c.firstTouch,
    'リニア': c.linear,
    'タイムデケイ': c.timeDecay,
  }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              アトリビューション分析
            </CardTitle>
            <CardDescription>
              チャネル別コンバージョン貢献度
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={selectedModel}
              onValueChange={(v) => setSelectedModel(v as AttributionModel)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MODEL_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => fetchData(selectedModel)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* サマリー */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-sm text-indigo-600">総CV数</p>
            <p className="text-2xl font-bold text-indigo-900">{data.summary.totalConversions}</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-4">
            <p className="text-sm text-emerald-600">チャネル数</p>
            <p className="text-2xl font-bold text-emerald-900">{data.summary.totalChannels}</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4">
            <p className="text-sm text-amber-600">平均タッチポイント</p>
            <p className="text-2xl font-bold text-amber-900">
              {(data.summary.avgTouchpoints ?? 0).toFixed(1)}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600">トップチャネル</p>
            <p className="text-lg font-bold text-purple-900 truncate">{data.summary.topChannel}</p>
          </div>
        </div>

        {/* チャネル貢献度（横棒グラフ） */}
        <div>
          <h4 className="font-medium mb-4">チャネル別貢献度（{MODEL_LABELS[selectedModel]}）</h4>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={120} />
                <Tooltip
                  formatter={(value) => {
                    const numValue = Number(value) || 0
                    return [
                      `${numValue.toFixed(1)} (${channelData.find((c) => c.value === numValue)?.percentage?.toFixed(1) || 0}%)`,
                      '貢献度',
                    ]
                  }}
                />
                <Bar dataKey="value" name="貢献度" radius={[0, 4, 4, 0]}>
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* モデル比較 */}
        <div>
          <h4 className="font-medium mb-4">アトリビューションモデル比較</h4>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="ラストタッチ" fill="#6366f1" />
                <Bar dataKey="ファーストタッチ" fill="#10b981" />
                <Bar dataKey="リニア" fill="#f59e0b" />
                <Bar dataKey="タイムデケイ" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* コンバージョンパス */}
        <div>
          <h4 className="font-medium mb-4">主要コンバージョンパス</h4>
          <div className="space-y-2">
            {data.paths.slice(0, 5).map((path, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {path.path.map((step, j) => (
                    <span key={j} className="flex items-center">
                      <Badge variant="outline">{step}</Badge>
                      {j < path.path.length - 1 && (
                        <span className="mx-1 text-gray-400">→</span>
                      )}
                    </span>
                  ))}
                </div>
                <div className="text-right">
                  <span className="font-medium">{path.conversions} CV</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({(path.avgTouchpoints ?? 0).toFixed(1)} タッチ)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* インサイト */}
        {data.insights?.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">インサイト</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              {data.insights.map((insight, i) => (
                <li key={i}>• {insight}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 過小評価チャネル */}
        {data.summary.undervaluedChannel && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-800 mb-1">注目ポイント</h4>
            <p className="text-sm text-amber-700">
              <strong>{data.summary.undervaluedChannel}</strong>
              はラストタッチモデルでは過小評価されている可能性があります。
              ファーストタッチやリニアモデルでの貢献度も確認してください。
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
