/**
 * AIライターAPI 統合テスト
 *
 * 実際のOpenAI APIを呼び出してテストを行う
 * 環境変数 OPENAI_API_KEY が必要
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText, generateText } from 'ai'
import * as fs from 'fs'
import * as path from 'path'

// .env.local を手動で読み込む
function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value.replace(/^["']|["']$/g, '')
        }
      }
    })
  } catch {
    // .env.local がない場合はスキップ
  }
}

loadEnvFile()

// OpenAI クライアント
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// バリデーション関数
const validateKeyword = (keyword: string | undefined, maxLength = 200): string | null => {
  if (!keyword) return 'キーワードは必須です'
  if (keyword.length > maxLength) return `キーワードは${maxLength}文字以内で入力してください`
  return null
}

const validateHeading = (heading: string | undefined, maxLength = 500): string | null => {
  if (!heading) return '見出しは必須です'
  if (heading.length > maxLength) return `見出しは${maxLength}文字以内で入力してください`
  return null
}

const validateContent = (content: string | undefined, maxLength = 50000): string | null => {
  if (!content) return 'コンテンツは必須です'
  if (content.length > maxLength) return `コンテンツは${maxLength}文字以内で入力してください`
  return null
}

describe('AIライター 統合テスト', () => {
  beforeAll(() => {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OPENAI_API_KEY が設定されていません。API呼び出しテストはスキップされます。')
    }
  })

  describe('バリデーション', () => {
    it('キーワードが空の場合はエラー', () => {
      expect(validateKeyword('')).toBe('キーワードは必須です')
      expect(validateKeyword(undefined)).toBe('キーワードは必須です')
    })

    it('キーワードが200文字を超える場合はエラー', () => {
      const longKeyword = 'あ'.repeat(201)
      expect(validateKeyword(longKeyword)).toContain('200文字以内')
    })

    it('見出しが空の場合はエラー', () => {
      expect(validateHeading('')).toBe('見出しは必須です')
    })

    it('見出しが500文字を超える場合はエラー', () => {
      const longHeading = 'あ'.repeat(501)
      expect(validateHeading(longHeading)).toContain('500文字以内')
    })

    it('コンテンツが空の場合はエラー', () => {
      expect(validateContent('')).toBe('コンテンツは必須です')
    })

    it('コンテンツが50000文字を超える場合はエラー', () => {
      const longContent = 'あ'.repeat(50001)
      expect(validateContent(longContent)).toContain('50000文字以内')
    })
  })

  describe('OpenAI API呼び出し（gpt-4oモデル）', () => {
    it.skipIf(!process.env.OPENAI_API_KEY)('gpt-4oモデルで構成案を生成できる', async () => {
      const keyword = 'テスト'

      const result = streamText({
        model: openai('gpt-4o'),
        messages: [
          {
            role: 'user',
            content: `キーワード「${keyword}」について、簡単な構成案を1行で返してください。`,
          },
        ],
        maxTokens: 100,
        temperature: 0.7,
      })

      const response = await result.toTextStreamResponse()
      expect(response.status).toBe(200)
      expect(response.body).toBeDefined()
    }, 30000)

    it.skipIf(!process.env.OPENAI_API_KEY)('gpt-4oモデルでセクションを生成できる', async () => {
      const heading = 'テスト見出し'

      const result = streamText({
        model: openai('gpt-4o'),
        messages: [
          {
            role: 'user',
            content: `見出し「${heading}」について、1文で説明してください。`,
          },
        ],
        maxTokens: 100,
        temperature: 0.7,
      })

      const response = await result.toTextStreamResponse()
      expect(response.status).toBe(200)
    }, 30000)

    it.skipIf(!process.env.OPENAI_API_KEY)('gpt-4oモデルでリンク提案を生成できる', async () => {
      // generateTextはvitest環境でfetchの問題があるためstreamTextを使用
      const result = streamText({
        model: openai('gpt-4o'),
        messages: [
          {
            role: 'user',
            content: `以下のJSON配列形式で1つのリンク提案を返してください:
[{"anchorText": "テスト", "url": "/test", "reason": "テスト理由"}]`,
          },
        ],
        maxTokens: 200,
        temperature: 0.5,
      })

      const response = await result.toTextStreamResponse()
      expect(response.status).toBe(200)
      expect(response.body).toBeDefined()
    }, 30000)
  })

  describe('JSONパース処理', () => {
    const parseJsonArray = (text: string): { suggestions: unknown[], warning?: string } => {
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          return { suggestions: JSON.parse(jsonMatch[0]) }
        } else {
          return { suggestions: [] }
        }
      } catch {
        return {
          suggestions: [],
          warning: 'リンク提案のパースに失敗しました。再度お試しください。',
        }
      }
    }

    it('正常なJSON配列をパースできる', () => {
      const input = '[{"anchorText": "テスト", "url": "/test"}]'
      const result = parseJsonArray(input)
      expect(result.suggestions).toHaveLength(1)
      expect(result.warning).toBeUndefined()
    })

    it('マークダウン内のJSON配列をパースできる', () => {
      const input = '```json\n[{"url": "/test"}]\n```'
      const result = parseJsonArray(input)
      expect(result.suggestions).toHaveLength(1)
    })

    it('テキスト混在でもJSON配列をパースできる', () => {
      const input = 'リンク提案:\n[{"url": "/test"}]\n以上です。'
      const result = parseJsonArray(input)
      expect(result.suggestions).toHaveLength(1)
    })

    it('JSON配列がない場合は空配列', () => {
      const input = 'リンク提案はありません。'
      const result = parseJsonArray(input)
      expect(result.suggestions).toHaveLength(0)
    })

    it('不正なJSONはwarningを返す', () => {
      const input = '[{"url": "/test"]'
      const result = parseJsonArray(input)
      expect(result.suggestions).toHaveLength(0)
      expect(result.warning).toBeDefined()
    })
  })

  describe('ファイル内容検証', () => {
    it('全APIファイルでgpt-4oモデルを使用', async () => {
      const fs = await import('fs')
      const files = [
        'src/app/api/ai-writer/outline/route.ts',
        'src/app/api/ai-writer/section/route.ts',
        'src/app/api/ai-writer/links/route.ts',
      ]

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8')
        expect(content).not.toContain("openai('gpt-4.1')")
        expect(content).toContain("openai('gpt-4o')")
      }
    })

    it('AIWriterPanelにuseRefとエラーUIが実装されている', async () => {
      const fs = await import('fs')
      const content = fs.readFileSync('src/components/admin/AIWriterPanel.tsx', 'utf-8')

      // useRef実装
      expect(content).toContain('useRef')
      expect(content).toContain('activeSectionRef')
      expect(content).toContain('activeSectionRef.current')

      // エラーUI
      expect(content).toContain('AlertCircle')
      expect(content).toContain('const [error, setError]')
      expect(content).toContain('border-destructive')
    })

    it('Supabaseエラーハンドリングが実装されている', async () => {
      const fs = await import('fs')

      const sectionContent = fs.readFileSync('src/app/api/ai-writer/section/route.ts', 'utf-8')
      expect(sectionContent).toContain('error: articlesError')
      expect(sectionContent).toContain("console.error('Failed to fetch sample articles:'")

      const linksContent = fs.readFileSync('src/app/api/ai-writer/links/route.ts', 'utf-8')
      expect(linksContent).toContain('error: articlesError')
      expect(linksContent).toContain('記事データの取得に失敗しました')
    })

    it('入力バリデーションが実装されている', async () => {
      const fs = await import('fs')

      const outlineContent = fs.readFileSync('src/app/api/ai-writer/outline/route.ts', 'utf-8')
      expect(outlineContent).toContain('MAX_KEYWORD_LENGTH')
      expect(outlineContent).toContain('MAX_CONTEXT_LENGTH')

      const sectionContent = fs.readFileSync('src/app/api/ai-writer/section/route.ts', 'utf-8')
      expect(sectionContent).toContain('MAX_HEADING_LENGTH')
      expect(sectionContent).toContain('MAX_PREVIOUS_CONTENT_LENGTH')

      const linksContent = fs.readFileSync('src/app/api/ai-writer/links/route.ts', 'utf-8')
      expect(linksContent).toContain('MAX_CONTENT_LENGTH')
    })
  })
})
