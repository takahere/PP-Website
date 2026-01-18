'use client'

import { useMemo } from 'react'
import {
  HubSpotForm,
  extractHubSpotForms,
  replaceHubSpotScripts,
  type HubSpotFormInfo,
} from './HubSpotForm'

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
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  // HubSpotフォームがある場合は、HTMLを分割してフォームを挿入
  return (
    <div className={className}>
      {/* クリーンなHTMLをレンダリング */}
      <div dangerouslySetInnerHTML={{ __html: cleanedHtml }} />

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
  const hubspotForms = useMemo(() => extractHubSpotForms(html), [html])
  const cleanedHtml = useMemo(() => replaceHubSpotScripts(html), [html])

  // HubSpotフォームがない場合
  if (hubspotForms.length === 0) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
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
    <div className={className}>
      {parts.map((part, index) => {
        // 偶数インデックスはHTML部分
        if (index % 2 === 0) {
          return part ? (
            <div
              key={`html-${index}`}
              dangerouslySetInnerHTML={{ __html: part }}
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
