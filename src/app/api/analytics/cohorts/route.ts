import { NextResponse } from 'next/server'

let cachedData: { data: any; timestamp: number } | null = null
const CACHE_DURATION = 10 * 60 * 1000

export async function GET() {
  try {
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json({ data: cachedData.data, cached: true })
    }

    const data = {
      period: { startDate: '180daysAgo', endDate: 'today' },
      cohorts: [
        {
          cohort: '2025-10',
          initialUsers: 1250,
          retention: {
            week1: 42.5,
            week2: 28.3,
            week4: 18.5,
            week8: 12.8,
          },
          conversionRate: 5.2,
          ltv: 8500,
        },
        {
          cohort: '2025-11',
          initialUsers: 1380,
          retention: {
            week1: 45.2,
            week2: 30.1,
            week4: 19.8,
            week8: 13.5,
          },
          conversionRate: 5.8,
          ltv: 9200,
        },
        {
          cohort: '2025-12',
          initialUsers: 1520,
          retention: {
            week1: 48.5,
            week2: 32.5,
            week4: 21.2,
            week8: null,
          },
          conversionRate: 6.2,
          ltv: 9800,
        },
      ],
      insights: {
        bestRetentionCohort: '2025-12',
        avgWeek1Retention: 45.4,
        retentionTrend: 'improving',
        ltvTrend: 'increasing',
      },
    }

    cachedData = { data, timestamp: Date.now() }
    return NextResponse.json({ data, demo: true, cached: false })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cohort data', demo: true })
  }
}







