import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { OUTLINE_SYSTEM_PROMPT } from '@/lib/ai-writer/prompts'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { keyword, additionalContext } = await req.json()

    if (!keyword) {
      return new Response(
        JSON.stringify({ error: 'キーワードは必須です' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // OpenAI APIキーの確認
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'OpenAI API key is not configured',
          message: 'OPENAI_API_KEYを.env.localに設定してください',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const result = streamText({
      model: openai('gpt-4.1'),
      system: OUTLINE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `以下のSEOキーワードで記事の構成案を作成してください。

## ターゲットキーワード
${keyword}

${additionalContext ? `## 追加コンテキスト\n${additionalContext}` : ''}

JSONのみを出力してください。`,
        },
      ],
      maxOutputTokens: 2000,
      temperature: 0.7,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Outline generation error:', error)
    return new Response(
      JSON.stringify({
        error: '構成生成に失敗しました',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

