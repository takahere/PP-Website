import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { SECTION_SYSTEM_PROMPT } from '@/lib/ai-writer/prompts'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 過去記事から文体サンプルを取得
async function getSampleArticles(): Promise<string> {
  const supabase = await createClient()

  // lab_articlesから最新5件を取得
  const { data: articles } = await supabase
    .from('lab_articles')
    .select('title, content_html')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(5)

  if (!articles || articles.length === 0) {
    return '（参照記事なし）'
  }

  // HTMLから最初の500文字を抽出
  return articles
    .map((a, i) => {
      const text = a.content_html
        ?.replace(/<[^>]*>/g, '') // HTMLタグ除去
        .replace(/\s+/g, ' ') // 連続空白を1つに
        .slice(0, 500)
      return `### サンプル${i + 1}: ${a.title}\n${text}...`
    })
    .join('\n\n')
}

export async function POST(req: Request) {
  try {
    const { heading, context, previousContent } = await req.json()

    if (!heading) {
      return new Response(
        JSON.stringify({ error: '見出しは必須です' }),
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

    const sampleArticles = await getSampleArticles()
    const systemPrompt = SECTION_SYSTEM_PROMPT(sampleArticles)

    const result = streamText({
      model: openai('gpt-4.1'),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `以下の見出しの本文を執筆してください。

## 見出し
${heading}

${context ? `## 記事全体の文脈\n${context}` : ''}

${previousContent ? `## 前のセクション（続きとして書く）\n${previousContent.slice(-500)}` : ''}

Markdownで本文のみを出力してください（見出しは含めない）。`,
        },
      ],
      maxOutputTokens: 1500,
      temperature: 0.7,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Section generation error:', error)
    return new Response(
      JSON.stringify({
        error: 'セクション生成に失敗しました',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

