import {
  ReportConfig,
  GeneratedReport,
  GeneratedReportData,
  GroupByPeriod,
  ReportMetric,
} from './types'

/**
 * レポート生成サービス
 */

// 日付範囲を計算
export function calculateDateRange(config: ReportConfig): { start: string; end: string } {
  const now = new Date()
  let start: Date
  let end: Date = new Date(now)
  end.setDate(end.getDate() - 1) // 昨日まで

  if (config.dateRange.type === 'fixed' && config.dateRange.startDate && config.dateRange.endDate) {
    return {
      start: config.dateRange.startDate,
      end: config.dateRange.endDate,
    }
  }

  // relative
  const days = config.dateRange.relativeDays || 30
  start = new Date(now)
  start.setDate(start.getDate() - days)

  return {
    start: formatDate(start),
    end: formatDate(end),
  }
}

// 日付フォーマット
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// グループ化キーを生成
export function getGroupKey(date: string, groupBy: GroupByPeriod): string {
  const d = new Date(date)

  switch (groupBy) {
    case 'day':
      return date
    case 'week':
      // ISO週番号を計算
      const jan1 = new Date(d.getFullYear(), 0, 1)
      const weekNum = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
      return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
    case 'month':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    default:
      return date
  }
}

// サマリーを計算
export function calculateSummary(
  data: GeneratedReportData[],
  metrics: ReportMetric[]
): Record<string, number> {
  const summary: Record<string, number> = {}

  for (const metric of metrics) {
    if (!metric.enabled) continue

    const values = data
      .map((row) => Number(row[metric.id]) || 0)
      .filter((v) => !isNaN(v))

    if (values.length === 0) {
      summary[metric.id] = 0
      continue
    }

    switch (metric.aggregation) {
      case 'sum':
        summary[metric.id] = values.reduce((a, b) => a + b, 0)
        break
      case 'avg':
        summary[metric.id] = values.reduce((a, b) => a + b, 0) / values.length
        break
      case 'min':
        summary[metric.id] = Math.min(...values)
        break
      case 'max':
        summary[metric.id] = Math.max(...values)
        break
      case 'count':
        summary[metric.id] = values.length
        break
    }

    // 小数点以下2桁に丸める
    summary[metric.id] = Math.round(summary[metric.id] * 100) / 100
  }

  return summary
}

// デモデータ生成（API未接続時）
export function generateDemoReportData(config: ReportConfig): GeneratedReport {
  const { start, end } = calculateDateRange(config)
  const startDate = new Date(start)
  const endDate = new Date(end)
  const data: GeneratedReportData[] = []

  // 日付範囲をイテレート
  const current = new Date(startDate)
  const groupedData = new Map<string, GeneratedReportData>()

  while (current <= endDate) {
    const dateStr = formatDate(current)
    const groupKey = getGroupKey(dateStr, config.groupBy)

    if (!groupedData.has(groupKey)) {
      const row: GeneratedReportData = {
        period: groupKey,
        date: dateStr,
      }

      // 各メトリクスにランダムデータを設定
      for (const metric of config.metrics) {
        if (!metric.enabled) continue

        let value: number
        switch (metric.metric) {
          case 'sessions':
            value = Math.floor(Math.random() * 500) + 100
            break
          case 'activeUsers':
            value = Math.floor(Math.random() * 400) + 80
            break
          case 'screenPageViews':
            value = Math.floor(Math.random() * 1500) + 300
            break
          case 'bounceRate':
            value = Math.random() * 30 + 35 // 35-65%
            break
          case 'avgSessionDuration':
            value = Math.random() * 180 + 60 // 60-240秒
            break
          case 'engagementRate':
            value = Math.random() * 30 + 50 // 50-80%
            break
          case 'conversions':
            value = Math.floor(Math.random() * 20) + 1
            break
          case 'impressions':
            value = Math.floor(Math.random() * 10000) + 1000
            break
          case 'clicks':
            value = Math.floor(Math.random() * 500) + 50
            break
          case 'ctr':
            value = Math.random() * 5 + 1 // 1-6%
            break
          case 'position':
            value = Math.random() * 20 + 5 // 5-25位
            break
          default:
            value = Math.floor(Math.random() * 100)
        }

        row[metric.id] = Math.round(value * 100) / 100
      }

      groupedData.set(groupKey, row)
    }

    current.setDate(current.getDate() + 1)
  }

  // Map を配列に変換
  data.push(...groupedData.values())

  // サマリーを計算
  const summary = calculateSummary(data, config.metrics)

  return {
    templateId: 'demo',
    templateName: 'デモレポート',
    generatedAt: new Date().toISOString(),
    period: { start, end },
    groupBy: config.groupBy,
    data,
    summary,
    metadata: {
      totalRows: data.length,
      metrics: config.metrics.filter((m) => m.enabled).map((m) => m.label),
      filters: config.filters,
    },
  }
}
