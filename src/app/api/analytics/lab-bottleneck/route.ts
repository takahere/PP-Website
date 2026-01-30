import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { getGoogleCredentials, isGoogleConfigured, isGSCConfigured } from '@/lib/google-auth'

// キャッシュ用
let cachedData: { data: BottleneckData; timestamp: number } | null = null
const CACHE_DURATION = 15 * 60 * 1000 // 15分

type BottleneckType = 'ctr' | 'cvr' | 'impressions' | 'healthy'
type Priority = 'high' | 'medium' | 'low'

interface ArticleMetrics {
  position: number
  impressions: number
  clicks: number
  ctr: number
  sessions: number
  downloads: number
  cvr: number
}

interface BottleneckInfo {
  type: BottleneckType
  label: string
  priority: Priority
  suggestion: string
}

interface ArticleBottleneck {
  path: string
  title: string
  metrics: ArticleMetrics
  bottleneck: BottleneckInfo
}

interface BottleneckSummary {
  totalArticles: number
  healthyCount: number
  ctrIssueCount: number
  cvrIssueCount: number
  impIssueCount: number
}

interface BottleneckData {
  period: {
    startDate: string
    endDate: string
  }
  articles: ArticleBottleneck[]
  summary: BottleneckSummary
}

// ボトルネック診断ロジック
function diagnoseBottleneck(metrics: ArticleMetrics): BottleneckInfo {
  // 順位が良いがCTRが低い → タイトル改善
  if (metrics.position <= 10 && metrics.ctr < 3) {
    return {
      type: 'ctr',
      label: 'タイトル改善',
      priority: 'high',
      suggestion: `順位${Math.round(metrics.position)}位と良好ですが、CTR${metrics.ctr}%は業界平均(3%)を下回っています。タイトルとディスクリプションを魅力的に書き換えましょう。`,
    }
  }

  // セッション多いがCVRが低い → 導線改善
  if (metrics.sessions >= 100 && metrics.cvr < 1) {
    return {
      type: 'cvr',
      label: '導線改善',
      priority: 'high',
      suggestion: `月間${metrics.sessions}セッションと流入がありますが、CVR${metrics.cvr}%は低めです。CTAボタンの配置やサービスサイトへの導線を見直しましょう。`,
    }
  }

  // 順位が低い → コンテンツ改善
  if (metrics.position > 20) {
    return {
      type: 'impressions',
      label: 'コンテンツ改善',
      priority: 'medium',
      suggestion: `平均順位${Math.round(metrics.position)}位と検索上位に表示されていません。記事のリライトや被リンク獲得で順位向上を目指しましょう。`,
    }
  }

  // 問題なし
  return {
    type: 'healthy',
    label: '良好',
    priority: 'low',
    suggestion: '現在のパフォーマンスは良好です。引き続きコンテンツの質を維持しましょう。',
  }
}

