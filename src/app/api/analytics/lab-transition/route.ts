import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'

// キャッシュ用
let cachedData: { data: TransitionData; timestamp: number } | null = null
const CACHE_DURATION = 10 * 60 * 1000 // 10分

// 遷移先の定義
const SERVICE_DESTINATIONS = [
  { path: '/partner-marketing', label: 'サービスサイト' },
  { path: '/casestudy/', label: '導入事例' },
  { path: '/knowledge/', label: 'お役立ち資料' },
  { path: '/seminar/', label: 'セミナー' },
]

interface DestinationData {
  destination: string
  destinationLabel: string
  sessions: number
  percentage: number
}

interface SourceArticleData {
  articlePath: string
  articleTitle: string
  transitionSessions: number
  transitionRate: number
}

interface TransitionSummary {
  labSessions: number
  transitionSessions: number
  transitionRate: number
  trend: number
}

interface TransitionData {
  period: {
    startDate: string
    endDate: string
  }
  summary: TransitionSummary
  byDestination: DestinationData[]
  bySourceArticle: SourceArticleData[]
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

    // 前月比較用
    const previousStartDate = '60daysAgo'
    const previousEndDate = '31daysAgo'

    // 並列でデータを取得
    const [
      labSessionsResponse,
      labToServiceResponse,
      previousLabSessionsResponse,
      previousLabToServiceResponse,
      labArticlesResponse,
    ] = await Promise.all([
      // 1. Lab記事の総セッション数
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        metrics: [{ name: 'sessions' }],
        dimensionFilter: {
          filter: {
            fieldName: 'landingPage',
            stringFilter: {
              matchType: 'BEGINS_WITH',
              value: '/lab/',
            },
          },
        },
      }),
      // 2. Lab → サービスサイトへの遷移（セッション内でLabとサービスページを両方閲覧）
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'sessions' }],
        dimensionFilter: {
          andGroup: {
            expressions: [
              {
                filter: {
                  fieldName: 'landingPage',
                  stringFilter: {
                    matchType: 'BEGINS_WITH',
                    value: '/lab/',
                  },
                },
              },
              {
                orGroup: {
                  expressions: SERVICE_DESTINATIONS.map(dest => ({
                    filter: {
                      fieldName: 'pagePath',
                      stringFilter: {
                        matchType: dest.path.endsWith('/') ? 'BEGINS_WITH' : 'EXACT',
                        value: dest.path,
                      },
                    },
                  })),
                },
              },
            ],
          },
        },
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 50,
      }),
      // 3. 前月のLabセッション数
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: previousStartDate, endDate: previousEndDate }],
        metrics: [{ name: 'sessions' }],
        dimensionFilter: {
          filter: {
            fieldName: 'landingPage',
            stringFilter: {
              matchType: 'BEGINS_WITH',
              value: '/lab/',
            },
          },
        },
      }),
      // 4. 前月のLab → サービス遷移
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: previousStartDate, endDate: previousEndDate }],
        metrics: [{ name: 'sessions' }],
        dimensionFilter: {
          andGroup: {
            expressions: [
              {
                filter: {
                  fieldName: 'landingPage',
                  stringFilter: {
                    matchType: 'BEGINS_WITH',
                    value: '/lab/',
                  },
                },
              },
              {
                orGroup: {
                  expressions: SERVICE_DESTINATIONS.map(dest => ({
                    filter: {
                      fieldName: 'pagePath',
                      stringFilter: {
                        matchType: dest.path.endsWith('/') ? 'BEGINS_WITH' : 'EXACT',
                        value: dest.path,
                      },
                    },
                  })),
                },
              },
            ],
          },
        },
      }),
      // 5. Lab記事別の遷移数
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'landingPage' }, { name: 'landingPagePlusQueryString' }],
        metrics: [{ name: 'sessions' }],
        dimensionFilter: {
          andGroup: {
            expressions: [
              {
                filter: {
                  fieldName: 'landingPage',
                  stringFilter: {
                    matchType: 'BEGINS_WITH',
                    value: '/lab/',
                  },
                },
              },
              {
                orGroup: {
                  expressions: SERVICE_DESTINATIONS.map(dest => ({
                    filter: {
                      fieldName: 'pagePath',
                      stringFilter: {
                        matchType: dest.path.endsWith('/') ? 'BEGINS_WITH' : 'EXACT',
                        value: dest.path,
                      },
                    },
                  })),
                },
              },
            ],
          },
        },
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 20,
      }),
    ])

    // データ集計
    const labSessions = Number(labSessionsResponse[0].rows?.[0]?.metricValues?.[0]?.value) || 0
    const previousLabSessions = Number(previousLabSessionsResponse[0].rows?.[0]?.metricValues?.[0]?.value) || 0

    // 遷移先別集計
    const destinationMap = new Map<string, number>()
    labToServiceResponse[0].rows?.forEach(row => {
      const pagePath = row.dimensionValues?.[0]?.value || ''
      const sessions = Number(row.metricValues?.[0]?.value) || 0

      for (const dest of SERVICE_DESTINATIONS) {
        if (pagePath.startsWith(dest.path) || pagePath === dest.path.replace(/\/$/, '')) {
          const current = destinationMap.get(dest.label) || 0
          destinationMap.set(dest.label, current + sessions)
          break
        }
      }
    })

    const transitionSessions = Array.from(destinationMap.values()).reduce((a, b) => a + b, 0)
    const previousTransitionSessions = Number(previousLabToServiceResponse[0].rows?.[0]?.metricValues?.[0]?.value) || 0

    // 遷移率計算
    const transitionRate = labSessions > 0
      ? Math.round((transitionSessions / labSessions) * 10000) / 100
      : 0
    const previousTransitionRate = previousLabSessions > 0
      ? Math.round((previousTransitionSessions / previousLabSessions) * 10000) / 100
      : 0
    const trend = previousTransitionRate > 0
      ? Math.round(((transitionRate - previousTransitionRate) / previousTransitionRate) * 100)
      : 0

    // 遷移先別データ
    const byDestination: DestinationData[] = Array.from(destinationMap.entries())
      .map(([label, sessions]) => ({
        destination: SERVICE_DESTINATIONS.find(d => d.label === label)?.path || '',
        destinationLabel: label,
        sessions,
        percentage: transitionSessions > 0 ? Math.round((sessions / transitionSessions) * 100) : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions)

    // 記事別遷移データ
    const articleMap = new Map<string, { sessions: number; title: string }>()
    labArticlesResponse[0].rows?.forEach(row => {
      const path = row.dimensionValues?.[0]?.value || ''
      const sessions = Number(row.metricValues?.[0]?.value) || 0

      if (path && path !== '/lab' && path !== '/lab/') {
        const existing = articleMap.get(path)
        if (existing) {
          existing.sessions += sessions
        } else {
          articleMap.set(path, { sessions, title: path })
        }
      }
    })

    // Lab記事別のセッション数を取得（遷移率計算用）
    const labArticleSessionsResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'landingPage' }],
      metrics: [{ name: 'sessions' }],
      dimensionFilter: {
        filter: {
          fieldName: 'landingPage',
          stringFilter: {
            matchType: 'BEGINS_WITH',
            value: '/lab/',
          },
        },
      },
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 50,
    })

    const articleSessionsMap = new Map<string, number>()
    labArticleSessionsResponse[0].rows?.forEach(row => {
      const path = row.dimensionValues?.[0]?.value || ''
      const sessions = Number(row.metricValues?.[0]?.value) || 0
      articleSessionsMap.set(path, sessions)
    })

    const bySourceArticle: SourceArticleData[] = Array.from(articleMap.entries())
      .map(([path, data]) => {
        const totalSessions = articleSessionsMap.get(path) || data.sessions
        return {
          articlePath: path,
          articleTitle: data.title,
          transitionSessions: data.sessions,
          transitionRate: totalSessions > 0
            ? Math.round((data.sessions / totalSessions) * 10000) / 100
            : 0,
        }
      })
      .sort((a, b) => b.transitionSessions - a.transitionSessions)
      .slice(0, 10)

    const data: TransitionData = {
      period: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      },
      summary: {
        labSessions,
        transitionSessions,
        transitionRate,
        trend,
      },
      byDestination,
      bySourceArticle,
    }

    // キャッシュ更新
    cachedData = { data, timestamp: Date.now() }

    return NextResponse.json({
      data,
      cached: false,
    })
  } catch (error) {
    console.error('Lab Transition API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch lab transition data',
        message: error instanceof Error ? error.message : 'Unknown error',
        demo: true,
        data: generateDemoData(),
      },
      { status: 200 }
    )
  }
}

