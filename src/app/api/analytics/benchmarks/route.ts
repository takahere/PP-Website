import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const data = {
      period: { startDate: '30daysAgo', endDate: 'today' },
      yourSite: {
        bounceRate: 38.5,
        avgSessionDuration: 205,
        pagesPerSession: 3.2,
        conversionRate: 4.1,
      },
      industryAverage: {
        bounceRate: 45.2,
        avgSessionDuration: 165,
        pagesPerSession: 2.8,
        conversionRate: 2.5,
      },
      comparison: {
        bounceRate: { status: 'better', difference: -6.7 },
        avgSessionDuration: { status: 'better', difference: 40 },
        pagesPerSession: { status: 'better', difference: 0.4 },
        conversionRate: { status: 'better', difference: 1.6 },
      },
      ranking: {
        overall: 'Top 15%',
        bounceRate: 'Top 20%',
        conversionRate: 'Top 10%',
      },
      insights: {
        strengths: ['CVR', '平均セッション時間', 'ページ/セッション'],
        weaknesses: [],
        opportunities: ['モバイルUXさらに改善の余地'],
        relativePosition: 'Industry Leader',
      },
    }

    return NextResponse.json({ data, demo: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch benchmarks data', demo: true })
  }
}














