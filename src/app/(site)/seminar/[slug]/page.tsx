import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { EventJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { ContentHtmlWithForms } from '@/components/ContentHtmlRenderer'

interface Props {
  params: Promise<{ slug: string }>
}

// セミナーデータを取得
async function getSeminar(slug: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('type', 'seminar')
    .eq('is_published', true)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data
}

// SEOメタデータを生成
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const seminar = await getSeminar(slug)
  
  if (!seminar) {
    return {
      title: 'セミナーが見つかりません | PartnerProp',
    }
  }
  
  // 未公開コンテンツはnoindex
  const robotsConfig = seminar.is_published === false
    ? { index: false, follow: false }
    : undefined

  return {
    title: `${seminar.title} | セミナー | PartnerProp`,
    description: seminar.seo_description || seminar.og_description || '',
    alternates: {
      canonical: `/seminar/${slug}`,
    },
    robots: robotsConfig,
    openGraph: {
      title: seminar.title,
      description: seminar.og_description || seminar.seo_description || '',
      images: seminar.thumbnail ? [seminar.thumbnail] : [],
      type: 'article',
      publishedTime: seminar.published_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: seminar.title,
      description: seminar.og_description || seminar.seo_description || '',
      images: seminar.thumbnail ? [seminar.thumbnail] : [],
    },
  }
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

export default async function SeminarDetailPage({ params }: Props) {
  const { slug } = await params
  const seminar = await getSeminar(slug)

  if (!seminar) {
    notFound()
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://partner-prop.com'
  const pageUrl = `${baseUrl}/seminar/${slug}`

  return (
    <>
      <EventJsonLd
        name={seminar.title}
        description={seminar.seo_description || seminar.og_description}
        image={seminar.thumbnail}
        startDate={seminar.published_at}
        url={pageUrl}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'ホーム', url: baseUrl },
          { name: 'セミナー', url: `${baseUrl}/seminar` },
          { name: seminar.title, url: pageUrl },
        ]}
      />
      <article className="min-h-screen bg-white">
        {/* ヘッダー分のスペーサー */}
        <div className="h-12 min-[1200px]:h-[86px]" />

        {/* 本文: articleBodyクラスでレガシーCSS適用 */}
        <div className="mx-auto max-w-[800px] px-4 py-8">
          <div className="articleBody">
            <ContentHtmlWithForms html={seminar.content_html || ''} />
          </div>
        </div>

        {/* フッター */}
        <footer className="border-t border-gray-200 py-8">
          <div className="mx-auto max-w-3xl px-4">
            <Link
              href="/seminar"
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
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
              セミナー一覧に戻る
            </Link>
          </div>
        </footer>
      </article>
    </>
  )
}

