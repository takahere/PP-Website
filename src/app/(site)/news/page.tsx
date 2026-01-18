import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'ニュース | PartnerProp',
  description: 'PartnerPropの最新ニュース、プレスリリース、メディア掲載情報をお届けします。',
  openGraph: {
    title: 'ニュース | PartnerProp',
    description: 'PartnerPropの最新ニュース、プレスリリース、メディア掲載情報をお届けします。',
  },
}

interface SearchParams {
  page?: string
}

const ITEMS_PER_PAGE = 12

// ニュース一覧を取得
async function getNewsList(page: number) {
  const supabase = await createClient()
  const offset = (page - 1) * ITEMS_PER_PAGE
  
  // 総件数を取得
  const { count } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'news')
    .eq('is_published', true)
  
  // データを取得
  const { data, error } = await supabase
    .from('posts')
    .select('id, slug, title, thumbnail, published_at, seo_description')
    .eq('type', 'news')
    .eq('is_published', true)
    .order('published_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1)
  
  if (error) {
    console.error('Error fetching news:', error)
    return { items: [], totalPages: 0 }
  }
  
  const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE)
  
  return { items: data || [], totalPages }
}

// 日付をフォーマット
function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function NewsListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const currentPage = Number(params.page) || 1
  const { items, totalPages } = await getNewsList(currentPage)
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight">ニュース</h1>
          <p className="mt-4 text-lg text-blue-100">
            PartnerPropの最新ニュース、プレスリリース、メディア掲載情報
          </p>
        </div>
      </header>
      
      {/* コンテンツ */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">ニュースはまだありません</p>
          </div>
        ) : (
          <>
            {/* 記事グリッド */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
                >
                  <Link href={`/news/${item.slug}`}>
                    {/* サムネイル */}
                    <div className="relative aspect-video overflow-hidden bg-gray-100">
                      {item.thumbnail ? (
                        <Image
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          className="object-cover transition group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-blue-50">
                          <span className="text-4xl text-blue-200">📰</span>
                        </div>
                      )}
                    </div>
                    
                    {/* コンテンツ */}
                    <div className="p-5">
                      <time className="text-sm text-gray-500">
                        {formatDate(item.published_at)}
                      </time>
                      <h2 className="mt-2 text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600">
                        {item.title}
                      </h2>
                      {item.seo_description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {item.seo_description}
                        </p>
                      )}
                    </div>
                  </Link>
                </article>
              ))}
            </div>
            
            {/* ページネーション */}
            {totalPages > 1 && (
              <nav className="mt-12 flex justify-center">
                <ul className="flex items-center gap-2">
                  {/* 前へ */}
                  {currentPage > 1 && (
                    <li>
                      <Link
                        href={`/news?page=${currentPage - 1}`}
                        className="flex h-10 items-center rounded-lg border bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        前へ
                      </Link>
                    </li>
                  )}
                  
                  {/* ページ番号 */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <li key={page}>
                      <Link
                        href={`/news?page=${page}`}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${
                          page === currentPage
                            ? 'bg-blue-600 text-white'
                            : 'border bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </Link>
                    </li>
                  ))}
                  
                  {/* 次へ */}
                  {currentPage < totalPages && (
                    <li>
                      <Link
                        href={`/news?page=${currentPage + 1}`}
                        className="flex h-10 items-center rounded-lg border bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        次へ
                      </Link>
                    </li>
                  )}
                </ul>
              </nav>
            )}
          </>
        )}
      </main>
    </div>
  )
}
