import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'PartnerLab | パートナービジネスの知見を発信',
  description: 'パートナービジネスに関する最新トレンド、ベストプラクティス、成功事例をお届けするメディアです。',
  openGraph: {
    title: 'PartnerLab | パートナービジネスの知見を発信',
    description: 'パートナービジネスに関する最新トレンド、ベストプラクティス、成功事例をお届けするメディアです。',
  },
}

interface SearchParams {
  page?: string
}

const ITEMS_PER_PAGE = 12

// PartnerLab記事一覧を取得
async function getLabArticles(page: number) {
  const supabase = await createClient()
  const offset = (page - 1) * ITEMS_PER_PAGE

  // 総件数を取得
  const { count } = await supabase
    .from('lab_articles')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)

  // データを取得
  const { data, error } = await supabase
    .from('lab_articles')
    .select('id, slug, title, thumbnail, published_at, seo_description, categories, content_type')
    .eq('is_published', true)
    .order('published_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1)

  if (error) {
    console.error('Error fetching lab articles:', error)
    return { items: [], totalPages: 0 }
  }

  const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE)

  return { items: data || [], totalPages }
}

// カテゴリ一覧を取得
async function getCategories() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('lab_categories')
    .select('slug, name')
    .order('name')

  return data || []
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

// スラッグ (category_id) から旧形式URL (/lab/category/id) を生成
function buildArticleUrl(slug: string): string {
  const lastUnderscoreIndex = slug.lastIndexOf('_')
  if (lastUnderscoreIndex !== -1) {
    const category = slug.substring(0, lastUnderscoreIndex)
    const id = slug.substring(lastUnderscoreIndex + 1)
    return `/lab/${category}/${id}`
  }
  // fallback: slugが想定外の形式の場合
  return `/lab/${slug}`
}

// コンテンツタイプのスタイル
const contentTypeStyles: Record<string, { label: string; bg: string; text: string }> = {
  research: { label: 'リサーチ', bg: 'bg-blue-100', text: 'text-blue-700' },
  interview: { label: 'インタビュー', bg: 'bg-purple-100', text: 'text-purple-700' },
  knowledge: { label: 'ナレッジ', bg: 'bg-green-100', text: 'text-green-700' },
}

// コンテンツタイプ一覧
const contentTypes = [
  { key: 'interview', label: 'インタビュー' },
  { key: 'knowledge', label: 'ナレッジ' },
  { key: 'research', label: 'リサーチ' },
]

export default async function LabListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const currentPage = Number(params.page) || 1

  const [{ items, totalPages }, categories] = await Promise.all([
    getLabArticles(currentPage),
    getCategories(),
  ])

  return (
    <div className="min-h-screen bg-[var(--pp-bg-light)]">
      {/* ヘッダー */}
      <header className="bg-[var(--pp-dark)] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--pp-coral)]">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">PartnerLab</h1>
          </div>
          <p className="mt-4 text-lg text-gray-300">
            パートナービジネスの最新トレンド、ベストプラクティス、成功事例を発信
          </p>
        </div>
      </header>

      {/* コンテンツタイプフィルター */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/lab"
              className="rounded-full bg-[var(--pp-coral)] px-5 py-2 text-sm font-medium text-white transition hover:bg-[var(--pp-coral-hover)]"
            >
              すべて
            </Link>
            {contentTypes.map((type) => (
              <Link
                key={type.key}
                href={`/lab/content_type/${type.key}`}
                className="rounded-full bg-gray-100 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
              >
                {type.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* カテゴリフィルター */}
      {categories.length > 0 && (
        <div className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-500">カテゴリ:</span>
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/lab/category/${cat.slug}`}
                  className="text-sm text-gray-600 hover:text-[var(--pp-coral)] transition"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* コンテンツ */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">記事はまだありません</p>
          </div>
        ) : (
          <>
            {/* 記事グリッド */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const typeStyle = item.content_type ? contentTypeStyles[item.content_type] : null
                return (
                  <article
                    key={item.id}
                    className="group overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <Link href={buildArticleUrl(item.slug)}>
                      <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                        {item.thumbnail ? (
                          <Image
                            src={item.thumbnail}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gray-100">
                            <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                          </div>
                        )}
                        {/* コンテンツタイプリボン */}
                        {typeStyle && (
                          <div className="absolute top-3 left-3">
                            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${typeStyle.bg} ${typeStyle.text}`}>
                              {typeStyle.label}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        {/* カテゴリタグ */}
                        {item.categories && item.categories.length > 0 && (
                          <div className="mb-3 flex flex-wrap gap-1.5">
                            {(Array.from(new Set(item.categories)) as string[]).slice(0, 2).map((cat, index) => (
                              <span
                                key={`${item.slug}-cat-${index}`}
                                className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        )}

                        <h2 className="text-lg font-bold text-[var(--pp-dark)] line-clamp-2 group-hover:text-[var(--pp-coral)] transition-colors">
                          {item.title}
                        </h2>

                        {item.seo_description && (
                          <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                            {item.seo_description}
                          </p>
                        )}

                        <time className="mt-3 block text-xs text-gray-400">
                          {formatDate(item.published_at)}
                        </time>
                      </div>
                    </Link>
                  </article>
                )
              })}
            </div>

            {/* ページネーション */}
            {totalPages > 1 && (
              <nav className="mt-12 flex justify-center">
                <ul className="flex items-center gap-2">
                  {currentPage > 1 && (
                    <li>
                      <Link
                        href={`/lab?page=${currentPage - 1}`}
                        className="flex h-10 items-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                      >
                        前へ
                      </Link>
                    </li>
                  )}

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page: number
                    if (totalPages <= 5) {
                      page = i + 1
                    } else if (currentPage <= 3) {
                      page = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i
                    } else {
                      page = currentPage - 2 + i
                    }
                    return page
                  }).map((page) => (
                    <li key={page}>
                      <Link
                        href={`/lab?page=${page}`}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition ${
                          page === currentPage
                            ? 'bg-[var(--pp-coral)] text-white'
                            : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </Link>
                    </li>
                  ))}

                  {currentPage < totalPages && (
                    <li>
                      <Link
                        href={`/lab?page=${currentPage + 1}`}
                        className="flex h-10 items-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
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

      {/* CTA */}
      <section className="bg-[var(--pp-dark)] py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">
            パートナービジネスを加速させませんか？
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            PartnerPropは、パートナービジネスの成果拡大を支援するPRMツールです。
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center rounded-lg bg-[var(--pp-coral)] px-6 py-3 font-medium text-white hover:bg-[var(--pp-coral-hover)] transition"
            >
              資料請求・お問い合わせ
            </Link>
            <Link
              href="/seminar"
              className="inline-flex items-center rounded-lg border border-white/30 px-6 py-3 font-medium text-white hover:bg-white/10 transition"
            >
              セミナー情報を見る
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
