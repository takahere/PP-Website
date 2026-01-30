/**
 * Slack Webhook クライアント
 * Incoming Webhookを使用したSlack通知送信
 */

export interface SlackBlock {
  type: string
  text?: {
    type: string
    text: string
    emoji?: boolean
  }
  fields?: Array<{
    type: string
    text: string
  }>
  elements?: Array<{
    type: string
    text: string
    emoji?: boolean
  }>
  accessory?: {
    type: string
    text: {
      type: string
      text: string
      emoji?: boolean
    }
    url?: string
  }
}

export interface SlackMessage {
  text: string // フォールバックテキスト
  blocks?: SlackBlock[]
  attachments?: Array<{
    color?: string
    blocks?: SlackBlock[]
  }>
}

export function isSlackConfigured(): boolean {
  return !!process.env.SLACK_WEBHOOK_URL
}

export async function sendSlackMessage(message: SlackMessage): Promise<{
  success: boolean
  error?: string
}> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL

  if (!webhookUrl) {
    return {
      success: false,
      error: 'SLACK_WEBHOOK_URL is not configured',
    }
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `Slack API error: ${response.status} - ${errorText}`,
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ヘルパー: テキストブロック作成
export function createTextBlock(text: string): SlackBlock {
  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text,
    },
  }
}

// ヘルパー: ヘッダーブロック作成
export function createHeaderBlock(text: string): SlackBlock {
  return {
    type: 'header',
    text: {
      type: 'plain_text',
      text,
      emoji: true,
    },
  }
}

// ヘルパー: 区切り線ブロック作成
export function createDividerBlock(): SlackBlock {
  return {
    type: 'divider',
  }
}

// ヘルパー: フィールドブロック作成（2列レイアウト）
export function createFieldsBlock(
  fields: Array<{ label: string; value: string }>
): SlackBlock {
  return {
    type: 'section',
    fields: fields.map((f) => ({
      type: 'mrkdwn',
      text: `*${f.label}*\n${f.value}`,
    })),
  }
}

// ヘルパー: コンテキストブロック作成（小さい補足テキスト）
export function createContextBlock(text: string): SlackBlock {
  return {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text,
      },
    ],
  }
}
