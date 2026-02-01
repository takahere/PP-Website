import { AdSettingsForm } from '@/components/admin/AdSettingsForm'

export const metadata = {
  title: '広告設定 | PartnerProp Admin',
  description: 'サイト全体の広告タグ・コンバージョン設定',
}

export default function AdSettingsPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <AdSettingsForm />
    </div>
  )
}
