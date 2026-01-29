import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { LRUCache } from 'lru-cache'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'

/**
 * Google Ads データAPI
 *
 * GA4とGoogle Adsがリンクされている場合に広告データを取得
 *
 * 取得データ:
 * - キャンペーン別パフォーマンス
 * - 広告グループ別パフォーマンス
 * - 広告費用・CPC・ROAS
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new LRUCache<string, any>({
  max: 100,
  ttl: 10 * 60 * 1000,
})

interface CampaignData {
  campaignName: string
  adGroupName?: string
  users: number
  sessions: number
  conversions: number
  cost: number
  clicks: number
  impressions: number
  cpc: number
  ctr: number
  conversionRate: number
  costPerConversion: number
  roas?: number
}

export async function GET(request: Request) {
  try {
    if (!isGoogleConfigured()) {
      return NextResponse.json({
        error: 'Google Analytics is not configured',
        demo: true,
        ...generateDemoData(),
      }, { status: 200 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || '30daysAgo'
    const endDate = searchParams.get('endDate') || 'today'
    const forceRefresh = searchParams.get('refresh') === 'true'
    const groupBy = searchParams.get('groupBy') || 'campaign' // campaign | adGroup

    const cacheKey = `ads-${groupBy}-${startDate}-${endDate}`
    if (!forceRefresh) {
      const cached = cache.get(cacheKey)
      if (cached) {
        return NextResponse.json({ ...cached as object, cached: true })
      }
    }

    const credentials = getGoogleCredentials()
    const propertyId = process.env.GA4_PROPERTY_ID
    const analyticsDataClient = new BetaAnalyticsDataClient({ credentials })

    const dimensions = groupBy === 'adGroup'
      ? [{ name: 'sessionGoogleAdsCampaignName' }, { name: 'sessionGoogleAdsAdGroupName' }]
      : [{ name: 'sessionGoogleAdsCampaignName' }]

    // Google Ads データ取得
    const response = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions,
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'conversions' },
        { name: 'advertiserAdCost' },
        { name: 'advertiserAdClicks' },
        { name: 'advertiserAdImpressions' },
        { name: 'advertiserAdCostPerClick' },
        { name: 'advertiserAdCostPerConversion' },
        { name: 'returnOnAdSpend' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'sessionGoogleAdsCampaignName',
          stringFilter: {
            matchType: 'FULL_REGEXP',
            value: '.+', // 空でないキャンペーン名
          },
        },
      },
      orderBys: [{ metric: { metricName: 'advertiserAdCost' }, desc: true }],
      limit: 50,
    })

    const campaigns: CampaignData[] = response[0].rows?.map((row) => {
      const clicks = Number(row.metricValues?.[4]?.value) || 0
      const impressions = Number(row.metricValues?.[5]?.value) || 0
      const sessions = Number(row.metricValues?.[1]?.value) || 0
      const conversions = Number(row.metricValues?.[2]?.value) || 0

      return {
        campaignName: row.dimensionValues?.[0]?.value || '',
        adGroupName: groupBy === 'adGroup' ? (row.dimensionValues?.[1]?.value ?? undefined) : undefined,
        users: Number(row.metricValues?.[0]?.value) || 0,
        sessions,
        conversions,
        cost: Number(row.metricValues?.[3]?.value) || 0,
        clicks,
        impressions,
        cpc: Number(row.metricValues?.[6]?.value) || 0,
        ctr: impressions > 0 ? clicks / impressions : 0,
        conversionRate: sessions > 0 ? conversions / sessions : 0,
        costPerConversion: Number(row.metricValues?.[7]?.value) || 0,
        roas: Number(row.metricValues?.[8]?.value) || 0,
      }
    }) || []

    // サマリー計算
    const summary = {
      totalCost: campaigns.reduce((sum, c) => sum + c.cost, 0),
      totalClicks: campaigns.reduce((sum, c) => sum + c.clicks, 0),
      totalImpressions: campaigns.reduce((sum, c) => sum + c.impressions, 0),
      totalConversions: campaigns.reduce((sum, c) => sum + c.conversions, 0),
      avgCpc: campaigns.length > 0
        ? campaigns.reduce((sum, c) => sum + c.cpc, 0) / campaigns.length
        : 0,
      avgRoas: campaigns.length > 0
        ? campaigns.reduce((sum, c) => sum + (c.roas || 0), 0) / campaigns.length
        : 0,
    }

    const responseData = {
      period: { startDate, endDate },
      groupBy,
      campaigns,
      summary,
      note: 'GA4とGoogle Adsがリンクされている必要があります',
    }

    cache.set(cacheKey, responseData)

    return NextResponse.json({ ...responseData, cached: false })
  } catch (error) {
    console.error('Ads API Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch ads data',
      message: error instanceof Error ? error.message : 'Unknown error',
      demo: true,
      ...generateDemoData(),
    }, { status: 200 })
  }
}

function generateDemoData() {
  return {
    campaigns: [
      {
        campaignName: 'パートナーマーケティング_検索',
        users: 850,
        sessions: 1105,
        conversions: 45,
        cost: 185000,
        clicks: 920,
        impressions: 15200,
        cpc: 201,
        ctr: 0.061,
        conversionRate: 0.041,
        costPerConversion: 4111,
        roas: 2.8,
      },
      {
        campaignName: 'PRM_ディスプレイ',
        users: 620,
        sessions: 806,
        conversions: 28,
        cost: 125000,
        clicks: 680,
        impressions: 42000,
        cpc: 184,
        ctr: 0.016,
        conversionRate: 0.035,
        costPerConversion: 4464,
        roas: 2.2,
      },
      {
        campaignName: 'リマーケティング_全般',
        users: 380,
        sessions: 494,
        conversions: 35,
        cost: 75000,
        clicks: 420,
        impressions: 8500,
        cpc: 179,
        ctr: 0.049,
        conversionRate: 0.071,
        costPerConversion: 2143,
        roas: 4.5,
      },
    ],
    summary: {
      totalCost: 385000,
      totalClicks: 2020,
      totalImpressions: 65700,
      totalConversions: 108,
      avgCpc: 188,
      avgRoas: 3.17,
    },
  }
}
