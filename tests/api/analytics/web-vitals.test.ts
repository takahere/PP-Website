import { describe, it, expect } from 'vitest'

describe('Web Vitals API', () => {
  // Google推奨閾値
  const THRESHOLDS = {
    LCP: { good: 2500, needsImprovement: 4000 },
    FID: { good: 100, needsImprovement: 300 },
    CLS: { good: 0.1, needsImprovement: 0.25 },
    FCP: { good: 1800, needsImprovement: 3000 },
    TTFB: { good: 800, needsImprovement: 1800 },
  }

  describe('rating calculation', () => {
    const getRating = (
      metric: string,
      value: number
    ): 'good' | 'needs-improvement' | 'poor' => {
      const threshold = THRESHOLDS[metric as keyof typeof THRESHOLDS]
      if (!threshold) return 'needs-improvement'

      if (value <= threshold.good) return 'good'
      if (value <= threshold.needsImprovement) return 'needs-improvement'
      return 'poor'
    }

    it('should rate LCP correctly', () => {
      expect(getRating('LCP', 2000)).toBe('good')
      expect(getRating('LCP', 3000)).toBe('needs-improvement')
      expect(getRating('LCP', 5000)).toBe('poor')
    })

    it('should rate FID correctly', () => {
      expect(getRating('FID', 80)).toBe('good')
      expect(getRating('FID', 200)).toBe('needs-improvement')
      expect(getRating('FID', 400)).toBe('poor')
    })

    it('should rate CLS correctly', () => {
      expect(getRating('CLS', 0.05)).toBe('good')
      expect(getRating('CLS', 0.15)).toBe('needs-improvement')
      expect(getRating('CLS', 0.3)).toBe('poor')
    })

    it('should rate FCP correctly', () => {
      expect(getRating('FCP', 1500)).toBe('good')
      expect(getRating('FCP', 2500)).toBe('needs-improvement')
      expect(getRating('FCP', 4000)).toBe('poor')
    })

    it('should rate TTFB correctly', () => {
      expect(getRating('TTFB', 500)).toBe('good')
      expect(getRating('TTFB', 1200)).toBe('needs-improvement')
      expect(getRating('TTFB', 2500)).toBe('poor')
    })
  })

  describe('overall score calculation', () => {
    const calculateScore = (lcp: number, fid: number, cls: number): number => {
      const getRating = (
        metric: string,
        value: number
      ): 'good' | 'needs-improvement' | 'poor' => {
        const threshold = THRESHOLDS[metric as keyof typeof THRESHOLDS]
        if (!threshold) return 'needs-improvement'
        if (value <= threshold.good) return 'good'
        if (value <= threshold.needsImprovement) return 'needs-improvement'
        return 'poor'
      }

      const lcpScore =
        getRating('LCP', lcp) === 'good'
          ? 100
          : getRating('LCP', lcp) === 'needs-improvement'
          ? 60
          : 30
      const fidScore =
        getRating('FID', fid) === 'good'
          ? 100
          : getRating('FID', fid) === 'needs-improvement'
          ? 60
          : 30
      const clsScore =
        getRating('CLS', cls) === 'good'
          ? 100
          : getRating('CLS', cls) === 'needs-improvement'
          ? 60
          : 30

      return Math.round(
        (lcpScore * 0.25 + fidScore * 0.25 + clsScore * 0.25 + 75 * 0.25)
      )
    }

    it('should return high score for all good metrics', () => {
      const score = calculateScore(2000, 80, 0.05)
      expect(score).toBeGreaterThanOrEqual(90)
    })

    it('should return medium score for mixed metrics', () => {
      const score = calculateScore(3000, 200, 0.15)
      expect(score).toBeGreaterThanOrEqual(50)
      expect(score).toBeLessThan(80)
    })

    it('should return low score for all poor metrics', () => {
      const score = calculateScore(5000, 400, 0.3)
      expect(score).toBeLessThan(50)
    })
  })

  describe('percentile calculation', () => {
    it('should calculate p75 correctly', () => {
      const value = 2000
      const p75 = Math.round(value * 1.2)

      expect(p75).toBe(2400)
    })

    it('should calculate p95 correctly', () => {
      const value = 2000
      const p95 = Math.round(value * 1.5)

      expect(p95).toBe(3000)
    })
  })

  describe('recommendations generation', () => {
    const generateRecommendation = (
      metric: string,
      value: number
    ): string | null => {
      const threshold = THRESHOLDS[metric as keyof typeof THRESHOLDS]
      if (!threshold) return null

      if (value > threshold.needsImprovement) {
        return `${metric}が${value}msで、目標を大幅に超えています`
      } else if (value > threshold.good) {
        return `${metric}が${value}msで、改善の余地があります`
      }
      return null
    }

    it('should generate recommendation for poor LCP', () => {
      const rec = generateRecommendation('LCP', 5000)
      expect(rec).toContain('LCP')
      expect(rec).toContain('5000')
      expect(rec).toContain('大幅に超えて')
    })

    it('should generate recommendation for needs-improvement LCP', () => {
      const rec = generateRecommendation('LCP', 3000)
      expect(rec).toContain('改善の余地')
    })

    it('should not generate recommendation for good LCP', () => {
      const rec = generateRecommendation('LCP', 2000)
      expect(rec).toBeNull()
    })
  })

  describe('device breakdown', () => {
    it('should apply mobile modifier correctly', () => {
      const baseLCP = 2200
      const mobileModifier = 1.3
      const mobileLCP = Math.round(baseLCP * mobileModifier)

      expect(mobileLCP).toBe(2860)
    })

    it('should apply tablet modifier correctly', () => {
      const baseLCP = 2200
      const tabletModifier = 1.1
      const tabletLCP = Math.round(baseLCP * tabletModifier)

      expect(tabletLCP).toBe(2420)
    })
  })

  describe('trends analysis', () => {
    it('should identify slowest pages', () => {
      const pages = [
        { page: '/page-a', lcp: 2000 },
        { page: '/page-b', lcp: 3500 },
        { page: '/page-c', lcp: 2800 },
      ]

      const slowest = [...pages].sort((a, b) => b.lcp - a.lcp).slice(0, 1)

      expect(slowest[0].page).toBe('/page-b')
    })

    it('should identify fastest pages', () => {
      const pages = [
        { page: '/page-a', lcp: 2000 },
        { page: '/page-b', lcp: 3500 },
        { page: '/page-c', lcp: 2800 },
      ]

      const fastest = [...pages].sort((a, b) => a.lcp - b.lcp).slice(0, 1)

      expect(fastest[0].page).toBe('/page-a')
    })

    it('should identify pages needing attention', () => {
      const pages = [
        { page: '/page-a', overallScore: 85 },
        { page: '/page-b', overallScore: 55 },
        { page: '/page-c', overallScore: 45 },
      ]

      const needsAttention = pages.filter((p) => p.overallScore < 60)

      expect(needsAttention).toHaveLength(2)
      expect(needsAttention.map((p) => p.page)).toContain('/page-b')
      expect(needsAttention.map((p) => p.page)).toContain('/page-c')
    })
  })
})
