import { NextResponse } from 'next/server'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { LRUCache } from 'lru-cache'
import { getGoogleCredentials, isGoogleConfigured } from '@/lib/google-auth'
import { getAllThresholds, AlertThreshold, MetricType, DEFAULT_THRESHOLDS } from '@/lib/thresholds'

/**
 * 異常検知 API
 *
 * トラフィック、CV率、エラー率などの異常を検知
 *
 * 検知アルゴリズム:
 * - 過去7日の平均値と標準偏差を計算
 * - データベースから取得した閾値を使用（カスタマイズ可能）
 * - デフォルト: 現在値が平均値 ± 2σ を超えた場合に異常として検知
 * - 前週比で閾値%以上の変動も異常として検知
 *
 * クエリパラメータ:
 * - refresh: キャッシュを無視 (true/false)
 * - threshold: 検知閾値の倍率（後方互換性のため維持、DBの設定を優先）
 */

// LRUキャッシュ（5分TTL）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new LRUCache<string, any>({
  max: 50,
  ttl: 5 * 60 * 1000,
})

interface Anomaly {
  metric: string
  currentValue: number
  expectedValue: number
  deviation: number // %
  severity: 'warning' | 'critical'
  direction: 'increase' | 'decrease'
  description: string
}

interface MetricStats {
  mean: number
  stdDev: number
  min: number
  max: number
  values: number[]
}

interface AnomalyData {
  analyzedAt: string
  period: {
    analysisStart: string
    analysisEnd: string
    comparisonStart: string
    comparisonEnd: string
  }
  summary: {
    totalAnomalies: number
    criticalCount: number
    warningCount: number
    healthStatus: 'healthy' | 'warning' | 'critical'
  }
  anomalies: Anomaly[]
  metrics: {
    sessions: {
      current: number
      expected: number
      stats: MetricStats
    }
    users: {
      current: number
      expected: number
      stats: MetricStats
    }
    pageviews: {
      current: number
      expected: number
      stats: MetricStats
    }
    bounceRate: {
      current: number
      expected: number
      stats: MetricStats
    }
    conversions: {
      current: number
      expected: number
      stats: MetricStats
    }
  }
  recommendations: string[]
}

// 後方互換性のためのデフォルト閾値
const LEGACY_THRESHOLDS = {
  percentChange: 30, // 前週比 ±30%
  sigmaMultiplier: 2, // 2σ を閾値
  criticalMultiplier: 3, // 3σ でクリティカル
}

