import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { INTERNAL_LINKS_SYSTEM_PROMPT } from '@/lib/ai-writer/prompts'

// スラッグ (category_id) から旧形式URL (/lab/category/id) を生成
function buildLabArticleUrl(slug: string): string {
  const lastUnderscoreIndex = slug.lastIndexOf('_')
  if (lastUnderscoreIndex !== -1) {
    const category = slug.substring(0, lastUnderscoreIndex)
    const id = slug.substring(lastUnderscoreIndex + 1)
    return `/lab/${category}/${id}`
  }
  return `/lab/${slug}`
}

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { content } = await req.json()

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'コンテンツは必須です' }),
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

    const supabase = await createClient()

    // 既存記事を取得
    const { data: articles } = await supabase
      .from('lab_articles')
      .select('slug, title, seo_description, categories, tags')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(50)

    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({ suggestions: [], message: '参照可能な記事がありません' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    const articleList = articles
      .map(
        (a) =>
          `- [${a.title}](${buildLabArticleUrl(a.slug)}) - ${a.seo_description || ''} (カテゴリ: ${a.categories?.join(', ') || 'なし'})`
      )
      .join('\n')

    const { text } = await generateText({
      model: openai('gpt-4.1'),
      system: INTERNAL_LINKS_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `## 現在執筆中の記事本文
${content.slice(0, 3000)}

## 既存記事リスト
${articleList}

内部リンクの提案をJSON配列で出力してください。`,
        },
      ],
      maxOutputTokens: 1000,
      temperature: 0.5,
    })

    // JSONをパース
    let suggestions = []
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.error('Failed to parse link suggestions:', text, parseError)
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Link suggestion error:', error)
    return new Response(
      JSON.stringify({
        error: 'リンク提案に失敗しました',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

