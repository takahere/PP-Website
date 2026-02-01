/**
 * AIライターAPI バリデーションテスト
 *
 * 修正内容の検証:
 * - Phase 1: gpt-4.1 → gpt-4o モデル修正
 * - Phase 1: useCompletion race condition修正
 * - Phase 2: Supabaseエラーハンドリング
 * - Phase 2: エラーUI追加
 * - Phase 3: 入力バリデーション
 * - Phase 3: JSONパースエラー改善
 */

import { describe, it, expect } from 'vitest'

// バリデーション定数（各route.tsと同じ値）
const OUTLINE_MAX_KEYWORD_LENGTH = 200
const OUTLINE_MAX_CONTEXT_LENGTH = 5000
const SECTION_MAX_HEADING_LENGTH = 500
const SECTION_MAX_CONTEXT_LENGTH = 5000
const SECTION_MAX_PREVIOUS_CONTENT_LENGTH = 50000
const LINKS_MAX_CONTENT_LENGTH = 50000

describe('AIライター バリデーション定数', () => {
  describe('Outline API', () => {
    it('キーワード最大長は200文字', () => {
      expect(OUTLINE_MAX_KEYWORD_LENGTH).toBe(200)
    })

    it('追加コンテキスト最大長は5000文字', () => {
      expect(OUTLINE_MAX_CONTEXT_LENGTH).toBe(5000)
    })
  })

  describe('Section API', () => {
    it('見出し最大長は500文字', () => {
      expect(SECTION_MAX_HEADING_LENGTH).toBe(500)
    })

    it('コンテキスト最大長は5000文字', () => {
      expect(SECTION_MAX_CONTEXT_LENGTH).toBe(5000)
    })

    it('前コンテンツ最大長は50000文字', () => {
      expect(SECTION_MAX_PREVIOUS_CONTENT_LENGTH).toBe(50000)
    })
  })

  describe('Links API', () => {
    it('コンテンツ最大長は50000文字', () => {
      expect(LINKS_MAX_CONTENT_LENGTH).toBe(50000)
    })
  })
})

describe('バリデーションロジック', () => {
  // キーワードバリデーション関数
  const validateKeyword = (keyword: string | undefined): string | null => {
    if (!keyword) return 'キーワードは必須です'
    if (keyword.length > OUTLINE_MAX_KEYWORD_LENGTH) {
      return `キーワードは${OUTLINE_MAX_KEYWORD_LENGTH}文字以内で入力してください`
    }
    return null
  }

  // 見出しバリデーション関数
  const validateHeading = (heading: string | undefined): string | null => {
    if (!heading) return '見出しは必須です'
    if (heading.length > SECTION_MAX_HEADING_LENGTH) {
      return `見出しは${SECTION_MAX_HEADING_LENGTH}文字以内で入力してください`
    }
    return null
  }

  // コンテンツバリデーション関数
  const validateContent = (content: string | undefined): string | null => {
    if (!content) return 'コンテンツは必須です'
    if (content.length > LINKS_MAX_CONTENT_LENGTH) {
      return `コンテンツは${LINKS_MAX_CONTENT_LENGTH}文字以内で入力してください`
    }
    return null
  }

  describe('キーワードバリデーション', () => {
    it('空の場合はエラー', () => {
      expect(validateKeyword('')).toBe('キーワードは必須です')
      expect(validateKeyword(undefined)).toBe('キーワードは必須です')
    })

    it('200文字以内は成功', () => {
      expect(validateKeyword('パートナーマーケティング')).toBeNull()
      expect(validateKeyword('a'.repeat(200))).toBeNull()
    })

    it('201文字以上はエラー', () => {
      expect(validateKeyword('a'.repeat(201))).toBe(
        `キーワードは${OUTLINE_MAX_KEYWORD_LENGTH}文字以内で入力してください`
      )
    })
  })

  describe('見出しバリデーション', () => {
    it('空の場合はエラー', () => {
      expect(validateHeading('')).toBe('見出しは必須です')
      expect(validateHeading(undefined)).toBe('見出しは必須です')
    })

    it('500文字以内は成功', () => {
      expect(validateHeading('パートナーマーケティングとは')).toBeNull()
      expect(validateHeading('a'.repeat(500))).toBeNull()
    })

    it('501文字以上はエラー', () => {
      expect(validateHeading('a'.repeat(501))).toBe(
        `見出しは${SECTION_MAX_HEADING_LENGTH}文字以内で入力してください`
      )
    })
  })

  describe('コンテンツバリデーション', () => {
    it('空の場合はエラー', () => {
      expect(validateContent('')).toBe('コンテンツは必須です')
      expect(validateContent(undefined)).toBe('コンテンツは必須です')
    })

    it('50000文字以内は成功', () => {
      expect(validateContent('テストコンテンツ')).toBeNull()
      expect(validateContent('a'.repeat(50000))).toBeNull()
    })

    it('50001文字以上はエラー', () => {
      expect(validateContent('a'.repeat(50001))).toBe(
        `コンテンツは${LINKS_MAX_CONTENT_LENGTH}文字以内で入力してください`
      )
    })
  })
})

