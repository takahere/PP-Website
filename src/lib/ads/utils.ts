/**
 * 広告タグ発火ユーティリティ
 */

import type {
  AdConfig,
  GoogleAdsConfig,
  MetaPixelConfig,
  YahooAdsConfig,
  CustomEventConfig,
  MergedAdConfig,
} from './types'

/**
 * dataLayer に イベントを push
 */
export function pushToDataLayer(event: { event: string; [key: string]: unknown }): void {
  if (typeof window === 'undefined') return

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(event)
}

/**
 * Google Ads コンバージョンを発火
 */
export function fireGoogleAdsConversion(
  config: GoogleAdsConfig,
  label: string,
  value?: number,
  currency?: string
): void {
  if (!config.conversionId || !label) return

  pushToDataLayer({
    event: 'conversion',
    send_to: `${config.conversionId}/${label}`,
    ...(value !== undefined && { value }),
    ...(currency && { currency }),
  })

  // gtag が直接利用可能な場合
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: `${config.conversionId}/${label}`,
      ...(value !== undefined && { value }),
      ...(currency && { currency }),
    })
  }
}

/**
 * Meta Pixel イベントを発火
 */
export function fireMetaPixelEvent(
  config: MetaPixelConfig,
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === 'undefined' || !window.fbq) return
  if (!config.pixelId || !eventName) return

  window.fbq('track', eventName, {
    ...config.customParams,
    ...params,
  })
}

/**
 * Yahoo Ads コンバージョンを発火
 */
export function fireYahooAdsConversion(
  config: YahooAdsConfig,
  label: string
): void {
  if (!config.conversionId || !label) return

  // Yahoo Ads は dataLayer 経由で GTM から発火するのが一般的
  pushToDataLayer({
    event: 'yahoo_conversion',
    yahoo_conversion_id: config.conversionId,
    yahoo_conversion_label: label,
  })
}

/**
 * ページビュー時のコンバージョンを発火
 */
export function firePageViewConversions(config: AdConfig): void {
  // Google Ads
  if (config.googleAds?.pageViewLabel) {
    fireGoogleAdsConversion(config.googleAds, config.googleAds.pageViewLabel)
  }

  // Meta Pixel
  if (config.metaPixel?.pageViewEvent) {
    fireMetaPixelEvent(config.metaPixel, config.metaPixel.pageViewEvent)
  }

  // Yahoo Ads
  if (config.yahooAds?.pageViewLabel) {
    fireYahooAdsConversion(config.yahooAds, config.yahooAds.pageViewLabel)
  }
}

/**
 * フォーム送信時のコンバージョンを発火
 */
export function fireFormSubmitConversions(config: AdConfig): void {
  // Google Ads
  if (config.googleAds?.formSubmitLabel) {
    fireGoogleAdsConversion(config.googleAds, config.googleAds.formSubmitLabel)
  }

  // Meta Pixel
  if (config.metaPixel?.formSubmitEvent) {
    fireMetaPixelEvent(config.metaPixel, config.metaPixel.formSubmitEvent)
  }

  // Yahoo Ads
  if (config.yahooAds?.formSubmitLabel) {
    fireYahooAdsConversion(config.yahooAds, config.yahooAds.formSubmitLabel)
  }
}

/**
 * カスタムイベントのコンバージョンを発火
 */
export function fireCustomEventConversion(
  event: CustomEventConfig,
  config: AdConfig
): void {
  // Google Ads
  if (event.platforms.googleAds?.label && config.googleAds?.conversionId) {
    fireGoogleAdsConversion(
      config.googleAds,
      event.platforms.googleAds.label
    )
  }

  // Meta Pixel
  if (event.platforms.metaPixel?.event && config.metaPixel?.pixelId) {
    fireMetaPixelEvent(
      config.metaPixel,
      event.platforms.metaPixel.event,
      event.platforms.metaPixel.params
    )
  }

  // Yahoo Ads
  if (event.platforms.yahooAds?.label && config.yahooAds?.conversionId) {
    fireYahooAdsConversion(
      config.yahooAds,
      event.platforms.yahooAds.label
    )
  }

  // 汎用イベント（GTM連携用）
  pushToDataLayer({
    event: 'custom_conversion',
    event_name: event.eventName,
    event_selector: event.selector,
    event_type: event.eventType,
  })
}

/**
 * グローバル設定とページ設定をマージ
 */
export function mergeAdConfigs(
  globalConfig: AdConfig | null,
  pageConfig: AdConfig | null
): MergedAdConfig {
  // ページ設定がグローバルを使う場合、またはページ設定がない場合
  if (!pageConfig || pageConfig.useGlobalSettings !== false) {
    if (!globalConfig) {
      return {
        source: 'global',
        isEnabled: false,
      }
    }
    return {
      ...globalConfig,
      source: 'global',
      isEnabled: true,
    }
  }

  // ページ独自の設定を使用
  return {
    ...pageConfig,
    source: 'page',
    isEnabled: true,
  }
}

/**
 * 設定が空かどうかをチェック
 */
export function isAdConfigEmpty(config: AdConfig | null | undefined): boolean {
  if (!config) return true

  const hasGoogleAds = config.googleAds?.conversionId && (
    config.googleAds.pageViewLabel || config.googleAds.formSubmitLabel
  )
  const hasMetaPixel = config.metaPixel?.pixelId && (
    config.metaPixel.pageViewEvent || config.metaPixel.formSubmitEvent
  )
  const hasYahooAds = config.yahooAds?.conversionId && (
    config.yahooAds.pageViewLabel || config.yahooAds.formSubmitLabel
  )
  const hasCustomEvents = config.customEvents && config.customEvents.length > 0

  return !hasGoogleAds && !hasMetaPixel && !hasYahooAds && !hasCustomEvents
}

/**
 * デフォルトの空設定を生成
 */
export function createEmptyAdConfig(): AdConfig {
  return {
    googleAds: {
      conversionId: '',
      pageViewLabel: '',
      formSubmitLabel: '',
    },
    metaPixel: {
      pixelId: '',
      pageViewEvent: '',
      formSubmitEvent: '',
    },
    yahooAds: {
      conversionId: '',
      pageViewLabel: '',
      formSubmitLabel: '',
    },
    customEvents: [],
    useGlobalSettings: true,
  }
}

/**
 * カスタムイベントの新規作成
 */
export function createCustomEvent(): CustomEventConfig {
  return {
    id: crypto.randomUUID(),
    selector: '',
    eventType: 'click',
    eventName: '',
    platforms: {},
  }
}
