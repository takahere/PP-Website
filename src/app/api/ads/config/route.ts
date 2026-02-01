import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AdConfig } from '@/lib/ads/types'
import { mergeAdConfigs, createEmptyAdConfig } from '@/lib/ads/utils'

/**
 * GET /api/ads/config
 * グローバル設定を取得
 *
 * Query params:
 * - pageId: string (optional) - ページIDを指定するとマージ済み設定を返す
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

    const adminClient = createAdminClient()

    // グローバル設定を取得
    const { data: globalSetting } = await adminClient
      .from('ad_settings')
      .select('*')
      .eq('setting_type', 'global')
      .is('page_id', null)
      .single()

    // pageIdが指定されている場合はページ設定も取得してマージ
    if (pageId) {
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
    }

    // グローバル設定のみを返す
    return NextResponse.json({
      data: globalSetting ? {
        ...globalSetting.config as AdConfig,
        isEnabled: globalSetting.is_enabled,
      } : createEmptyAdConfig(),
      setting: globalSetting,
    })
  } catch (error) {
    console.error('Failed to get ad config:', error)
    return NextResponse.json(
      { error: 'Failed to get ad config', message: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/ads/config
 * グローバル設定を更新
 *
 * Body:
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
    const { config, isEnabled = true } = body

    if (!config) {
      return NextResponse.json({ error: 'config is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // グローバル設定を upsert
    const { data, error } = await adminClient
      .from('ad_settings')
      .upsert({
        setting_type: 'global',
        page_id: null,
        config,
        is_enabled: isEnabled,
        updated_by: user.id,
      }, {
        onConflict: 'setting_type,page_id',
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to update ad config:', error)
      return NextResponse.json(
        { error: 'Failed to update ad config', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data, success: true })
  } catch (error) {
    console.error('Failed to update ad config:', error)
    return NextResponse.json(
      { error: 'Failed to update ad config', message: (error as Error).message },
      { status: 500 }
    )
  }
}
