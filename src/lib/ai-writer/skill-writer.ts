/**
 * Skill-based AI Writer
 *
 * Agent Skills アーキテクチャを活用した記事執筆支援モジュール
 * 既存のAI Writer APIとSkills Serviceを統合
 */

import {
  executeSkill,
  executeSkillStream,
  executeLabArticleWritingSkill,
  type SkillResult,
  type SkillContext,
} from '@/lib/agents/skills-service'

// アウトライン生成リクエスト
export interface OutlineRequest {
  keyword: string
  contentType?: 'research' | 'interview' | 'knowledge'
  additionalContext?: string
}

// アウトライン生成結果
export interface OutlineResult {
  success: boolean
  outline?: {
    title: string
    description: string
    outline: {
      level: 'h2' | 'h3'
      text: string
      keywords?: string[]
    }[]
  }
  error?: string
}

// セクション執筆リクエスト
export interface SectionRequest {
  heading: string
  outline?: string
  previousSections?: string
  context?: string
}

// セクション執筆結果
export interface SectionResult {
  success: boolean
  content?: string
  error?: string
}

// 内部リンク提案リクエスト
export interface InternalLinksRequest {
  content: string
  maxLinks?: number
}

// 内部リンク提案結果
export interface InternalLinksResult {
  success: boolean
  links?: {
    anchorText: string
    url: string
    articleTitle: string
    reason: string
    insertAfter?: string
  }[]
  error?: string
}

/**
 * スキルベースでアウトラインを生成
 * lab-article-writing スキルを使用
 */
export async function generateOutlineWithSkill(
  request: OutlineRequest
): Promise<OutlineResult> {
  const prompt = `
以下のキーワードでLab記事のアウトラインを生成してください。

## ターゲットキーワード
${request.keyword}

## 記事タイプ
${request.contentType || 'knowledge'}

${request.additionalContext ? `## 追加コンテキスト\n${request.additionalContext}` : ''}

以下のJSON形式で出力してください：
\`\`\`json
{
  "title": "SEOを意識した記事タイトル（40文字以内）",
  "description": "メタディスクリプション用の要約（120文字以内）",
  "outline": [
    {
      "level": "h2",
      "text": "見出しテキスト",
      "keywords": ["関連キーワード1", "関連キーワード2"]
    }
  ]
}
\`\`\`
`

  const result = await executeSkill('lab-article-writing', prompt, {
    contentType: 'lab_article',
  })

  if (!result.success) {
    return { success: false, error: result.error }
  }

  // レスポンスからJSONを抽出
  try {
    const responseText = result.data as string
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/)

    if (jsonMatch) {
      const outline = JSON.parse(jsonMatch[1])
      return { success: true, outline }
    }

    // JSONブロックがない場合は直接パースを試みる
    const outline = JSON.parse(responseText)
    return { success: true, outline }
  } catch {
    return {
      success: false,
      error: 'アウトラインのパースに失敗しました',
    }
  }
}

/**
 * スキルベースでセクションを執筆
 * lab-article-writing スキルを使用
 */
