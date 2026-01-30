'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  RefreshCw,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react'
import {
  AlertThreshold,
  MetricType,
  METRIC_LABELS,
  METRIC_CATEGORIES,
  DEFAULT_THRESHOLDS,
} from '@/lib/thresholds/types'

interface ThresholdEditorProps {
  threshold: AlertThreshold
  defaultValue: typeof DEFAULT_THRESHOLDS[MetricType]
  onChange: (metric: MetricType, field: string, value: number | boolean) => void
  onReset: (metric: MetricType) => void
}

function ThresholdEditor({ threshold, defaultValue, onChange, onReset }: ThresholdEditorProps) {
  const isModified =
    threshold.warningMultiplier !== defaultValue.warningMultiplier ||
    threshold.criticalMultiplier !== defaultValue.criticalMultiplier ||
    threshold.percentChangeThreshold !== defaultValue.percentChangeThreshold ||
    threshold.enabled !== defaultValue.enabled

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Switch
            checked={threshold.enabled}
            onCheckedChange={(checked) => onChange(threshold.metric, 'enabled', checked)}
          />
          <div>
            <h4 className="font-medium">{METRIC_LABELS[threshold.metric]}</h4>
            <p className="text-sm text-muted-foreground">{threshold.metric}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isModified && (
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              変更あり
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReset(threshold.metric)}
            disabled={!isModified}
            title="デフォルトに戻す"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm text-muted-foreground">Warning (σ)</label>
          <Input
            type="number"
            min={0.5}
            max={10}
            step={0.1}
            value={threshold.warningMultiplier}
            onChange={(e) =>
              onChange(threshold.metric, 'warningMultiplier', parseFloat(e.target.value))
            }
            disabled={!threshold.enabled}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            デフォルト: {defaultValue.warningMultiplier}
          </p>
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Critical (σ)</label>
          <Input
            type="number"
            min={0.5}
            max={10}
            step={0.1}
            value={threshold.criticalMultiplier}
            onChange={(e) =>
              onChange(threshold.metric, 'criticalMultiplier', parseFloat(e.target.value))
            }
            disabled={!threshold.enabled}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            デフォルト: {defaultValue.criticalMultiplier}
          </p>
        </div>

        <div>
          <label className="text-sm text-muted-foreground">変化率 (%)</label>
          <Input
            type="number"
            min={5}
            max={100}
            step={5}
            value={threshold.percentChangeThreshold}
            onChange={(e) =>
              onChange(threshold.metric, 'percentChangeThreshold', parseInt(e.target.value))
            }
            disabled={!threshold.enabled}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            デフォルト: {defaultValue.percentChangeThreshold}%
          </p>
        </div>
      </div>
    </div>
  )
}

export function AlertThresholdSettings() {
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // 閾値を取得
  useEffect(() => {
    fetchThresholds()
  }, [])

  const fetchThresholds = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/analytics/thresholds')
      if (!response.ok) {
        throw new Error('Failed to fetch thresholds')
      }

      const { data } = await response.json()
      setThresholds(data)
    } catch (err) {
      setError((err as Error).message)
      // エラー時はデフォルト値を表示
      setThresholds(
        Object.values(DEFAULT_THRESHOLDS).map((t, i) => ({
          ...t,
          id: `default-${i}`,
          updatedAt: new Date().toISOString(),
          updatedBy: null,
        }))
      )
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (metric: MetricType, field: string, value: number | boolean) => {
    setThresholds((prev) =>
      prev.map((t) => (t.metric === metric ? { ...t, [field]: value } : t))
    )
    setHasChanges(true)
    setSuccess(null)
  }

  const handleReset = (metric: MetricType) => {
    const defaultValue = DEFAULT_THRESHOLDS[metric]
    setThresholds((prev) =>
      prev.map((t) =>
        t.metric === metric
          ? {
              ...t,
              warningMultiplier: defaultValue.warningMultiplier,
              criticalMultiplier: defaultValue.criticalMultiplier,
              percentChangeThreshold: defaultValue.percentChangeThreshold,
              enabled: defaultValue.enabled,
            }
          : t
      )
    )
    setHasChanges(true)
    setSuccess(null)
  }

  const handleResetAll = () => {
    setThresholds((prev) =>
      prev.map((t) => {
        const defaultValue = DEFAULT_THRESHOLDS[t.metric]
        return {
          ...t,
          warningMultiplier: defaultValue.warningMultiplier,
          criticalMultiplier: defaultValue.criticalMultiplier,
          percentChangeThreshold: defaultValue.percentChangeThreshold,
          enabled: defaultValue.enabled,
        }
      })
    )
    setHasChanges(true)
    setSuccess(null)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const updates = thresholds.map((t) => ({
        metric: t.metric,
        warningMultiplier: t.warningMultiplier,
        criticalMultiplier: t.criticalMultiplier,
        percentChangeThreshold: t.percentChangeThreshold,
        enabled: t.enabled,
      }))

      const response = await fetch('/api/analytics/thresholds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save thresholds')
      }

      setHasChanges(false)
      setSuccess('閾値を保存しました')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                異常検知閾値設定
              </CardTitle>
              <CardDescription>
                各メトリクスの異常検知閾値をカスタマイズできます
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleResetAll} disabled={saving}>
                <RefreshCw className="h-4 w-4 mr-2" />
                すべてリセット
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges || saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                保存
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 説明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">閾値の説明</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>
                    <strong>Warning (σ)</strong>: この標準偏差倍率を超えると警告
                  </li>
                  <li>
                    <strong>Critical (σ)</strong>: この標準偏差倍率を超えると重大アラート
                  </li>
                  <li>
                    <strong>変化率 (%)</strong>: 前週比でこの割合を超えると異常として検知
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* ステータスメッセージ */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800">{success}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* カテゴリ別の閾値設定 */}
      {Object.entries(METRIC_CATEGORIES).map(([category, metrics]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg">{category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.map((metric) => {
              const threshold = thresholds.find((t) => t.metric === metric)
              if (!threshold) return null

              return (
                <ThresholdEditor
                  key={metric}
                  threshold={threshold}
                  defaultValue={DEFAULT_THRESHOLDS[metric]}
                  onChange={handleChange}
                  onReset={handleReset}
                />
              )
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