export async function GET(request: Request) {
  try {
    // 設定チェック
    if (!isGoogleConfigured() || !isGSCConfigured()) {
      return NextResponse.json(
        {
          error: 'Google Analytics or Search Console is not configured',
          message: 'Please set GOOGLE_SERVICE_ACCOUNT_JSON, GA4_PROPERTY_ID, and GSC_SITE_URL',
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
    const siteUrl = process.env.GSC_SITE_URL

    // GSC API設定
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    })
    const searchconsole = google.searchconsole({ version: 'v1', auth })

    // GA4 API設定
    const analyticsDataClient = new BetaAnalyticsDataClient({ credentials })

    // 日付範囲（過去28日）
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 28)
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    // 1. GSCから/lab/の各ページのデータを取得
    const gscResponse = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDateStr,
        endDate: endDateStr,
        dimensions: ['page'],
        dimensionFilterGroups: [
          {
            filters: [
              {
                dimension: 'page',
                operator: 'contains',
                expression: '/lab/',
              },
            ],
          },
        ],
        rowLimit: 100,
      },
    })

    // GSCデータをMapに格納
    const gscDataMap = new Map<string, { position: number; impressions: number; clicks: number; ctr: number }>()
    gscResponse.data.rows?.forEach(row => {
      const pageUrl = row.keys?.[0] || ''
      // URLからパスを抽出
      try {
        const url = new URL(pageUrl)
        const path = url.pathname
        if (path.startsWith('/lab/') && path !== '/lab/' && !path.includes('/category/') && !path.includes('/tag/') && !path.includes('/content_type/')) {
          gscDataMap.set(path, {
            position: row.position || 0,
            impressions: row.impressions || 0,
            clicks: row.clicks || 0,
            ctr: (row.ctr || 0) * 100, // パーセントに変換
          })
        }
      } catch {
        // URL解析エラーは無視
      }
    })

    // 2. GA4から/labページのセッション数とダウンロード数を取得
    const [labSessionsResponse, labDownloadsResponse] = await Promise.all([
      // セッション数
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: startDateStr, endDate: endDateStr }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'sessions' }],
        dimensionFilter: {
          filter: {
            fieldName: 'pagePath',
            stringFilter: {
              matchType: 'BEGINS_WITH',
              value: '/lab/',
            },
          },
        },
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 100,
      }),
      // ダウンロード数（ランディングページベース）
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: startDateStr, endDate: endDateStr }],
        dimensions: [{ name: 'landingPage' }],
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
                    value: '/lab/',
                  },
                },
              },
            ],
          },
        },
        limit: 100,
      }),
    ])

    // GA4データをMapに格納
    const sessionsMap = new Map<string, number>()
    labSessionsResponse[0].rows?.forEach(row => {
      const path = row.dimensionValues?.[0]?.value || ''
      const sessions = Number(row.metricValues?.[0]?.value) || 0
      if (path && path !== '/lab' && path !== '/lab/') {
        sessionsMap.set(path, sessions)
      }
    })

    const downloadsMap = new Map<string, number>()
    labDownloadsResponse[0].rows?.forEach(row => {
      const path = row.dimensionValues?.[0]?.value || ''
      const downloads = Number(row.metricValues?.[0]?.value) || 0
      if (path && path !== '/lab' && path !== '/lab/') {
        downloadsMap.set(path, downloads)
      }
    })

    // 3. データを結合してボトルネック診断
    const articles: ArticleBottleneck[] = []

    gscDataMap.forEach((gscData, path) => {
      const sessions = sessionsMap.get(path) || 0
      const downloads = downloadsMap.get(path) || 0
      const cvr = sessions > 0 ? Math.round((downloads / sessions) * 10000) / 100 : 0

      const metrics: ArticleMetrics = {
        position: Math.round(gscData.position * 10) / 10,
        impressions: gscData.impressions,
        clicks: gscData.clicks,
        ctr: Math.round(gscData.ctr * 100) / 100,
        sessions,
        downloads,
        cvr,
      }

      // インプレッション数が少なすぎる記事は除外
      if (metrics.impressions < 10) return

      const bottleneck = diagnoseBottleneck(metrics)

      articles.push({
        path,
        title: path, // TODO: Supabaseから記事タイトルを取得
        metrics,
        bottleneck,
      })
    })

    // 優先度でソート（high > medium > low、同じ優先度内はインプレッション降順）
    const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 }
    articles.sort((a, b) => {
      const priorityDiff = priorityOrder[a.bottleneck.priority] - priorityOrder[b.bottleneck.priority]
      if (priorityDiff !== 0) return priorityDiff
      return b.metrics.impressions - a.metrics.impressions
    })

    // サマリー集計
    const summary: BottleneckSummary = {
      totalArticles: articles.length,
      healthyCount: articles.filter(a => a.bottleneck.type === 'healthy').length,
      ctrIssueCount: articles.filter(a => a.bottleneck.type === 'ctr').length,
      cvrIssueCount: articles.filter(a => a.bottleneck.type === 'cvr').length,
      impIssueCount: articles.filter(a => a.bottleneck.type === 'impressions').length,
    }

    const data: BottleneckData = {
      period: {
        startDate: startDateStr,
        endDate: endDateStr,
      },
      articles: articles.slice(0, 50), // 上位50件
      summary,
    }

    // キャッシュ更新
    cachedData = { data, timestamp: Date.now() }

    return NextResponse.json({
      data,
      cached: false,
    })
  } catch (error) {
    console.error('Lab Bottleneck API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch bottleneck data',
        message: error instanceof Error ? error.message : 'Unknown error',
        demo: true,
        data: generateDemoData(),
      },
      { status: 200 }
    )
  }
}

// デモデータ生成
function generateDemoData(): BottleneckData {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 28)

  return {
    period: {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    },
    articles: [
      {
        path: '/lab/agency/prm/123',
        title: 'PRMツール完全ガイド',
        metrics: { position: 5.2, impressions: 1250, clicks: 28, ctr: 2.24, sessions: 180, downloads: 0, cvr: 0 },
        bottleneck: { type: 'ctr', label: 'タイトル改善', priority: 'high', suggestion: '順位5位と良好ですが、CTR2.24%は業界平均(3%)を下回っています。タイトルとディスクリプションを魅力的に書き換えましょう。' },
      },
      {
        path: '/lab/strategy-planning/456',
        title: 'パートナー戦略の立て方',
        metrics: { position: 8.1, impressions: 980, clicks: 45, ctr: 4.59, sessions: 320, downloads: 2, cvr: 0.63 },
        bottleneck: { type: 'cvr', label: '導線改善', priority: 'high', suggestion: '月間320セッションと流入がありますが、CVR0.63%は低めです。CTAボタンの配置やサービスサイトへの導線を見直しましょう。' },
      },
      {
        path: '/lab/optimization/789',
        title: 'パートナー最適化戦略',
        metrics: { position: 25.3, impressions: 420, clicks: 8, ctr: 1.9, sessions: 85, downloads: 1, cvr: 1.18 },
        bottleneck: { type: 'impressions', label: 'コンテンツ改善', priority: 'medium', suggestion: '平均順位25位と検索上位に表示されていません。記事のリライトや被リンク獲得で順位向上を目指しましょう。' },
      },
      {
        path: '/lab/marketing/101',
        title: 'パートナーマーケティング入門',
        metrics: { position: 6.8, impressions: 1850, clicks: 82, ctr: 4.43, sessions: 450, downloads: 8, cvr: 1.78 },
        bottleneck: { type: 'healthy', label: '良好', priority: 'low', suggestion: '現在のパフォーマンスは良好です。引き続きコンテンツの質を維持しましょう。' },
      },
      {
        path: '/lab/case-analysis/202',
        title: '成功事例分析',
        metrics: { position: 12.4, impressions: 680, clicks: 22, ctr: 3.24, sessions: 150, downloads: 3, cvr: 2.0 },
        bottleneck: { type: 'healthy', label: '良好', priority: 'low', suggestion: '現在のパフォーマンスは良好です。引き続きコンテンツの質を維持しましょう。' },
      },
    ],
    summary: {
      totalArticles: 5,
      healthyCount: 2,
      ctrIssueCount: 1,
      cvrIssueCount: 1,
      impIssueCount: 1,
    },
  }
}
