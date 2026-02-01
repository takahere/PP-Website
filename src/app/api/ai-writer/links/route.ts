import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { INTERNAL_LINKS_SYSTEM_PROMPT, createEnhancedLinksPrompt } from '@/lib/ai-writer/prompts'
import { calculateAllArticleSEOScores, generateDemoSEOScores } from '@/lib/seo/scoring-service'
import { isGoogleConfigured, isGSCConfigured } from '@/lib/google-auth'

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

// バリデーション定数
const MAX_CONTENT_LENGTH = 50000

export async function POST(req: Request) {
  try {
    const { content, useEnhanced = true } = await req.json()

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'コンテンツは必須です' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `コンテンツは${MAX_CONTENT_LENGTH}文字以内で入力してください` }),
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
    const { data: articles, error: articlesError } = await supabase
      .from('lab_articles')
      .select('slug, title, seo_description, categories, tags')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(50)

    if (articlesError) {
      console.error('Failed to fetch articles:', articlesError)
      return new Response(
        JSON.stringify({ suggestions: [], error: '記事データの取得に失敗しました' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({ suggestions: [], message: '参照可能な記事がありません' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // SEOスコアを取得（強化版の場合）
    const articleScores: Map<string, { seoScore: number; rank: string }> = new Map()
    let systemPrompt = INTERNAL_LINKS_SYSTEM_PROMPT

    if (useEnhanced) {
      try {
        const scores = (isGoogleConfigured() && isGSCConfigured())
          ? await calculateAllArticleSEOScores()
          : generateDemoSEOScores()

        scores.forEach((score) => {
          articleScores.set(score.slug, { seoScore: score.seoScore, rank: score.rank })
        })

        systemPrompt = createEnhancedLinksPrompt({
          articleScores: scores.slice(0, 30).map((s) => ({
            slug: s.slug,
            title: s.title,
            seoScore: s.seoScore,
            rank: s.rank,
          })),
        })
      } catch (error) {
        console.warn('Failed to get SEO scores, using default prompt:', error)
      }
    }

    // 記事リストを生成（SEOスコア付きの場合）
    const articleList = articles
      .map((a) => {
        const scoreData = articleScores.get(a.slug)
        const scoreInfo = scoreData ? ` [SEOスコア: ${scoreData.seoScore}, ランク: ${scoreData.rank}]` : ''
        return `- [${a.title}](${buildLabArticleUrl(a.slug)})${scoreInfo} - ${a.seo_description || ''} (カテゴリ: ${a.categories?.join(', ') || 'なし'})`
      })
      // SEOスコアでソート（高い順）
      .sort((a, b) => {
        const scoreA = a.match(/SEOスコア: (\d+)/)?.[1] || '0'
        const scoreB = b.match(/SEOスコア: (\d+)/)?.[1] || '0'
        return parseInt(scoreB) - parseInt(scoreA)
      })
      .join('\n')

    const { text } = await generateText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `## 現在執筆中の記事本文
${content.slice(0, 3000)}

## 既存記事リスト（SEOスコア順）
${articleList}

内部リンクの提案をJSON配列で出力してください。高SEOスコアの記事を優先的に提案してください。`,
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
      } else {
        console.warn('No JSON array found in response:', text.slice(0, 200))
      }
    } catch (parseError) {
      console.error('Failed to parse link suggestions:', text.slice(0, 200), parseError)
      return new Response(
        JSON.stringify({
          suggestions: [],
          warning: 'リンク提案のパースに失敗しました。再度お試しください。',
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
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

