import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { getSheets } from './actions'

// 動的インポート（バンドルサイズ最適化）
const DataAnalysisWorkspace = dynamic(
  () => import('./DataAnalysisWorkspace').then((mod) => mod.DataAnalysisWorkspace),
  { loading: () => <Skeleton className="h-[600px] w-full" /> }
)

export default async function DataAnalysisPage() {
  const sheets = await getSheets()

  return <DataAnalysisWorkspace initialSheets={sheets} />
}
