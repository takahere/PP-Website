import { NextRequest, NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'
import {
  isSlackConfigured,
  sendSlackMessage,
} from '@/lib/slack/client'
import {
  formatDailyAlert,
  DailyAlertData,
} from '@/lib/slack/formatters'

/**
 * 日次アラート Slack通知 Cron
 *
 * スケジュール: 毎日 0:00 UTC (JST 9:00)
 * 環境変数: CRON_SECRET, SLACK_WEBHOOK_URL
 *
 * 取得データ:
 * - GA4: 昨日のセッション, CV数, 直帰率
 * - アラート: 閾値超過時に通知
 *
 * アラート閾値:
 * - トラフィック急落: 前日比 -30%以上
 * - 直帰率急上昇: 60%以上
 * - CVゼロ: 24時間CV無し
 */

// アラート閾値
const ALERT_THRESHOLDS = {
  trafficDropPercent: -30, // セッション前日比 -30%以下
  bounceRateHigh: 60, // 直帰率 60%以上
  bounceRateCritical: 70, // 直帰率 70%以上（クリティカル）
  zeroCVDays: 1, // CV無し日数
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Cron認証
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Slack設定チェック
    if (!isSlackConfigured()) {
      return NextResponse.json(
        {
          error: 'Slack is not configured',
          message: 'Please set SLACK_WEBHOOK_URL environment variable',
        },
        { status: 400 }
      )
    }

    console.log('📈 日次アラート生成開始...')

    // 日付範囲を計算
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)

    const dayBefore = new Date(now)
    dayBefore.setDate(now.getDate() - 2)

    const formatDate = (d: Date) => d.toISOString().split('T')[0]
    const formatDisplayDate = (d: Date) =>
      `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`

    const yesterdayStr = formatDate(yesterday)
    const dayBeforeStr = formatDate(dayBefore)

    console.log(`分析対象日: ${yesterdayStr}`)

    // データ取得
    const gaData = await fetchDailyGAData(yesterdayStr, dayBeforeStr)

    // アラート判定
    const alerts: DailyAlertData['alerts'] = []

    // トラフィック急落チェック
    if (gaData.sessionsTrend <= ALERT_THRESHOLDS.trafficDropPercent) {
      alerts.push({
        type: 'critical',
        message: `トラフィック急落: 前日比 ${gaData.sessionsTrend.toFixed(1)}%`,
      })
    }

    // 直帰率チェック
    if (gaData.bounceRate >= ALERT_THRESHOLDS.bounceRateCritical) {
      alerts.push({
        type: 'critical',
        message: `直帰率が非常に高い: ${gaData.bounceRate.toFixed(1)}%`,
      })
    } else if (gaData.bounceRate >= ALERT_THRESHOLDS.bounceRateHigh) {
      alerts.push({
        type: 'warning',
        message: `直帰率が高い: ${gaData.bounceRate.toFixed(1)}%`,
      })
    }

    // CVゼロチェック
    if (gaData.conversions === 0) {
      alerts.push({
        type: 'warning',
        message: 'CV数が0件です',
      })
    }

    // サマリーデータを構築
    const alertData: DailyAlertData = {
      date: formatDisplayDate(yesterday),
      sessions: gaData.sessions,
      sessionsTrend: gaData.sessionsTrend,
      conversions: gaData.conversions,
      conversionsTrend: gaData.conversionsTrend,
      bounceRate: gaData.bounceRate,
      alerts,
    }

    // Slackメッセージ送信
    const message = formatDailyAlert(alertData)
    const result = await sendSlackMessage(message)

    const duration = Date.now() - startTime

    if (result.success) {
      console.log(`✅ 日次アラート送信完了 (${duration}ms)`)
      return NextResponse.json({
        success: true,
        message: 'Daily alert sent to Slack',
        data: alertData,
        duration: `${duration}ms`,
      })
    } else {
      console.error('❌ Slack送信失敗:', result.error)
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          data: alertData,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Daily Alert] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate daily alert',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// 日次GA4データ取得
async function fetchDailyGAData(yesterday: string, dayBefore: string) {
  if (!isGoogleConfigured()) {
    console.log('⚠️ GA4未設定、デモデータを使用')
    return generateDemoDailyData()
  }

  try {
    const credentials = getGoogleCredentials()
    const propertyId = process.env.GA4_PROPERTY_ID
    const analyticsDataClient = new BetaAnalyticsDataClient({ credentials })

    const [yesterdayResponse, dayBeforeResponse] = await Promise.all([
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: yesterday, endDate: yesterday }],
        metrics: [
          { name: 'sessions' },
          { name: 'bounceRate' },
          { name: 'conversions' },
        ],
      }),
      analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: dayBefore, endDate: dayBefore }],
        metrics: [
          { name: 'sessions' },
          { name: 'bounceRate' },
          { name: 'conversions' },
        ],
      }),
    ])

    const yesterdayRow = yesterdayResponse[0].rows?.[0]
    const dayBeforeRow = dayBeforeResponse[0].rows?.[0]

    const sessions = Number(yesterdayRow?.metricValues?.[0]?.value) || 0
    const prevSessions = Number(dayBeforeRow?.metricValues?.[0]?.value) || 0
    const bounceRate = (Number(yesterdayRow?.metricValues?.[1]?.value) || 0) * 100
    const conversions = Number(yesterdayRow?.metricValues?.[2]?.value) || 0
    const prevConversions = Number(dayBeforeRow?.metricValues?.[2]?.value) || 0

    const sessionsTrend = prevSessions > 0
      ? ((sessions - prevSessions) / prevSessions) * 100
      : 0

    return {
      sessions,
      sessionsTrend,
      bounceRate,
      conversions,
      conversionsTrend: conversions - prevConversions,
    }
  } catch (error) {
    console.error('GA4日次データ取得エラー:', error)
    return generateDemoDailyData()
  }
}

// デモ日次データ
function generateDemoDailyData() {
  return {
    sessions: 1823,
    sessionsTrend: 12.5,
    bounceRate: 45.2,
    conversions: 5,
    conversionsTrend: 2,
  }
}

export const dynamic = 'force-dynamic'
export const maxDuration = 30
