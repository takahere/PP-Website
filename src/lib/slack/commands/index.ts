/**
 * Slack スラッシュコマンドハンドラー
 *
 * 利用可能なコマンド:
 * - /report [daily|weekly|help] - レポート生成
 * - /status - システム状態確認
 * - /metrics [metric|help] - メトリクス取得
 *
 * Slack App設定 (api.slack.com):
 * 1. Slash Commands に登録:
 *    - /report: POST https://your-domain.com/api/slack/commands
 *    - /status: POST https://your-domain.com/api/slack/commands
 *    - /metrics: POST https://your-domain.com/api/slack/commands
 * 2. Interactivity & Shortcuts:
 *    - Request URL: https://your-domain.com/api/slack/interactions
 * 3. OAuth & Permissions:
 *    - Bot Token Scopes: commands, chat:write
 *
 * 必要な環境変数:
 * - SLACK_SIGNING_SECRET: Slack App の Signing Secret
 * - SLACK_BOT_TOKEN: Bot User OAuth Token (xoxb-xxx)
 */

export { handleReportCommand } from './report'
export { handleStatusCommand } from './status'
export { handleMetricsCommand } from './metrics'
