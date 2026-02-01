import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AdConfig } from '@/lib/ads/types'
import { mergeAdConfigs } from '@/lib/ads/utils'

/**
 * GET /api/ads/config/page?pageId=xxx
 * ページ設定を取得（マージ済み）
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get('pageId')

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // グローバル設定を取得
    const { data: globalSetting } = await adminClient
      .from('ad_settings')
      .select('*')
      .eq('setting_type', 'global')
      .is('page_id', null)
      .single()

    // ページ設定を取得
    const { data: pageSetting } = await adminClient
      .from('ad_settings')
      .select('*')
      .eq('setting_type', 'page')
      .eq('page_id', pageId)
      .single()

    const mergedConfig = mergeAdConfigs(
      globalSetting?.config as AdConfig | null,
      pageSetting?.config as AdConfig | null
    )

    return NextResponse.json({
      data: mergedConfig,
      globalSetting,
      pageSetting,
    })
  } catch (error) {
    console.error('Failed to get page ad config:', error)
    return NextResponse.json(
      { error: 'Failed to get page ad config', message: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/ads/config/page
 * ページ設定を更新
 *
 * Body:
 * - pageId: string - ページID
 * - config: AdConfig - 広告設定
 * - isEnabled: boolean - 有効/無効
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { pageId, config, isEnabled = true } = body

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 })
    }

    if (!config) {
      return NextResponse.json({ error: 'config is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // ページ設定を upsert
    const { data, error } = await adminClient
      .from('ad_settings')
      .upsert({
        setting_type: 'page',
        page_id: pageId,
        config,
        is_enabled: isEnabled,
        updated_by: user.id,
      }, {
        onConflict: 'setting_type,page_id',
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to update page ad config:', error)
      return NextResponse.json(
        { error: 'Failed to update page ad config', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data, success: true })
  } catch (error) {
    console.error('Failed to update page ad config:', error)
    return NextResponse.json(
      { error: 'Failed to update page ad config', message: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/ads/config/page?pageId=xxx
 * ページ設定を削除（グローバル設定に戻す）
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get('pageId')

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('ad_settings')
      .delete()
      .eq('setting_type', 'page')
      .eq('page_id', pageId)

    if (error) {
      console.error('Failed to delete page ad config:', error)
      return NextResponse.json(
        { error: 'Failed to delete page ad config', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete page ad config:', error)
    return NextResponse.json(
      { error: 'Failed to delete page ad config', message: (error as Error).message },
      { status: 500 }
    )
  }
}