// デモデータ生成
function generateDemoData(): TransitionData {
  return {
    period: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    },
    summary: {
      labSessions: 4520,
      transitionSessions: 135,
      transitionRate: 2.99,
      trend: 12,
    },
    byDestination: [
      { destination: '/partner-marketing', destinationLabel: 'サービスサイト', sessions: 68, percentage: 50 },
      { destination: '/casestudy/', destinationLabel: '導入事例', sessions: 35, percentage: 26 },
      { destination: '/knowledge/', destinationLabel: 'お役立ち資料', sessions: 22, percentage: 16 },
      { destination: '/seminar/', destinationLabel: 'セミナー', sessions: 10, percentage: 8 },
    ],
    bySourceArticle: [
      { articlePath: '/lab/agency/prm/123', articleTitle: 'PRMツール完全ガイド', transitionSessions: 28, transitionRate: 4.2 },
      { articlePath: '/lab/strategy-planning/456', articleTitle: 'パートナー戦略の立て方', transitionSessions: 22, transitionRate: 3.8 },
      { articlePath: '/lab/optimization/789', articleTitle: 'パートナー最適化戦略', transitionSessions: 18, transitionRate: 3.1 },
      { articlePath: '/lab/marketing/101', articleTitle: 'パートナーマーケティング入門', transitionSessions: 15, transitionRate: 2.8 },
      { articlePath: '/lab/case-analysis/202', articleTitle: '成功事例分析', transitionSessions: 12, transitionRate: 2.5 },
    ],
  }
}
