import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'

/**
 * カスタムディメンション取得API
 *
 * クエリパラメータ:
 * - dimension: カスタムディメンション名（例: customEvent:article_category）
 * - metric: 取得する指標（デフォルト: activeUsers,sessions）
 * - startDate: 開始日（デフォルト: 30daysAgo）
 * - endDate: 終了日（デフォルト: today）
 * - limit: 取得件数（デフォルト: 100）
 */
export async function GET(request: Request) {
  try {
    if (!isGoogleConfigured()) {
      return NextResponse.json(
        {
          error: 'Google Analytics is not configured',
          message: 'Please set GOOGLE_SERVICE_ACCOUNT_JSON and GA4_PROPERTY_ID',
          demo: true,
          data: generateDemoData(),
        },
        { status: 200 }
      )
    }

    const { searchParams } = new URL(request.url)
    const dimensionName = searchParams.get('dimension')
    const metricNames = searchParams.get('metrics')?.split(',') || ['activeUsers', 'sessions']
    const startDate = searchParams.get('startDate') || '30daysAgo'
    const endDate = searchParams.get('endDate') || 'today'
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    if (!dimensionName) {
      return NextResponse.json(
        {
          error: 'Missing required parameter: dimension',
          message: 'Please specify a dimension name (e.g., customEvent:article_category)',
          availableDimensions: getAvailableDimensions(),
        },
        { status: 400 }
      )
    }

    const credentials = getGoogleCredentials()
    const propertyId = process.env.GA4_PROPERTY_ID
    const analyticsDataClient = new BetaAnalyticsDataClient({ credentials })

    const response = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: dimensionName }],
      metrics: metricNames.map((name) => ({ name })),
      orderBys: [{ metric: { metricName: metricNames[0] }, desc: true }],
      limit,
    })

    const data = response[0].rows?.map((row) => {
      const result: Record<string, string | number> = {
        [dimensionName]: row.dimensionValues?.[0]?.value || '',
      }
      metricNames.forEach((metric, index) => {
        result[metric] = Number(row.metricValues?.[index]?.value) || 0
      })
      return result
    }) || []

    // 合計を計算
    const totals: Record<string, number> = {}
    metricNames.forEach((metric) => {
      totals[metric] = data.reduce((sum, row) => sum + (Number(row[metric]) || 0), 0)
    })

    return NextResponse.json({
      dimension: dimensionName,
      metrics: metricNames,
      period: { startDate, endDate },
      data,
      totals,
      rowCount: data.length,
    })
  } catch (error) {
    console.error('Custom Dimensions API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch custom dimension data',
        message: error instanceof Error ? error.message : 'Unknown error',
        demo: true,
        data: generateDemoData(),
      },
      { status: 200 }
    )
  }
}

// 利用可能なディメンション一覧
function getAvailableDimensions() {
  return {
    standard: [
      'date',
      'country',
      'city',
      'deviceCategory',
      'browser',
      'operatingSystem',
      'language',
      'pagePath',
      'pageTitle',
      'sessionDefaultChannelGroup',
      'sessionSource',
      'sessionMedium',
      'sessionCampaignName',
      'landingPage',
      'eventName',
      'newVsReturning',
    ],
    custom: [
      'customEvent:*',  // カスタムイベントパラメータ
      'customUser:*',   // カスタムユーザープロパティ
    ],
    examples: [
      'customEvent:article_category',
      'customEvent:form_name',
      'customUser:user_type',
      'customUser:subscription_status',
    ],
  }
}

// デモデータ
function generateDemoData() {
  return [
    { dimension: 'カテゴリA', activeUsers: 450, sessions: 580 },
    { dimension: 'カテゴリB', activeUsers: 320, sessions: 410 },
    { dimension: 'カテゴリC', activeUsers: 280, sessions: 350 },
    { dimension: 'カテゴリD', activeUsers: 150, sessions: 190 },
    { dimension: 'その他', activeUsers: 100, sessions: 120 },
  ]
}
