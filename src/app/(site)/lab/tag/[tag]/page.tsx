import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ tag: string }>
}

// タグ情報を取得
async function getTagInfo(tagSlug: string) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('lab_tags')
    .select('slug, name')
    .eq('slug', tagSlug)
    .single()
  
  if (data) {
    // searchName: 記事のtags配列と一致させるための短い名前（検索用）
    const searchName = data.name.split(/[|｜│]/)[0]?.trim() || data.name
    return { ...data, searchName }
  }
  
  return null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)
  
  // スラッグでタグ情報を検索
  const tagInfo = await getTagInfo(tag)
  const displayName = tagInfo?.name || decodedTag

  return {
    title: `${displayName}の記事一覧 | PartnerLab`,
    description: `「${displayName}」タグの記事一覧です。パートナービジネスに関する知見をお届けします。`,
  }
}

async function getArticlesByTag(tagName: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lab_articles')
    .select('id, slug, title, thumbnail, published_at, seo_description, tags')
    .eq('is_published', true)
    .contains('tags', [tagName])
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Error fetching articles by tag:', error)
    return []
  }

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
  return `/lab/${slug}`
}

export default async function LabTagPage({ params }: Props) {
  const { tag } = await params
  
  // タグ情報を取得
  const tagInfo = await getTagInfo(tag)
  
  // 記事検索用にはsearchName（短い名前）を使用
  const searchTag = tagInfo?.searchName || decodeURIComponent(tag)
  const articles = await getArticlesByTag(searchTag)
  
  // 表示名は元のname（長い形式）を使用
  const decodedTag = tagInfo?.name || decodeURIComponent(tag)

  if (articles.length === 0) {
    notFound()
  }

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
            <span>タグ: {decodedTag}</span>
          </nav>
          <h1 className="text-3xl font-bold">#{decodedTag}</h1>
          <p className="mt-2 text-indigo-100">{articles.length}件の記事</p>
        </div>
      </header>

      {/* 記事一覧 */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
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

