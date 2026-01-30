import { NextRequest, NextResponse } from 'next/server'
import { verifySlackSignature, SlackSlashCommand, isSlackAppConfigured } from '@/lib/slack/verify'
import { handleReportCommand } from '@/lib/slack/commands/report'
import { handleStatusCommand } from '@/lib/slack/commands/status'
import { handleMetricsCommand } from '@/lib/slack/commands/metrics'

/**
 * Slack スラッシュコマンド API エンドポイント
 *
 * 対応コマンド:
 * - /report [daily|weekly|help] - レポート生成
 * - /status - システム状態確認
 * - /metrics [metric|help] - メトリクス取得
 */
export async function POST(request: NextRequest) {
  // Slack App 設定チェック
  if (!isSlackAppConfigured()) {
    return NextResponse.json(
      { text: 'Slack App が設定されていません。管理者に連絡してください。' },
      { status: 500 }
    )
  }

  // リクエストボディを取得
  const body = await request.text()

  // 署名検証
  const signature = request.headers.get('x-slack-signature') || ''
  const timestamp = request.headers.get('x-slack-request-timestamp') || ''

  if (!verifySlackSignature(signature, timestamp, body)) {
    console.error('Slack signature verification failed')
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    )
  }

  // ペイロードをパース
  const params = new URLSearchParams(body)
  const payload: SlackSlashCommand = {
    token: params.get('token') || '',
    team_id: params.get('team_id') || '',
    team_domain: params.get('team_domain') || '',
    channel_id: params.get('channel_id') || '',
    channel_name: params.get('channel_name') || '',
    user_id: params.get('user_id') || '',
    user_name: params.get('user_name') || '',
    command: params.get('command') || '',
    text: params.get('text') || '',
    response_url: params.get('response_url') || '',
    trigger_id: params.get('trigger_id') || '',
    api_app_id: params.get('api_app_id') || '',
  }

  try {
    let response: {
      text: string
      blocks?: unknown[]
      response_type?: 'in_channel' | 'ephemeral'
    }

    // コマンドに応じてハンドラーを呼び出し
    switch (payload.command) {
      case '/report':
        response = await handleReportCommand(payload)
        break

      case '/status':
        response = await handleStatusCommand(payload)
        break

      case '/metrics':
        response = await handleMetricsCommand(payload)
        break

      default:
        response = {
          text: `不明なコマンド: ${payload.command}`,
          response_type: 'ephemeral',
        }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Slack command error:', error)
    return NextResponse.json({
      text: `エラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
      response_type: 'ephemeral',
    })
  }
}

// Slack の URL 検証に対応
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
