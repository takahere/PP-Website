import { NextResponse } from 'next/server'

let cachedData: { data: unknown; timestamp: number } | null = null
const CACHE_DURATION = 10 * 60 * 1000

export async function GET() {
  try {
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json({ data: cachedData.data, cached: true })
    }

    const data = {
      period: { startDate: '30daysAgo', endDate: 'today' },
      errors404: [
        { url: '/old-product-page', hits: 245, referrers: ['google', '(direct)'] },
        { url: '/blog/deleted-post', hits: 156, referrers: ['twitter.com', 'facebook.com'] },
        { url: '/resources/whitepaper-2024', hits: 98, referrers: ['linkedin'] },
      ],
      jsErrors: [
        { error: 'TypeError: Cannot read property', count: 42, pages: ['/lab', '/partner-marketing'] },
        { error: 'ReferenceError: $ is not defined', count: 28, pages: ['/about'] },
      ],
      slowPages: [
        { page: '/seminar', avgLoadTime: 4850, impactedUsers: 680 },
        { page: '/casestudy/detailed', avgLoadTime: 3920, impactedUsers: 420 },
      ],
      insights: {
        critical404s: 3,
        totalJSErrors: 70,
        pagesNeedingOptimization: 2,
        estimatedUserImpact: 1180,
      },
    }

    cachedData = { data, timestamp: Date.now() }
    return NextResponse.json({ data, demo: true, cached: false })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch technical issues', demo: true })
  }
}














