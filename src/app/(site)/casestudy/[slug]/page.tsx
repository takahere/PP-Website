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

// 導入事例データを取得
async function getCasestudy(slug: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .eq('type', 'casestudy')
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data
}

// SEOメタデータを生成
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const casestudy = await getCasestudy(slug)
  
  if (!casestudy) {
    return {
      title: '導入事例が見つかりません | PartnerProp',
    }
  }
  
  // 未公開コンテンツはnoindex
  const robotsConfig = casestudy.is_published === false
    ? { index: false, follow: false }
    : undefined

  return {
    title: `${casestudy.title} | 導入事例 | PartnerProp`,
    description: casestudy.seo_description || casestudy.og_description || '',
    alternates: {
      canonical: `/casestudy/${slug}`,
    },
    robots: robotsConfig,
    openGraph: {
      title: casestudy.title,
      description: casestudy.og_description || casestudy.seo_description || '',
      images: casestudy.thumbnail ? [casestudy.thumbnail] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: casestudy.title,
      description: casestudy.og_description || casestudy.seo_description || '',
      images: casestudy.thumbnail ? [casestudy.thumbnail] : [],
    },
  }
}

export default async function CasestudyDetailPage({ params }: Props) {
  const { slug } = await params
  const casestudy = await getCasestudy(slug)

  if (!casestudy) {
    notFound()
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://partner-prop.com'
  const pageUrl = `${baseUrl}/casestudy/${slug}`

  // 広告設定を取得
  const adConfig = await getAdConfig(casestudy.id)

  return (
    <>
      <AdTracker pageId={casestudy.id} config={adConfig} />
      <ArticleJsonLd
        title={casestudy.title}
        description={casestudy.seo_description || casestudy.og_description}
        image={casestudy.thumbnail}
        publishedAt={casestudy.created_at}
        updatedAt={casestudy.updated_at}
        url={pageUrl}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'ホーム', url: baseUrl },
          { name: '導入事例', url: `${baseUrl}/casestudy` },
          { name: casestudy.title, url: pageUrl },
        ]}
      />
      <article className="min-h-screen bg-white">
      {/* ヘッダー部分 */}
      <header className="bg-gradient-to-b from-emerald-50 to-white py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* パンくずリスト */}
          <nav className="mb-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">ホーム</Link>
            <span className="mx-2">/</span>
            <Link href="/casestudy" className="hover:text-gray-700">導入事例</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{casestudy.title}</span>
          </nav>
          
          {/* カテゴリバッジ */}
          <div className="mb-4">
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
              導入事例
            </span>
          </div>
          
          {/* タイトル */}
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {casestudy.title}
          </h1>
        </div>
      </header>
      
      {/* アイキャッチ画像 */}
      {casestudy.thumbnail && (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative aspect-video overflow-hidden rounded-xl shadow-lg">
            <Image
              src={casestudy.thumbnail}
              alt={casestudy.title}
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
          html={casestudy.content_html || ''}
          className="prose prose-lg prose-gray max-w-none
            prose-headings:font-bold prose-headings:tracking-tight
            prose-h2:mt-10 prose-h2:text-2xl
            prose-h3:mt-8 prose-h3:text-xl
            prose-p:leading-relaxed
            prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-lg prose-img:shadow-md
            prose-blockquote:border-l-emerald-500 prose-blockquote:bg-gray-50 prose-blockquote:py-1"
        />
      </div>
      
      {/* CTA */}
      <div className="bg-emerald-50 py-12">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900">
            PartnerPropの導入をご検討ですか？
          </h2>
          <p className="mt-4 text-gray-600">
            導入に関するご相談やデモのご依頼など、お気軽にお問い合わせください。
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center rounded-lg bg-emerald-600 px-6 py-3 text-white hover:bg-emerald-700"
          >
            お問い合わせ
          </Link>
        </div>
      </div>
      
      {/* フッター */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link 
            href="/casestudy"
            className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-800"
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
            導入事例一覧に戻る
          </Link>
        </div>
      </footer>
    </article>
    </>
  )
}

