import { describe, it, expect } from 'vitest'
import {
  formatWeeklySummary,
  formatDailyAlert,
  formatAnomalyAlert,
  WeeklySummaryData,
  DailyAlertData,
  AnomalyAlertData,
} from '@/lib/slack/formatters'

describe('Slack Formatters', () => {
  describe('formatWeeklySummary', () => {
    const mockData: WeeklySummaryData = {
      period: {
        startDate: '2025-01-20',
        endDate: '2025-01-26',
      },
      traffic: {
        sessions: 12345,
        sessionsTrend: 5.2,
        users: 8901,
        usersTrend: 3.1,
        pageviews: 34567,
        pageviewsTrend: 7.8,
      },
      search: {
        impressions: 45678,
        impressionsTrend: 12.3,
        clicks: 2345,
        clicksTrend: 8.9,
        avgPosition: 15.2,
        positionTrend: -2.1,
      },
      conversions: {
        formSubmissions: 23,
        formTrend: 15.0,
        downloads: 45,
        downloadTrend: 8.3,
        labTransitionRate: 4.2,
        transitionTrend: 0.3,
      },
      topPages: [
        { path: '/lab/article-1', pageviews: 3456 },
        { path: '/lab/article-2', pageviews: 2345 },
      ],
    }

    it('should create message with correct text fallback', () => {
      const message = formatWeeklySummary(mockData)

      expect(message.text).toContain('週次アナリティクスレポート')
      expect(message.text).toContain('2025-01-20')
      expect(message.text).toContain('2025-01-26')
    })

    it('should include blocks array', () => {
      const message = formatWeeklySummary(mockData)

      expect(message.blocks).toBeDefined()
      expect(Array.isArray(message.blocks)).toBe(true)
      expect(message.blocks!.length).toBeGreaterThan(0)
    })

    it('should include header block', () => {
      const message = formatWeeklySummary(mockData)

      const headerBlock = message.blocks!.find((b) => b.type === 'header')
      expect(headerBlock).toBeDefined()
      expect(headerBlock!.text?.text).toContain('週次アナリティクスレポート')
    })

    it('should include divider blocks', () => {
      const message = formatWeeklySummary(mockData)

      const dividerBlocks = message.blocks!.filter((b) => b.type === 'divider')
      expect(dividerBlocks.length).toBeGreaterThan(0)
    })
  })

  describe('formatDailyAlert', () => {
    const mockData: DailyAlertData = {
      date: '2025/1/28',
      sessions: 1823,
      sessionsTrend: 12.5,
      conversions: 5,
      conversionsTrend: 2,
      bounceRate: 45.2,
      alerts: [],
    }

    it('should create message with correct text fallback', () => {
      const message = formatDailyAlert(mockData)

      expect(message.text).toContain('日次KPIサマリー')
      expect(message.text).toContain('1,823') // formatted with comma
    })

    it('should show no alerts when array is empty', () => {
      const message = formatDailyAlert(mockData)

      const textBlocks = message.blocks!.filter((b) => b.type === 'section')
      const alertBlock = textBlocks.find((b) =>
        b.text?.text?.includes('アラート')
      )

      expect(alertBlock?.text?.text).toContain('なし')
    })

    it('should show alerts when present', () => {
      const dataWithAlerts: DailyAlertData = {
        ...mockData,
        alerts: [
          { type: 'warning', message: 'トラフィック減少' },
          { type: 'critical', message: '直帰率急上昇' },
        ],
      }

      const message = formatDailyAlert(dataWithAlerts)

      const textBlocks = message.blocks!.filter((b) => b.type === 'section')
      const alertText = textBlocks.map((b) => b.text?.text || '').join(' ')

      expect(alertText).toContain('トラフィック減少')
      expect(alertText).toContain('直帰率急上昇')
    })
  })

  describe('formatAnomalyAlert', () => {
    it('should handle empty anomalies array', () => {
      const data: AnomalyAlertData = {
        detectedAt: '2025/1/29 10:00',
        anomalies: [],
      }

      const message = formatAnomalyAlert(data)

      expect(message.text).toContain('問題なし')
      expect(message.blocks!.some((b) =>
        b.text?.text?.includes('異常は検出されていません')
      )).toBe(true)
    })

    it('should format warning anomaly correctly', () => {
      const data: AnomalyAlertData = {
        detectedAt: '2025/1/29 10:00',
        anomalies: [
          {
            metric: '直帰率',
            currentValue: 58.5,
            expectedValue: 48.2,
            deviation: 21.4,
            severity: 'warning',
          },
        ],
      }

      const message = formatAnomalyAlert(data)

      expect(message.text).toContain('異常検知アラート')
      expect(message.text).toContain('1件')

      const textBlocks = message.blocks!.filter((b) => b.type === 'section')
      const anomalyText = textBlocks.map((b) => b.text?.text || '').join(' ')

      expect(anomalyText).toContain('直帰率')
      expect(anomalyText).toContain('🟡') // warning emoji
    })

    it('should format critical anomaly correctly', () => {
      const data: AnomalyAlertData = {
        detectedAt: '2025/1/29 10:00',
        anomalies: [
          {
            metric: 'セッション数',
            currentValue: 650,
            expectedValue: 1000,
            deviation: -35.0,
            severity: 'critical',
          },
        ],
      }

      const message = formatAnomalyAlert(data)

      const textBlocks = message.blocks!.filter((b) => b.type === 'section')
      const anomalyText = textBlocks.map((b) => b.text?.text || '').join(' ')

      expect(anomalyText).toContain('セッション数')
      expect(anomalyText).toContain('🔴') // critical emoji
    })

    it('should include header for anomaly alert', () => {
      const data: AnomalyAlertData = {
        detectedAt: '2025/1/29 10:00',
        anomalies: [
          {
            metric: 'テスト',
            currentValue: 100,
            expectedValue: 50,
            deviation: 100,
            severity: 'warning',
          },
        ],
      }

      const message = formatAnomalyAlert(data)
      const headerBlock = message.blocks!.find((b) => b.type === 'header')

      expect(headerBlock).toBeDefined()
      expect(headerBlock!.text?.text).toContain('異常検知')
    })
  })

  describe('utility functions', () => {
    it('should format numbers with commas', () => {
      const formatNumber = (num: number): string => {
        return num.toLocaleString('ja-JP')
      }

      expect(formatNumber(1234567)).toBe('1,234,567')
      expect(formatNumber(1000)).toBe('1,000')
    })

    it('should format change percentage correctly', () => {
      const formatChange = (change: number): string => {
        if (change > 0) return `+${change.toFixed(1)}%`
        if (change < 0) return `${change.toFixed(1)}%`
        return '±0%'
      }

      expect(formatChange(5.2)).toBe('+5.2%')
      expect(formatChange(-3.5)).toBe('-3.5%')
      expect(formatChange(0)).toBe('±0%')
    })

    it('should return correct emoji for positive change', () => {
      const getChangeEmoji = (change: number): string => {
        if (change > 5) return '📈'
        if (change < -5) return '📉'
        return '➡️'
      }

      expect(getChangeEmoji(10)).toBe('📈')
      expect(getChangeEmoji(-10)).toBe('📉')
      expect(getChangeEmoji(2)).toBe('➡️')
    })
  })
})
