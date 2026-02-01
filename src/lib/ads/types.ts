/**
 * 広告タグ・コンバージョン設定の型定義
 */

// Google Ads 設定
export interface GoogleAdsConfig {
  conversionId: string      // AW-XXXXXXXXX
  pageViewLabel?: string    // ページビュー時のラベル
  formSubmitLabel?: string  // フォーム送信時のラベル
}

// Meta Pixel (Facebook) 設定
export interface MetaPixelConfig {
  pixelId: string              // Pixel ID
  pageViewEvent?: string       // PageView, ViewContent など
  formSubmitEvent?: string     // Lead, CompleteRegistration など
  customParams?: Record<string, unknown>
}

// Yahoo Ads 設定
export interface YahooAdsConfig {
  conversionId: string
  pageViewLabel?: string
  formSubmitLabel?: string
}

// カスタムイベント設定
export interface CustomEventConfig {
  id: string                   // ユニークID
  selector: string             // CSSセレクタ (.cta-button, #submit-btn)
  eventType: 'click' | 'submit'
  eventName: string            // イベント名（管理用）
  platforms: {
    googleAds?: { label: string }
    metaPixel?: { event: string; params?: Record<string, unknown> }
    yahooAds?: { label: string }
  }
}

// 広告設定全体
export interface AdConfig {
  googleAds?: GoogleAdsConfig
  metaPixel?: MetaPixelConfig
  yahooAds?: YahooAdsConfig
  customEvents?: CustomEventConfig[]
  useGlobalSettings?: boolean  // ページ設定でグローバルを使うか
}

// DB保存用の設定型
export interface AdSettingsRow {
  id: string
  setting_type: 'global' | 'page'
  page_id: string | null
  config: AdConfig
  is_enabled: boolean
  created_at: string
  updated_at: string
  updated_by: string | null
}

// マージされた設定（グローバル + ページ上書き）
export interface MergedAdConfig extends AdConfig {
  source: 'global' | 'page' | 'merged'
  isEnabled: boolean
}

// Meta Pixel 標準イベント
export const META_PIXEL_EVENTS = [
  { value: 'PageView', label: 'PageView（ページビュー）' },
  { value: 'ViewContent', label: 'ViewContent（コンテンツ閲覧）' },
  { value: 'Lead', label: 'Lead（リード獲得）' },
  { value: 'CompleteRegistration', label: 'CompleteRegistration（登録完了）' },
  { value: 'Contact', label: 'Contact（お問い合わせ）' },
  { value: 'Schedule', label: 'Schedule（予約）' },
  { value: 'InitiateCheckout', label: 'InitiateCheckout（チェックアウト開始）' },
  { value: 'Purchase', label: 'Purchase（購入）' },
  { value: 'Subscribe', label: 'Subscribe（登録）' },
] as const

export type MetaPixelEventType = typeof META_PIXEL_EVENTS[number]['value']

// dataLayer イベント型
export interface DataLayerEvent {
  event: string
  [key: string]: unknown
}

// window 拡張型
declare global {
  interface Window {
    dataLayer?: DataLayerEvent[]
    fbq?: (
      action: 'track' | 'init' | 'trackCustom',
      event: string,
      params?: Record<string, unknown>
    ) => void
    gtag?: (
      command: 'event' | 'config' | 'js',
      target: string | Date,
      params?: Record<string, unknown>
    ) => void
  }
}