// 閾値マップ型
type ThresholdMap = Map<MetricType, AlertThreshold>

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'
    const thresholdMultiplier = parseFloat(searchParams.get('threshold') || '2')

    const cacheKey = `anomalies-v2`

    if (!forceRefresh) {
      const cached = cache.get(cacheKey)
      if (cached) {
        return NextResponse.json({ ...cached as object, cached: true })
      }
    }

    // 設定チェック
    if (!isGoogleConfigured()) {
      const demoData = generateDemoData()
      return NextResponse.json({
        error: 'Google Analytics is not configured',
        message: 'Please set GOOGLE_SERVICE_ACCOUNT_JSON and GA4_PROPERTY_ID',
        demo: true,
        data: demoData,
      })
    }

    const credentials = getGoogleCredentials()
    const propertyId = process.env.GA4_PROPERTY_ID
    const analyticsDataClient = new BetaAnalyticsDataClient({ credentials })

    console.log('🔍 異常検知分析開始...')

    // 日付範囲
    // 分析対象: 昨日
    // 比較対象: 過去7日
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)

    const analysisDate = formatDate(yesterday)
    const comparisonStart = new Date(yesterday)
    comparisonStart.setDate(yesterday.getDate() - 7)
    const comparisonEnd = new Date(yesterday)
    comparisonEnd.setDate(yesterday.getDate() - 1)

    // 過去7日の日別データを取得
    const dailyResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: formatDate(comparisonStart),
          endDate: formatDate(comparisonEnd),
        },
      ],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'conversions' },
      ],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    })

    // 昨日のデータを取得
    const yesterdayResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: analysisDate, endDate: analysisDate }],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'conversions' },
      ],
    })

    // 過去7日のデータを集計
    const historicalData = {
      sessions: [] as number[],
      users: [] as number[],
      pageviews: [] as number[],
      bounceRate: [] as number[],
      conversions: [] as number[],
    }

    dailyResponse[0].rows?.forEach((row) => {
      historicalData.sessions.push(Number(row.metricValues?.[0]?.value) || 0)
      historicalData.users.push(Number(row.metricValues?.[1]?.value) || 0)
      historicalData.pageviews.push(Number(row.metricValues?.[2]?.value) || 0)
      historicalData.bounceRate.push((Number(row.metricValues?.[3]?.value) || 0) * 100)
      historicalData.conversions.push(Number(row.metricValues?.[4]?.value) || 0)
    })

    // 昨日のデータ
    const yesterdayRow = yesterdayResponse[0].rows?.[0]
    const currentData = {
      sessions: Number(yesterdayRow?.metricValues?.[0]?.value) || 0,
      users: Number(yesterdayRow?.metricValues?.[1]?.value) || 0,
      pageviews: Number(yesterdayRow?.metricValues?.[2]?.value) || 0,
      bounceRate: (Number(yesterdayRow?.metricValues?.[3]?.value) || 0) * 100,
      conversions: Number(yesterdayRow?.metricValues?.[4]?.value) || 0,
    }

    // 統計を計算
    const metricsStats = {
      sessions: calculateStats(historicalData.sessions),
      users: calculateStats(historicalData.users),
      pageviews: calculateStats(historicalData.pageviews),
      bounceRate: calculateStats(historicalData.bounceRate),
      conversions: calculateStats(historicalData.conversions),
    }

    // データベースから閾値を取得
    let thresholdMap: ThresholdMap = new Map()
    try {
      const dbThresholds = await getAllThresholds()
      dbThresholds.forEach((t) => thresholdMap.set(t.metric, t))
      console.log('📊 DBから閾値を取得しました')
    } catch (err) {
      console.warn('⚠️ DB閾値取得失敗、デフォルト値を使用:', err)
      // デフォルト値を使用
      Object.entries(DEFAULT_THRESHOLDS).forEach(([metric, value]) => {
        thresholdMap.set(metric as MetricType, {
          ...value,
          id: `default-${metric}`,
          updatedAt: new Date().toISOString(),
          updatedBy: null,
        })
      })
    }

    // 異常を検知
    const anomalies: Anomaly[] = []

    // セッション異常
    const sessionThreshold = thresholdMap.get('sessions')
    if (sessionThreshold?.enabled) {
      const sessionAnomaly = detectAnomalyWithThreshold(
        'セッション数',
        currentData.sessions,
        metricsStats.sessions,
        sessionThreshold,
        false // 減少が悪い
      )
      if (sessionAnomaly) anomalies.push(sessionAnomaly)
    }

    // ユーザー異常
    const userThreshold = thresholdMap.get('users')
    if (userThreshold?.enabled) {
      const userAnomaly = detectAnomalyWithThreshold(
        'ユーザー数',
        currentData.users,
        metricsStats.users,
        userThreshold,
        false
      )
      if (userAnomaly) anomalies.push(userAnomaly)
    }

    // PV異常
    const pvThreshold = thresholdMap.get('pageviews')
    if (pvThreshold?.enabled) {
      const pvAnomaly = detectAnomalyWithThreshold(
        'ページビュー数',
        currentData.pageviews,
        metricsStats.pageviews,
        pvThreshold,
        false
      )
      if (pvAnomaly) anomalies.push(pvAnomaly)
    }

    // 直帰率異常（増加が悪い）
    const bounceThreshold = thresholdMap.get('bounceRate')
    if (bounceThreshold?.enabled) {
      const bounceAnomaly = detectAnomalyWithThreshold(
        '直帰率',
        currentData.bounceRate,
        metricsStats.bounceRate,
        bounceThreshold,
        true // 増加が悪い
      )
      if (bounceAnomaly) anomalies.push(bounceAnomaly)
    }

    // CV異常
    const cvThreshold = thresholdMap.get('conversions')
    if (cvThreshold?.enabled) {
      const cvAnomaly = detectAnomalyWithThreshold(
        'コンバージョン数',
        currentData.conversions,
        metricsStats.conversions,
        cvThreshold,
        false
      )
      if (cvAnomaly) anomalies.push(cvAnomaly)
    }

    // サマリーを計算
    const criticalCount = anomalies.filter((a) => a.severity === 'critical').length
    const warningCount = anomalies.filter((a) => a.severity === 'warning').length
    const healthStatus =
      criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'healthy'

    // 推奨事項
    const recommendations = generateRecommendations(anomalies)

    const anomalyData: AnomalyData = {
      analyzedAt: new Date().toISOString(),
      period: {
        analysisStart: analysisDate,
        analysisEnd: analysisDate,
        comparisonStart: formatDate(comparisonStart),
        comparisonEnd: formatDate(comparisonEnd),
      },
      summary: {
        totalAnomalies: anomalies.length,
        criticalCount,
        warningCount,
        healthStatus,
      },
      anomalies,
      metrics: {
        sessions: {
          current: currentData.sessions,
          expected: metricsStats.sessions.mean,
          stats: metricsStats.sessions,
        },
        users: {
          current: currentData.users,
          expected: metricsStats.users.mean,
          stats: metricsStats.users,
        },
        pageviews: {
          current: currentData.pageviews,
          expected: metricsStats.pageviews.mean,
          stats: metricsStats.pageviews,
        },
        bounceRate: {
          current: currentData.bounceRate,
          expected: metricsStats.bounceRate.mean,
          stats: metricsStats.bounceRate,
        },
        conversions: {
          current: currentData.conversions,
          expected: metricsStats.conversions.mean,
          stats: metricsStats.conversions,
        },
      },
      recommendations,
    }

    console.log(`✅ 異常検知完了: ${anomalies.length}件の異常を検出`)

    // キャッシュ更新
    cache.set(cacheKey, { data: anomalyData })

    return NextResponse.json({
      data: anomalyData,
      cached: false,
    })
  } catch (error) {
    console.error('Anomaly Detection API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to detect anomalies',
        message: error instanceof Error ? error.message : 'Unknown error',
        demo: true,
        data: generateDemoData(),
      },
      { status: 200 }
    )
  }
}

