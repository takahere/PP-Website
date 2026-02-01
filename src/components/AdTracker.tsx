'use client'

import { useEffect, useRef } from 'react'
import type { AdConfig, MergedAdConfig } from '@/lib/ads/types'
import {
  firePageViewConversions,
  fireCustomEventConversion,
} from '@/lib/ads/utils'

interface AdTrackerProps {
  pageId: string
  config: MergedAdConfig | AdConfig
}

/**
 * 広告タグ発火コンポーネント
 *
 * ページ表示時にコンバージョンタグを発火し、
 * カスタムイベント（クリック、フォーム送信）のリスナーを設定する
 */
export function AdTracker({ pageId, config }: AdTrackerProps) {
  const hasFiredPageView = useRef(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  // ページビュー時のコンバージョン発火
  useEffect(() => {
    // 1回だけ発火
    if (hasFiredPageView.current) return
    hasFiredPageView.current = true

    // 設定が有効でない場合はスキップ
    if ('isEnabled' in config && !config.isEnabled) return

    // ページビューコンバージョンを発火
    firePageViewConversions(config)

    // デバッグログ（開発時のみ）
    if (process.env.NODE_ENV === 'development') {
      console.log('[AdTracker] Page view conversions fired', { pageId, config })
    }
  }, [pageId, config])

  // カスタムイベントのリスナー設定
  useEffect(() => {
    if (!config.customEvents || config.customEvents.length === 0) return
    if ('isEnabled' in config && !config.isEnabled) return

    const listeners: Array<{ element: Element; type: string; handler: () => void }> = []

    config.customEvents.forEach(event => {
      if (!event.selector) return

      const elements = document.querySelectorAll(event.selector)
      elements.forEach(element => {
        const handler = () => {
          fireCustomEventConversion(event, config)

          if (process.env.NODE_ENV === 'development') {
            console.log('[AdTracker] Custom event fired', {
              eventName: event.eventName,
              selector: event.selector,
            })
          }
        }

        element.addEventListener(event.eventType, handler)
        listeners.push({ element, type: event.eventType, handler })
      })
    })

    // クリーンアップ関数を保存
    cleanupRef.current = () => {
      listeners.forEach(({ element, type, handler }) => {
        element.removeEventListener(type, handler)
      })
    }

    return () => {
      cleanupRef.current?.()
    }
  }, [config])

  // このコンポーネントは何もレンダリングしない
  return null
}

/**
 * フォーム送信時の広告タグ発火用フック
 *
 * HubSpotフォームなど、外部フォームの送信完了時に呼び出す
 */
export function useFormSubmitTracking(config: AdConfig | null) {
  const fireFormConversion = () => {
    if (!config) return

    // Google Ads
    if (config.googleAds?.formSubmitLabel) {
      window.dataLayer?.push({
        event: 'conversion',
        send_to: `${config.googleAds.conversionId}/${config.googleAds.formSubmitLabel}`,
      })
    }

    // Meta Pixel
    if (config.metaPixel?.formSubmitEvent && window.fbq) {
      window.fbq('track', config.metaPixel.formSubmitEvent)
    }

    // Yahoo Ads
    if (config.yahooAds?.formSubmitLabel) {
      window.dataLayer?.push({
        event: 'yahoo_conversion',
        yahoo_conversion_id: config.yahooAds.conversionId,
        yahoo_conversion_label: config.yahooAds.formSubmitLabel,
      })
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[AdTracker] Form submit conversion fired', config)
    }
  }

  return { fireFormConversion }
}