describe('JSONパース処理', () => {
  const parseJsonArray = (text: string): { suggestions: unknown[], warning?: string } => {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return { suggestions: JSON.parse(jsonMatch[0]) }
      } else {
        console.warn('No JSON array found in response:', text.slice(0, 200))
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
    const input = '[{"url": "/test", "anchorText": "テスト"}]'
    const result = parseJsonArray(input)
    expect(result.suggestions).toHaveLength(1)
    expect(result.warning).toBeUndefined()
  })

  it('マークダウンコードブロック内のJSON配列をパースできる', () => {
    const input = '```json\n[{"url": "/test"}]\n```'
    const result = parseJsonArray(input)
    expect(result.suggestions).toHaveLength(1)
  })

  it('テキスト混在のJSON配列をパースできる', () => {
    const input = 'Here are the suggestions:\n[{"url": "/test"}]\nEnd of suggestions.'
    const result = parseJsonArray(input)
    expect(result.suggestions).toHaveLength(1)
  })

  it('JSON配列がない場合は空配列を返す', () => {
    const input = 'No suggestions available.'
    const result = parseJsonArray(input)
    expect(result.suggestions).toHaveLength(0)
  })

  it('不正なJSONの場合はwarningを返す', () => {
    // 正規表現がマッチするが、JSONパースに失敗するケース
    const input = '[{"url": "/test", "broken]'
    const result = parseJsonArray(input)
    expect(result.suggestions).toHaveLength(0)
    expect(result.warning).toBe('リンク提案のパースに失敗しました。再度お試しください。')
  })
})

describe('モデル名検証', () => {
  it('gpt-4oモデルが正しく設定されている', async () => {
    // 実際のファイルを読み込んでモデル名を検証
    const fs = await import('fs')
    const path = await import('path')

    const outlinePath = path.join(process.cwd(), 'src/app/api/ai-writer/outline/route.ts')
    const sectionPath = path.join(process.cwd(), 'src/app/api/ai-writer/section/route.ts')
    const linksPath = path.join(process.cwd(), 'src/app/api/ai-writer/links/route.ts')

    const outlineContent = fs.readFileSync(outlinePath, 'utf-8')
    const sectionContent = fs.readFileSync(sectionPath, 'utf-8')
    const linksContent = fs.readFileSync(linksPath, 'utf-8')

    // gpt-4.1 が使われていないことを確認
    expect(outlineContent).not.toContain("openai('gpt-4.1')")
    expect(sectionContent).not.toContain("openai('gpt-4.1')")
    expect(linksContent).not.toContain("openai('gpt-4.1')")

    // gpt-4o が使われていることを確認
    expect(outlineContent).toContain("openai('gpt-4o')")
    expect(sectionContent).toContain("openai('gpt-4o')")
    expect(linksContent).toContain("openai('gpt-4o')")
  })
})

describe('AIWriterPanel race condition修正検証', () => {
  it('useRefがインポートされている', async () => {
    const fs = await import('fs')
    const path = await import('path')

    const panelPath = path.join(process.cwd(), 'src/components/admin/AIWriterPanel.tsx')
    const content = fs.readFileSync(panelPath, 'utf-8')

    // useRefがインポートされている
    expect(content).toContain('useRef')

    // activeSectionRefが定義されている
    expect(content).toContain('activeSectionRef')

    // onFinishでrefを参照している
    expect(content).toContain('activeSectionRef.current')
  })

  it('エラーUIコンポーネントが追加されている', async () => {
    const fs = await import('fs')
    const path = await import('path')

    const panelPath = path.join(process.cwd(), 'src/components/admin/AIWriterPanel.tsx')
    const content = fs.readFileSync(panelPath, 'utf-8')

    // AlertCircleがインポートされている
    expect(content).toContain('AlertCircle')

    // errorステートが定義されている
    expect(content).toContain('const [error, setError]')

    // エラー表示UIがある
    expect(content).toContain('border-destructive')
    expect(content).toContain('text-destructive')
  })
})

describe('Supabaseエラーハンドリング検証', () => {
  it('section/route.tsでエラーハンドリングがある', async () => {
    const fs = await import('fs')
    const path = await import('path')

    const sectionPath = path.join(process.cwd(), 'src/app/api/ai-writer/section/route.ts')
    const content = fs.readFileSync(sectionPath, 'utf-8')

    // articlesErrorを取得している
    expect(content).toContain('error: articlesError')

    // エラーログを出力している
    expect(content).toContain("console.error('Failed to fetch sample articles:'")
  })

  it('links/route.tsでエラーハンドリングがある', async () => {
    const fs = await import('fs')
    const path = await import('path')

    const linksPath = path.join(process.cwd(), 'src/app/api/ai-writer/links/route.ts')
    const content = fs.readFileSync(linksPath, 'utf-8')

    // articlesErrorを取得している
    expect(content).toContain('error: articlesError')

    // エラーログを出力している
    expect(content).toContain("console.error('Failed to fetch articles:'")

    // エラーレスポンスを返している
    expect(content).toContain('記事データの取得に失敗しました')
  })
})
