'use client'

import { useEffect, useRef } from 'react'

interface HubSpotFormProps {
  portalId: string
  formId: string
  region?: string
  className?: string
  onFormSubmit?: () => void
}

declare global {
  interface Window {
    hbspt?: {
      forms: {
        create: (options: {
          region?: string
          portalId: string
          formId: string
          target: string
          onFormSubmit?: () => void
        }) => void
      }
    }
  }
}

export function HubSpotForm({
  portalId,
  formId,
  region = 'na1',
  className = '',
  onFormSubmit,
}: HubSpotFormProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const formCreated = useRef(false)
  const onFormSubmitRef = useRef(onFormSubmit)

  // コールバックの最新値を保持
  useEffect(() => {
    onFormSubmitRef.current = onFormSubmit
  }, [onFormSubmit])

  useEffect(() => {
    // 既にフォームが作成されている場合はスキップ
    if (formCreated.current) return

    const createForm = () => {
      if (window.hbspt && containerRef.current) {
        // コンテナをクリア
        containerRef.current.innerHTML = ''

        window.hbspt.forms.create({
          region,
          portalId,
          formId,
          target: `#hubspot-form-${formId}`,
          onFormSubmit: () => onFormSubmitRef.current?.(),
        })
        formCreated.current = true
      }
    }

    // HubSpotスクリプトが既に読み込まれているか確認
    if (window.hbspt) {
      createForm()
      return
    }

    // スクリプトが既に追加されているか確認
    const existingScript = document.querySelector(
      'script[src*="js.hsforms.net"]'
    )

    if (existingScript) {
      // スクリプトは存在するが、まだロードされていない可能性
      existingScript.addEventListener('load', createForm)
      // 既にロード済みの場合のためにタイムアウトでも試行
      setTimeout(createForm, 100)
      return
    }

    // HubSpotフォームスクリプトを読み込む
    const script = document.createElement('script')
    script.src = '//js.hsforms.net/forms/embed/v2.js'
    script.charset = 'utf-8'
    script.async = true

    script.onload = () => {
      // スクリプトロード後、少し待ってからフォームを作成
      setTimeout(createForm, 100)
    }

    document.head.appendChild(script)

    return () => {
      formCreated.current = false
    }
  }, [portalId, formId, region])

  return (
    <div
      ref={containerRef}
      id={`hubspot-form-${formId}`}
      className={className}
    />
  )
}

// HubSpotフォーム情報を抽出するユーティリティ
export interface HubSpotFormInfo {
  portalId: string
  formId: string
  region: string
}

export function extractHubSpotForms(html: string): HubSpotFormInfo[] {
  const forms: HubSpotFormInfo[] = []

  // hbspt.forms.create({ ... }) パターンを検出
  const pattern = /hbspt\.forms\.create\s*\(\s*\{([^}]+)\}/g
  let match

  while ((match = pattern.exec(html)) !== null) {
    const config = match[1]

    const portalIdMatch = config.match(/portalId\s*:\s*["']?(\d+)["']?/)
    const formIdMatch = config.match(/formId\s*:\s*["']([a-f0-9-]+)["']/)
    const regionMatch = config.match(/region\s*:\s*["']([^"']+)["']/)

    if (portalIdMatch && formIdMatch) {
      forms.push({
        portalId: portalIdMatch[1],
        formId: formIdMatch[1],
        region: regionMatch ? regionMatch[1] : 'na1',
      })
    }
  }

  return forms
}

// content_htmlからHubSpotスクリプトを除去し、プレースホルダーに置換
export function replaceHubSpotScripts(html: string): string {
  // HubSpotのscriptタグとhbspt.forms.createを含むscriptタグを検出
  // パターン1: <script>...hbspt.forms.create...</script>
  let result = html.replace(
    /<script[^>]*>[\s\S]*?hbspt\.forms\.create\s*\(\s*\{([^}]+)\}[\s\S]*?<\/script>/gi,
    (match, config) => {
      const formIdMatch = config.match(/formId\s*:\s*["']([a-f0-9-]+)["']/)
      if (formIdMatch) {
        return `<div data-hubspot-form="${formIdMatch[1]}"></div>`
      }
      return ''
    }
  )

  // パターン2: HubSpotフォームスクリプトローダーを除去
  result = result.replace(
    /<script[^>]*src="[^"]*js\.hsforms\.net[^"]*"[^>]*><\/script>/gi,
    ''
  )

  return result
}
