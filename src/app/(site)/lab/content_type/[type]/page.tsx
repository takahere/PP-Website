import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'

// コンテンツタイプの定義
const CONTENT_TYPES = {
  research: {
    name: 'リサーチ',
    nameEn: 'Research',
    description: '数値でみるパートナーマーケティング。事実とデータをもとに実践的なインサイトを提供します。',
    color: 'bg-blue-600',
  },
  interview: {
    name: 'インタビュー',
    nameEn: 'Interview',
    description: '現場の声から学ぶ。経営者・専門家・実務者などへのインタビューを通じた洞察記事',
    color: 'bg-purple-600',
  },
  knowledge: {
    name: 'ナレッジ',
    nameEn: 'Knowledge',
    description: 'パートナービジネスに関するナレッジ、ノウハウ、お役立ち情報をご紹介します。',
    color: 'bg-green-600',
  },
} as const

type ContentType = keyof typeof CONTENT_TYPES

interface Props {
  params: Promise<{ type: string }>
}

// スラッグからURL生成
function buildArticleUrl(slug: string): string {
  const lastUnderscoreIndex = slug.lastIndexOf('_')
  if (lastUnderscoreIndex !== -1) {
    const category = slug.substring(0, lastUnderscoreIndex)
    const id = slug.substring(lastUnderscoreIndex + 1)
    return `/lab/${category}/${id}`
  }
  return `/lab/${slug}`
}

// メタデータ生成
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params
  const contentType = CONTENT_TYPES[type as ContentType]

  if (!contentType) {
    return {
      title: 'ページが見つかりません | PartnerLab',
    }
  }

  return {
    title: `${contentType.name} | PartnerLab`,
    description: contentType.description,
    openGraph: {
      title: `${contentType.name} | PartnerLab`,
      description: contentType.description,
    },
  }
}

// 静的パラメータ生成
export async function generateStaticParams() {
  return Object.keys(CONTENT_TYPES).map((type) => ({ type }))
}

// コンテンツタイプ別の記事取得
async function getArticlesByContentType(contentType: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lab_articles')
    .select('id, slug, title, thumbnail, categories, tags, published_at, content_type')
    .eq('is_published', true)
    .eq('content_type', contentType)
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Error fetching articles by content type:', error)
    return []
  }

  return data || []
}

// 日付フォーマット
function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function ContentTypeListPage({ params }: Props) {
  const { type } = await params
  const contentType = CONTENT_TYPES[type as ContentType]

  if (!contentType) {
    notFound()
  }

  const articles = await getArticlesByContentType(type)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヒーローセクション - コンテンツタイプごとに色を変更 */}
      <section className={`${contentType.color} py-16 text-white`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-wider opacity-80">
              {contentType.nameEn}
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
              {contentType.name}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg opacity-90">
              {contentType.description}
            </p>
          </div>
        </div>
      </section>

      {/* 記事一覧 */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {contentType.name}の記事はまだありません
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={buildArticleUrl(article.slug)}
                  className="group block overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg"
                >
                  {/* サムネイル */}
                  <div className="aspect-video overflow-hidden bg-gray-100">
                    {article.thumbnail ? (
                      <Image
                        src={article.thumbnail}
                        alt={article.title}
                        width={400}
                        height={225}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-4xl text-gray-300">📄</span>
                      </div>
                    )}
                  </div>

                  {/* コンテンツ */}
                  <div className="p-5">
                    {/* カテゴリ・タグ */}
                    <div className="mb-3 flex flex-wrap gap-2">
                      {/* 重複を除去してから表示 */}
                      {(Array.from(new Set(article.categories || [])) as string[]).slice(0, 2).map((cat, index) => (
                        <Badge key={`${article.slug}-cat-${index}`} variant="secondary" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>

                    {/* タイトル */}
                    <h2 className="mb-2 text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600">
                      {article.title}
                    </h2>

                    {/* 日付 */}
                    <time className="text-sm text-gray-500">
                      {formatDate(article.published_at)}
                    </time>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Labトップへ戻る */}
          <div className="mt-12 text-center">
            <Link
              href="/lab"
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              PartnerLabトップへ
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

