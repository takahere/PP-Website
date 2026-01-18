import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'

// キャッシュ用
let cachedData: { data: LabMetrics; timestamp: number } | null = null
const CACHE_DURATION = 10 * 60 * 1000 // 10分

interface MonthlyData {
  month: string // YYYYMM形式
  users: number
  pageviews: number
  downloads: number
  formSubmissions: number
  cvr: number // ダウンロード率 (%)
}

interface LabMetrics {
  currentMonth: MonthlyData
  previousMonths: MonthlyData[]
  summary: {
    totalUsers: number
    totalDownloads: number
    totalFormSubmissions: number
    avgCvr: number
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

    // 過去6ヶ月のデータを取得
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const startDate = sixMonthsAgo.toISOString().split('T')[0]

    const isDebugMode = process.env.ANALYTICS_DEBUG === 'true'
    
    if (isDebugMode) {
      console.log('🔍 Lab Metrics API: デバッグモード開始')
      console.log('  期間:', startDate, '〜 today')
      console.log('  プロパティID:', propertyId)
    }

    // 並列でデータを取得
    const [monthlyUsersResponse, labLandingDownloadsResponse, formSubmissionsResponse] = await Promise.all([
      // パートナーラボの月次ユーザー数とPV
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate: 'today' }],
        dimensions: [{ name: 'yearMonth' }],
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
        orderBys: [{ dimension: { dimensionName: 'yearMonth' } }],
      }),
      // 資料ダウンロード数（/labをランディングページとするセッションから）
      // sessionDefaultChannelGroupをディメンションに含めることでセッションスコープのクエリにする
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate: 'today' }],
        dimensions: [
          { name: 'yearMonth' },
          { name: 'sessionDefaultChannelGroup' }, // セッションスコープのディメンション
        ],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          andGroup: {
            expressions: [
              {
                filter: {
                  fieldName: 'eventName',
                  stringFilter: {
                    value: '資料ダウンロード',
                  },
                },
              },
              {
                filter: {
                  fieldName: 'landingPage',
                  stringFilter: {
                    matchType: 'BEGINS_WITH',
                    value: '/lab',
                  },
                },
              },
            ],
          },
        },
      }),
      // 取材フォーム送信数（/lab/inquiry/ページ）
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate: 'today' }],
        dimensions: [{ name: 'yearMonth' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          andGroup: {
            expressions: [
              {
                filter: {
                  fieldName: 'eventName',
                  stringFilter: {
                    value: 'form_submit',
                  },
                },
              },
              {
                filter: {
                  fieldName: 'pagePath',
                  stringFilter: {
                    matchType: 'CONTAINS',
                    value: '/lab/inquiry',
                  },
                },
              },
            ],
          },
        },
        orderBys: [{ dimension: { dimensionName: 'yearMonth' } }],
      }),
    ])

    // データを月次ごとにマッピング
    const monthlyDataMap = new Map<string, MonthlyData>()

    // ユーザー数とPVを追加
    monthlyUsersResponse[0].rows?.forEach((row) => {
      const month = row.dimensionValues?.[0]?.value || ''
      monthlyDataMap.set(month, {
        month,
        users: Number(row.metricValues?.[0]?.value) || 0,
        pageviews: Number(row.metricValues?.[1]?.value) || 0,
        downloads: 0,
        formSubmissions: 0,
        cvr: 0,
      })
    })

    // ダウンロード数を追加（/labランディングページから）
    // 注: sessionDefaultChannelGroupディメンションを含めたため、
    // 同じ月に複数行（チャネルごと）が返ってくるので合計する
    if (isDebugMode) {
      console.log('🔍 /lab起因のダウンロードデータ（詳細）:')
      console.log('  総行数:', labLandingDownloadsResponse[0].rows?.length || 0)
      console.log('  生データ:', labLandingDownloadsResponse[0].rows?.map(row => ({
        month: row.dimensionValues?.[0]?.value,
        channel: row.dimensionValues?.[1]?.value,
        count: row.metricValues?.[0]?.value,
      })))
    }

    labLandingDownloadsResponse[0].rows?.forEach((row) => {
      const month = row.dimensionValues?.[0]?.value || ''
      const channel = row.dimensionValues?.[1]?.value || ''
      const count = Number(row.metricValues?.[0]?.value) || 0
      
      if (isDebugMode) {
        console.log(`  📊 ${month} (${channel}): ${count}件`)
      }
      
      const data = monthlyDataMap.get(month)
      if (data) {
        data.downloads += count
      }
    })

    if (isDebugMode) {
      console.log('📈 月次集計後のダウンロード数:', 
        Array.from(monthlyDataMap.values()).map(d => ({
          month: d.month,
          downloads: d.downloads
        }))
      )
    }

    // 🧪 デバッグ: 全ての資料ダウンロードのランディングページ別内訳を取得
    if (isDebugMode) {
      try {
        const allDownloadsResponse = await analyticsDataClient.runReport({
          property: `properties/${propertyId}`,
          dateRanges: [{ startDate, endDate: 'today' }],
          dimensions: [{ name: 'landingPage' }],
          metrics: [{ name: 'eventCount' }],
          dimensionFilter: {
            filter: {
              fieldName: 'eventName',
              stringFilter: { value: '資料ダウンロード' }
            }
          },
          orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
          limit: 20
        })

        console.log('📥 全ての「資料ダウンロード」イベントのランディングページ別内訳:')
        const totalAllDownloads = allDownloadsResponse[0].rows?.reduce((sum, row) => 
          sum + Number(row.metricValues?.[0]?.value || 0), 0) || 0
        console.log('  総件数:', totalAllDownloads)
        
        allDownloadsResponse[0].rows?.forEach(row => {
          const landing = row.dimensionValues?.[0]?.value || '(not set)'
          const count = row.metricValues?.[0]?.value
          const isLab = landing.startsWith('/lab')
          console.log(`  ${isLab ? '✅' : '  '} ${landing}: ${count}件`)
        })

        const labDownloadsSum = allDownloadsResponse[0].rows
          ?.filter(row => row.dimensionValues?.[0]?.value?.startsWith('/lab'))
          .reduce((sum, row) => sum + Number(row.metricValues?.[0]?.value || 0), 0) || 0
        console.log('  🎯 /lab起因のDL数（デバッグ集計）:', labDownloadsSum)

        // 月次×ランディングページの詳細クロス集計
        const monthlyLandingResponse = await analyticsDataClient.runReport({
          property: `properties/${propertyId}`,
          dateRanges: [{ startDate, endDate: 'today' }],
          dimensions: [
            { name: 'yearMonth' },
            { name: 'landingPage' }
          ],
          metrics: [{ name: 'eventCount' }],
          dimensionFilter: {
            andGroup: {
              expressions: [
                {
                  filter: {
                    fieldName: 'eventName',
                    stringFilter: { value: '資料ダウンロード' }
                  }
                },
                {
                  filter: {
                    fieldName: 'landingPage',
                    stringFilter: { matchType: 'BEGINS_WITH', value: '/lab' }
                  }
                }
              ]
            }
          },
          orderBys: [
            { dimension: { dimensionName: 'yearMonth' } },
            { metric: { metricName: 'eventCount' }, desc: true }
          ]
        })

        console.log('📅 月次×ランディングページのクロス集計:')
        monthlyLandingResponse[0].rows?.forEach(row => {
          const month = row.dimensionValues?.[0]?.value
          const landing = row.dimensionValues?.[1]?.value
          const count = row.metricValues?.[0]?.value
          console.log(`  ${month} | ${landing}: ${count}件`)
        })
      } catch (error) {
        console.error('デバッグクエリエラー:', error)
      }
    }

    // フォーム送信数を追加
    formSubmissionsResponse[0].rows?.forEach((row) => {
      const month = row.dimensionValues?.[0]?.value || ''
      const data = monthlyDataMap.get(month)
      if (data) {
        data.formSubmissions = Number(row.metricValues?.[0]?.value) || 0
      }
    })

    // CVRを計算
    monthlyDataMap.forEach((data) => {
      if (data.users > 0) {
        data.cvr = Math.round((data.downloads / data.users) * 10000) / 100
      }
    })

    // 配列に変換してソート
    const sortedData = Array.from(monthlyDataMap.values()).sort((a, b) =>
      b.month.localeCompare(a.month)
    )

    // 現在の月と過去の月に分割
    const currentMonth = sortedData[0] || generateEmptyMonthData()
    const previousMonths = sortedData.slice(1)

    // サマリー計算
    const totalUsers = sortedData.reduce((sum, d) => sum + d.users, 0)
    const totalDownloads = sortedData.reduce((sum, d) => sum + d.downloads, 0)
    const totalFormSubmissions = sortedData.reduce((sum, d) => sum + d.formSubmissions, 0)
    const avgCvr =
      totalUsers > 0 ? Math.round((totalDownloads / totalUsers) * 10000) / 100 : 0

    const data: LabMetrics = {
      currentMonth,
      previousMonths,
      summary: {
        totalUsers,
        totalDownloads,
        totalFormSubmissions,
        avgCvr,
      },
    }

    // キャッシュ更新
    cachedData = { data, timestamp: Date.now() }

    return NextResponse.json({
      data,
      cached: false,
    })
  } catch (error) {
    console.error('Lab Metrics API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch lab metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
        demo: true,
        data: generateDemoData(),
      },
      { status: 200 }
    )
  }
}

