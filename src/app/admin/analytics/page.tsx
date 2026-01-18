import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// 動的インポート（バンドルサイズ最適化）
const AnalyticsDashboard = dynamic(
  () => import('@/components/admin/AnalyticsDashboard').then((mod) => mod.AnalyticsDashboard),
  { loading: () => <Skeleton className="h-[600px] w-full" /> }
)

const AnalyticsAIChat = dynamic(
  () => import('./AnalyticsAIChat').then((mod) => mod.AnalyticsAIChat)
)

export const metadata: Metadata = {
  title: 'アナリティクス',
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* ダッシュボード（フル幅） */}
      <AnalyticsDashboard headerActions={<AnalyticsAIChat />} />
    </div>
  )
}
