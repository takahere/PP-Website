import { NextRequest, NextResponse } from 'next/server'
import {
  isSlackConfigured,
  sendSlackMessage,
} from '@/lib/slack/client'
import {
  formatAnomalyAlert,
  AnomalyAlertData,
} from '@/lib/slack/formatters'

/**
 * 異常検知 Slack通知 Cron
 *
 * スケジュール: 毎日 1:00 UTC (JST 10:00)
 * 環境変数: CRON_SECRET, SLACK_WEBHOOK_URL
 *
 * 動作:
 * 1. /api/analytics/anomalies を内部呼び出し
 * 2. 異常があれば Slack に通知
 * 3. 異常がなくても日次サマリーとして通知（オプション）
 */

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

    console.log('🔍 異常検知アラート生成開始...')

    // 異常検知APIを内部呼び出し
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const anomalyResponse = await fetch(`${baseUrl}/api/analytics/anomalies`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!anomalyResponse.ok) {
      throw new Error(`Anomaly API error: ${anomalyResponse.status}`)
    }

    const anomalyResult = await anomalyResponse.json()
    const anomalyData = anomalyResult.data

    if (!anomalyData) {
      throw new Error('No anomaly data received')
    }

    // 異常が検出された場合のみ通知、または常に通知（設定可能）
    const notifyAlways = process.env.ANOMALY_NOTIFY_ALWAYS === 'true'
    const hasAnomalies = anomalyData.anomalies && anomalyData.anomalies.length > 0

    if (!hasAnomalies && !notifyAlways) {
      console.log('✅ 異常なし、通知をスキップ')
      return NextResponse.json({
        success: true,
        message: 'No anomalies detected, notification skipped',
        data: {
          healthStatus: anomalyData.summary?.healthStatus || 'healthy',
          anomaliesCount: 0,
        },
        duration: `${Date.now() - startTime}ms`,
      })
    }

    // Slack通知用データを構築
    const alertData: AnomalyAlertData = {
      detectedAt: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
      anomalies: anomalyData.anomalies.map((a: {
        metric: string
        currentValue: number
        expectedValue: number
        deviation: number
        severity: 'warning' | 'critical'
      }) => ({
        metric: a.metric,
        currentValue: a.currentValue,
        expectedValue: a.expectedValue,
        deviation: a.deviation,
        severity: a.severity,
      })),
    }

    // Slackメッセージ送信
    const message = formatAnomalyAlert(alertData)
    const result = await sendSlackMessage(message)

    const duration = Date.now() - startTime

    if (result.success) {
      console.log(`✅ 異常検知アラート送信完了 (${duration}ms)`)
      return NextResponse.json({
        success: true,
        message: hasAnomalies
          ? `Anomaly alert sent to Slack (${anomalyData.anomalies.length} anomalies)`
          : 'Health status sent to Slack',
        data: {
          healthStatus: anomalyData.summary?.healthStatus || 'unknown',
          anomaliesCount: anomalyData.anomalies?.length || 0,
          criticalCount: anomalyData.summary?.criticalCount || 0,
          warningCount: anomalyData.summary?.warningCount || 0,
        },
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
    console.error('[Anomaly Alert] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate anomaly alert',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
export const maxDuration = 30
