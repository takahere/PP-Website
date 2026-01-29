/**
 * Skills Service
 *
 * Claude Agent SDK を使用してカスタムスキルを実行するサービス
 * .claude/skills/ ディレクトリのSKILL.mdファイルを読み込み、
 * スキルベースの処理を実行する
 */

import { query } from '@anthropic-ai/claude-agent-sdk'
import type { Options as ClaudeAgentOptions } from '@anthropic-ai/claude-agent-sdk'
import { promises as fs } from 'fs'
import path from 'path'

// スキル実行時のコンテキスト
export interface SkillContext {
  contentType?: 'lab_article' | 'post' | 'page' | 'member'
  currentSlug?: string
  existingContent?: string
  additionalData?: Record<string, unknown>
}

// スキル実行結果
export interface SkillResult {
  success: boolean
  data?: unknown
  error?: string
  sessionId?: string
}

// スキルメタデータ
export interface SkillMetadata {
  name: string
  description: string
}

// 利用可能なスキル名
export type SkillName =
  | 'content-management'
  | 'seo-optimization'
  | 'lab-article-writing'
  | 'database-operations'
  | 'analytics-assistant'
  | 'data-analysis'

// スキルのベースパス
const SKILLS_BASE_PATH = path.join(process.cwd(), '.claude', 'skills')

/**
 * SKILL.md ファイルからスキルプロンプトを読み込む
 */
async function loadSkillPrompt(skillName: SkillName): Promise<string | null> {
  const skillPath = path.join(SKILLS_BASE_PATH, skillName, 'SKILL.md')

  try {
    const content = await fs.readFile(skillPath, 'utf-8')

    // YAMLフロントマターを除去してMarkdown本文を取得
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
    if (frontmatterMatch) {
      return frontmatterMatch[2].trim()
    }

    return content
  } catch (error) {
    console.error(`Failed to load skill: ${skillName}`, error)
    return null
  }
}

/**
 * スキルメタデータを取得
 */
async function getSkillMetadata(skillName: SkillName): Promise<SkillMetadata | null> {
  const skillPath = path.join(SKILLS_BASE_PATH, skillName, 'SKILL.md')

  try {
    const content = await fs.readFile(skillPath, 'utf-8')

    // YAMLフロントマターをパース
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
    if (frontmatterMatch) {
      const yaml = frontmatterMatch[1]
      const nameMatch = yaml.match(/name:\s*(.+)/)
      const descMatch = yaml.match(/description:\s*(.+)/)

      return {
        name: nameMatch ? nameMatch[1].trim() : skillName,
        description: descMatch ? descMatch[1].trim() : '',
      }
    }

    return { name: skillName, description: '' }
  } catch {
    return null
  }
}

/**
 * 利用可能なスキル一覧を取得
 */
export async function listAvailableSkills(): Promise<SkillMetadata[]> {
  const skills: SkillMetadata[] = []

  try {
    const entries = await fs.readdir(SKILLS_BASE_PATH, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const metadata = await getSkillMetadata(entry.name as SkillName)
        if (metadata) {
          skills.push(metadata)
        }
      }
    }
  } catch (error) {
    console.error('Failed to list skills:', error)
  }

  return skills
}

/**
 * スキルを実行する
 *
 * @param skillName - 実行するスキル名
 * @param userPrompt - ユーザーからのリクエスト
 * @param context - 追加のコンテキスト情報
 * @returns スキル実行結果
 */
