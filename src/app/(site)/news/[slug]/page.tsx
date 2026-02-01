import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { ContentHtmlWithForms } from '@/components/ContentHtmlRenderer'
import { AdTracker } from '@/components/AdTracker'
import { getAdConfig } from '@/lib/ads/server'

interface Props {
  params: Promise<{ slug: string }>
}

// 記事データを取得
async function getNews(slug: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('type', 'news')
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
  const news = await getNews(slug)
  
  if (!news) {
    return {
      title: '記事が見つかりません | PartnerProp',
    }
  }
  
  // 未公開コンテンツはnoindex
  const robotsConfig = news.is_published === false
    ? { index: false, follow: false }
    : undefined

  return {
    title: `${news.title} | ニュース | PartnerProp`,
    description: news.seo_description || news.og_description || '',
    alternates: {
      canonical: `/news/${slug}`,
    },
    robots: robotsConfig,
    openGraph: {
      title: news.title,
      description: news.og_description || news.seo_description || '',
      images: news.thumbnail ? [news.thumbnail] : [],
      type: 'article',
      publishedTime: news.published_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: news.title,
      description: news.og_description || news.seo_description || '',
      images: news.thumbnail ? [news.thumbnail] : [],
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

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params
  const news = await getNews(slug)

  if (!news) {
    notFound()
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://partner-prop.com'
  const pageUrl = `${baseUrl}/news/${slug}`

  // 広告設定を取得
  const adConfig = await getAdConfig(news.id)

  return (
    <>
      <AdTracker pageId={news.id} config={adConfig} />
      <ArticleJsonLd
        title={news.title}
        description={news.seo_description || news.og_description}
        image={news.thumbnail}
        publishedAt={news.published_at}
        updatedAt={news.updated_at}
        url={pageUrl}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'ホーム', url: baseUrl },
          { name: 'ニュース', url: `${baseUrl}/news` },
          { name: news.title, url: pageUrl },
        ]}
      />
      <article className="min-h-screen bg-white">
      {/* ヘッダー部分 */}
      <header className="bg-gradient-to-b from-blue-50 to-white py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* パンくずリスト */}
          <nav className="mb-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">ホーム</Link>
            <span className="mx-2">/</span>
            <Link href="/news" className="hover:text-gray-700">ニュース</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{news.title}</span>
          </nav>
          
          {/* カテゴリバッジ */}
          <div className="mb-4">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              ニュース
            </span>
          </div>
          
          {/* タイトル */}
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {news.title}
          </h1>
          
          {/* 公開日 */}
          {news.published_at && (
            <time 
              dateTime={news.published_at}
              className="mt-4 block text-sm text-gray-500"
            >
              {formatDate(news.published_at)}
            </time>
          )}
        </div>
      </header>
      
      {/* アイキャッチ画像 */}
      {news.thumbnail && (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative aspect-video overflow-hidden rounded-xl shadow-lg">
            <Image
              src={news.thumbnail}
              alt={news.title}
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
          html={news.content_html || ''}
          className="prose prose-lg prose-gray max-w-none
            prose-headings:font-bold prose-headings:tracking-tight
            prose-h2:mt-10 prose-h2:text-2xl
            prose-h3:mt-8 prose-h3:text-xl
            prose-p:leading-relaxed
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-lg prose-img:shadow-md
            prose-blockquote:border-l-blue-500 prose-blockquote:bg-gray-50 prose-blockquote:py-1"
        />
      </div>
      
      {/* フッター */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link 
            href="/news"
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
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
            ニュース一覧に戻る
          </Link>
        </div>
      </footer>
    </article>
    </>
  )
}

