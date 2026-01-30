import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { image_url } = await req.json()

    if (!image_url) {
      return new Response(
        JSON.stringify({ error: '画像URLは必須です' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'OpenAI API key is not configured',
          message: 'OPENAI_API_KEYを.env.localに設定してください',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const result = await generateText({
      model: openai('gpt-4o'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `この画像の内容を説明するalt textを日本語で生成してください。

ルール:
- 50文字以内で簡潔に
- 画像の主な内容を客観的に説明
- 「画像」「写真」などの言葉は使わない
- 装飾的な画像の場合は空文字を返す

alt textのみを出力してください。他の説明は不要です。`,
            },
            {
              type: 'image',
              image: image_url,
            },
          ],
        },
      ],
      maxOutputTokens: 100,
      temperature: 0.3,
    })

    const altText = result.text.trim()

    return new Response(
      JSON.stringify({ alt_text: altText }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Alt text generation error:', error)
    return new Response(
      JSON.stringify({
        error: 'Alt text生成に失敗しました',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
