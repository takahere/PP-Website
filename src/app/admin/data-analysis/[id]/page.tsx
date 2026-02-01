import { notFound } from 'next/navigation'
import { getSheet } from '../actions'
import { SheetEditor } from './SheetEditor'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SheetDetailPage({ params }: PageProps) {
  const { id } = await params
  const sheet = await getSheet(id)

  if (!sheet) {
    notFound()
  }

  return <SheetEditor sheet={sheet} />
}