// 日付フォーマット
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// 統計計算
function calculateStats(values: number[]): MetricStats {
  if (values.length === 0) {
    return { mean: 0, stdDev: 0, min: 0, max: 0, values: [] }
  }

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2))
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length
  const stdDev = Math.sqrt(variance)

  return {
    mean: Math.round(mean * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    min: Math.min(...values),
    max: Math.max(...values),
    values,
  }
}

// 異常検知（レガシー - 後方互換性のため維持）
function detectAnomaly(
  metricName: string,
  currentValue: number,
  stats: MetricStats,
  thresholdMultiplier: number,
  increaseIsBad: boolean
): Anomaly | null {
  if (stats.mean === 0 || stats.stdDev === 0) {
    return null
  }

  // Zスコアを計算
  const zScore = (currentValue - stats.mean) / stats.stdDev

  // 変化率を計算
  const deviation = ((currentValue - stats.mean) / stats.mean) * 100
  const direction = currentValue > stats.mean ? 'increase' : 'decrease'

  // 閾値チェック
  const isWarning = Math.abs(zScore) >= thresholdMultiplier
  const isCritical = Math.abs(zScore) >= LEGACY_THRESHOLDS.criticalMultiplier

  // 異常なしの場合
  if (!isWarning && Math.abs(deviation) < LEGACY_THRESHOLDS.percentChange) {
    return null
  }

  // 異常の深刻度を判定
  // increaseIsBad: trueの場合、増加が悪い（直帰率など）
  const isBadChange = increaseIsBad
    ? currentValue > stats.mean
    : currentValue < stats.mean

  const severity = isCritical || (isBadChange && Math.abs(deviation) >= 50)
    ? 'critical'
    : 'warning'

  const description = generateAnomalyDescription(
    metricName,
    currentValue,
    stats.mean,
    deviation,
    direction,
    increaseIsBad
  )

  return {
    metric: metricName,
    currentValue: Math.round(currentValue * 100) / 100,
    expectedValue: Math.round(stats.mean * 100) / 100,
    deviation: Math.round(deviation * 10) / 10,
    severity,
    direction,
    description,
  }
}

// 異常検知（DB閾値を使用）
function detectAnomalyWithThreshold(
  metricName: string,
  currentValue: number,
  stats: MetricStats,
  threshold: AlertThreshold,
  increaseIsBad: boolean
): Anomaly | null {
  if (stats.mean === 0 || stats.stdDev === 0) {
    return null
  }

  // Zスコアを計算
  const zScore = (currentValue - stats.mean) / stats.stdDev

  // 変化率を計算
  const deviation = ((currentValue - stats.mean) / stats.mean) * 100
  const direction = currentValue > stats.mean ? 'increase' : 'decrease'

  // DB閾値でチェック
  const isWarning = Math.abs(zScore) >= threshold.warningMultiplier
  const isCritical = Math.abs(zScore) >= threshold.criticalMultiplier
  const exceedsPercentChange = Math.abs(deviation) >= threshold.percentChangeThreshold

  // 異常なしの場合
  if (!isWarning && !exceedsPercentChange) {
    return null
  }

  // 異常の深刻度を判定
  const isBadChange = increaseIsBad
    ? currentValue > stats.mean
    : currentValue < stats.mean

  const severity = isCritical || (isBadChange && Math.abs(deviation) >= 50)
    ? 'critical'
    : 'warning'

  const description = generateAnomalyDescription(
    metricName,
    currentValue,
    stats.mean,
    deviation,
    direction,
    increaseIsBad
  )

  return {
    metric: metricName,
    currentValue: Math.round(currentValue * 100) / 100,
    expectedValue: Math.round(stats.mean * 100) / 100,
    deviation: Math.round(deviation * 10) / 10,
    severity,
    direction,
    description,
  }
}