export async function generateSectionWithSkill(
  request: SectionRequest
): Promise<SectionResult> {
  const prompt = `
以下の見出しに対する本文を執筆してください。

## 見出し
${request.heading}

${request.outline ? `## 記事全体のアウトライン\n${request.outline}` : ''}

${request.previousSections ? `## 前のセクションの内容\n${request.previousSections}` : ''}

${request.context ? `## 追加コンテキスト\n${request.context}` : ''}

## 執筆ルール
- 専門用語は初出時に簡単な説明を入れる
- 箇条書きを適度に使って読みやすく
- 具体例や数字を盛り込む
- 「〜です」「〜ます」の丁寧語で統一
- 500〜800文字程度
- Markdown形式で出力

本文のみを出力してください。
`

  const result = await executeSkill('lab-article-writing', prompt, {
    contentType: 'lab_article',
    existingContent: request.previousSections,
  })

  if (!result.success) {
    return { success: false, error: result.error }
  }

  return {
    success: true,
    content: result.data as string,
  }
}

/**
 * スキルベースで内部リンクを提案
 * seo-optimization スキルを使用
 */
export async function suggestInternalLinksWithSkill(
  request: InternalLinksRequest
): Promise<InternalLinksResult> {
  const prompt = `
以下の記事本文に対して、内部リンクを挿入できる箇所を提案してください。

## 記事本文
${request.content}

## 条件
- 提案するリンクは${request.maxLinks || 5}個以内
- 関連性の高い記事のみ提案
- 同じ記事への重複リンクは避ける

以下のJSON形式で出力してください：
\`\`\`json
[
  {
    "anchorText": "リンクにするテキスト",
    "url": "/lab/記事のslug",
    "articleTitle": "リンク先記事のタイトル",
    "reason": "なぜこのリンクが適切か（1文）",
    "insertAfter": "挿入位置の目安（本文中のテキスト抜粋）"
  }
]
\`\`\`
`

  const result = await executeSkill('seo-optimization', prompt)

  if (!result.success) {
    return { success: false, error: result.error }
  }

  // レスポンスからJSONを抽出
  try {
    const responseText = result.data as string
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/)

    if (jsonMatch) {
      const links = JSON.parse(jsonMatch[1])
      return { success: true, links }
    }

    const links = JSON.parse(responseText)
    return { success: true, links }
  } catch {
    return {
      success: false,
      error: '内部リンク提案のパースに失敗しました',
    }
  }
}

/**
 * スキルベースで記事をレビュー
 * lab-article-writing スキルを使用
 */
export async function reviewArticleWithSkill(
  content: string,
  options?: {
    checkSeo?: boolean
    checkQuality?: boolean
    checkReadability?: boolean
  }
): Promise<SkillResult> {
  const checks = []
  if (options?.checkSeo !== false) checks.push('SEO')
  if (options?.checkQuality !== false) checks.push('品質')
  if (options?.checkReadability !== false) checks.push('読みやすさ')

  const prompt = `
以下の記事をレビューしてください。

## 記事本文
${content}

## チェック項目
${checks.map((c) => `- ${c}`).join('\n')}

## 出力形式
1. 総合スコア（100点満点）
2. 良い点
3. 改善が必要な点
4. 具体的な改善提案
`

  return executeLabArticleWritingSkill('review', {
    existingContent: content,
  })
}

/**
 * ストリーミングでセクションを執筆
 */
export async function* generateSectionStream(
  request: SectionRequest
): AsyncGenerator<{ type: 'content' | 'done' | 'error'; data: unknown }> {
  const prompt = `
以下の見出しに対する本文を執筆してください。

## 見出し
${request.heading}

${request.context ? `## コンテキスト\n${request.context}` : ''}

## 執筆ルール
- 専門用語は初出時に簡単な説明を入れる
- 箇条書きを適度に使って読みやすく
- 「〜です」「〜ます」の丁寧語で統一
- 500〜800文字程度

本文のみを出力してください。
`

  yield* executeSkillStream('lab-article-writing', prompt, {
    contentType: 'lab_article',
  })
}

/**
 * 既存のAI Writer APIと統合するためのラッパー
 * フォールバックとして既存APIを使用
 */
export async function generateWithFallback(
  type: 'outline' | 'section' | 'links',
  params: Record<string, unknown>,
  options?: { preferSkill?: boolean }
): Promise<SkillResult> {
  const useSkill = options?.preferSkill ?? true

  if (useSkill) {
    try {
      switch (type) {
        case 'outline':
          return await generateOutlineWithSkill(params as unknown as OutlineRequest)
            .then((r) => ({ success: r.success, data: r.outline, error: r.error }))

        case 'section':
          return await generateSectionWithSkill(params as unknown as SectionRequest)
            .then((r) => ({ success: r.success, data: r.content, error: r.error }))

        case 'links':
          return await suggestInternalLinksWithSkill(params as unknown as InternalLinksRequest)
            .then((r) => ({ success: r.success, data: r.links, error: r.error }))

        default:
          return { success: false, error: 'Unknown generation type' }
      }
    } catch (error) {
      console.error('Skill execution failed, falling back to API:', error)
      // フォールバック: 既存APIを呼び出す
    }
  }

  // 既存APIを呼び出す（フォールバック）
  try {
    const endpoint = `/api/ai-writer/${type}`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || 'API request failed' }
    }

    const data = await response.text()
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
