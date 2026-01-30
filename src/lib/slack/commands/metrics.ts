import { SlackSlashCommand } from '../verify'
import { createTextBlock, createHeaderBlock, createDividerBlock, createFieldsBlock, createContextBlock } from '../client'

/**
 * /metrics コマンドハンドラー
 *
 * 使用方法:
 * - /metrics - 全メトリクスのサマリーを表示
 * - /metrics sessions - セッション詳細
 * - /metrics users - ユーザー詳細
 * - /metrics pageviews - ページビュー詳細
 * - /metrics conversions - コンバージョン詳細
 * - /metrics webvitals - Core Web Vitals
 * - /metrics help - ヘルプ表示
 */
export async function handleMetricsCommand(payload: SlackSlashCommand): Promise<{
  text: string
  blocks?: unknown[]
  response_type?: 'in_channel' | 'ephemeral'
}> {
  const metric = payload.text.trim().toLowerCase() || 'summary'

  if (metric === 'help') {
    return {
      text: '/metrics コマンドのヘルプ',
      blocks: [
        createHeaderBlock('📊 /metrics コマンド'),
        createTextBlock(
          '*使用方法:*\n' +
          '• `/metrics` - 全メトリクスのサマリーを表示\n' +
          '• `/metrics sessions` - セッション数の詳細\n' +
          '• `/metrics users` - ユーザー数の詳細\n' +
          '• `/metrics pageviews` - ページビュー数の詳細\n' +
          '• `/metrics conversions` - コンバージョンの詳細\n' +
          '• `/metrics webvitals` - Core Web Vitals\n' +
          '• `/metrics help` - このヘルプを表示'
        ),
      ],
    }
  }

  // メトリクスデータを取得
  const metricsData = await getMetricsData(metric)

  return {
    text: metricsData.text,
    blocks: metricsData.blocks,
    response_type: 'ephemeral',
  }
}

interface MetricDetail {
  current: number
  previous: number
  trend: number
  unit?: string
}

interface MetricsResult {
  text: string
  blocks: unknown[]
}