// 空の月データを生成
function generateEmptyMonthData(): MonthlyData {
  const now = new Date()
  const month = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  return {
    month,
    users: 0,
    pageviews: 0,
    downloads: 0,
    formSubmissions: 0,
    cvr: 0,
  }
}

// デモデータ生成
function generateDemoData(): LabMetrics {
  const now = new Date()
  const months: MonthlyData[] = []

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const month = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`
    const users = Math.round(800 + Math.random() * 400)
    const downloads = Math.round(users * (0.08 + Math.random() * 0.04))

    months.push({
      month,
      users,
      pageviews: Math.round(users * 3.2),
      downloads,
      formSubmissions: Math.round(downloads * 0.15),
      cvr: Math.round((downloads / users) * 10000) / 100,
    })
  }

  const totalUsers = months.reduce((sum, d) => sum + d.users, 0)
  const totalDownloads = months.reduce((sum, d) => sum + d.downloads, 0)
  const totalFormSubmissions = months.reduce((sum, d) => sum + d.formSubmissions, 0)

  return {
    currentMonth: months[months.length - 1],
    previousMonths: months.slice(0, -1).reverse(),
    summary: {
      totalUsers,
      totalDownloads,
      totalFormSubmissions,
      avgCvr: Math.round((totalDownloads / totalUsers) * 10000) / 100,
    },
  }
}

// 月フォーマット: YYYYMM -> YYYY年MM月
export function formatMonth(month: string): string {
  if (month.length !== 6) return month
  return `${month.slice(0, 4)}年${month.slice(4, 6)}月`
}

