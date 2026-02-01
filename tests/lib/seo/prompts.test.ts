/**
 * 強化版プロンプト生成のユニットテスト
 */
import { describe, it, expect } from 'vitest'
import {
  OUTLINE_SYSTEM_PROMPT,
  SECTION_SYSTEM_PROMPT,
  INTERNAL_LINKS_SYSTEM_PROMPT,
  createEnhancedOutlinePrompt,
  createEnhancedSectionPrompt,
  createEnhancedLinksPrompt,
} from '@/lib/ai-writer/prompts'

describe('AI Writer Prompts', () => {
  describe('OUTLINE_SYSTEM_PROMPT', () => {
    it('should contain PartnerProp context', () => {
      expect(OUTLINE_SYSTEM_PROMPT).toContain('PartnerProp')
    })

    it('should contain output format instructions', () => {
      expect(OUTLINE_SYSTEM_PROMPT).toContain('JSON')
      expect(OUTLINE_SYSTEM_PROMPT).toContain('title')
      expect(OUTLINE_SYSTEM_PROMPT).toContain('outline')
    })
  })

  describe('SECTION_SYSTEM_PROMPT', () => {
    it('should be a function that returns a string', () => {
      expect(typeof SECTION_SYSTEM_PROMPT).toBe('function')

      const prompt = SECTION_SYSTEM_PROMPT('サンプル記事')
      expect(typeof prompt).toBe('string')
    })

    it('should include sample articles in the prompt', () => {
      const sampleArticles = 'テスト記事1\nテスト記事2'
      const prompt = SECTION_SYSTEM_PROMPT(sampleArticles)

      expect(prompt).toContain(sampleArticles)
    })

    it('should contain writing rules', () => {
      const prompt = SECTION_SYSTEM_PROMPT('サンプル')

      expect(prompt).toContain('ライティングルール')
      expect(prompt).toContain('Markdown')
    })
  })

  describe('INTERNAL_LINKS_SYSTEM_PROMPT', () => {
    it('should contain output format instructions', () => {
      expect(INTERNAL_LINKS_SYSTEM_PROMPT).toContain('JSON')
      expect(INTERNAL_LINKS_SYSTEM_PROMPT).toContain('anchorText')
      expect(INTERNAL_LINKS_SYSTEM_PROMPT).toContain('url')
    })

    it('should contain link rules', () => {
      expect(INTERNAL_LINKS_SYSTEM_PROMPT).toContain('3〜5個')
    })
  })

  describe('createEnhancedOutlinePrompt', () => {
    it('should include base prompt content', () => {
      const enhanced = createEnhancedOutlinePrompt({})

      expect(enhanced).toContain('PartnerProp')
      expect(enhanced).toContain('構成のルール')
    })

    it('should include success patterns when provided', () => {
      const enhanced = createEnhancedOutlinePrompt({
        successPatterns: {
          avgH2Count: 5,
          avgWordCount: 3500,
          commonH2Patterns: ['とは', 'メリット'],
          structureFlow: ['導入', 'まとめ'],
        },
      })

      expect(enhanced).toContain('成功記事の平均H2数: 5個')
      expect(enhanced).toContain('成功記事の平均文字数: 3500文字')
      expect(enhanced).toContain('とは')
      expect(enhanced).toContain('メリット')
    })

    it('should include related queries when provided', () => {
      const enhanced = createEnhancedOutlinePrompt({
        relatedQueries: [
          { query: 'パートナーマーケティングとは', impressions: 100, position: 5 },
          { query: 'PRM ツール', impressions: 80, position: 8 },
        ],
      })

      expect(enhanced).toContain('パートナーマーケティングとは')
      expect(enhanced).toContain('PRM ツール')
      expect(enhanced).toContain('月間100回表示')
    })

    it('should include sample outlines when provided', () => {
      const enhanced = createEnhancedOutlinePrompt({
        sampleOutlines: [
          {
            title: 'サンプル記事タイトル',
            outline: [
              { level: 'h2', text: 'はじめに' },
              { level: 'h2', text: 'まとめ' },
            ],
          },
        ],
      })

      expect(enhanced).toContain('サンプル記事タイトル')
      expect(enhanced).toContain('はじめに')
      expect(enhanced).toContain('まとめ')
    })
  })

  describe('createEnhancedSectionPrompt', () => {
    it('should include base content', () => {
      const enhanced = createEnhancedSectionPrompt({})

      expect(enhanced).toContain('PartnerProp')
      expect(enhanced).toContain('ライティングルール')
    })

    it('should include style analysis when provided', () => {
      const enhanced = createEnhancedSectionPrompt({
        styleAnalysis: {
          avgParagraphLength: 120,
          avgSentenceLength: 45,
          bulletPointRate: 25,
          sentenceEndingPatterns: [
            { pattern: 'です', percentage: 45 },
            { pattern: 'ます', percentage: 35 },
          ],
          commonPhrases: ['重要です', 'ポイントは'],
        },
      })

      expect(enhanced).toContain('平均段落長: 120文字')
      expect(enhanced).toContain('平均文長: 45文字')
      expect(enhanced).toContain('箇条書き使用率: 25%')
      expect(enhanced).toContain('「です」(45%)')
      expect(enhanced).toContain('重要です')
    })

    it('should include style samples when provided', () => {
      const enhanced = createEnhancedSectionPrompt({
        styleSamples: [
          {
            title: 'サンプル記事',
            excerpt: 'これはサンプルの抜粋です。',
            seoScore: 92,
          },
        ],
      })

      expect(enhanced).toContain('サンプル記事')
      expect(enhanced).toContain('SEOスコア: 92')
      expect(enhanced).toContain('これはサンプルの抜粋です')
    })
  })

  describe('createEnhancedLinksPrompt', () => {
    it('should include base content', () => {
      const enhanced = createEnhancedLinksPrompt({})

      expect(enhanced).toContain('内部リンク最適化')
      expect(enhanced).toContain('JSON')
    })

    it('should include SEO score information when provided', () => {
      const enhanced = createEnhancedLinksPrompt({
        articleScores: [
          { slug: 'test-article', title: 'テスト記事', seoScore: 85, rank: 'S' },
          { slug: 'another-article', title: '別の記事', seoScore: 72, rank: 'A' },
        ],
      })

      expect(enhanced).toContain('SEOスコア順')
      expect(enhanced).toContain('ランク')
      expect(enhanced).toContain('S')
      expect(enhanced).toContain('最優先でリンク')
    })

    it('should contain rank priority rules', () => {
      const enhanced = createEnhancedLinksPrompt({
        articleScores: [{ slug: 'test', title: 'Test', seoScore: 90, rank: 'S' }],
      })

      expect(enhanced).toContain('高SEOスコア（S/Aランク）の記事を優先')
      expect(enhanced).toContain('低スコア（Cランク）の記事へのリンクは避ける')
    })
  })
})
