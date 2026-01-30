import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAllThresholds,
  updateThreshold,
  updateThresholds,
  resetThreshold,
  resetAllThresholds,
  MetricType,
  AlertThresholdUpdate,
  DEFAULT_THRESHOLDS,
} from '@/lib/thresholds'

/**
 * GET /api/analytics/thresholds
 * すべての閾値を取得
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const thresholds = await getAllThresholds()

    return NextResponse.json({
      data: thresholds,
      defaults: DEFAULT_THRESHOLDS,
    })
  } catch (error) {
    console.error('Failed to get thresholds:', error)
    return NextResponse.json(
      { error: 'Failed to get thresholds', message: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/analytics/thresholds
 * 閾値を更新
 *
 * Body:
 * - metric: string - 更新するメトリクス
 * - warningMultiplier?: number
 * - criticalMultiplier?: number
 * - percentChangeThreshold?: number
 * - enabled?: boolean
 *
 * または複数更新:
 * - updates: Array<{ metric: string, ...update }>
 */
export async function PUT(request: NextRequest) {
  try {
    // 認証チェック
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // 複数更新
    if (body.updates && Array.isArray(body.updates)) {
      const updates = body.updates.map(
        (u: { metric: string } & AlertThresholdUpdate) => ({
          metric: u.metric as MetricType,
          update: {
            warningMultiplier: u.warningMultiplier,
            criticalMultiplier: u.criticalMultiplier,
            percentChangeThreshold: u.percentChangeThreshold,
            enabled: u.enabled,
          },
        })
      )

      const results = await updateThresholds(updates, user.id)
      return NextResponse.json({ data: results })
    }

    // 単一更新
    const { metric, warningMultiplier, criticalMultiplier, percentChangeThreshold, enabled } =
      body

    if (!metric) {
      return NextResponse.json({ error: 'metric is required' }, { status: 400 })
    }

    // バリデーション
    if (warningMultiplier !== undefined && (warningMultiplier < 0.5 || warningMultiplier > 10)) {
      return NextResponse.json(
        { error: 'warningMultiplier must be between 0.5 and 10' },
        { status: 400 }
      )
    }

    if (criticalMultiplier !== undefined && (criticalMultiplier < 0.5 || criticalMultiplier > 10)) {
      return NextResponse.json(
        { error: 'criticalMultiplier must be between 0.5 and 10' },
        { status: 400 }
      )
    }

    if (
      percentChangeThreshold !== undefined &&
      (percentChangeThreshold < 5 || percentChangeThreshold > 100)
    ) {
      return NextResponse.json(
        { error: 'percentChangeThreshold must be between 5 and 100' },
        { status: 400 }
      )
    }

    const update: AlertThresholdUpdate = {}
    if (warningMultiplier !== undefined) update.warningMultiplier = warningMultiplier
    if (criticalMultiplier !== undefined) update.criticalMultiplier = criticalMultiplier
    if (percentChangeThreshold !== undefined) update.percentChangeThreshold = percentChangeThreshold
    if (enabled !== undefined) update.enabled = enabled

    const result = await updateThreshold(metric as MetricType, update, user.id)

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Failed to update threshold:', error)
    return NextResponse.json(
      { error: 'Failed to update threshold', message: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/analytics/thresholds/reset
 * 閾値をデフォルトにリセット
 *
 * Body:
 * - metric?: string - 特定のメトリクスのみリセット（省略時は全リセット）
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (body.metric) {
      // 特定のメトリクスをリセット
      const result = await resetThreshold(body.metric as MetricType, user.id)
      return NextResponse.json({ data: result })
    } else {
      // 全リセット
      const results = await resetAllThresholds(user.id)
      return NextResponse.json({ data: results })
    }
  } catch (error) {
    console.error('Failed to reset threshold:', error)
    return NextResponse.json(
      { error: 'Failed to reset threshold', message: (error as Error).message },
      { status: 500 }
    )
  }
}
