import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ category: string }>
  searchParams: Promise<{ page?: string }>
}

const ITEMS_PER_PAGE = 12

// カテゴリ名のマッピング
const CATEGORY_NAMES: Record<string, string> = {
  'partner-business': 'パートナービジネス',
  'partner-marketing': 'パートナーマーケティング',
  'service-introduction': 'サービス紹介',
}

async function getKnowledgeByCategory(category: string, page: number) {
  const supabase = await createClient()
  const offset = (page - 1) * ITEMS_PER_PAGE

  const { count } = await supabase
    .from('pages')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'knowledge')

  const { data, error } = await supabase
    .from('pages')
    .select('id, slug, title, thumbnail, updated_at, seo_description')
    .eq('type', 'knowledge')
    .order('updated_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1)

  if (error) {
    console.error('Error fetching knowledge by category:', error)
    return { items: [], totalPages: 0 }
  }

  const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE)
  return { items: data || [], totalPages }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const displayName = CATEGORY_NAMES[category] || decodeURIComponent(category)

  return {
    title: `${displayName}のナレッジ一覧 | PartnerProp`,
    description: `「${displayName}」カテゴリのナレッジ記事一覧です。パートナービジネスに関する知見をお届けします。`,
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

export default async function KnowledgeCategoryPage({ params, searchParams }: Props) {
  const { category } = await params
  const { page } = await searchParams
  const currentPage = Number(page) || 1
  const displayName = CATEGORY_NAMES[category] || decodeURIComponent(category)

  const { items, totalPages } = await getKnowledgeByCategory(category, currentPage)

  if (items.length === 0 && currentPage === 1) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-amber-600 to-amber-800 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-4 text-sm text-amber-200">
            <Link href="/" className="hover:text-white">ホーム</Link>
            <span className="mx-2">/</span>
            <Link href="/knowledge" className="hover:text-white">ナレッジ</Link>
            <span className="mx-2">/</span>
            <span>カテゴリ: {displayName}</span>
          </nav>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-amber-500 px-3 py-1 text-sm">カテゴリ</span>
            <h1 className="text-3xl font-bold">{displayName}</h1>
          </div>
          <p className="mt-2 text-amber-100">{items.length}件のナレッジ</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">このカテゴリのナレッジはまだありません</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="group overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md">
                <Link href={`/knowledge/${item.slug}`}>
                  <div className="relative aspect-video overflow-hidden bg-gray-100">
                    {item.thumbnail ? (
                      <Image src={item.thumbnail} alt={item.title} fill className="object-cover transition group-hover:scale-105" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-amber-50">
                        <span className="text-4xl text-amber-200">📚</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h2 className="line-clamp-2 text-lg font-semibold text-gray-900 group-hover:text-amber-600">{item.title}</h2>
                    {item.updated_at && (
                      <time className="mt-2 block text-sm text-gray-500">{formatDate(item.updated_at)}</time>
                    )}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href="/knowledge" className="inline-flex items-center text-amber-600 hover:text-amber-800">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ナレッジ一覧に戻る
          </Link>
        </div>
      </main>
    </div>
  )
}















