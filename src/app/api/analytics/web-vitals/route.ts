import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'

// キャッシュ用
let cachedData: { data: WebVitalsData; timestamp: number } | null = null
const CACHE_DURATION = 10 * 60 * 1000 // 10分

interface VitalMetric {
  metric: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  percentile75: number
  percentile95: number
  sampleSize: number
}

interface PageVitals {
  page: string
  lcp: VitalMetric
  fid: VitalMetric
  cls: VitalMetric
  fcp: VitalMetric
  ttfb: VitalMetric
  overallScore: number // 0-100
}

interface WebVitalsData {
  period: {
    startDate: string
    endDate: string
  }
  overview: {
    avgLCP: number // ms
    avgFID: number // ms
    avgCLS: number // score
    avgFCP: number // ms
    avgTTFB: number // ms
    overallScore: number // 0-100
    goodPagePercentage: number // %
  }
  byPage: PageVitals[]
  byDevice: {
    device: string
    lcp: number
    fid: number
    cls: number
    score: number
  }[]
  byConnection: {
    connectionType: string
    avgLoadTime: number
    sampleSize: number
  }[]
  trends: {
    date: string
    lcp: number
    fid: number
    cls: number
  }[]
  insights: {
    slowestPages: string[]
    fastestPages: string[]
    mostImprovedMetric: string
    needsAttention: string[]
  }
  recommendations: {
    priority: 'high' | 'medium' | 'low'
    metric: string
    issue: string
    suggestion: string
  }[]
}

export async function GET(request: Request) {
  try {
    // 設定チェック
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

    // キャッシュチェック
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'

    if (!forceRefresh && cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        data: cachedData.data,
        cached: true,
      })
    }

    const credentials = getGoogleCredentials()
    const propertyId = process.env.GA4_PROPERTY_ID

    const analyticsDataClient = new BetaAnalyticsDataClient({ credentials })

    // 過去30日のデータを分析
    const startDate = '30daysAgo'
    const endDate = 'today'

    console.log('🔍 Web Vitals分析開始:', { startDate, endDate })

    // GA4からWeb Vitalsデータを取得
    // 注: これはカスタムイベントとして実装されている必要があります
    try {
      const webVitalsResponse = await analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [
          { name: 'eventCount' },
          { name: 'averageSessionDuration' },
        ],
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 20,
      })

      // データがない、または不十分な場合はデモデータを使用
      if (!webVitalsResponse[0].rows || webVitalsResponse[0].rows.length === 0) {
        console.log('⚠️ Web Vitalsデータなし、デモデータを使用')
        return NextResponse.json({
          demo: true,
          data: generateDemoData(),
        })
      }
    } catch (error) {
      console.log('⚠️ Web Vitalsデータ取得エラー、デモデータを使用:', error)
      return NextResponse.json({
        demo: true,
        data: generateDemoData(),
      })
    }

    // 実データがない場合はデモデータを返す
    console.log('⚠️ Web Vitalsは専用実装が必要、デモデータを使用')
    const data = generateDemoData()

    // キャッシュ更新
    cachedData = { data, timestamp: Date.now() }

    return NextResponse.json({
      data,
      demo: true,
      cached: false,
    })
  } catch (error) {
    console.error('Web Vitals API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch web vitals data',
        message: error instanceof Error ? error.message : 'Unknown error',
        demo: true,
        data: generateDemoData(),
      },
      { status: 200 }
    )
  }
}

// 評価を判定
function getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  switch (metric) {
    case 'LCP':
      return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor'
    case 'FID':
      return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor'
    case 'CLS':
      return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor'
    case 'FCP':
      return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor'
    case 'TTFB':
      return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor'
    default:
      return 'needs-improvement'
  }
}

