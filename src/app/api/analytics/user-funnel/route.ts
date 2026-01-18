import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'

// キャッシュ用
let cachedData: { data: UserFunnelData; timestamp: number } | null = null
const CACHE_DURATION = 10 * 60 * 1000 // 10分

interface FunnelStep {
  step: number
  name: string
  users: number
  dropoffRate: number // %
  conversionRate: number // 最初のステップからの残存率 %
}

interface PathFlow {
  path: string // 例: "/ → /lab → /knowledge → DL"
  users: number
  percentage: number // %
  avgSteps: number
}

interface UserFunnelData {
  period: {
    startDate: string
    endDate: string
  }
  conversionFunnel: {
    steps: FunnelStep[]
    totalUsers: number
    finalConversions: number
    overallConversionRate: number // %
  }
  topUserFlows: PathFlow[]
  insights: {
    biggestDropoffStep: string
    mostCommonPath: string
    avgPagesBeforeConversion: number
    directConversionRate: number // 1ページでCVする割合
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

    // 過去30日のデータを分析
    const startDate = '30daysAgo'
    const endDate = 'today'

    console.log('🔍 ユーザーフロー/ファネル分析開始:', { startDate, endDate })

    // コンバージョンファネルを構築
    // Step 1: サイト訪問
    const step1Response = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: 'activeUsers' }],
    })

    // Step 2: /labページ訪問
    const step2Response = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: 'activeUsers' }],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'BEGINS_WITH',
            value: '/lab',
          },
        },
      },
    })

    // Step 3: ナレッジページ or フォームページ訪問
    const step3Response = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: 'activeUsers' }],
      dimensionFilter: {
        orGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'pagePath',
                stringFilter: {
                  matchType: 'BEGINS_WITH',
                  value: '/knowledge',
                },
              },
            },
            {
              filter: {
                fieldName: 'pagePath',
                stringFilter: {
                  matchType: 'CONTAINS',
                  value: 'form',
                },
              },
            },
          ],
        },
      },
    })

    // Step 4: 資料ダウンロード
    const step4Response = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: 'activeUsers' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            value: '資料ダウンロード',
          },
        },
      },
    })

    const totalUsers = Number(step1Response[0].rows?.[0]?.metricValues?.[0]?.value) || 0
    const labUsers = Number(step2Response[0].rows?.[0]?.metricValues?.[0]?.value) || 0
    const formUsers = Number(step3Response[0].rows?.[0]?.metricValues?.[0]?.value) || 0
    const convertedUsers = Number(step4Response[0].rows?.[0]?.metricValues?.[0]?.value) || 0

    // ファネルステップを構築
    const steps: FunnelStep[] = [
      {
        step: 1,
        name: 'サイト訪問',
        users: totalUsers,
        dropoffRate: 0,
        conversionRate: 100,
      },
      {
        step: 2,
        name: '/lab記事閲覧',
        users: labUsers,
        dropoffRate: totalUsers > 0 ? Math.round(((totalUsers - labUsers) / totalUsers) * 10000) / 100 : 0,
        conversionRate: totalUsers > 0 ? Math.round((labUsers / totalUsers) * 10000) / 100 : 0,
      },
      {
        step: 3,
        name: 'ナレッジ/フォーム閲覧',
        users: formUsers,
        dropoffRate: labUsers > 0 ? Math.round(((labUsers - formUsers) / labUsers) * 10000) / 100 : 0,
        conversionRate: totalUsers > 0 ? Math.round((formUsers / totalUsers) * 10000) / 100 : 0,
      },
      {
        step: 4,
        name: '資料ダウンロード',
        users: convertedUsers,
        dropoffRate: formUsers > 0 ? Math.round(((formUsers - convertedUsers) / formUsers) * 10000) / 100 : 0,
        conversionRate: totalUsers > 0 ? Math.round((convertedUsers / totalUsers) * 10000) / 100 : 0,
      },
    ]

    const overallConversionRate = totalUsers > 0
      ? Math.round((convertedUsers / totalUsers) * 10000) / 100
      : 0

    // よくあるユーザーフローパターンを取得
    // ランディングページ別の遷移パターン
    const landingToNextPageResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'landingPage' },
        { name: 'pagePath' },
      ],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 30,
    })

    // パスパターンを集約
    const pathPatterns = new Map<string, number>()
    landingToNextPageResponse[0].rows?.forEach((row) => {
      const landing = row.dimensionValues?.[0]?.value || ''
      const next = row.dimensionValues?.[1]?.value || ''
      const sessions = Number(row.metricValues?.[0]?.value) || 0

      if (landing !== next) {
        const pathKey = `${landing} → ${next}`
        pathPatterns.set(pathKey, (pathPatterns.get(pathKey) || 0) + sessions)
      }
    })

    const totalPathSessions = Array.from(pathPatterns.values()).reduce((sum, val) => sum + val, 0) || 1

    const topUserFlows: PathFlow[] = Array.from(pathPatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, users]) => ({
        path,
        users,
        percentage: Math.round((users / totalPathSessions) * 10000) / 100,
        avgSteps: 2, // 簡略化（実際はさらに詳細な分析が必要）
      }))

    // インサイトを計算
    let biggestDropoffStep = ''
    let maxDropoff = 0
    steps.forEach((step) => {
      if (step.dropoffRate > maxDropoff) {
        maxDropoff = step.dropoffRate
        biggestDropoffStep = step.name
      }
    })

    const mostCommonPath = topUserFlows[0]?.path || 'データなし'
    const avgPagesBeforeConversion = 2.5 // 簡略化
    const directConversionRate = totalUsers > 0
      ? Math.round((convertedUsers / totalUsers) * 10000) / 100
      : 0

    const insights = {
      biggestDropoffStep,
      mostCommonPath,
      avgPagesBeforeConversion,
      directConversionRate,
    }

    const data: UserFunnelData = {
      period: { startDate, endDate },
      conversionFunnel: {
        steps,
        totalUsers,
        finalConversions: convertedUsers,
        overallConversionRate,
      },
      topUserFlows,
      insights,
    }

    console.log('📊 ファネル分析結果:', {
      総ユーザー: totalUsers,
      CV数: convertedUsers,
      全体CVR: `${overallConversionRate}%`,
      最大離脱: biggestDropoffStep,
    })

    // キャッシュ更新
    cachedData = { data, timestamp: Date.now() }

    return NextResponse.json({
      data,
      cached: false,
    })
  } catch (error) {
    console.error('User Funnel API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch user funnel data',
        message: error instanceof Error ? error.message : 'Unknown error',
        demo: true,
        data: generateDemoData(),
      },
      { status: 200 }
    )
  }
}

