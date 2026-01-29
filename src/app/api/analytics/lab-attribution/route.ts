import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'

// キャッシュ用
let cachedData: { data: AttributionData; timestamp: number } | null = null
const CACHE_DURATION = 10 * 60 * 1000 // 10分

interface AttributionData {
  period: {
    startDate: string
    endDate: string
  }
  labVisitors: {
    totalUsers: number // /labを訪問したユニークユーザー数
    pageviews: number
  }
  downloadUsers: {
    totalUsers: number // 資料ダウンロードしたユニークユーザー数
    totalDownloads: number
  }
  directAttribution: {
    users: number // /labをランディングページとしてDLしたユーザー数
    downloads: number // /labをランディングページとしてのDL数
  }
  estimatedIndirectContribution: {
    potentialInfluencedUsers: number // /labを訪問し、かつDLもしたユーザー（推定）
    contributionRate: number // 推定貢献率 (%)
  }
  insights: {
    directCvr: number // 直接CVR (%)
    overallDownloadRate: number // サイト全体のDL率 (%)
    labVisitorDownloadRate: number // /lab訪問者のDL率推定 (%)
  }
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

    // 過去6ヶ月のデータを分析
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const startDate = sixMonthsAgo.toISOString().split('T')[0]
    const endDate = 'today'

    console.log('🔍 アトリビューション分析開始:', { startDate, endDate })

    // 並列でデータを取得
    const [
      labVisitorsResponse,
      downloadUsersResponse,
      directAttributionResponse,
    ] = await Promise.all([
      // 1. /labページを訪問したユーザー数
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'pagePath',
            stringFilter: {
              matchType: 'BEGINS_WITH',
              value: '/lab',
            },
          },
        },
      }),
      // 2. 資料ダウンロードしたユーザー数
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'eventCount' },
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: {
              value: '資料ダウンロード',
            },
          },
        },
      }),
      // 3. /labをランディングページとしてDLしたユーザー数
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }], // セッションスコープ用
        metrics: [
          { name: 'activeUsers' },
          { name: 'eventCount' },
        ],
        dimensionFilter: {
          andGroup: {
            expressions: [
              {
                filter: {
                  fieldName: 'eventName',
                  stringFilter: { value: '資料ダウンロード' },
                },
              },
              {
                filter: {
                  fieldName: 'landingPage',
                  stringFilter: { matchType: 'BEGINS_WITH', value: '/lab' },
                },
              },
            ],
          },
        },
      }),
    ])

    // データを集計
    const labVisitors = {
      totalUsers: Number(labVisitorsResponse[0].rows?.[0]?.metricValues?.[0]?.value) || 0,
      pageviews: Number(labVisitorsResponse[0].rows?.[0]?.metricValues?.[1]?.value) || 0,
    }

    const downloadUsers = {
      totalUsers: Number(downloadUsersResponse[0].rows?.[0]?.metricValues?.[0]?.value) || 0,
      totalDownloads: Number(downloadUsersResponse[0].rows?.[0]?.metricValues?.[1]?.value) || 0,
    }

    // 直接アトリビューション（チャネル別を合計）
    const directUsers = directAttributionResponse[0].rows?.reduce(
      (sum, row) => sum + Number(row.metricValues?.[0]?.value || 0),
      0
    ) || 0
    const directDownloads = directAttributionResponse[0].rows?.reduce(
      (sum, row) => sum + Number(row.metricValues?.[1]?.value || 0),
      0
    ) || 0

    const directAttribution = {
      users: directUsers,
      downloads: directDownloads,
    }

    // 間接貢献の推定
    // 仮定: /labを訪問したユーザーのうち、DLした人数は
    // (全体のDLユーザー数) × (/lab訪問者数 / 全体のユーザー数) で推定
    // ただし、直接DLした人数は除く
    const potentialInfluencedUsers = Math.max(
      0,
      Math.round((downloadUsers.totalUsers * labVisitors.totalUsers) / (labVisitors.totalUsers + downloadUsers.totalUsers)) - directUsers
    )

    const contributionRate = downloadUsers.totalUsers > 0
      ? Math.round((potentialInfluencedUsers / downloadUsers.totalUsers) * 10000) / 100
      : 0

    const estimatedIndirectContribution = {
      potentialInfluencedUsers,
      contributionRate,
    }

    // インサイトを計算
    const directCvr = labVisitors.totalUsers > 0
      ? Math.round((directUsers / labVisitors.totalUsers) * 10000) / 100
      : 0

    const overallDownloadRate = 0 // サイト全体のユーザー数が必要（別途取得）

    const labVisitorDownloadRate = labVisitors.totalUsers > 0
      ? Math.round(((directUsers + potentialInfluencedUsers) / labVisitors.totalUsers) * 10000) / 100
      : 0

    const insights = {
      directCvr,
      overallDownloadRate,
      labVisitorDownloadRate,
    }

    const data: AttributionData = {
      period: { startDate, endDate },
      labVisitors,
      downloadUsers,
      directAttribution,
      estimatedIndirectContribution,
      insights,
    }

    console.log('📊 アトリビューション分析結果:', data)

    // キャッシュ更新
    cachedData = { data, timestamp: Date.now() }

    return NextResponse.json({
      data,
      cached: false,
    })
  } catch (error) {
    console.error('Attribution API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch attribution data',
        message: error instanceof Error ? error.message : 'Unknown error',
        demo: true,
        data: generateDemoData(),
      },
      { status: 200 }
    )
  }
}

// デモデータ生成
function generateDemoData(): AttributionData {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const startDate = sixMonthsAgo.toISOString().split('T')[0]

  return {
    period: {
      startDate,
      endDate: new Date().toISOString().split('T')[0],
    },
    labVisitors: {
      totalUsers: 18309, // /labを訪問したユーザー
      pageviews: 62194,
    },
    downloadUsers: {
      totalUsers: 285, // DLしたユーザー総数
      totalDownloads: 632,
    },
    directAttribution: {
      users: 28, // /labから直接DL
      downloads: 30,
    },
    estimatedIndirectContribution: {
      potentialInfluencedUsers: 95, // 推定間接影響ユーザー
      contributionRate: 33.3, // 全DLユーザーの33%
    },
    insights: {
      directCvr: 0.15, // 直接CVR
      overallDownloadRate: 1.56, // サイト全体
      labVisitorDownloadRate: 0.67, // /lab訪問者のDL率
    },
  }
}














