import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `あなたはコンテンツ分析の専門家です。与えられた記事のタイトルと本文を分析し、最も適切なカテゴリとタグを提案してください。

## 出力形式
以下のJSON形式で出力してください:
{
  "suggested_categories": ["カテゴリ名1", "カテゴリ名2"],
  "suggested_tags": ["タグ名1", "タグ名2", "タグ名3"],
  "reasoning": "提案理由の簡潔な説明"
}

## ルール
- 提供された選択肢リストから選ぶこと（リストにないものは提案しない）
- カテゴリは1〜3個、タグは1〜5個を提案
- 記事の主題に最も関連性の高いものを優先
- JSONのみを出力し、他の説明は不要`

export async function POST(req: Request) {
  try {
    const { title, content_html, available_categories, available_tags } = await req.json()

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

    // HTMLタグを除去
    const plainText = content_html
      ? content_html.replace(/<[^>]*>/g, '').substring(0, 2000)
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

## 選択可能なカテゴリ
${(available_categories || []).join(', ') || 'なし'}

## 選択可能なタグ
${(available_tags || []).join(', ') || 'なし'}

上記の記事内容を分析し、最も適切なカテゴリとタグを提案してください。JSONのみを出力してください。`,
        },
      ],
      maxOutputTokens: 500,
      temperature: 0.5,
    })

    // JSONをパース
    const text = result.text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // 提供されたリストに存在するもののみをフィルタリング
    const validCategories = (parsed.suggested_categories || []).filter(
      (cat: string) => (available_categories || []).includes(cat)
    )
    const validTags = (parsed.suggested_tags || []).filter(
      (tag: string) => (available_tags || []).includes(tag)
    )

    return new Response(
      JSON.stringify({
        suggested_categories: validCategories,
        suggested_tags: validTags,
        reasoning: parsed.reasoning || '',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Tag suggestion error:', error)
    return new Response(
      JSON.stringify({
        error: 'タグ提案の生成に失敗しました',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
