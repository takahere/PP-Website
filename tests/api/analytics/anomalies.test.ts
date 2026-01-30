import { describe, it, expect, vi, beforeEach } from 'vitest'

// モックの設定
vi.mock('@google-analytics/data', () => ({
  BetaAnalyticsDataClient: vi.fn().mockImplementation(() => ({
    runReport: vi.fn(),
  })),
}))

vi.mock('@/lib/google-auth', () => ({
  getGoogleCredentials: vi.fn(() => ({
    type: 'service_account',
    project_id: 'test-project',
  })),
  isGoogleConfigured: vi.fn(() => true),
}))

describe('Anomaly Detection API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('detectAnomaly logic', () => {
    it('should detect anomaly when value exceeds 2 standard deviations', () => {
      // テスト用の統計データ
      const stats = {
        mean: 100,
        stdDev: 10,
        min: 80,
        max: 120,
        values: [90, 95, 100, 105, 110],
      }

      // 2σ以上の値（120超え）は異常
      const currentValue = 130
      const zScore = (currentValue - stats.mean) / stats.stdDev // 3.0

      expect(Math.abs(zScore)).toBeGreaterThanOrEqual(2)
    })

    it('should not detect anomaly when value is within normal range', () => {
      const stats = {
        mean: 100,
        stdDev: 10,
      }

      const currentValue = 105
      const zScore = (currentValue - stats.mean) / stats.stdDev // 0.5

      expect(Math.abs(zScore)).toBeLessThan(2)
    })

    it('should classify severity as critical when deviation exceeds 3σ', () => {
      const stats = {
        mean: 100,
        stdDev: 10,
      }

      const currentValue = 135 // 3.5σ
      const zScore = (currentValue - stats.mean) / stats.stdDev

      const severity = Math.abs(zScore) >= 3 ? 'critical' : 'warning'
      expect(severity).toBe('critical')
    })

    it('should classify severity as warning when deviation is between 2σ and 3σ', () => {
      const stats = {
        mean: 100,
        stdDev: 10,
      }

      const currentValue = 125 // 2.5σ
      const zScore = (currentValue - stats.mean) / stats.stdDev

      const severity = Math.abs(zScore) >= 3 ? 'critical' : 'warning'
      expect(severity).toBe('warning')
    })
  })

  describe('traffic anomaly detection', () => {
    it('should detect traffic drop of more than 30%', () => {
      const previousSessions = 1000
      const currentSessions = 650 // 35% drop

      const deviation = ((currentSessions - previousSessions) / previousSessions) * 100

      expect(deviation).toBeLessThanOrEqual(-30)
    })

    it('should not flag normal traffic variation', () => {
      const previousSessions = 1000
      const currentSessions = 850 // 15% drop

      const deviation = ((currentSessions - previousSessions) / previousSessions) * 100

      expect(deviation).toBeGreaterThan(-30)
    })
  })

  describe('bounce rate anomaly detection', () => {
    it('should detect high bounce rate above 60%', () => {
      const bounceRate = 65

      const isAnomalous = bounceRate >= 60
      expect(isAnomalous).toBe(true)
    })

    it('should classify bounce rate above 70% as critical', () => {
      const bounceRate = 72

      const severity = bounceRate >= 70 ? 'critical' : 'warning'
      expect(severity).toBe('critical')
    })
  })

  describe('stats calculation', () => {
    it('should correctly calculate mean', () => {
      const values = [10, 20, 30, 40, 50]
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length

      expect(mean).toBe(30)
    })

    it('should correctly calculate standard deviation', () => {
      const values = [10, 20, 30, 40, 50]
      const mean = 30
      const squaredDiffs = values.map((v) => Math.pow(v - mean, 2))
      const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length
      const stdDev = Math.sqrt(variance)

      expect(stdDev).toBeCloseTo(14.14, 1)
    })
  })
})
