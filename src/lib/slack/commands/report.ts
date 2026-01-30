import { SlackSlashCommand, sendToResponseUrl } from '../verify'
import { createTextBlock, createHeaderBlock, createDividerBlock, createFieldsBlock } from '../client'

/**
 * /report コマンドハンドラー
 *
 * 使用方法:
 * - /report daily - 日次レポート
 * - /report weekly - 週次レポート
 * - /report help - ヘルプ表示
 */
export async function handleReportCommand(payload: SlackSlashCommand): Promise<{
  text: string
  blocks?: unknown[]
  response_type?: 'in_channel' | 'ephemeral'
}> {
  const subcommand = payload.text.trim().toLowerCase() || 'daily'

  if (subcommand === 'help') {
    return {
      text: '/report コマンドのヘルプ',
      blocks: [
        createHeaderBlock('📊 /report コマンド'),
        createTextBlock(
          '*使用方法:*\n' +
          '• `/report daily` - 日次KPIサマリーを表示\n' +
          '• `/report weekly` - 週次トラフィックサマリーを表示\n' +
          '• `/report help` - このヘルプを表示'
        ),
      ],
    }
  }

  // 即時レスポンス（処理中メッセージ）
  // 実際のデータ取得は非同期で行い、response_urlに送信
  setTimeout(async () => {
    try {
      const report = await generateReport(subcommand)
      await sendToResponseUrl(payload.response_url, {
        text: report.text,
        blocks: report.blocks,
        response_type: 'in_channel',
      })
    } catch (error) {
      await sendToResponseUrl(payload.response_url, {
        text: `エラーが発生しました: ${(error as Error).message}`,
      })
    }
  }, 0)

  return {
    text: `${subcommand === 'weekly' ? '週次' : '日次'}レポートを生成中... 🔄`,
  }
}

async function generateReport(type: string): Promise<{ text: string; blocks: unknown[] }> {
  // デモデータを使用（実際はAPIから取得）
  const now = new Date()
  const dateStr = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`

  if (type === 'weekly') {
    // 週次レポート
    const data = {
      sessions: 12345,
      sessionsTrend: 5.2,
      users: 8901,
      usersTrend: 3.1,
      pageviews: 34567,
      pageviewsTrend: 7.8,
      conversions: 45,
      conversionsTrend: 12.5,
    }

    const blocks = [
      createHeaderBlock('📈 週次アナリティクスサマリー'),
      createTextBlock(`*期間:* 過去7日間 (〜${dateStr})`),
      createDividerBlock(),
      createFieldsBlock([
        { label: 'セッション', value: `${data.sessions.toLocaleString()} (${data.sessionsTrend > 0 ? '+' : ''}${data.sessionsTrend}%)` },
        { label: 'ユーザー', value: `${data.users.toLocaleString()} (${data.usersTrend > 0 ? '+' : ''}${data.usersTrend}%)` },
        { label: 'ページビュー', value: `${data.pageviews.toLocaleString()} (${data.pageviewsTrend > 0 ? '+' : ''}${data.pageviewsTrend}%)` },
        { label: 'CV', value: `${data.conversions} (${data.conversionsTrend > 0 ? '+' : ''}${data.conversionsTrend}%)` },
      ]),
      createDividerBlock(),
      createTextBlock('_詳細はダッシュボードで確認してください_'),
    ]

    return {
      text: `週次レポート (${dateStr})`,
      blocks,
    }
  } else {
    // 日次レポート
    const data = {
      sessions: 1823,
      sessionsTrend: 8.5,
      users: 1456,
      pageviews: 4521,
      bounceRate: 45.2,
      conversions: 6,
    }

    const blocks = [
      createHeaderBlock('📊 日次KPIサマリー'),
      createTextBlock(`*日付:* ${dateStr}`),
      createDividerBlock(),
      createFieldsBlock([
        { label: 'セッション', value: `${data.sessions.toLocaleString()} (前日比 ${data.sessionsTrend > 0 ? '+' : ''}${data.sessionsTrend}%)` },
        { label: 'ユーザー', value: data.users.toLocaleString() },
        { label: 'ページビュー', value: data.pageviews.toLocaleString() },
        { label: '直帰率', value: `${data.bounceRate}%` },
      ]),
      createTextBlock(`*コンバージョン:* ${data.conversions}件`),
      createDividerBlock(),
      createTextBlock('_詳細はダッシュボードで確認してください_'),
    ]

    return {
      text: `日次KPIサマリー (${dateStr})`,
      blocks,
    }
  }
}
