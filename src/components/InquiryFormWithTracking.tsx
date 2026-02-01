'use client'

import { HubSpotForm } from '@/components/HubSpotForm'
import { AdTracker, useFormSubmitTracking } from '@/components/AdTracker'
import type { MergedAdConfig } from '@/lib/ads/types'

interface InquiryFormWithTrackingProps {
  pageId: string
  adConfig: MergedAdConfig
  portalId: string
  formId: string
  className?: string
}

/**
 * HubSpotフォームと広告追跡を統合したコンポーネント
 *
 * - ページビュー時にAdTrackerでコンバージョンを発火
 * - フォーム送信時にフォーム送信コンバージョンを発火
 */
export function InquiryFormWithTracking({
  pageId,
  adConfig,
  portalId,
  formId,
  className,
}: InquiryFormWithTrackingProps) {
  const { fireFormConversion } = useFormSubmitTracking(adConfig)

  return (
    <>
      <AdTracker pageId={pageId} config={adConfig} />
      <HubSpotForm
        portalId={portalId}
        formId={formId}
        className={className}
        onFormSubmit={fireFormConversion}
      />
    </>
  )
}
