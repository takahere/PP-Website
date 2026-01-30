import { createClient } from '@/lib/supabase/server'
import {
  AlertThreshold,
  AlertThresholdUpdate,
  MetricType,
  DEFAULT_THRESHOLDS,
} from './types'

/**
 * 閾値サービス - CRUD操作
 */

// すべての閾値を取得
export async function getAllThresholds(): Promise<AlertThreshold[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('alert_thresholds')
    .select('*')
    .order('metric')

  if (error) {
    console.error('Failed to fetch thresholds:', error)
    // エラー時はデフォルト値を返す
    return Object.values(DEFAULT_THRESHOLDS).map((t, i) => ({
      ...t,
      id: `default-${i}`,
      updatedAt: new Date().toISOString(),
      updatedBy: null,
    }))
  }

  // データベースから取得した値をマップ
  const thresholds: AlertThreshold[] = data.map((row) => ({
    id: row.id,
    metric: row.metric as MetricType,
    warningMultiplier: parseFloat(row.warning_multiplier),
    criticalMultiplier: parseFloat(row.critical_multiplier),
    percentChangeThreshold: row.percent_change_threshold,
    enabled: row.enabled,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  }))

  // 未登録のメトリクスにはデフォルト値を追加
  const existingMetrics = new Set(thresholds.map((t) => t.metric))
  for (const [metric, defaultValue] of Object.entries(DEFAULT_THRESHOLDS)) {
    if (!existingMetrics.has(metric as MetricType)) {
      thresholds.push({
        ...defaultValue,
        id: `default-${metric}`,
        updatedAt: new Date().toISOString(),
        updatedBy: null,
      })
    }
  }

  return thresholds
}

// 特定のメトリクスの閾値を取得
export async function getThreshold(metric: MetricType): Promise<AlertThreshold> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('alert_thresholds')
    .select('*')
    .eq('metric', metric)
    .single()

  if (error || !data) {
    // 存在しない場合はデフォルト値を返す
    const defaultValue = DEFAULT_THRESHOLDS[metric]
    return {
      ...defaultValue,
      id: `default-${metric}`,
      updatedAt: new Date().toISOString(),
      updatedBy: null,
    }
  }

  return {
    id: data.id,
    metric: data.metric as MetricType,
    warningMultiplier: parseFloat(data.warning_multiplier),
    criticalMultiplier: parseFloat(data.critical_multiplier),
    percentChangeThreshold: data.percent_change_threshold,
    enabled: data.enabled,
    updatedAt: data.updated_at,
    updatedBy: data.updated_by,
  }
}

// 閾値を更新（存在しない場合は作成）
export async function updateThreshold(
  metric: MetricType,
  update: AlertThresholdUpdate,
  userId?: string
): Promise<AlertThreshold> {
  const supabase = await createClient()

  // 既存のレコードを確認
  const { data: existing } = await supabase
    .from('alert_thresholds')
    .select('id')
    .eq('metric', metric)
    .single()

  const defaultValue = DEFAULT_THRESHOLDS[metric]
  const now = new Date().toISOString()

  if (existing) {
    // 更新
    const { data, error } = await supabase
      .from('alert_thresholds')
      .update({
        warning_multiplier: update.warningMultiplier,
        critical_multiplier: update.criticalMultiplier,
        percent_change_threshold: update.percentChangeThreshold,
        enabled: update.enabled,
        updated_at: now,
        updated_by: userId || null,
      })
      .eq('metric', metric)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update threshold: ${error.message}`)
    }

    return {
      id: data.id,
      metric: data.metric as MetricType,
      warningMultiplier: parseFloat(data.warning_multiplier),
      criticalMultiplier: parseFloat(data.critical_multiplier),
      percentChangeThreshold: data.percent_change_threshold,
      enabled: data.enabled,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by,
    }
  } else {
    // 新規作成
    const { data, error } = await supabase
      .from('alert_thresholds')
      .insert({
        metric,
        warning_multiplier: update.warningMultiplier ?? defaultValue.warningMultiplier,
        critical_multiplier: update.criticalMultiplier ?? defaultValue.criticalMultiplier,
        percent_change_threshold: update.percentChangeThreshold ?? defaultValue.percentChangeThreshold,
        enabled: update.enabled ?? defaultValue.enabled,
        updated_at: now,
        updated_by: userId || null,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create threshold: ${error.message}`)
    }

    return {
      id: data.id,
      metric: data.metric as MetricType,
      warningMultiplier: parseFloat(data.warning_multiplier),
      criticalMultiplier: parseFloat(data.critical_multiplier),
      percentChangeThreshold: data.percent_change_threshold,
      enabled: data.enabled,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by,
    }
  }
}

// 複数の閾値を一括更新
export async function updateThresholds(
  updates: Array<{ metric: MetricType; update: AlertThresholdUpdate }>,
  userId?: string
): Promise<AlertThreshold[]> {
  const results: AlertThreshold[] = []

  for (const { metric, update } of updates) {
    const result = await updateThreshold(metric, update, userId)
    results.push(result)
  }

  return results
}

// 閾値をデフォルトにリセット
export async function resetThreshold(metric: MetricType, userId?: string): Promise<AlertThreshold> {
  const defaultValue = DEFAULT_THRESHOLDS[metric]
  return updateThreshold(metric, defaultValue, userId)
}

// すべての閾値をデフォルトにリセット
export async function resetAllThresholds(userId?: string): Promise<AlertThreshold[]> {
  const results: AlertThreshold[] = []

  for (const metric of Object.keys(DEFAULT_THRESHOLDS) as MetricType[]) {
    const result = await resetThreshold(metric, userId)
    results.push(result)
  }

  return results
}

// 閾値を適用して異常を判定
export function evaluateAnomaly(
  metric: MetricType,
  currentValue: number,
  expectedValue: number,
  stdDev: number,
  threshold: AlertThreshold
): {
  isAnomaly: boolean
  severity: 'warning' | 'critical' | null
  deviation: number
  zScore: number
} {
  if (!threshold.enabled) {
    return { isAnomaly: false, severity: null, deviation: 0, zScore: 0 }
  }

  const deviation = ((currentValue - expectedValue) / expectedValue) * 100
  const zScore = stdDev > 0 ? Math.abs(currentValue - expectedValue) / stdDev : 0

  // 閾値チェック
  const exceedsPercentChange = Math.abs(deviation) > threshold.percentChangeThreshold
  const isCritical = zScore >= threshold.criticalMultiplier
  const isWarning = zScore >= threshold.warningMultiplier

  if (exceedsPercentChange || isCritical) {
    return {
      isAnomaly: true,
      severity: isCritical ? 'critical' : 'warning',
      deviation,
      zScore,
    }
  }

  if (isWarning) {
    return {
      isAnomaly: true,
      severity: 'warning',
      deviation,
      zScore,
    }
  }

  return { isAnomaly: false, severity: null, deviation, zScore }
}
