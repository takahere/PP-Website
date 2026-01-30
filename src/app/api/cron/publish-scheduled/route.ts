import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// このエンドポイントはVercel CronやGitHub Actionsから定期実行されることを想定
// 環境変数 CRON_SECRET で保護

export async function GET(request: NextRequest) {
  try {
    // Cron認証
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const now = new Date().toISOString()

    // 公開予定時刻を過ぎているコンテンツを取得して公開
    const tables = ['posts', 'pages', 'lab_articles']
    const results: { table: string; updated: number; error?: string }[] = []

    for (const table of tables) {
      try {
        // scheduled_at カラムが存在するか確認してから実行
        const { data, error: selectError } = await adminClient
          .from(table)
          .select('id, slug, title, scheduled_at')
          .eq('is_published', false)
          .not('scheduled_at', 'is', null)
          .lte('scheduled_at', now)
          .limit(50)

        if (selectError) {
          // カラムが存在しない場合はスキップ
          if (selectError.message?.includes('column') || selectError.code === '42703') {
            results.push({ table, updated: 0, error: 'scheduled_at column not found' })
            continue
          }
          throw selectError
        }

        if (!data || data.length === 0) {
          results.push({ table, updated: 0 })
          continue
        }

        // 一括で公開状態に更新
        const ids = data.map((item) => item.id)
        const { error: updateError } = await adminClient
          .from(table)
          .update({
            is_published: true,
            scheduled_at: null, // 公開後は予約をクリア
          })
          .in('id', ids)

        if (updateError) {
          throw updateError
        }

        results.push({ table, updated: data.length })

        // ログ出力
        console.log(
          `[Scheduled Publish] ${table}: ${data.length} items published`,
          data.map((d) => d.slug)
        )
      } catch (err) {
        console.error(`[Scheduled Publish] Error in ${table}:`, err)
        results.push({
          table,
          updated: 0,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now,
      results,
    })
  } catch (error) {
    console.error('[Scheduled Publish] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process scheduled publishing',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Vercel Cronからの呼び出し対応
export const dynamic = 'force-dynamic'
export const maxDuration = 30
