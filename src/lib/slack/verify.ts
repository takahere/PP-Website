import crypto from 'crypto'

/**
 * Slack署名検証
 *
 * Slackからのリクエストが正当なものかを検証
 * https://api.slack.com/authentication/verifying-requests-from-slack
 */

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET

/**
 * Slackリクエストの署名を検証
 *
 * @param signature - X-Slack-Signature ヘッダーの値
 * @param timestamp - X-Slack-Request-Timestamp ヘッダーの値
 * @param body - リクエストボディ（文字列）
 * @returns 署名が有効な場合 true
 */
export function verifySlackSignature(
  signature: string,
  timestamp: string,
  body: string
): boolean {
  if (!SLACK_SIGNING_SECRET) {
    console.error('SLACK_SIGNING_SECRET is not configured')
    return false
  }

  // タイムスタンプが5分以上古い場合はリプレイ攻撃の可能性
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5
  if (parseInt(timestamp) < fiveMinutesAgo) {
    console.error('Slack request timestamp is too old')
    return false
  }

  // 署名を計算
  const sigBasestring = `v0:${timestamp}:${body}`
  const hmac = crypto.createHmac('sha256', SLACK_SIGNING_SECRET)
  hmac.update(sigBasestring)
  const calculatedSignature = `v0=${hmac.digest('hex')}`

  // タイミング攻撃を防ぐために timingSafeEqual を使用
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    )
  } catch (err) {
    console.error('Signature verification failed:', err)
    return false
  }
}

/**
 * Slack設定が完了しているかチェック
 */
export function isSlackAppConfigured(): boolean {
  return !!(
    process.env.SLACK_SIGNING_SECRET &&
    process.env.SLACK_BOT_TOKEN
  )
}

/**
 * スラッシュコマンドのペイロード型
 */
export interface SlackSlashCommand {
  token: string
  team_id: string
  team_domain: string
  channel_id: string
  channel_name: string
  user_id: string
  user_name: string
  command: string
  text: string
  response_url: string
  trigger_id: string
  api_app_id: string
}

/**
 * インタラクションのペイロード型
 */
export interface SlackInteraction {
  type: 'block_actions' | 'view_submission' | 'shortcut'
  user: {
    id: string
    username: string
    name: string
    team_id: string
  }
  api_app_id: string
  team: {
    id: string
    domain: string
  }
  channel?: {
    id: string
    name: string
  }
  trigger_id: string
  response_url?: string
  actions?: SlackAction[]
  view?: SlackView
}

export interface SlackAction {
  action_id: string
  block_id: string
  type: string
  value?: string
  selected_option?: {
    text: { type: string; text: string }
    value: string
  }
}

export interface SlackView {
  id: string
  type: string
  callback_id: string
  state: {
    values: Record<string, Record<string, { value?: string; selected_option?: { value: string } }>>
  }
}

/**
 * レスポンスURLに非同期でメッセージを送信
 */
export async function sendToResponseUrl(
  responseUrl: string,
  message: { text: string; blocks?: unknown[]; response_type?: 'in_channel' | 'ephemeral' }
): Promise<void> {
  await fetch(responseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      response_type: message.response_type || 'ephemeral',
      text: message.text,
      blocks: message.blocks,
    }),
  })
}
