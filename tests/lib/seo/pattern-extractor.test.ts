/**
 * パターン抽出サービスのユニットテスト
 */
import { describe, it, expect } from 'vitest'
import { generateRecommendedOutline } from '@/lib/seo/pattern-extractor'
import type { OutlinePattern } from '@/lib/seo/pattern-extractor'

describe('Pattern Extractor', () => {
  describe('generateRecommendedOutline', () => {
    const mockPattern: OutlinePattern = {
      h2Structure: {
        avgCount: 5,
        minCount: 4,
        maxCount: 7,
        commonPatterns: [
          { pattern: 'とは', frequency: 85, examples: [] },
          { pattern: 'メリット', frequency: 70, examples: [] },
        ],
      },
      h3Structure: {
        avgCountPerH2: 2,
        totalAvgCount: 10,
        commonPatterns: [],
      },
      structureFlow: ['導入・概要', '定義・説明', 'メリット・効果', '実践方法', 'まとめ'],
      sampleOutlines: [],
    }

    it('should generate outline based on keyword and pattern', () => {
      const outline = generateRecommendedOutline('パートナーマーケティング', mockPattern)

      expect(Array.isArray(outline)).toBe(true)
      expect(outline.length).toBeGreaterThan(0)
    })

    it('should include H2 headings from structure flow', () => {
      const outline = generateRecommendedOutline('パートナーマーケティング', mockPattern)
      const h2s = outline.filter((item) => item.level === 'h2')

      expect(h2s.length).toBe(mockPattern.structureFlow.length)
    })

    it('should include keyword in generated headings', () => {
      const keyword = 'パートナーマーケティング'
      const outline = generateRecommendedOutline(keyword, mockPattern)
      const h2s = outline.filter((item) => item.level === 'h2')

      // 最初のH2は「〜とは」形式
      expect(h2s[0].text).toContain(keyword)
    })

    it('should generate H3 placeholders for each H2', () => {
      const outline = generateRecommendedOutline('テスト', mockPattern)
      const h3s = outline.filter((item) => item.level === 'h3')

      // 各H2につき2個のH3（avgCountPerH2 = 2）
      expect(h3s.length).toBe(mockPattern.structureFlow.length * Math.round(mockPattern.h3Structure.avgCountPerH2))
    })

    it('should include keywords array for H2 items', () => {
      const outline = generateRecommendedOutline('テスト', mockPattern)
      const h2s = outline.filter((item) => item.level === 'h2')

      h2s.forEach((h2) => {
        expect(h2.keywords).toBeDefined()
        expect(Array.isArray(h2.keywords)).toBe(true)
      })
    })
  })
})