// デモデータ生成
function generateDemoData(): UserFunnelData {
  return {
    period: {
      startDate: '30daysAgo',
      endDate: 'today',
    },
    conversionFunnel: {
      steps: [
        {
          step: 1,
          name: 'サイト訪問',
          users: 10000,
          dropoffRate: 0,
          conversionRate: 100,
        },
        {
          step: 2,
          name: '/lab記事閲覧',
          users: 3500,
          dropoffRate: 65,
          conversionRate: 35,
        },
        {
          step: 3,
          name: 'ナレッジ/フォーム閲覧',
          users: 1200,
          dropoffRate: 65.71,
          conversionRate: 12,
        },
        {
          step: 4,
          name: '資料ダウンロード',
          users: 280,
          dropoffRate: 76.67,
          conversionRate: 2.8,
        },
      ],
      totalUsers: 10000,
      finalConversions: 280,
      overallConversionRate: 2.8,
    },
    topUserFlows: [
      {
        path: '/ → /partner-marketing',
        users: 856,
        percentage: 15.3,
        avgSteps: 2,
      },
      {
        path: '/ → /lab',
        users: 623,
        percentage: 11.1,
        avgSteps: 2,
      },
      {
        path: '/lab → /knowledge/service-form',
        users: 445,
        percentage: 7.9,
        avgSteps: 2,
      },
    ],
    insights: {
      biggestDropoffStep: 'ナレッジ/フォーム閲覧',
      mostCommonPath: '/ → /partner-marketing',
      avgPagesBeforeConversion: 2.8,
      directConversionRate: 2.8,
    },
  }
}







