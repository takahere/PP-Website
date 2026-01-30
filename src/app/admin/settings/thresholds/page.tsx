import { AlertThresholdSettings } from '@/components/admin/AlertThresholdSettings'

export const metadata = {
  title: '異常検知閾値設定 | PartnerProp Admin',
  description: '異常検知の閾値をカスタマイズ',
}

export default function ThresholdsSettingsPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <AlertThresholdSettings />
    </div>
  )
}
