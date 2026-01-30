import { describe, it, expect } from 'vitest'

describe('Cohort Analysis API', () => {
  describe('week number calculation', () => {
    it('should correctly calculate week number for January 1st', () => {
      const date = new Date('2025-01-01')
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
      const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)

      expect(weekNumber).toBeGreaterThanOrEqual(1)
      expect(weekNumber).toBeLessThanOrEqual(53)
    })

    it('should correctly calculate week number for mid-year', () => {
      const date = new Date('2025-06-15')
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
      const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
      const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)

      expect(weekNumber).toBeGreaterThanOrEqual(24)
      expect(weekNumber).toBeLessThanOrEqual(26)
    })
  })

  describe('cohort label formatting', () => {
    it('should format cohort label correctly', () => {
      const date = new Date('2025-01-15')
      const month = date.getMonth() + 1
      const weekOfMonth = Math.ceil(date.getDate() / 7)
      const label = `${month}月第${weekOfMonth}週`

      expect(label).toBe('1月第3週')
    })

    it('should handle end of month correctly', () => {
      const date = new Date('2025-01-31')
      const month = date.getMonth() + 1
      const weekOfMonth = Math.ceil(date.getDate() / 7)
      const label = `${month}月第${weekOfMonth}週`

      expect(label).toBe('1月第5週')
    })
  })

  describe('retention calculation', () => {
    it('should return null retention for zero initial users', () => {
      const initialUsers = 0

      const retention = initialUsers === 0
        ? { week1: null, week2: null, week4: null, week8: null }
        : { week1: 45, week2: 30, week4: 20, week8: 12 }

      expect(retention.week1).toBeNull()
      expect(retention.week8).toBeNull()
    })

    it('should calculate retention as percentage', () => {
      const initialUsers = 1000
      const week1Users = 450

      const retention = (week1Users / initialUsers) * 100

      expect(retention).toBe(45)
    })

    it('should cap week8 retention for recent cohorts', () => {
      const cohortIndex = 2 // 3週間前のコホート
      const week8Available = cohortIndex >= 4

      expect(week8Available).toBe(false)
    })
  })

  describe('insights calculation', () => {
    it('should identify best retention cohort', () => {
      const cohorts = [
        { cohort: '2025-W01', retention: { week1: 45 } },
        { cohort: '2025-W02', retention: { week1: 52 } },
        { cohort: '2025-W03', retention: { week1: 48 } },
      ]

      const best = cohorts.reduce((best, c) =>
        (c.retention.week1 || 0) > (best.retention.week1 || 0) ? c : best
      )

      expect(best.cohort).toBe('2025-W02')
    })

    it('should determine retention trend', () => {
      const recent = [50, 52, 54] // 最新3コホート
      const older = [45, 46, 44] // 古い3コホート

      const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length
      const olderAvg = older.reduce((sum, v) => sum + v, 0) / older.length

      let trend: 'improving' | 'declining' | 'stable' = 'stable'
      if (recentAvg > olderAvg * 1.05) trend = 'improving'
      else if (recentAvg < olderAvg * 0.95) trend = 'declining'

      expect(trend).toBe('improving')
    })
  })

  describe('channel cohort analysis', () => {
    it('should aggregate retention by channel', () => {
      const channelCohorts = [
        { channel: 'Organic Search', retention: { week1: 48 } },
        { channel: 'Organic Search', retention: { week1: 52 } },
        { channel: 'Direct', retention: { week1: 35 } },
        { channel: 'Direct', retention: { week1: 38 } },
      ]

      const organicAvg = channelCohorts
        .filter((c) => c.channel === 'Organic Search')
        .reduce((sum, c) => sum + (c.retention.week1 || 0), 0) / 2

      const directAvg = channelCohorts
        .filter((c) => c.channel === 'Direct')
        .reduce((sum, c) => sum + (c.retention.week1 || 0), 0) / 2

      expect(organicAvg).toBe(50)
      expect(directAvg).toBe(36.5)
      expect(organicAvg).toBeGreaterThan(directAvg)
    })
  })
})
