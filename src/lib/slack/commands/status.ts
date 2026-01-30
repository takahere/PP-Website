import { SlackSlashCommand } from '../verify'
import { createTextBlock, createHeaderBlock, createDividerBlock, createContextBlock } from '../client'

/**
 * /status コマンドハンドラー
 *
 * システム状態と異常検知の状況を表示
 */
export async function handleStatusCommand(payload: SlackSlashCommand): Promise<{
  text: string
  blocks?: unknown[]
  response_type?: 'in_channel' | 'ephemeral'
}> {
  // デモデータ（実際はAPIから取得）
  const status = await getSystemStatus()

  const statusEmoji = status.healthStatus === 'healthy'
    ? '🟢'
    : status.healthStatus === 'warning'
    ? '🟡'
    : '🔴'

  const statusText = status.healthStatus === 'healthy'
    ? '正常'
    : status.healthStatus === 'warning'
    ? '警告あり'
    : '要対応'

  const blocks = [
    createHeaderBlock('🔍 システム状態'),
    createDividerBlock(),
    createTextBlock(
      `*ステータス:* ${statusEmoji} ${statusText}\n` +
      `*異常検知:* ${status.anomalyCount}件\n` +
      `*最終チェック:* ${status.lastChecked}`
    ),
  ]

  if (status.anomalies.length > 0) {
    blocks.push(createDividerBlock())
    blocks.push(createTextBlock('*検出された異常:*'))

    for (const anomaly of status.anomalies) {
      const severityEmoji = anomaly.severity === 'critical' ? '🔴' : '🟡'
      blocks.push(
        createTextBlock(
          `${severityEmoji} *${anomaly.metric}*: ${anomaly.description}`
        )
      )
    }
  }

  blocks.push(createDividerBlock())
  blocks.push(
    createContextBlock(
      `リクエスト by @${payload.user_name} | 詳細はダッシュボードで確認`
    )
  )

  return {
    text: `システム状態: ${statusText}`,
    blocks,
    response_type: 'ephemeral',
  }
}

interface SystemStatus {
  healthStatus: 'healthy' | 'warning' | 'critical'
  anomalyCount: number
  lastChecked: string
  anomalies: Array<{
    metric: string
    severity: 'warning' | 'critical'
    description: string
  }>
}

async function getSystemStatus(): Promise<SystemStatus> {
  // TODO: 実際のAPIから取得
  // const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/analytics/anomalies`)
  // const { data } = await response.json()

  // デモデータ
  return {
    healthStatus: 'warning',
    anomalyCount: 1,
    lastChecked: new Date().toLocaleString('ja-JP'),
    anomalies: [
      {
        metric: '直帰率',
        severity: 'warning',
        description: '58.5%で期待値48.2%から21.4%増加',
      },
    ],
  }
}