// 異常説明文を生成
function generateAnomalyDescription(
  metricName: string,
  current: number,
  expected: number,
  deviation: number,
  direction: 'increase' | 'decrease',
  increaseIsBad: boolean
): string {
  const directionText = direction === 'increase' ? '増加' : '減少'
  const qualityText = (direction === 'increase') === increaseIsBad ? '悪化' : '改善'

  if (metricName === '直帰率') {
    return `直帰率が${current.toFixed(1)}%で、期待値${expected.toFixed(1)}%から${Math.abs(deviation).toFixed(1)}%${directionText}しています（${qualityText}）`
  }

  return `${metricName}が${Math.round(current)}で、期待値${Math.round(expected)}から${Math.abs(deviation).toFixed(1)}%${directionText}しています`
}

// 推奨事項生成
function generateRecommendations(anomalies: Anomaly[]): string[] {
  const recommendations: string[] = []

  const hasTrafficDrop = anomalies.some(
    (a) =>
      (a.metric === 'セッション数' || a.metric === 'ユーザー数') &&
      a.direction === 'decrease'
  )

  const hasBounceIncrease = anomalies.some(
    (a) => a.metric === '直帰率' && a.direction === 'increase'
  )

  const hasCVDrop = anomalies.some(
    (a) => a.metric === 'コンバージョン数' && a.direction === 'decrease'
  )

  if (hasTrafficDrop) {
    recommendations.push(
      'トラフィック減少: GSCでインデックス状況を確認し、技術的な問題がないかチェックしてください'
    )
    recommendations.push(
      '外部リンクの変化やSNSからの流入減少がないか確認してください'
    )
  }

  if (hasBounceIncrease) {
    recommendations.push(
      '直帰率上昇: ページ表示速度の低下やコンテンツの問題がないか確認してください'
    )
    recommendations.push(
      'モバイル表示に問題がないかデバイス別レポートを確認してください'
    )
  }

  if (hasCVDrop) {
    recommendations.push(
      'CV減少: フォームやCTAの動作に問題がないか確認してください'
    )
    recommendations.push(
      'ユーザーフローを分析し、離脱ポイントを特定してください'
    )
  }

  if (recommendations.length === 0) {
    recommendations.push('現在、特に対応が必要な異常は検出されていません')
    recommendations.push('引き続きモニタリングを継続してください')
  }

  return recommendations
}

// デモデータ生成
function generateDemoData(): AnomalyData {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  const analysisDate = formatDate(yesterday)
  const comparisonStart = new Date(yesterday)
  comparisonStart.setDate(yesterday.getDate() - 7)
  const comparisonEnd = new Date(yesterday)
  comparisonEnd.setDate(yesterday.getDate() - 1)

  return {
    analyzedAt: now.toISOString(),
    period: {
      analysisStart: analysisDate,
      analysisEnd: analysisDate,
      comparisonStart: formatDate(comparisonStart),
      comparisonEnd: formatDate(comparisonEnd),
    },
    summary: {
      totalAnomalies: 1,
      criticalCount: 0,
      warningCount: 1,
      healthStatus: 'warning',
    },
    anomalies: [
      {
        metric: '直帰率',
        currentValue: 58.5,
        expectedValue: 48.2,
        deviation: 21.4,
        severity: 'warning',
        direction: 'increase',
        description:
          '直帰率が58.5%で、期待値48.2%から21.4%増加しています（悪化）',
      },
    ],
    metrics: {
      sessions: {
        current: 1850,
        expected: 1780,
        stats: {
          mean: 1780,
          stdDev: 150,
          min: 1520,
          max: 2010,
          values: [1650, 1720, 1800, 1850, 1780, 1920, 1740],
        },
      },
      users: {
        current: 1320,
        expected: 1280,
        stats: {
          mean: 1280,
          stdDev: 120,
          min: 1100,
          max: 1450,
          values: [1200, 1250, 1300, 1320, 1280, 1380, 1230],
        },
      },
      pageviews: {
        current: 4500,
        expected: 4350,
        stats: {
          mean: 4350,
          stdDev: 380,
          min: 3800,
          max: 4900,
          values: [4100, 4200, 4400, 4500, 4350, 4700, 4200],
        },
      },
      bounceRate: {
        current: 58.5,
        expected: 48.2,
        stats: {
          mean: 48.2,
          stdDev: 5.2,
          min: 42.1,
          max: 54.8,
          values: [45.2, 47.8, 49.1, 50.2, 48.5, 46.3, 50.3],
        },
      },
      conversions: {
        current: 12,
        expected: 11,
        stats: {
          mean: 11,
          stdDev: 3.2,
          min: 6,
          max: 16,
          values: [8, 10, 12, 14, 11, 15, 7],
        },
      },
    },
    recommendations: [
      '直帰率上昇: ページ表示速度の低下やコンテンツの問題がないか確認してください',
      'モバイル表示に問題がないかデバイス別レポートを確認してください',
    ],
  }
}
