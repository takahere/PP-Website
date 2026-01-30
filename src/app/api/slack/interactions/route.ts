import { NextRequest, NextResponse } from 'next/server'
import { verifySlackSignature, SlackInteraction, isSlackAppConfigured, sendToResponseUrl } from '@/lib/slack/verify'
import { createTextBlock, createHeaderBlock, createDividerBlock } from '@/lib/slack/client'

/**
 * Slack インタラクション API エンドポイント
 *
 * ボタンクリック、セレクトメニュー選択、モーダル送信などを処理
 */
export async function POST(request: NextRequest) {
  // Slack App 設定チェック
  if (!isSlackAppConfigured()) {
    return NextResponse.json(
      { text: 'Slack App が設定されていません。' },
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

  // インタラクションペイロードをパース
  const params = new URLSearchParams(body)
  const payloadStr = params.get('payload')

  if (!payloadStr) {
    return NextResponse.json(
      { error: 'Missing payload' },
      { status: 400 }
    )
  }

  let payload: SlackInteraction

  try {
    payload = JSON.parse(payloadStr)
  } catch {
    return NextResponse.json(
      { error: 'Invalid payload' },
      { status: 400 }
    )
  }

  try {
    // インタラクションタイプに応じて処理
    switch (payload.type) {
      case 'block_actions':
        await handleBlockActions(payload)
        break

      case 'view_submission':
        await handleViewSubmission(payload)
        break

      case 'shortcut':
        await handleShortcut(payload)
        break

      default:
        console.log(`Unknown interaction type: ${payload.type}`)
    }

    // 即時レスポンス（200 OK を返す）
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error('Slack interaction error:', error)
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    )
  }
}

/**
 * ブロックアクション（ボタン、セレクトメニューなど）の処理
 */
async function handleBlockActions(payload: SlackInteraction): Promise<void> {
  if (!payload.actions || payload.actions.length === 0) {
    return
  }

  for (const action of payload.actions) {
    switch (action.action_id) {
      case 'view_dashboard':
        await sendDashboardLink(payload)
        break

      case 'refresh_metrics':
        await sendRefreshedMetrics(payload)
        break

      case 'download_report':
        await sendReportDownloadLink(payload)
        break

      default:
        console.log(`Unknown action_id: ${action.action_id}`)
    }
  }
}

/**
 * ビュー送信（モーダルフォーム送信）の処理
 */
async function handleViewSubmission(payload: SlackInteraction): Promise<void> {
  if (!payload.view) {
    return
  }

  switch (payload.view.callback_id) {
    case 'report_settings':
      // レポート設定の保存処理
      console.log('Report settings submitted:', payload.view.state.values)
      break

    case 'alert_settings':
      // アラート設定の保存処理
      console.log('Alert settings submitted:', payload.view.state.values)
      break

    default:
      console.log(`Unknown callback_id: ${payload.view.callback_id}`)
  }
}

/**
 * ショートカットの処理
 */
async function handleShortcut(payload: SlackInteraction): Promise<void> {
  // グローバルショートカットやメッセージショートカットの処理
  console.log('Shortcut triggered:', payload.trigger_id)
}

/**
 * ダッシュボードリンクを送信
 */
async function sendDashboardLink(payload: SlackInteraction): Promise<void> {
  if (!payload.response_url) return

  const dashboardUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://partner-prop.com'

  await sendToResponseUrl(payload.response_url, {
    text: 'ダッシュボードへのリンク',
    blocks: [
      createHeaderBlock('📊 ダッシュボード'),
      createTextBlock(`<${dashboardUrl}/admin/analytics|ダッシュボードを開く>`),
    ],
  })
}

/**
 * 更新されたメトリクスを送信
 */
async function sendRefreshedMetrics(payload: SlackInteraction): Promise<void> {
  if (!payload.response_url) return

  // デモデータ（実際はAPIから取得）
  const now = new Date()
  const dateStr = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`

  await sendToResponseUrl(payload.response_url, {
    text: 'メトリクスを更新しました',
    blocks: [
      createHeaderBlock('🔄 メトリクス更新'),
      createTextBlock(`*更新時刻:* ${dateStr}`),
      createDividerBlock(),
      createTextBlock(
        '*セッション:* 1,856 (+2.3%)\n' +
        '*ユーザー:* 1,478 (+1.5%)\n' +
        '*ページビュー:* 4,612 (+2.0%)'
      ),
    ],
  })
}

/**
 * レポートダウンロードリンクを送信
 */
async function sendReportDownloadLink(payload: SlackInteraction): Promise<void> {
  if (!payload.response_url) return

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://partner-prop.com'

  await sendToResponseUrl(payload.response_url, {
    text: 'レポートダウンロード',
    blocks: [
      createHeaderBlock('📥 レポートダウンロード'),
      createTextBlock(
        `CSVレポートをダウンロード:\n` +
        `<${baseUrl}/api/reports/generate?format=csv|📊 日次レポート (CSV)>`
      ),
    ],
  })
}