// デモデータ生成
function generateDemoData(): WebVitalsData {
  const pages = [
    '/',
    '/partner-marketing',
    '/lab',
    '/knowledge/service-form',
    '/casestudy/freee',
    '/seminar',
  ]

  const byPage: PageVitals[] = pages.map((page, index) => {
    const lcpValue = 1800 + index * 300 + Math.random() * 500
    const fidValue = 80 + index * 20 + Math.random() * 50
    const clsValue = 0.05 + index * 0.03 + Math.random() * 0.05
    const fcpValue = 1200 + index * 200 + Math.random() * 400
    const ttfbValue = 500 + index * 100 + Math.random() * 300

    const scores = [
      getRating('LCP', lcpValue) === 'good' ? 100 : getRating('LCP', lcpValue) === 'needs-improvement' ? 60 : 30,
      getRating('FID', fidValue) === 'good' ? 100 : getRating('FID', fidValue) === 'needs-improvement' ? 60 : 30,
      getRating('CLS', clsValue) === 'good' ? 100 : getRating('CLS', clsValue) === 'needs-improvement' ? 60 : 30,
    ]
    const overallScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)

    return {
      page,
      lcp: {
        metric: 'LCP',
        value: Math.round(lcpValue),
        rating: getRating('LCP', lcpValue),
        percentile75: Math.round(lcpValue * 1.2),
        percentile95: Math.round(lcpValue * 1.5),
        sampleSize: Math.floor(500 + Math.random() * 1000),
      },
      fid: {
        metric: 'FID',
        value: Math.round(fidValue),
        rating: getRating('FID', fidValue),
        percentile75: Math.round(fidValue * 1.3),
        percentile95: Math.round(fidValue * 1.8),
        sampleSize: Math.floor(500 + Math.random() * 1000),
      },
      cls: {
        metric: 'CLS',
        value: Math.round(clsValue * 1000) / 1000,
        rating: getRating('CLS', clsValue),
        percentile75: Math.round(clsValue * 1.4 * 1000) / 1000,
        percentile95: Math.round(clsValue * 2.0 * 1000) / 1000,
        sampleSize: Math.floor(500 + Math.random() * 1000),
      },
      fcp: {
        metric: 'FCP',
        value: Math.round(fcpValue),
        rating: getRating('FCP', fcpValue),
        percentile75: Math.round(fcpValue * 1.2),
        percentile95: Math.round(fcpValue * 1.5),
        sampleSize: Math.floor(500 + Math.random() * 1000),
      },
      ttfb: {
        metric: 'TTFB',
        value: Math.round(ttfbValue),
        rating: getRating('TTFB', ttfbValue),
        percentile75: Math.round(ttfbValue * 1.3),
        percentile95: Math.round(ttfbValue * 1.7),
        sampleSize: Math.floor(500 + Math.random() * 1000),
      },
      overallScore,
    }
  })

  const avgLCP = Math.round(byPage.reduce((sum, p) => sum + p.lcp.value, 0) / byPage.length)
  const avgFID = Math.round(byPage.reduce((sum, p) => sum + p.fid.value, 0) / byPage.length)
  const avgCLS = Math.round((byPage.reduce((sum, p) => sum + p.cls.value, 0) / byPage.length) * 1000) / 1000
  const avgFCP = Math.round(byPage.reduce((sum, p) => sum + p.fcp.value, 0) / byPage.length)
  const avgTTFB = Math.round(byPage.reduce((sum, p) => sum + p.ttfb.value, 0) / byPage.length)
  const overallScore = Math.round(byPage.reduce((sum, p) => sum + p.overallScore, 0) / byPage.length)
  const goodPagePercentage = Math.round((byPage.filter(p => p.overallScore >= 80).length / byPage.length) * 100)

  // 日別トレンド（過去7日）
  const trends = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    trends.push({
      date: date.toISOString().split('T')[0],
      lcp: Math.round(avgLCP + (Math.random() - 0.5) * 400),
      fid: Math.round(avgFID + (Math.random() - 0.5) * 40),
      cls: Math.round((avgCLS + (Math.random() - 0.5) * 0.05) * 1000) / 1000,
    })
  }

  return {
    period: {
      startDate: '30daysAgo',
      endDate: 'today',
    },
    overview: {
      avgLCP,
      avgFID,
      avgCLS,
      avgFCP,
      avgTTFB,
      overallScore,
      goodPagePercentage,
    },
    byPage,
    byDevice: [
      { device: 'desktop', lcp: avgLCP - 300, fid: avgFID - 20, cls: avgCLS - 0.02, score: overallScore + 5 },
      { device: 'mobile', lcp: avgLCP + 500, fid: avgFID + 30, cls: avgCLS + 0.03, score: overallScore - 10 },
      { device: 'tablet', lcp: avgLCP + 200, fid: avgFID + 10, cls: avgCLS + 0.01, score: overallScore - 3 },
    ],
    byConnection: [
      { connectionType: '4g', avgLoadTime: avgLCP + 200, sampleSize: 2500 },
      { connectionType: '3g', avgLoadTime: avgLCP + 1200, sampleSize: 450 },
      { connectionType: 'wifi', avgLoadTime: avgLCP - 400, sampleSize: 3200 },
    ],
    trends,
    insights: {
      slowestPages: byPage.sort((a, b) => b.lcp.value - a.lcp.value).slice(0, 3).map(p => p.page),
      fastestPages: byPage.sort((a, b) => a.lcp.value - b.lcp.value).slice(0, 3).map(p => p.page),
      mostImprovedMetric: 'FCP',
      needsAttention: byPage.filter(p => p.overallScore < 60).map(p => p.page),
    },
    recommendations: [
      {
        priority: 'high',
        metric: 'LCP',
        issue: 'モバイルでのLCPが4秒を超えています',
        suggestion: '画像の最適化、CDN利用、サーバーレスポンス改善を検討してください',
      },
      {
        priority: 'medium',
        metric: 'CLS',
        issue: 'レイアウトシフトが発生しています',
        suggestion: '画像とiframeにwidth/heightを明示的に指定してください',
      },
      {
        priority: 'medium',
        metric: 'TTFB',
        issue: 'サーバーレスポンスが遅い',
        suggestion: 'キャッシュの最適化、サーバーパフォーマンスの改善を検討してください',
      },
    ],
  }
}







