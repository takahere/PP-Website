import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { OUTLINE_SYSTEM_PROMPT, createEnhancedOutlinePrompt } from '@/lib/ai-writer/prompts'
import { extractOutlinePatterns } from '@/lib/seo/pattern-extractor'
import { selectOptimalQueries } from '@/lib/seo/related-queries'
import { isGoogleConfigured, isGSCConfigured } from '@/lib/google-auth'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// バリデーション定数
const MAX_KEYWORD_LENGTH = 200
const MAX_CONTEXT_LENGTH = 5000

export async function POST(req: Request) {
  try {
    const { keyword, additionalContext, useEnhanced = true, category, contentType } = await req.json()

    if (!keyword) {
      return new Response(
        JSON.stringify({ error: 'キーワードは必須です' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (keyword.length > MAX_KEYWORD_LENGTH) {
      return new Response(
        JSON.stringify({ error: `キーワードは${MAX_KEYWORD_LENGTH}文字以内で入力してください` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (additionalContext && additionalContext.length > MAX_CONTEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `追加コンテキストは${MAX_CONTEXT_LENGTH}文字以内で入力してください` }),
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

    // 強化版プロンプトを生成
    let systemPrompt = OUTLINE_SYSTEM_PROMPT

    if (useEnhanced && (isGoogleConfigured() || isGSCConfigured())) {
      try {
        // 成功パターンと関連クエリを並列取得
        const [outlinePatterns, relatedQueries] = await Promise.all([
          extractOutlinePatterns({ category, contentType }),
          isGSCConfigured() ? selectOptimalQueries(keyword, { maxQueries: 10 }) : Promise.resolve([]),
        ])

        systemPrompt = createEnhancedOutlinePrompt({
          successPatterns: {
            avgH2Count: outlinePatterns.h2Structure.avgCount,
            avgWordCount: 3500, // 平均的な目安
            commonH2Patterns: outlinePatterns.h2Structure.commonPatterns.map(p => p.pattern),
            structureFlow: outlinePatterns.structureFlow,
          },
          relatedQueries: relatedQueries.map(q => ({
            query: q.query,
            impressions: q.impressions,
            position: q.position,
          })),
          sampleOutlines: outlinePatterns.sampleOutlines.map(s => ({
            title: s.title,
            outline: s.outline,
          })),
        })
      } catch (enhanceError) {
        console.warn('Failed to enhance outline prompt, using default:', enhanceError)
        // デフォルトプロンプトを使用
      }
    }

    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
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

