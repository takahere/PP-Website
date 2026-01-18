import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
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
      {/* ヘッダー部分 */}
      <header className="bg-gradient-to-b from-purple-50 to-white py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* パンくずリスト */}
          <nav className="mb-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">ホーム</Link>
            <span className="mx-2">/</span>
            <Link href="/seminar" className="hover:text-gray-700">セミナー</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{seminar.title}</span>
          </nav>
          
          {/* カテゴリバッジ */}
          <div className="mb-4">
            <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800">
              セミナー
            </span>
          </div>
          
          {/* タイトル */}
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {seminar.title}
          </h1>
          
          {/* 公開日 */}
          {seminar.published_at && (
            <time 
              dateTime={seminar.published_at}
              className="mt-4 block text-sm text-gray-500"
            >
              {formatDate(seminar.published_at)}
            </time>
          )}
        </div>
      </header>
      
      {/* アイキャッチ画像 */}
      {seminar.thumbnail && (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative aspect-video overflow-hidden rounded-xl shadow-lg">
            <Image
              src={seminar.thumbnail}
              alt={seminar.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
            />
          </div>
        </div>
      )}
      
      {/* 本文 */}
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <ContentHtmlWithForms
          html={seminar.content_html || ''}
          className="prose prose-lg prose-gray max-w-none
            prose-headings:font-bold prose-headings:tracking-tight
            prose-h2:mt-10 prose-h2:text-2xl
            prose-h3:mt-8 prose-h3:text-xl
            prose-p:leading-relaxed
            prose-a:text-purple-600 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-lg prose-img:shadow-md
            prose-blockquote:border-l-purple-500 prose-blockquote:bg-gray-50 prose-blockquote:py-1"
        />
      </div>
      
      {/* フッター */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link 
            href="/seminar"
            className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-800"
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

