import { Metadata } from 'next'

import { createClient } from '@/lib/supabase/server'
import { SeminarCard } from '@/components/seminar'
import {
  extractSeminarMetadata,
  isUpcomingSeminar,
} from '@/lib/seminar-utils'

export const metadata: Metadata = {
  title: 'セミナー＆イベント | PartnerProp',
  description:
    'パートナービジネスに関するセミナー、ウェビナー、イベント情報をご案内します。',
  alternates: {
    canonical: '/seminar',
  },
  openGraph: {
    title: 'セミナー＆イベント | PartnerProp',
    description:
      'パートナービジネスに関するセミナー、ウェビナー、イベント情報をご案内します。',
  },
}

interface SearchParams {
  page?: string
}

const ITEMS_PER_PAGE = 30 // 全件表示に近い値

// セミナー一覧を取得（content_html も取得してメタデータ抽出に使用）
async function getSeminarList() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select('id, slug, title, thumbnail, content_html, published_at, seo_description')
    .eq('type', 'seminar')
    .eq('is_published', true)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(100)

  if (error) {
    console.error('Error fetching seminars:', error)
    return []
  }

  return data || []
}

// セミナーを開催予定/過去に分離
function separateSeminars(seminars: Awaited<ReturnType<typeof getSeminarList>>) {
  const upcoming: typeof seminars = []
  const past: typeof seminars = []

  for (const seminar of seminars) {
    const metadata = extractSeminarMetadata(seminar.content_html || '')
    if (isUpcomingSeminar(metadata)) {
      upcoming.push(seminar)
    } else {
      past.push(seminar)
    }
  }

  // 開催予定は日付が近い順（昇順）
  upcoming.sort((a, b) => {
    const metaA = extractSeminarMetadata(a.content_html || '')
    const metaB = extractSeminarMetadata(b.content_html || '')
    const dateA = metaA.eventDate?.getTime() || 0
    const dateB = metaB.eventDate?.getTime() || 0
    return dateA - dateB
  })

  return { upcoming, past }
}

export default async function SeminarListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const seminars = await getSeminarList()
  const { upcoming, past } = separateSeminars(seminars)

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー分のスペーサー */}
      <div className="h-12 min-[1200px]:h-[86px]" />

      {/* ページヘッダー */}
      <header className="py-12 text-center">
        <p className="text-sm font-medium tracking-widest text-gray-500">
          Seminar&Event
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
          セミナー＆イベント情報
        </h1>
      </header>

      {/* コンテンツ */}
      <main className="mx-auto max-w-[1200px] px-4 pb-16">
        {seminars.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">セミナーはまだありません</p>
          </div>
        ) : (
          <>
            {/* 開催間近のセミナー */}
            {upcoming.length > 0 && (
              <section className="mb-16" aria-labelledby="upcoming-title">
                <div className="mb-8 text-center">
                  <p className="text-sm font-medium tracking-widest text-gray-500">
                    Upcoming Seminars
                  </p>
                  <h2
                    id="upcoming-title"
                    className="mt-1 text-2xl font-bold text-gray-900"
                  >
                    開催間近のセミナー
                  </h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map((item) => (
                    <SeminarCard key={item.id} item={item} isPast={false} />
                  ))}
                </div>
              </section>
            )}

            {/* 過去開催したセミナー */}
            {past.length > 0 && (
              <section aria-labelledby="past-title">
                <div className="mb-8 text-center">
                  <p className="text-sm font-medium tracking-widest text-gray-500">
                    Past Seminars
                  </p>
                  <h2
                    id="past-title"
                    className="mt-1 text-2xl font-bold text-gray-900"
                  >
                    過去開催したセミナー
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    ※募集は行っていません
                  </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {past.map((item) => (
                    <SeminarCard key={item.id} item={item} isPast={true} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
