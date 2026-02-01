/**
 * 広告設定のサーバーサイド取得関数
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { AdConfig, MergedAdConfig } from './types'
import { mergeAdConfigs } from './utils'

/**
 * ページの広告設定を取得（グローバル設定とマージ済み）
 */
export async function getAdConfig(pageId: string): Promise<MergedAdConfig> {
  const adminClient = createAdminClient()

  // グローバル設定を取得
  const { data: globalSetting } = await adminClient
    .from('ad_settings')
    .select('config, is_enabled')
    .eq('setting_type', 'global')
    .is('page_id', null)
    .single()

  // ページ設定を取得
  const { data: pageSetting } = await adminClient
    .from('ad_settings')
    .select('config, is_enabled')
    .eq('setting_type', 'page')
    .eq('page_id', pageId)
    .single()

  // マージして返す
  const merged = mergeAdConfigs(
    globalSetting?.config as AdConfig | null,
    pageSetting?.config as AdConfig | null
  )

  // 有効/無効の判定
  if (pageSetting) {
    merged.isEnabled = pageSetting.is_enabled
  } else if (globalSetting) {
    merged.isEnabled = globalSetting.is_enabled
  }

  return merged
}

/**
 * グローバル広告設定を取得
 */
export async function getGlobalAdConfig(): Promise<AdConfig | null> {
  const adminClient = createAdminClient()

  const { data } = await adminClient
    .from('ad_settings')
    .select('config, is_enabled')
    .eq('setting_type', 'global')
    .is('page_id', null)
    .single()

  if (!data) return null

  return data.config as AdConfig
}
