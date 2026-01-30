/**
 * Slack メッセージフォーマッター
 * Analytics データをSlack用メッセージに変換
 */

import {
  SlackMessage,
  SlackBlock,
  createHeaderBlock,
  createTextBlock,
  createFieldsBlock,
  createDividerBlock,
  createContextBlock,
} from './client'

// 数値フォーマット（カンマ区切り）
function formatNumber(num: number): string {
  return num.toLocaleString('ja-JP')
}

// パーセント変化のフォーマット
function formatChange(change: number): string {
  if (change > 0) return `+${change.toFixed(1)}%`
  if (change < 0) return `${change.toFixed(1)}%`
  return '±0%'
}

// 変化の絵文字
function getChangeEmoji(change: number, inverse = false): string {
  // inverse: trueの場合、下がることが良い（直帰率など）
  if (inverse) {
    if (change < -5) return '✅'
    if (change > 5) return '⚠️'
    return '➡️'
  }
  if (change > 5) return '📈'
  if (change < -5) return '📉'
  return '➡️'
}

export interface WeeklySummaryData {
  period: {
    startDate: string
    endDate: string
  }
  traffic: {
    sessions: number
    sessionsTrend: number
    users: number
    usersTrend: number
    pageviews: number
    pageviewsTrend: number
  }
  search: {
    impressions: number
    impressionsTrend: number
    clicks: number
    clicksTrend: number
    avgPosition: number
    positionTrend: number // マイナスが良い
  }
  conversions: {
    formSubmissions: number
    formTrend: number
    downloads: number
    downloadTrend: number
    labTransitionRate: number
    transitionTrend: number
  }
  topPages: Array<{
    path: string
    pageviews: number
  }>
}

export function formatWeeklySummary(data: WeeklySummaryData): SlackMessage {
  const { period, traffic, search, conversions, topPages } = data

  const blocks: SlackBlock[] = [
    createHeaderBlock('📊 週次アナリティクスレポート'),
    createContextBlock(`${period.startDate} 〜 ${period.endDate}`),
    createDividerBlock(),

    // トラフィック
    createTextBlock('*【トラフィック】*'),
    createFieldsBlock([
      {
        label: 'セッション',
        value: `${formatNumber(traffic.sessions)} (${getChangeEmoji(traffic.sessionsTrend)} ${formatChange(traffic.sessionsTrend)})`,
      },
      {
        label: 'ユーザー',
        value: `${formatNumber(traffic.users)} (${getChangeEmoji(traffic.usersTrend)} ${formatChange(traffic.usersTrend)})`,
      },
      {
        label: 'PV',
        value: `${formatNumber(traffic.pageviews)} (${getChangeEmoji(traffic.pageviewsTrend)} ${formatChange(traffic.pageviewsTrend)})`,
      },
    ]),

    createDividerBlock(),

    // 検索パフォーマンス
    createTextBlock('*【検索パフォーマンス】*'),
    createFieldsBlock([
      {
        label: '表示回数',
        value: `${formatNumber(search.impressions)} (${getChangeEmoji(search.impressionsTrend)} ${formatChange(search.impressionsTrend)})`,
      },
      {
        label: 'クリック数',
        value: `${formatNumber(search.clicks)} (${getChangeEmoji(search.clicksTrend)} ${formatChange(search.clicksTrend)})`,
      },
      {
        label: '平均掲載順位',
        value: `${search.avgPosition.toFixed(1)}位 (${getChangeEmoji(search.positionTrend, true)} ${search.positionTrend > 0 ? '↓' : '↑'}${Math.abs(search.positionTrend).toFixed(1)})`,
      },
    ]),

    createDividerBlock(),

    // コンバージョン
    createTextBlock('*【コンバージョン】*'),
    createFieldsBlock([
      {
        label: 'フォーム送信',
        value: `${formatNumber(conversions.formSubmissions)}件 (${getChangeEmoji(conversions.formTrend)} ${formatChange(conversions.formTrend)})`,
      },
      {
        label: '資料DL',
        value: `${formatNumber(conversions.downloads)}件 (${getChangeEmoji(conversions.downloadTrend)} ${formatChange(conversions.downloadTrend)})`,
      },
      {
        label: 'Lab遷移率',
        value: `${conversions.labTransitionRate.toFixed(1)}% (${getChangeEmoji(conversions.transitionTrend)} ${conversions.transitionTrend > 0 ? '+' : ''}${conversions.transitionTrend.toFixed(1)}pt)`,
      },
    ]),
  ]

  // Top記事
  if (topPages.length > 0) {
    blocks.push(createDividerBlock())
    blocks.push(createTextBlock('*【Top記事】*'))

    const topPagesText = topPages
      .slice(0, 5)
      .map((p, i) => `${i + 1}. \`${p.path}\` (${formatNumber(p.pageviews)} PV)`)
      .join('\n')

    blocks.push(createTextBlock(topPagesText))
  }

  blocks.push(createContextBlock('_このレポートは自動生成されています_'))

  return {
    text: `週次アナリティクスレポート (${period.startDate} 〜 ${period.endDate})`,
    blocks,
  }
}

