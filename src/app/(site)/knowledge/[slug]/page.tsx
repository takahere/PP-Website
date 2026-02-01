import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { ContentHtmlWithForms } from '@/components/ContentHtmlRenderer'
import { AdTracker } from '@/components/AdTracker'
import { getAdConfig } from '@/lib/ads/server'

interface Props {
  params: Promise<{ slug: string }>
}

// ナレッジデータを取得
async function getKnowledge(slug: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .eq('type', 'knowledge')
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data
}

// SEOメタデータを生成
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const knowledge = await getKnowledge(slug)
  
  if (!knowledge) {
    return {
      title: 'ナレッジが見つかりません | PartnerProp',
    }
  }
  
  // 未公開コンテンツはnoindex
  const robotsConfig = knowledge.is_published === false
    ? { index: false, follow: false }
    : undefined

  return {
    title: `${knowledge.title} | ナレッジ | PartnerProp`,
    description: knowledge.seo_description || knowledge.og_description || '',
    alternates: {
      canonical: `/knowledge/${slug}`,
    },
    robots: robotsConfig,
    openGraph: {
      title: knowledge.title,
      description: knowledge.og_description || knowledge.seo_description || '',
      images: knowledge.thumbnail ? [knowledge.thumbnail] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: knowledge.title,
      description: knowledge.og_description || knowledge.seo_description || '',
      images: knowledge.thumbnail ? [knowledge.thumbnail] : [],
    },
  }
}

export default async function KnowledgeDetailPage({ params }: Props) {
  const { slug } = await params
  const knowledge = await getKnowledge(slug)

  if (!knowledge) {
    notFound()
  }

  // 広告設定を取得
  const adConfig = await getAdConfig(knowledge.id)

  return (
    <>
      <AdTracker pageId={knowledge.id} config={adConfig} />
      <article className="min-h-screen bg-white">
      {/* ヘッダー部分 */}
      <header className="bg-gradient-to-b from-amber-50 to-white py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* パンくずリスト */}
          <nav className="mb-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">ホーム</Link>
            <span className="mx-2">/</span>
            <Link href="/knowledge" className="hover:text-gray-700">ナレッジ</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{knowledge.title}</span>
          </nav>
          
          {/* カテゴリバッジ */}
          <div className="mb-4">
            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
              ナレッジ
            </span>
          </div>
          
          {/* タイトル */}
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {knowledge.title}
          </h1>
        </div>
      </header>
      
      {/* アイキャッチ画像 */}
      {knowledge.thumbnail && (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative aspect-video overflow-hidden rounded-xl shadow-lg">
            <Image
              src={knowledge.thumbnail}
              alt={knowledge.title}
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
          html={knowledge.content_html || ''}
          className="prose prose-lg prose-gray max-w-none
            prose-headings:font-bold prose-headings:tracking-tight
            prose-h2:mt-10 prose-h2:text-2xl
            prose-h3:mt-8 prose-h3:text-xl
            prose-p:leading-relaxed
            prose-a:text-amber-600 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-lg prose-img:shadow-md
            prose-blockquote:border-l-amber-500 prose-blockquote:bg-gray-50 prose-blockquote:py-1"
        />
      </div>
      
      {/* 関連資料CTA */}
      <div className="bg-amber-50 py-12">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900">
            パートナービジネスの知識を深める
          </h2>
          <p className="mt-4 text-gray-600">
            PartnerLabでは、パートナービジネスに関する最新情報やノウハウを発信しています。
          </p>
          <Link
            href="/lab"
            className="mt-6 inline-flex items-center rounded-lg bg-amber-600 px-6 py-3 text-white hover:bg-amber-700"
          >
            PartnerLabを見る
          </Link>
        </div>
      </div>
      
      {/* フッター */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link 
            href="/knowledge"
            className="inline-flex items-center text-sm font-medium text-amber-600 hover:text-amber-800"
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
            ナレッジ一覧に戻る
          </Link>
        </div>
      </footer>
    </article>
    </>
  )
}

