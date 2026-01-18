import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const data = {
      period: { startDate: '30daysAgo', endDate: 'today' },
      activeExperiments: [
        {
          name: 'CTAボタン色テスト',
          status: 'running',
          startDate: '2026-01-15',
          variants: [
            { name: 'Control (青)', users: 1250, conversions: 58, conversionRate: 4.64 },
            { name: 'Variant A (赤)', users: 1280, conversions: 78, conversionRate: 6.09 },
          ],
          winner: 'Variant A',
          confidence: 95.2,
          uplift: 31.2,
        },
        {
          name: 'フォーム項目削減',
          status: 'running',
          startDate: '2026-01-10',
          variants: [
            { name: 'Control (5項目)', users: 850, conversions: 165, conversionRate: 19.41 },
            { name: 'Variant A (3項目)', users: 880, conversions: 242, conversionRate: 27.50 },
          ],
          winner: 'Variant A',
          confidence: 98.5,
          uplift: 41.7,
        },
      ],
      completedExperiments: [
        {
          name: 'ヘッダーナビゲーション改善',
          completedDate: '2026-01-05',
          winner: 'Variant B',
          uplift: 15.8,
          implemented: true,
        },
      ],
      insights: {
        totalActiveTests: 2,
        significantWinners: 2,
        avgUplift: 36.4,
        recommendedActions: [
          'CTAボタン色テストは即座に実装可能',
          'フォーム項目削減は即座に実装可能',
        ],
      },
    }

    return NextResponse.json({ data, demo: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch experiments data', demo: true })
  }
}







