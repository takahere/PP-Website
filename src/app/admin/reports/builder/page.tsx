import { ReportBuilder } from '@/components/admin/reports'

export const metadata = {
  title: 'レポート作成 | PartnerProp Admin',
  description: 'カスタムレポートテンプレートの作成',
}

export default function ReportBuilderPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <ReportBuilder />
    </div>
  )
}
