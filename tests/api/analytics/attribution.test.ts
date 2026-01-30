import { describe, it, expect } from 'vitest'

describe('Attribution Analysis API', () => {
  describe('attribution models', () => {
    const channelData = [
      { channel: 'Organic Search', lastTouch: 45, firstTouch: 52 },
      { channel: 'Direct', lastTouch: 28, firstTouch: 18 },
      { channel: 'Social', lastTouch: 8, firstTouch: 14 },
      { channel: 'Email', lastTouch: 12, firstTouch: 5 },
    ]

    it('should calculate last touch attribution correctly', () => {
      const lastTouchTotal = channelData.reduce((sum, c) => sum + c.lastTouch, 0)

      const organicPercentage = (channelData[0].lastTouch / lastTouchTotal) * 100

      expect(organicPercentage).toBeCloseTo(48.4, 1)
    })

    it('should calculate first touch attribution correctly', () => {
      const firstTouchTotal = channelData.reduce((sum, c) => sum + c.firstTouch, 0)

      const organicPercentage = (channelData[0].firstTouch / firstTouchTotal) * 100

      expect(organicPercentage).toBeCloseTo(58.4, 1)
    })

    it('should calculate linear attribution correctly', () => {
      const linear = channelData.map((c) => ({
        channel: c.channel,
        value: (c.lastTouch + c.firstTouch) / 2,
      }))

      const linearTotal = linear.reduce((sum, c) => sum + c.value, 0)
      const organicPercentage = (linear[0].value / linearTotal) * 100

      expect(linear[0].value).toBe(48.5) // (45 + 52) / 2
      expect(organicPercentage).toBeCloseTo(53.3, 1)
    })

    it('should calculate time decay attribution correctly', () => {
      // Time Decay: Last Touch 70%, First Touch 30%
      const timeDecay = channelData.map((c) => ({
        channel: c.channel,
        value: c.lastTouch * 0.7 + c.firstTouch * 0.3,
      }))

      expect(timeDecay[0].value).toBe(45 * 0.7 + 52 * 0.3) // 47.1
      expect(timeDecay[1].value).toBe(28 * 0.7 + 18 * 0.3) // 25.0
    })
  })

  describe('model comparison', () => {
    it('should identify undervalued channels', () => {
      const comparison = [
        { channel: 'Organic Search', lastTouch: 45, firstTouch: 52 },
        { channel: 'Social', lastTouch: 8, firstTouch: 14 },
      ]

      // Social is undervalued in Last Touch (8 vs 14)
      const undervalued = comparison.find(
        (c) => c.firstTouch > c.lastTouch * 1.5
      )

      expect(undervalued?.channel).toBe('Social')
    })

    it('should identify overvalued channels', () => {
      const comparison = [
        { channel: 'Direct', lastTouch: 28, firstTouch: 18 },
        { channel: 'Email', lastTouch: 12, firstTouch: 5 },
      ]

      // Email is overvalued in Last Touch (12 vs 5)
      const overvalued = comparison.find(
        (c) => c.lastTouch > c.firstTouch * 2
      )

      expect(overvalued?.channel).toBe('Email')
    })
  })

  describe('conversion paths', () => {
    it('should categorize URLs correctly', () => {
      const categorizeUrl = (url: string): string => {
        if (url.includes('/lab')) return 'Lab'
        if (url.includes('/casestudy')) return 'Case Study'
        if (url.includes('/seminar')) return 'Seminar'
        if (url.includes('/knowledge')) return 'Knowledge'
        if (url === '/' || url === '') return 'Top'
        return 'Other'
      }

      expect(categorizeUrl('/lab/article-1')).toBe('Lab')
      expect(categorizeUrl('/casestudy/company-a')).toBe('Case Study')
      expect(categorizeUrl('/')).toBe('Top')
      expect(categorizeUrl('/about')).toBe('Other')
    })

    it('should aggregate paths correctly', () => {
      const paths = [
        { path: 'Organic Search → Lab', conversions: 10 },
        { path: 'Organic Search → Lab', conversions: 8 },
        { path: 'Direct → Top', conversions: 12 },
      ]

      const aggregated = new Map<string, number>()
      paths.forEach((p) => {
        const existing = aggregated.get(p.path) || 0
        aggregated.set(p.path, existing + p.conversions)
      })

      expect(aggregated.get('Organic Search → Lab')).toBe(18)
      expect(aggregated.get('Direct → Top')).toBe(12)
    })
  })

  describe('percentage calculation', () => {
    it('should sum to 100% across all channels', () => {
      const channels = [
        { attributedValue: 48.5 },
        { attributedValue: 23.0 },
        { attributedValue: 11.0 },
        { attributedValue: 8.5 },
      ]

      const total = channels.reduce((sum, c) => sum + c.attributedValue, 0)
      const percentages = channels.map((c) => (c.attributedValue / total) * 100)
      const totalPercentage = percentages.reduce((sum, p) => sum + p, 0)

      expect(totalPercentage).toBeCloseTo(100, 1)
    })
  })

  describe('insights generation', () => {
    it('should identify top channel', () => {
      const channels = [
        { channel: 'Organic Search', percentage: 48.4 },
        { channel: 'Direct', percentage: 30.1 },
        { channel: 'Social', percentage: 12.5 },
      ]

      const topChannel = channels.reduce((top, c) =>
        c.percentage > top.percentage ? c : top
      )

      expect(topChannel.channel).toBe('Organic Search')
    })

    it('should identify low performers with high sessions', () => {
      const channels = [
        { channel: 'Organic Search', percentage: 48.4, sessions: 3500 },
        { channel: 'Paid Search', percentage: 3.2, sessions: 800 },
      ]

      const lowPerformers = channels.filter(
        (c) => c.percentage < 5 && c.sessions > 100
      )

      expect(lowPerformers).toHaveLength(1)
      expect(lowPerformers[0].channel).toBe('Paid Search')
    })
  })
})
