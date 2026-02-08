import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ status: string }>
  searchParams: Promise<{ page?: string }>
}

const ITEMS_PER_PAGE = 12

// ステータス名のマッピング
const STATUS_NAMES: Record<string, string> = {
  archivedbroadcast: 'アーカイブ配信',
  comingsoon: '開催予定',
  pastevents: '過去開催',
}

const STATUS_DESCRIPTIONS: Record<string, string> = {
  archivedbroadcast: 'アーカイブ配信中のセミナー一覧です。いつでもご視聴いただけます。',
  comingsoon: '開催予定のセミナー一覧です。お申し込みをお待ちしております。',
  pastevents: '過去に開催したセミナー一覧です。',
}

async function getSeminarsByStatus(status: string, page: number) {
  const supabase = await createClient()
  const offset = (page - 1) * ITEMS_PER_PAGE

  // セミナーを取得（現在はステータスでのフィルタリングなし）
  const { count } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'seminar')
    .eq('is_published', true)

  const { data, error } = await supabase
    .from('posts')
    .select('id, slug, title, thumbnail, published_at, seo_description')
    .eq('type', 'seminar')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1)

  if (error) {
    console.error('Error fetching seminars by status:', error)
    return { items: [], totalPages: 0 }
  }

  const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE)
  return { items: data || [], totalPages }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { status } = await params
  const displayName = STATUS_NAMES[status] || decodeURIComponent(status)
  const description = STATUS_DESCRIPTIONS[status] || `${displayName}のセミナー一覧です。`

  return {
    title: `${displayName}セミナー | PartnerProp`,
    description,
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function SeminarStatusPage({ params, searchParams }: Props) {
  const { status } = await params
  const { page } = await searchParams
  const currentPage = Number(page) || 1
  const displayName = STATUS_NAMES[status] || decodeURIComponent(status)
  const description = STATUS_DESCRIPTIONS[status]

  // 有効なステータスかチェック
  if (!STATUS_NAMES[status]) {
    notFound()
  }

  const { items, totalPages } = await getSeminarsByStatus(status, currentPage)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-600 to-purple-800 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-4 text-sm text-purple-200">
            <Link href="/" className="hover:text-white">ホーム</Link>
            <span className="mx-2">/</span>
            <Link href="/seminar" className="hover:text-white">セミナー</Link>
            <span className="mx-2">/</span>
            <span>{displayName}</span>
          </nav>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-purple-500 px-3 py-1 text-sm">
              {status === 'comingsoon' ? '🎯' : status === 'archivedbroadcast' ? '📹' : '📋'}
            </span>
            <h1 className="text-3xl font-bold">{displayName}セミナー</h1>
          </div>
          {description && (
            <p className="mt-2 text-purple-100">{description}</p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* ステータスタブ */}
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/seminar"
            className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            すべて
          </Link>
          {Object.entries(STATUS_NAMES).map(([key, name]) => (
            <Link
              key={key}
              href={`/news/seminar_status/${key}`}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                key === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {name}
            </Link>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">このステータスのセミナーはまだありません</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="group overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md">
                <Link href={`/seminar/${item.slug}`}>
                  <div className="relative aspect-video overflow-hidden bg-gray-100">
                    {item.thumbnail ? (
                      <Image src={item.thumbnail} alt={item.title} fill className="object-cover transition group-hover:scale-105" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-purple-50">
                        <span className="text-4xl text-purple-200">🎤</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <span className="mb-2 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                      {displayName}
                    </span>
                    <h2 className="line-clamp-2 text-lg font-semibold text-gray-900 group-hover:text-purple-600">{item.title}</h2>
                    {item.published_at && (
                      <time className="mt-2 block text-sm text-gray-500">{formatDate(item.published_at)}</time>
                    )}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href="/seminar" className="inline-flex items-center text-purple-600 hover:text-purple-800">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            セミナー一覧に戻る
          </Link>
        </div>
      </main>
    </div>
  )
}


















