import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { SECTION_SYSTEM_PROMPT, createEnhancedSectionPrompt } from '@/lib/ai-writer/prompts'
import { analyzeSuccessArticleStyles } from '@/lib/seo/style-analyzer'
import { getStyleSamples } from '@/lib/seo/success-article-service'
import { isGoogleConfigured, isGSCConfigured } from '@/lib/google-auth'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// バリデーション定数
const MAX_HEADING_LENGTH = 500
const MAX_CONTEXT_LENGTH = 5000
const MAX_PREVIOUS_CONTENT_LENGTH = 50000

// 過去記事から文体サンプルを取得（従来版）
async function getSampleArticles(): Promise<string> {
  const supabase = await createClient()

  // lab_articlesから最新5件を取得
  const { data: articles, error: articlesError } = await supabase
    .from('lab_articles')
    .select('title, content_html')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(5)

  if (articlesError) {
    console.error('Failed to fetch sample articles:', articlesError)
    // サンプルなしでも処理継続
  }

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

// SEOスコア上位の成功記事から文体サンプルを取得（強化版）
async function getEnhancedStyleData(category?: string): Promise<{
  systemPrompt: string
  isEnhanced: boolean
}> {
  try {
    // 成功記事の文体分析と文体サンプルを並列取得
    const [styleAnalysis, styleSamples] = await Promise.all([
      analyzeSuccessArticleStyles({ category }),
      getStyleSamples({ category, limit: 3 }),
    ])

    const systemPrompt = createEnhancedSectionPrompt({
      styleAnalysis: {
        avgParagraphLength: styleAnalysis.avgParagraphLength,
        avgSentenceLength: styleAnalysis.avgSentenceLength,
        bulletPointRate: styleAnalysis.bulletPointRate,
        sentenceEndingPatterns: styleAnalysis.sentenceEndingPatterns,
        commonPhrases: styleAnalysis.commonPhrases,
      },
      styleSamples: styleSamples.map(s => ({
        title: s.title,
        excerpt: s.excerpt,
        seoScore: s.seoScore,
      })),
    })

    return { systemPrompt, isEnhanced: true }
  } catch (error) {
    console.warn('Failed to get enhanced style data, falling back to default:', error)
    const sampleArticles = await getSampleArticles()
    return { systemPrompt: SECTION_SYSTEM_PROMPT(sampleArticles), isEnhanced: false }
  }
}

export async function POST(req: Request) {
  try {
    const { heading, context, previousContent, useEnhanced = true, category } = await req.json()

    if (!heading) {
      return new Response(
        JSON.stringify({ error: '見出しは必須です' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (heading.length > MAX_HEADING_LENGTH) {
      return new Response(
        JSON.stringify({ error: `見出しは${MAX_HEADING_LENGTH}文字以内で入力してください` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (context && context.length > MAX_CONTEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `コンテキストは${MAX_CONTEXT_LENGTH}文字以内で入力してください` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (previousContent && previousContent.length > MAX_PREVIOUS_CONTENT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `前のコンテンツは${MAX_PREVIOUS_CONTENT_LENGTH}文字以内で入力してください` }),
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

    // 強化版/従来版のプロンプトを取得
    let systemPrompt: string

    if (useEnhanced && (isGoogleConfigured() || isGSCConfigured())) {
      const { systemPrompt: enhancedPrompt } = await getEnhancedStyleData(category)
      systemPrompt = enhancedPrompt
    } else {
      const sampleArticles = await getSampleArticles()
      systemPrompt = SECTION_SYSTEM_PROMPT(sampleArticles)
    }

    const result = streamText({
      model: openai('gpt-4o'),
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

