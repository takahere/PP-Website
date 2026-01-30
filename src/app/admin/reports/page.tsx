import { ReportList } from '@/components/admin/reports'

export const metadata = {
  title: 'カスタムレポート | PartnerProp Admin',
  description: 'レポートテンプレートの管理と生成',
}

export default function ReportsPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <ReportList />
    </div>
  )
}
