import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `あなたはコンテンツ品質評価の専門家です。与えられた記事のタイトルと本文を分析し、品質スコアと改善提案を提供してください。

## 出力形式
以下のJSON形式で出力してください:
{
  "overall_score": 78,
  "categories": {
    "readability": {
      "score": 80,
      "label": "読みやすさ",
      "status": "good",
      "feedback": "文章が適度な長さで読みやすいです"
    },
    "seo": {
      "score": 65,
      "label": "SEO",
      "status": "warning",
      "feedback": "メタディスクリプションが設定されていません"
    },
    "content_length": {
      "score": 90,
      "label": "コンテンツ量",
      "status": "good",
      "feedback": "十分な文字数があります"
    },
    "structure": {
      "score": 70,
      "label": "構造",
      "status": "warning",
      "feedback": "見出しの階層構造を整理するとより良くなります"
    }
  },
  "suggestions": [
    "メタディスクリプションを追加してください",
    "見出しにキーワードを含めると検索順位が向上します"
  ]
}

## 評価基準
- readability（読みやすさ）: 文の長さ、漢字率、専門用語の使用頻度
- seo: タイトル長（30-60文字推奨）、meta有無、キーワード配置
- content_length: 文字数（2000-5000文字推奨）
- structure: 見出し構造、段落分け、リスト活用

## statusの基準
- "good": スコア80以上
- "warning": スコア60-79
- "error": スコア59以下

## ルール
- overall_scoreは4カテゴリの平均（0-100）
- 具体的で実行可能な改善提案を3つ以内で
- JSONのみを出力し、他の説明は不要`

export async function POST(req: Request) {
  try {
    const { title, content_html, seo_description, og_description } = await req.json()

    if (!title && !content_html) {
      return new Response(
        JSON.stringify({ error: 'タイトルまたは本文は必須です' }),
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
      ? content_html.replace(/<[^>]*>/g, '').substring(0, 3000)
      : ''

    // 見出し構造を抽出
    const headings = content_html
      ? (content_html.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [])
          .map((h: string) => h.replace(/<[^>]*>/g, ''))
          .slice(0, 10)
      : []

    // リンク数をカウント
    const linkCount = content_html
      ? (content_html.match(/<a\s/gi) || []).length
      : 0

    // 文字数をカウント
    const charCount = plainText.length

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `## タイトル
${title || '（未設定）'}

## 本文（抜粋）
${plainText || '（本文なし）'}

## メタ情報
- SEO description: ${seo_description || '（未設定）'}
- OG description: ${og_description || '（未設定）'}

## 構造情報
- 文字数: ${charCount}文字
- 見出し: ${headings.length > 0 ? headings.join(' / ') : 'なし'}
- リンク数: ${linkCount}件

上記の記事内容を分析し、品質スコアと改善提案を提供してください。JSONのみを出力してください。`,
        },
      ],
      maxOutputTokens: 800,
      temperature: 0.3,
    })

    // JSONをパース
    const text = result.text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // 基本的な統計情報も追加
    return new Response(
      JSON.stringify({
        ...parsed,
        stats: {
          char_count: charCount,
          heading_count: headings.length,
          link_count: linkCount,
          has_seo_description: !!seo_description,
          has_og_description: !!og_description,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Content quality analysis error:', error)
    return new Response(
      JSON.stringify({
        error: 'コンテンツ品質分析に失敗しました',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
