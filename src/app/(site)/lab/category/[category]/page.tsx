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

// カテゴリ情報を取得
async function getCategoryInfo(categorySlug: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('lab_categories')
    .select('slug, name')
    .eq('slug', categorySlug)
    .single()
  
  if (data) {
    // searchName: 記事のcategories配列と一致させるための短い名前（検索用）
    const searchName = data.name.split(/[|｜│]/)[0]?.trim() || data.name
    return { ...data, searchName }
  }
  
  return null
}

// カテゴリ名で記事を取得（スラッグがない場合のフォールバック）
async function getArticlesByCategoryName(categoryName: string, page: number) {
  const supabase = await createClient()
  const offset = (page - 1) * ITEMS_PER_PAGE
  const decodedCategory = decodeURIComponent(categoryName)

  // 総件数を取得
  const { count } = await supabase
    .from('lab_articles')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .contains('categories', [decodedCategory])

  // データを取得
  const { data, error } = await supabase
    .from('lab_articles')
    .select('id, slug, title, thumbnail, published_at, seo_description, categories')
    .eq('is_published', true)
    .contains('categories', [decodedCategory])
    .order('published_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1)

  if (error) {
    console.error('Error fetching articles by category:', error)
    return { items: [], totalPages: 0, categoryName: decodedCategory }
  }

  const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE)

  return { items: data || [], totalPages, categoryName: decodedCategory }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const decodedCategory = decodeURIComponent(category)
  
  // まずスラッグでカテゴリ情報を検索
  const categoryInfo = await getCategoryInfo(category)
  const displayName = categoryInfo?.name || decodedCategory

  return {
    title: `${displayName}の記事一覧 | PartnerLab`,
    description: `「${displayName}」カテゴリの記事一覧です。パートナービジネスに関する知見をお届けします。`,
    openGraph: {
      title: `${displayName}の記事一覧 | PartnerLab`,
      description: `「${displayName}」カテゴリの記事一覧です。`,
    },
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

// スラッグ (category_id) から旧形式URL (/lab/category/id) を生成
function buildArticleUrl(slug: string): string {
  const lastUnderscoreIndex = slug.lastIndexOf('_')
  if (lastUnderscoreIndex !== -1) {
    const category = slug.substring(0, lastUnderscoreIndex)
    const id = slug.substring(lastUnderscoreIndex + 1)
    return `/lab/${category}/${id}`
  }
  return `/lab/${slug}`
}

export default async function LabCategoryPage({ params, searchParams }: Props) {
  const { category } = await params
  const { page } = await searchParams
  const currentPage = Number(page) || 1
  
  // カテゴリ情報を取得
  const categoryInfo = await getCategoryInfo(category)
  
  // 記事検索用にはsearchName（短い名前）を使用
  const searchCategory = categoryInfo?.searchName || decodeURIComponent(category)
  const { items: articles, totalPages } = await getArticlesByCategoryName(searchCategory, currentPage)

  if (articles.length === 0 && currentPage === 1) {
    notFound()
  }

  // 表示名は元のname（長い形式）を使用
  const displayName = categoryInfo?.name || decodeURIComponent(category)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-indigo-600 to-indigo-800 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-4 text-sm text-indigo-200">
            <Link href="/" className="hover:text-white">
              ホーム
            </Link>
            <span className="mx-2">/</span>
            <Link href="/lab" className="hover:text-white">
              PartnerLab
            </Link>
            <span className="mx-2">/</span>
            <span>カテゴリ: {displayName}</span>
          </nav>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-indigo-500 px-3 py-1 text-sm">
              カテゴリ
            </span>
            <h1 className="text-3xl font-bold">{displayName}</h1>
          </div>
          <p className="mt-2 text-indigo-100">
            {articles.length > 0 
              ? `${(currentPage - 1) * ITEMS_PER_PAGE + 1}〜${Math.min(currentPage * ITEMS_PER_PAGE, (currentPage - 1) * ITEMS_PER_PAGE + articles.length)}件を表示`
              : '記事がありません'}
          </p>
        </div>
      </header>

      {/* 記事一覧 */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {articles.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">このカテゴリの記事はまだありません</p>
            <Link
              href="/lab"
              className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800"
            >
              ← PartnerLab一覧に戻る
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <article
                  key={article.id}
                  className="group overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
                >
                  <Link href={buildArticleUrl(article.slug)}>
                    <div className="relative aspect-video overflow-hidden bg-gray-100">
                      {article.thumbnail ? (
                        <Image
                          src={article.thumbnail}
                          alt={article.title}
                          fill
                          className="object-cover transition group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-indigo-50">
                          <span className="text-4xl text-indigo-200">📝</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      {/* カテゴリバッジ */}
                      {article.categories && article.categories.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1">
                          {/* 重複を除去してから表示 */}
                          {(Array.from(new Set(article.categories)) as string[]).slice(0, 2).map((cat, index) => (
                            <span
                              key={`${article.slug}-cat-${index}`}
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                cat === displayName
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-indigo-100 text-indigo-700'
                              }`}
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}
                      <h2 className="line-clamp-2 text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                        {article.title}
                      </h2>
                      {article.published_at && (
                        <time className="mt-2 block text-sm text-gray-500">
                          {formatDate(article.published_at)}
                        </time>
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
                  {currentPage > 1 && (
                    <li>
                      <Link
                        href={`/lab/category/${category}?page=${currentPage - 1}`}
                        className="flex h-10 items-center rounded-lg border bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        前へ
                      </Link>
                    </li>
                  )}

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return pageNum
                  }).map((pageNum) => (
                    <li key={pageNum}>
                      <Link
                        href={`/lab/category/${category}?page=${pageNum}`}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${
                          pageNum === currentPage
                            ? 'bg-indigo-600 text-white'
                            : 'border bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </Link>
                    </li>
                  ))}

                  {currentPage < totalPages && (
                    <li>
                      <Link
                        href={`/lab/category/${category}?page=${currentPage + 1}`}
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

        {/* 戻るリンク */}
        <div className="mt-12 text-center">
          <Link
            href="/lab"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            PartnerLab一覧に戻る
          </Link>
        </div>
      </main>
    </div>
  )
}