async function getMetricsData(metric: string): Promise<MetricsResult> {
  // TODO: 実際のAPIから取得
  // const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/analytics/ga`)
  // const { data } = await response.json()

  // デモデータ
  const demoData: Record<string, MetricDetail> = {
    sessions: { current: 1823, previous: 1680, trend: 8.5, unit: '' },
    users: { current: 1456, previous: 1398, trend: 4.1, unit: '' },
    pageviews: { current: 4521, previous: 4102, trend: 10.2, unit: '' },
    bounceRate: { current: 45.2, previous: 48.7, trend: -7.2, unit: '%' },
    conversions: { current: 6, previous: 4, trend: 50.0, unit: '件' },
  }

  const webVitalsData = {
    lcp: { value: 2.1, rating: 'good' as const },
    fid: { value: 85, rating: 'needs-improvement' as const },
    cls: { value: 0.08, rating: 'good' as const },
  }

  const now = new Date()
  const dateStr = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`

  if (metric === 'summary' || metric === '') {
    return getSummaryMetrics(demoData, dateStr)
  }

  if (metric === 'webvitals') {
    return getWebVitalsMetrics(webVitalsData, dateStr)
  }

  if (demoData[metric]) {
    return getDetailedMetric(metric, demoData[metric], dateStr)
  }

  // 不明なメトリクス
  return {
    text: `不明なメトリクス: ${metric}`,
    blocks: [
      createTextBlock(`⚠️ *不明なメトリクス:* ${metric}`),
      createTextBlock('`/metrics help` で使用可能なメトリクスを確認してください'),
    ],
  }
}

function getSummaryMetrics(
  data: Record<string, MetricDetail>,
  dateStr: string
): MetricsResult {
  const trendIcon = (trend: number) => (trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️')
  const trendText = (trend: number) => (trend > 0 ? `+${trend}%` : `${trend}%`)

  const blocks = [
    createHeaderBlock('📊 メトリクスサマリー'),
    createTextBlock(`*日付:* ${dateStr}`),
    createDividerBlock(),
    createFieldsBlock([
      {
        label: 'セッション',
        value: `${data.sessions.current.toLocaleString()} ${trendIcon(data.sessions.trend)} ${trendText(data.sessions.trend)}`,
      },
      {
        label: 'ユーザー',
        value: `${data.users.current.toLocaleString()} ${trendIcon(data.users.trend)} ${trendText(data.users.trend)}`,
      },
      {
        label: 'ページビュー',
        value: `${data.pageviews.current.toLocaleString()} ${trendIcon(data.pageviews.trend)} ${trendText(data.pageviews.trend)}`,
      },
      {
        label: '直帰率',
        value: `${data.bounceRate.current}% ${trendIcon(-data.bounceRate.trend)} ${trendText(data.bounceRate.trend)}`,
      },
    ]),
    createTextBlock(`*コンバージョン:* ${data.conversions.current}${data.conversions.unit} ${trendIcon(data.conversions.trend)} ${trendText(data.conversions.trend)}`),
    createDividerBlock(),
    createContextBlock('_個別メトリクスの詳細は `/metrics [metric名]` で確認_'),
  ]

  return {
    text: `メトリクスサマリー (${dateStr})`,
    blocks,
  }
}

function getWebVitalsMetrics(
  data: { lcp: { value: number; rating: string }; fid: { value: number; rating: string }; cls: { value: number; rating: string } },
  dateStr: string
): MetricsResult {
  const ratingEmoji = (rating: string) => {
    switch (rating) {
      case 'good':
        return '🟢'
      case 'needs-improvement':
        return '🟡'
      case 'poor':
        return '🔴'
      default:
        return '⚪'
    }
  }

  const blocks = [
    createHeaderBlock('⚡ Core Web Vitals'),
    createTextBlock(`*日付:* ${dateStr}`),
    createDividerBlock(),
    createTextBlock(
      `${ratingEmoji(data.lcp.rating)} *LCP (Largest Contentful Paint)*\n` +
      `現在値: ${data.lcp.value}秒 | 目標: < 2.5秒`
    ),
    createTextBlock(
      `${ratingEmoji(data.fid.rating)} *FID (First Input Delay)*\n` +
      `現在値: ${data.fid.value}ms | 目標: < 100ms`
    ),
    createTextBlock(
      `${ratingEmoji(data.cls.rating)} *CLS (Cumulative Layout Shift)*\n` +
      `現在値: ${data.cls.value} | 目標: < 0.1`
    ),
    createDividerBlock(),
    createContextBlock('🟢 Good | 🟡 Needs Improvement | 🔴 Poor'),
  ]

  return {
    text: `Core Web Vitals (${dateStr})`,
    blocks,
  }
}

function getDetailedMetric(
  metricName: string,
  data: MetricDetail,
  dateStr: string
): MetricsResult {
  const metricLabels: Record<string, string> = {
    sessions: 'セッション数',
    users: 'ユーザー数',
    pageviews: 'ページビュー数',
    bounceRate: '直帰率',
    conversions: 'コンバージョン',
  }

  const metricEmojis: Record<string, string> = {
    sessions: '👥',
    users: '🧑',
    pageviews: '📄',
    bounceRate: '↩️',
    conversions: '🎯',
  }

  const label = metricLabels[metricName] || metricName
  const emoji = metricEmojis[metricName] || '📊'
  const trendIcon = data.trend > 0 ? '📈' : data.trend < 0 ? '📉' : '➡️'
  const trendText = data.trend > 0 ? `+${data.trend}%` : `${data.trend}%`

  // 直帰率は下がる方が良い
  const isPositive = metricName === 'bounceRate' ? data.trend < 0 : data.trend > 0
  const statusEmoji = isPositive ? '✅' : '⚠️'

  const blocks = [
    createHeaderBlock(`${emoji} ${label}`),
    createTextBlock(`*日付:* ${dateStr}`),
    createDividerBlock(),
    createFieldsBlock([
      {
        label: '現在値',
        value: `${data.current.toLocaleString()}${data.unit}`,
      },
      {
        label: '前期間',
        value: `${data.previous.toLocaleString()}${data.unit}`,
      },
    ]),
    createTextBlock(`${statusEmoji} *トレンド:* ${trendIcon} ${trendText}`),
    createDividerBlock(),
    createContextBlock('_詳細はダッシュボードで確認してください_'),
  ]

  return {
    text: `${label}: ${data.current.toLocaleString()}${data.unit}`,
    blocks,
  }
}
