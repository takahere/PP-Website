/**
 * SEOスコアリングサービスのユニットテスト
 */
import { describe, it, expect } from 'vitest'
import {
  calculateRankScore,
  calculateCtrScore,
  calculateTransitionScore,
  calculateEngagementScore,
  calculateSEOScore,
  determineRank,
  generateDemoSEOScores,
} from '@/lib/seo/scoring-service'

describe('SEO Scoring Service', () => {
  describe('calculateRankScore', () => {
    it('should return 100 for positions 1-3', () => {
      expect(calculateRankScore(1)).toBe(100)
      expect(calculateRankScore(2)).toBe(100)
      expect(calculateRankScore(3)).toBe(100)
    })

    it('should return 90 for positions 4-5', () => {
      expect(calculateRankScore(4)).toBe(90)
      expect(calculateRankScore(5)).toBe(90)
    })

    it('should return 70 for positions 6-10', () => {
      expect(calculateRankScore(6)).toBe(70)
      expect(calculateRankScore(10)).toBe(70)
    })

    it('should return 50 for positions 11-20', () => {
      expect(calculateRankScore(11)).toBe(50)
      expect(calculateRankScore(20)).toBe(50)
    })

    it('should return 30 for positions 21-30', () => {
      expect(calculateRankScore(21)).toBe(30)
      expect(calculateRankScore(30)).toBe(30)
    })

    it('should return 10 for positions > 30', () => {
      expect(calculateRankScore(31)).toBe(10)
      expect(calculateRankScore(100)).toBe(10)
    })
  })

  describe('calculateCtrScore', () => {
    it('should return 100 for CTR >= 8%', () => {
      expect(calculateCtrScore(8)).toBe(100)
      expect(calculateCtrScore(10)).toBe(100)
    })

    it('should return 90 for CTR 5-7.9%', () => {
      expect(calculateCtrScore(5)).toBe(90)
      expect(calculateCtrScore(7.9)).toBe(90)
    })

    it('should return 70 for CTR 3-4.9%', () => {
      expect(calculateCtrScore(3)).toBe(70)
      expect(calculateCtrScore(4.9)).toBe(70)
    })

    it('should return 50 for CTR 2-2.9%', () => {
      expect(calculateCtrScore(2)).toBe(50)
      expect(calculateCtrScore(2.9)).toBe(50)
    })

    it('should return 30 for CTR 1-1.9%', () => {
      expect(calculateCtrScore(1)).toBe(30)
      expect(calculateCtrScore(1.9)).toBe(30)
    })

    it('should return 10 for CTR < 1%', () => {
      expect(calculateCtrScore(0.5)).toBe(10)
      expect(calculateCtrScore(0)).toBe(10)
    })
  })

  describe('calculateTransitionScore', () => {
    it('should return 100 for transition rate >= 5%', () => {
      expect(calculateTransitionScore(5)).toBe(100)
      expect(calculateTransitionScore(10)).toBe(100)
    })

    it('should return 85 for transition rate 3-4.9%', () => {
      expect(calculateTransitionScore(3)).toBe(85)
      expect(calculateTransitionScore(4.9)).toBe(85)
    })

    it('should return 70 for transition rate 2-2.9%', () => {
      expect(calculateTransitionScore(2)).toBe(70)
      expect(calculateTransitionScore(2.9)).toBe(70)
    })

    it('should return 50 for transition rate 1-1.9%', () => {
      expect(calculateTransitionScore(1)).toBe(50)
      expect(calculateTransitionScore(1.9)).toBe(50)
    })

    it('should return 30 for transition rate < 1%', () => {
      expect(calculateTransitionScore(0.5)).toBe(30)
      expect(calculateTransitionScore(0)).toBe(30)
    })
  })

  describe('calculateEngagementScore', () => {
    it('should return 100 for engagement rate >= 70%', () => {
      expect(calculateEngagementScore(70)).toBe(100)
      expect(calculateEngagementScore(90)).toBe(100)
    })

    it('should return 85 for engagement rate 60-69%', () => {
      expect(calculateEngagementScore(60)).toBe(85)
      expect(calculateEngagementScore(69)).toBe(85)
    })

    it('should return 70 for engagement rate 50-59%', () => {
      expect(calculateEngagementScore(50)).toBe(70)
      expect(calculateEngagementScore(59)).toBe(70)
    })

    it('should return 50 for engagement rate 40-49%', () => {
      expect(calculateEngagementScore(40)).toBe(50)
      expect(calculateEngagementScore(49)).toBe(50)
    })

    it('should return 30 for engagement rate < 40%', () => {
      expect(calculateEngagementScore(30)).toBe(30)
      expect(calculateEngagementScore(0)).toBe(30)
    })
  })

  describe('calculateSEOScore', () => {
    it('should calculate weighted score correctly', () => {
      const metrics = {
        position: 3,      // 100点
        ctr: 5,           // 90点
        transitionRate: 3, // 85点
        engagementRate: 60, // 85点
      }

      const result = calculateSEOScore(metrics)

      // 100*0.30 + 90*0.25 + 85*0.25 + 85*0.20 = 30 + 22.5 + 21.25 + 17 = 90.75 → 91
      expect(result.score).toBe(91)
      expect(result.scores.rankScore).toBe(100)
      expect(result.scores.ctrScore).toBe(90)
      expect(result.scores.transitionScore).toBe(85)
      expect(result.scores.engagementScore).toBe(85)
    })

    it('should handle low performance metrics', () => {
      const metrics = {
        position: 50,
        ctr: 0.5,
        transitionRate: 0.5,
        engagementRate: 30,
      }

      const result = calculateSEOScore(metrics)

      // 10*0.30 + 10*0.25 + 30*0.25 + 30*0.20 = 3 + 2.5 + 7.5 + 6 = 19
      expect(result.score).toBe(19)
    })
  })

  describe('determineRank', () => {
    it('should return S for score >= 85', () => {
      expect(determineRank(85)).toBe('S')
      expect(determineRank(100)).toBe('S')
    })

    it('should return A for score 70-84', () => {
      expect(determineRank(70)).toBe('A')
      expect(determineRank(84)).toBe('A')
    })

    it('should return B for score 50-69', () => {
      expect(determineRank(50)).toBe('B')
      expect(determineRank(69)).toBe('B')
    })

    it('should return C for score < 50', () => {
      expect(determineRank(49)).toBe('C')
      expect(determineRank(0)).toBe('C')
    })
  })

  describe('generateDemoSEOScores', () => {
    it('should return an array of demo scores', () => {
      const demoScores = generateDemoSEOScores()

      expect(Array.isArray(demoScores)).toBe(true)
      expect(demoScores.length).toBeGreaterThan(0)
    })

    it('should have correct structure for each score', () => {
      const demoScores = generateDemoSEOScores()
      const firstScore = demoScores[0]

      expect(firstScore).toHaveProperty('slug')
      expect(firstScore).toHaveProperty('title')
      expect(firstScore).toHaveProperty('seoScore')
      expect(firstScore).toHaveProperty('rank')
      expect(firstScore).toHaveProperty('metrics')
      expect(firstScore).toHaveProperty('scores')

      expect(typeof firstScore.seoScore).toBe('number')
      expect(['S', 'A', 'B', 'C']).toContain(firstScore.rank)
    })

    it('should have scores sorted in descending order', () => {
      const demoScores = generateDemoSEOScores()

      for (let i = 1; i < demoScores.length; i++) {
        expect(demoScores[i - 1].seoScore).toBeGreaterThanOrEqual(demoScores[i].seoScore)
      }
    })
  })
})
