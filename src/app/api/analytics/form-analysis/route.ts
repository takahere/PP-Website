import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'

let cachedData: { data: unknown; timestamp: number } | null = null
const CACHE_DURATION = 10 * 60 * 1000

export async function GET(request: Request) {
  try {
    if (!isGoogleConfigured()) {
      return NextResponse.json({
        error: 'Google Analytics is not configured',
        demo: true,
        data: generateDemoData(),
      })
    }

    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'

    if (!forceRefresh && cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json({ data: cachedData.data, cached: true })
    }

    console.log('🔍 フォーム分析開始')
    const data = generateDemoData()
    cachedData = { data, timestamp: Date.now() }

    return NextResponse.json({ data, demo: true, cached: false })
  } catch (error) {
    console.error('Form Analysis API Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch form analysis data',
      demo: true,
      data: generateDemoData(),
    })
  }
}

function generateDemoData() {
  return {
    period: { startDate: '30daysAgo', endDate: 'today' },
    overview: {
      formStarts: 1850,
      formSubmits: 685,
      completionRate: 37.0,
      avgCompletionTime: 185,
    },
    byForm: [
      {
        formName: 'サービス資料請求フォーム',
        starts: 980,
        submits: 420,
        completionRate: 42.9,
        avgTime: 165,
        dropoffFields: [
          { field: '会社名', dropoffs: 145, percentage: 14.8 },
          { field: '電話番号', dropoffs: 98, percentage: 10.0 },
        ],
      },
      {
        formName: 'お問い合わせフォーム',
        starts: 620,
        submits: 185,
        completionRate: 29.8,
        avgTime: 220,
        dropoffFields: [
          { field: 'お問い合わせ内容', dropoffs: 186, percentage: 30.0 },
          { field: '予算', dropoffs: 93, percentage: 15.0 },
        ],
      },
    ],
    fieldAnalysis: [
      { field: '会社名', avgFillTime: 8, errorRate: 2.5, dropoffRate: 12.0 },
      { field: 'メールアドレス', avgFillTime: 12, errorRate: 8.5, dropoffRate: 5.0 },
      { field: '電話番号', avgFillTime: 15, errorRate: 12.0, dropoffRate: 18.0 },
    ],
    insights: {
      problematicForms: ['お問い合わせフォーム'],
      highDropoffFields: ['電話番号', 'お問い合わせ内容'],
      recommendations: [
        { priority: 'high', issue: '電話番号入力で離脱多い', suggestion: '任意項目に変更' },
      ],
    },
  }
}