export async function executeSkill(
  skillName: SkillName,
  userPrompt: string,
  context?: SkillContext
): Promise<SkillResult> {
  const skillPrompt = await loadSkillPrompt(skillName)

  if (!skillPrompt) {
    return {
      success: false,
      error: `Skill not found: ${skillName}`,
    }
  }

  // システムプロンプトを構築
  const systemPrompt = `${skillPrompt}

## 現在のコンテキスト
${context ? JSON.stringify(context, null, 2) : 'コンテキストなし'}

## 重要な指示
- すべての応答は日本語で行ってください
- 具体的で実行可能な提案を行ってください
- エラーが発生した場合は原因と対処法を説明してください`

  try {
    const agentOptions: ClaudeAgentOptions = {
      systemPrompt,
      maxTurns: 5,
    }

    let result = ''
    let sessionId: string | undefined

    for await (const message of query({
      prompt: userPrompt,
      options: agentOptions,
    })) {
      // セッションID取得
      if ('type' in message && message.type === 'system') {
        if ('subtype' in message && message.subtype === 'init') {
          sessionId = (message as { session_id?: string }).session_id
        }
      }

      // テキストコンテンツ取得
      if ('content' in message && typeof message.content === 'string') {
        result += message.content
      }

      // 結果取得
      if ('type' in message && message.type === 'result') {
        if ('result' in message) {
          result += (message as { result: string }).result
        }
      }
    }

    return {
      success: true,
      data: result,
      sessionId,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * スキルをストリーミング実行する
 *
 * @param skillName - 実行するスキル名
 * @param userPrompt - ユーザーからのリクエスト
 * @param context - 追加のコンテキスト情報
 * @yields スキル実行中のイベント
 */
export async function* executeSkillStream(
  skillName: SkillName,
  userPrompt: string,
  context?: SkillContext
): AsyncGenerator<{ type: 'content' | 'done' | 'error'; data: unknown }> {
  const skillPrompt = await loadSkillPrompt(skillName)

  if (!skillPrompt) {
    yield {
      type: 'error',
      data: { message: `Skill not found: ${skillName}` },
    }
    return
  }

  const systemPrompt = `${skillPrompt}

## 現在のコンテキスト
${context ? JSON.stringify(context, null, 2) : 'コンテキストなし'}

## 重要な指示
- すべての応答は日本語で行ってください
- 具体的で実行可能な提案を行ってください`

  try {
    const agentOptions: ClaudeAgentOptions = {
      systemPrompt,
      maxTurns: 5,
    }

    for await (const message of query({
      prompt: userPrompt,
      options: agentOptions,
    })) {
      if ('content' in message && typeof message.content === 'string') {
        yield { type: 'content', data: message.content }
      }

      if ('type' in message && message.type === 'result') {
        if ('result' in message) {
          yield { type: 'content', data: (message as { result: string }).result }
        }
      }
    }

    yield { type: 'done', data: {} }
  } catch (error) {
    yield {
      type: 'error',
      data: { message: error instanceof Error ? error.message : 'Unknown error' },
    }
  }
}

/**
 * コンテンツ管理スキルを実行
 */
export async function executeContentManagementSkill(
  action: 'create' | 'edit' | 'delete' | 'list',
  params: {
    contentType: 'lab_article' | 'post' | 'page'
    slug?: string
    title?: string
    content?: string
  }
): Promise<SkillResult> {
  const prompt = `
コンテンツ管理アクション: ${action}

パラメータ:
- コンテンツタイプ: ${params.contentType}
${params.slug ? `- スラッグ: ${params.slug}` : ''}
${params.title ? `- タイトル: ${params.title}` : ''}

${action === 'create' ? '新規コンテンツを作成するための手順を教えてください。' : ''}
${action === 'edit' ? 'このコンテンツを編集するための手順を教えてください。' : ''}
${action === 'list' ? 'このタイプのコンテンツ一覧を取得する方法を教えてください。' : ''}
`

  return executeSkill('content-management', prompt, {
    contentType: params.contentType,
    currentSlug: params.slug,
    existingContent: params.content,
  })
}

/**
 * SEO最適化スキルを実行
 */
export async function executeSeoOptimizationSkill(
  action: 'audit' | 'improve' | 'redirect',
  params: {
    slug?: string
    url?: string
    targetUrl?: string
  }
): Promise<SkillResult> {
  const prompt = `
SEOアクション: ${action}

${params.slug ? `対象スラッグ: ${params.slug}` : ''}
${params.url ? `対象URL: ${params.url}` : ''}
${params.targetUrl ? `リダイレクト先: ${params.targetUrl}` : ''}

${action === 'audit' ? 'このコンテンツのSEO監査を実行してください。' : ''}
${action === 'improve' ? 'このコンテンツのSEOを改善する提案をしてください。' : ''}
${action === 'redirect' ? 'リダイレクト設定の手順を教えてください。' : ''}
`

  return executeSkill('seo-optimization', prompt, {
    currentSlug: params.slug,
  })
}

/**
 * Lab記事執筆スキルを実行
 */
export async function executeLabArticleWritingSkill(
  action: 'outline' | 'section' | 'review',
  params: {
    keyword?: string
    contentType?: 'research' | 'interview' | 'knowledge'
    heading?: string
    existingContent?: string
  }
): Promise<SkillResult> {
  const prompt = `
Lab記事執筆アクション: ${action}

${params.keyword ? `キーワード: ${params.keyword}` : ''}
${params.contentType ? `記事タイプ: ${params.contentType}` : ''}
${params.heading ? `見出し: ${params.heading}` : ''}

${action === 'outline' ? 'この記事のアウトラインを作成してください。' : ''}
${action === 'section' ? 'この見出しの本文を執筆してください。' : ''}
${action === 'review' ? 'この記事の品質レビューを行ってください。' : ''}
`

  return executeSkill('lab-article-writing', prompt, {
    contentType: 'lab_article',
    existingContent: params.existingContent,
  })
}
