import { GeneratedReport, ReportMetric } from './types'

/**
 * CSV生成ユーティリティ
 */

// 値をCSV用にエスケープ
function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // カンマ、改行、ダブルクォートを含む場合はクォートで囲む
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// レポートデータからCSVを生成
export function generateCSV(report: GeneratedReport, metrics: ReportMetric[]): string {
  const enabledMetrics = metrics.filter((m) => m.enabled)

  // ヘッダー行
  const headers = ['期間', ...enabledMetrics.map((m) => m.label)]
  const lines: string[] = [headers.map(escapeCSV).join(',')]

  // データ行
  for (const row of report.data) {
    const values = [
      row.period,
      ...enabledMetrics.map((m) => {
        const val = row[m.id]
        if (val === null || val === undefined) return ''
        // パーセンテージや小数点を含む値はフォーマット
        if (typeof val === 'number') {
          if (m.metric.includes('Rate') || m.metric === 'ctr') {
            return `${val.toFixed(2)}%`
          }
          return val.toFixed(2)
        }
        return String(val)
      }),
    ]
    lines.push(values.map(escapeCSV).join(','))
  }

  // サマリー行
  lines.push('') // 空行
  lines.push('サマリー')
  for (const metric of enabledMetrics) {
    const value = report.summary[metric.id]
    const formattedValue =
      value !== undefined
        ? metric.metric.includes('Rate') || metric.metric === 'ctr'
          ? `${value.toFixed(2)}%`
          : value.toFixed(2)
        : '-'
    lines.push(`${escapeCSV(metric.label)},${escapeCSV(formattedValue)}`)
  }

  // メタデータ
  lines.push('')
  lines.push('レポート情報')
  lines.push(`生成日時,${report.generatedAt}`)
  lines.push(`期間,${report.period.start} 〜 ${report.period.end}`)
  lines.push(`グループ化,${report.groupBy}`)
  lines.push(`データ行数,${report.metadata.totalRows}`)

  return lines.join('\n')
}

// CSVダウンロード用のBlobを生成
export function createCSVBlob(csvContent: string): Blob {
  // BOMを追加してExcelで正しく開けるようにする
  const bom = new Uint8Array([0xef, 0xbb, 0xbf])
  return new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8' })
}

// ファイル名を生成
export function generateFileName(templateName: string, format: 'csv' | 'json' | 'pdf'): string {
  const date = new Date().toISOString().split('T')[0]
  const safeName = templateName.replace(/[^a-zA-Z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '_')
  return `${safeName}_${date}.${format}`
}
