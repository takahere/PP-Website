'use client'

import { useMemo, useRef } from 'react'
import DOMPurify from 'dompurify'
import {
  HubSpotForm,
  extractHubSpotForms,
  replaceHubSpotScripts,
  type HubSpotFormInfo,
} from './HubSpotForm'

/**
 * HTMLをサニタイズする
 * クライアントサイドでのみ実行される
 * WordPress コンテンツで使用される要素（iframe, lite-youtube等）を許可
 */
function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') return html
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe', 'lite-youtube'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'videoid', 'playlabel'],
    ALLOW_DATA_ATTR: true,
  })
}

interface ContentHtmlRendererProps {
  html: string
  className?: string
}

export function ContentHtmlRenderer({
  html,
  className = '',
}: ContentHtmlRendererProps) {
  // HubSpotフォーム情報を抽出
  const hubspotForms = useMemo(() => extractHubSpotForms(html), [html])

  // HubSpotスクリプトを除去したHTMLを生成
  const cleanedHtml = useMemo(() => replaceHubSpotScripts(html), [html])

  // HubSpotフォームがない場合は通常のレンダリング
  if (hubspotForms.length === 0) {
    return (
      <div
        className={`legacy-content ${className}`}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
      />
    )
  }

  // HubSpotフォームがある場合は、HTMLを分割してフォームを挿入
  return (
    <div className={`legacy-content ${className}`}>
      {/* クリーンなHTMLをレンダリング */}
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: sanitizeHtml(cleanedHtml) }} />

      {/* HubSpotフォームをレンダリング */}
      {hubspotForms.map((form, index) => (
        <div key={form.formId} className="hubspot-form-container my-8">
          <HubSpotForm
            portalId={form.portalId}
            formId={form.formId}
            region={form.region}
          />
        </div>
      ))}
    </div>
  )
}

// プレースホルダーを使用した高度なレンダリング
export function ContentHtmlWithForms({
  html,
  className = '',
}: ContentHtmlRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const hubspotForms = useMemo(() => extractHubSpotForms(html), [html])
  const cleanedHtml = useMemo(() => replaceHubSpotScripts(html), [html])

  // HubSpotフォームがない場合
  if (hubspotForms.length === 0) {
    return (
      <div
        className={`legacy-content ${className}`}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
      />
    )
  }

  // プレースホルダーの位置でHTMLを分割
  const parts = cleanedHtml.split(/<div data-hubspot-form="([^"]+)"><\/div>/g)

  // フォームIDとコンポーネントのマップを作成
  const formMap = new Map<string, HubSpotFormInfo>()
  hubspotForms.forEach((form) => {
    formMap.set(form.formId, form)
  })

  return (
    <div ref={containerRef} className={`legacy-content ${className}`}>
      {parts.map((part, index) => {
        // 偶数インデックスはHTML部分
        if (index % 2 === 0) {
          return part ? (
            <div
              key={`html-${index}`}
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(part) }}
            />
          ) : null
        }

        // 奇数インデックスはフォームID
        const formInfo = formMap.get(part)
        if (formInfo) {
          return (
            <div key={`form-${part}`} className="hubspot-form-container my-8">
              <HubSpotForm
                portalId={formInfo.portalId}
                formId={formInfo.formId}
                region={formInfo.region}
              />
            </div>
          )
        }

        return null
      })}
    </div>
  )
}
