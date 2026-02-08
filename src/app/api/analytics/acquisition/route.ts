import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const data = {
      period: { startDate: '30daysAgo', endDate: 'today' },
      channels: [
        {
          channel: 'Organic Search',
          newUsers: 4850,
          cost: 0,
          cpa: 0,
          conversionRate: 4.2,
          avgSessionDuration: 220,
          quality: 'high',
        },
        {
          channel: 'Paid Search',
          newUsers: 2680,
          cost: 285000,
          cpa: 106,
          conversionRate: 5.8,
          avgSessionDuration: 195,
          quality: 'high',
        },
        {
          channel: 'Social Media',
          newUsers: 1920,
          cost: 125000,
          cpa: 65,
          conversionRate: 3.5,
          avgSessionDuration: 145,
          quality: 'medium',
        },
        {
          channel: 'Direct',
          newUsers: 1450,
          cost: 0,
          cpa: 0,
          conversionRate: 6.2,
          avgSessionDuration: 285,
          quality: 'high',
        },
      ],
      assistedConversions: [
        { channel: 'Organic Search', assisted: 125, direct: 85, ratio: 1.47 },
        { channel: 'Social Media', assisted: 95, direct: 42, ratio: 2.26 },
      ],
      insights: {
        bestQualityChannel: 'Direct',
        lowestCPAChannel: 'Social Media',
        totalAcquisitionCost: 410000,
        avgCPA: 85,
        recommendedBudgetAllocation: {
          'Paid Search': 50,
          'Social Media': 30,
          'Other': 20,
        },
      },
    }

    return NextResponse.json({ data, demo: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch acquisition data', demo: true })
  }
}


















