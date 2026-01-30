'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Save,
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import {
  ReportConfig,
  ReportMetric,
  GroupByPeriod,
  MetricSource,
  AVAILABLE_METRICS,
  PRESET_DATE_RANGES,
} from '@/lib/reports'

const SOURCE_LABELS: Record<MetricSource, string> = {
  ga4: 'Google Analytics',
  gsc: 'Google Search Console',
  business: 'ビジネス指標',
  lab: 'Lab指標',
}

export function ReportBuilder() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // フォーム状態
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [dateRangeDays, setDateRangeDays] = useState(30)
  const [groupBy, setGroupBy] = useState<GroupByPeriod>('day')
  const [selectedMetrics, setSelectedMetrics] = useState<Record<string, boolean>>({
    ga4_sessions: true,
    ga4_users: true,
    ga4_pageviews: true,
  })

  // メトリクスの有効/無効を切り替え
  const toggleMetric = (metricId: string) => {
    setSelectedMetrics((prev) => ({
      ...prev,
      [metricId]: !prev[metricId],
    }))
  }

  // 選択されたメトリクス数
  const selectedCount = Object.values(selectedMetrics).filter(Boolean).length

  // 保存処理
  const handleSave = async () => {
    if (!name.trim()) {
      setError('レポート名を入力してください')
      return
    }

    if (selectedCount === 0) {
      setError('少なくとも1つのメトリクスを選択してください')
      return
    }

    try {
      setSaving(true)
      setError(null)

      // メトリクス配列を構築
      const metrics: ReportMetric[] = []
      for (const [source, sourceMetrics] of Object.entries(AVAILABLE_METRICS)) {
        for (const metric of sourceMetrics) {
          metrics.push({
            ...metric,
            enabled: selectedMetrics[metric.id] || false,
          })
        }
      }

      const config: ReportConfig = {
        metrics,
        dateRange: {
          type: 'relative',
          relativeDays: dateRangeDays,
        },
        groupBy,
        filters: [],
        includeCharts: true,
        includeSummary: true,
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          config,
          isPublic,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save template')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/reports')
      }, 1500)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <div>
            <h1 className="text-2xl font-bold">レポートテンプレート作成</h1>
            <p className="text-muted-foreground">カスタムレポートの設定</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving || success}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : success ? (
            <CheckCircle className="h-4 w-4 mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {success ? '保存完了' : '保存'}
        </Button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* 成功表示 */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-800">テンプレートを保存しました。リダイレクト中...</span>
        </div>
      )}

      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">レポート名 *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 週次トラフィックレポート"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">説明</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例: 週ごとのトラフィック推移を確認"
              className="mt-1"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">公開設定</label>
              <p className="text-xs text-muted-foreground">他のユーザーもこのテンプレートを使用可能</p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
        </CardContent>
      </Card>

      {/* 期間設定 */}
      <Card>
        <CardHeader>
          <CardTitle>期間設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">対象期間</label>
              <Select
                value={String(dateRangeDays)}
                onValueChange={(v) => setDateRangeDays(parseInt(v))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_DATE_RANGES.filter((r) => typeof r.value === 'number').map((range) => (
                    <SelectItem key={range.value} value={String(range.value)}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">グループ化</label>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByPeriod)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">日別</SelectItem>
                  <SelectItem value="week">週別</SelectItem>
                  <SelectItem value="month">月別</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* メトリクス選択 */}
      <Card>
        <CardHeader>
          <CardTitle>メトリクス選択</CardTitle>
          <CardDescription>
            レポートに含めるメトリクスを選択（{selectedCount}件選択中）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(AVAILABLE_METRICS).map(([source, metrics]) => (
            <div key={source}>
              <h4 className="font-medium mb-3">{SOURCE_LABELS[source as MetricSource]}</h4>
              <div className="grid grid-cols-2 gap-2">
                {metrics.map((metric) => (
                  <div
                    key={metric.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedMetrics[metric.id]
                        ? 'bg-indigo-50 border-indigo-200'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => toggleMetric(metric.id)}
                  >
                    <span className="text-sm">{metric.label}</span>
                    <Switch
                      checked={selectedMetrics[metric.id] || false}
                      onCheckedChange={() => toggleMetric(metric.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* プレビュー */}
      <Card>
        <CardHeader>
          <CardTitle>設定プレビュー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">レポート名:</span>
              <span className="font-medium">{name || '(未入力)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">期間:</span>
              <span className="font-medium">過去{dateRangeDays}日</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">グループ化:</span>
              <span className="font-medium">
                {groupBy === 'day' ? '日別' : groupBy === 'week' ? '週別' : '月別'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">選択メトリクス:</span>
              <span className="font-medium">{selectedCount}件</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(AVAILABLE_METRICS)
                .flatMap(([, metrics]) => metrics)
                .filter((m) => selectedMetrics[m.id])
                .map((m) => (
                  <Badge key={m.id} variant="secondary" className="text-xs">
                    {m.label}
                  </Badge>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