export interface DailyAlertData {
  date: string
  sessions: number
  sessionsTrend: number // 前日比
  conversions: number
  conversionsTrend: number
  bounceRate: number
  alerts: Array<{
    type: 'warning' | 'critical'
    message: string
  }>
}

export function formatDailyAlert(data: DailyAlertData): SlackMessage {
  const { date, sessions, sessionsTrend, conversions, conversionsTrend, bounceRate, alerts } = data

  const blocks: SlackBlock[] = [
    createHeaderBlock(`📈 日次KPIサマリー`),
    createContextBlock(date),
    createDividerBlock(),

    createFieldsBlock([
      {
        label: 'セッション',
        value: `${formatNumber(sessions)} (前日比 ${getChangeEmoji(sessionsTrend)} ${formatChange(sessionsTrend)})`,
      },
      {
        label: 'CV数',
        value: `${conversions}件 (前日比 ${conversionsTrend >= 0 ? '+' : ''}${conversionsTrend})`,
      },
      {
        label: '直帰率',
        value: `${bounceRate.toFixed(1)}% (${bounceRate < 55 ? '正常' : bounceRate < 65 ? '注意' : '高い'})`,
      },
    ]),
  ]

  // アラート
  if (alerts.length > 0) {
    blocks.push(createDividerBlock())

    const alertText = alerts
      .map((a) => `${a.type === 'critical' ? '🚨' : '⚠️'} ${a.message}`)
      .join('\n')

    blocks.push(createTextBlock(`*【アラート】*\n${alertText}`))
  } else {
    blocks.push(createTextBlock('✅ *アラート: なし*'))
  }

  blocks.push(createContextBlock('_このレポートは自動生成されています_'))

  return {
    text: `日次KPIサマリー (${date}) - セッション: ${formatNumber(sessions)}, CV: ${conversions}件`,
    blocks,
  }
}

export interface AnomalyAlertData {
  detectedAt: string
  anomalies: Array<{
    metric: string
    currentValue: number
    expectedValue: number
    deviation: number // %
    severity: 'warning' | 'critical'
  }>
}

export function formatAnomalyAlert(data: AnomalyAlertData): SlackMessage {
  const { detectedAt, anomalies } = data

  if (anomalies.length === 0) {
    return {
      text: '異常検知: 問題なし',
      blocks: [
        createHeaderBlock('🔍 異常検知レポート'),
        createContextBlock(detectedAt),
        createTextBlock('✅ 現在、異常は検出されていません'),
      ],
    }
  }

  const blocks: SlackBlock[] = [
    createHeaderBlock('🚨 異常検知アラート'),
    createContextBlock(detectedAt),
    createDividerBlock(),
  ]

  anomalies.forEach((anomaly) => {
    const emoji = anomaly.severity === 'critical' ? '🔴' : '🟡'
    const direction = anomaly.deviation > 0 ? '上昇' : '下落'

    blocks.push(
      createTextBlock(
        `${emoji} *${anomaly.metric}*\n` +
          `現在値: ${formatNumber(anomaly.currentValue)} | 期待値: ${formatNumber(anomaly.expectedValue)}\n` +
          `乖離率: ${formatChange(anomaly.deviation)} (${direction})`
      )
    )
  })

  blocks.push(createDividerBlock())
  blocks.push(
    createContextBlock('_異常検知基準: 前週平均から±30%以上の乖離_')
  )

  return {
    text: `異常検知アラート: ${anomalies.length}件の異常を検出`,
    blocks,
  }
}
