import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const data = {
      period: { startDate: '30daysAgo', endDate: 'today' },
      browsers: [
        { browser: 'Chrome', version: '120.x', users: 5680, percentage: 58.2 },
        { browser: 'Safari', version: '17.x', users: 2450, percentage: 25.1 },
        { browser: 'Edge', version: '120.x', users: 980, percentage: 10.0 },
        { browser: 'Firefox', version: '121.x', users: 450, percentage: 4.6 },
      ],
      os: [
        { os: 'Windows', version: '11', users: 4850, percentage: 49.7 },
        { os: 'macOS', version: '14.x', users: 2680, percentage: 27.5 },
        { os: 'iOS', version: '17.x', users: 1520, percentage: 15.6 },
        { os: 'Android', version: '14', users: 680, percentage: 7.0 },
      ],
      screenResolutions: [
        { resolution: '1920x1080', users: 3850, percentage: 39.5 },
        { resolution: '1366x768', users: 2120, percentage: 21.7 },
        { resolution: '390x844 (mobile)', users: 1680, percentage: 17.2 },
      ],
      connectionTypes: [
        { type: '4g', users: 4200, avgSpeed: '15 Mbps' },
        { type: 'wifi', users: 5100, avgSpeed: '50 Mbps' },
        { type: '3g', users: 450, avgSpeed: '2 Mbps' },
      ],
      insights: {
        mostCommonBrowser: 'Chrome 120.x',
        supportPriority: ['Chrome', 'Safari', 'Edge'],
        slowConnectionUsers: 450,
        modernBrowserPercentage: 93.3,
      },
    }

    return NextResponse.json({ data, demo: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tech environment data', demo: true })
  }
}


















