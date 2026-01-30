import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `あなたはSEOの専門家です。与えられたタイトルと本文から、最適なメタディスクリプションを生成してください。

## 出力形式
以下のJSON形式で出力してください:
{
  "seo_description": "SEO用メタディスクリプション（120文字以内、検索結果に表示される説明文）",
  "og_description": "OG用ディスクリプション（80文字以内、SNSシェア時に表示される説明文）"
}

## ルール
- SEO descriptionは検索意図に応える内容を含め、クリックを促す文章に
- OG descriptionはSNSでシェアされた際に興味を引く簡潔な内容に
- 両方とも日本語で、自然な文章で書く
- JSONのみを出力し、他の説明は不要`

export async function POST(req: Request) {
  try {
    const { title, content_html } = await req.json()

    if (!title) {
      return new Response(
        JSON.stringify({ error: 'タイトルは必須です' }),
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

    // HTMLタグを除去してプレーンテキストに変換
    const plainText = content_html
      ? content_html.replace(/<[^>]*>/g, '').substring(0, 1500)
      : ''

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `## タイトル
${title}

## 本文（抜粋）
${plainText || '（本文なし）'}

上記の内容からメタディスクリプションを生成してください。JSONのみを出力してください。`,
        },
      ],
      maxOutputTokens: 500,
      temperature: 0.7,
    })

    // JSONをパース
    const text = result.text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    return new Response(
      JSON.stringify({
        seo_description: parsed.seo_description || '',
        og_description: parsed.og_description || '',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Meta generation error:', error)
    return new Response(
      JSON.stringify({
        error: 'メタ情報の生成に失敗しました',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
