import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { ContentHtmlWithForms } from '@/components/ContentHtmlRenderer'

interface Props {
  params: Promise<{ slug: string }>
}

// 記事データを取得
async function getPost(slug: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
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
  const post = await getPost(slug)
  
  if (!post) {
    return {
      title: '記事が見つかりません | PartnerProp',
    }
  }
  
  return {
    title: `${post.title} | PartnerProp`,
    description: post.seo_description || post.og_description || '',
    openGraph: {
      title: post.title,
      description: post.og_description || post.seo_description || '',
      images: post.thumbnail ? [post.thumbnail] : [],
      type: 'article',
      publishedTime: post.published_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.og_description || post.seo_description || '',
      images: post.thumbnail ? [post.thumbnail] : [],
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

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)
  
  if (!post) {
    notFound()
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://partner-prop.com'
  const pageUrl = `${baseUrl}/blog/${slug}`
  
  return (
    <>
      <ArticleJsonLd
        title={post.title}
        description={post.seo_description || post.og_description}
        image={post.thumbnail}
        publishedAt={post.published_at}
        updatedAt={post.updated_at}
        url={pageUrl}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'ホーム', url: baseUrl },
          { name: 'ブログ', url: `${baseUrl}/blog` },
          { name: post.title, url: pageUrl },
        ]}
      />
      <article className="min-h-screen bg-white">
      {/* ヘッダー部分 */}
      <header className="bg-gradient-to-b from-gray-50 to-white py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* カテゴリバッジ */}
          <div className="mb-4">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              {post.type === 'news' ? 'ニュース' : 'セミナー'}
            </span>
          </div>
          
          {/* タイトル */}
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
            {post.title}
          </h1>
          
          {/* 公開日 */}
          {post.published_at && (
            <time 
              dateTime={post.published_at}
              className="mt-4 block text-sm text-gray-500"
            >
              {formatDate(post.published_at)}
            </time>
          )}
        </div>
      </header>
      
      {/* アイキャッチ画像 */}
      {post.thumbnail && (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative aspect-video overflow-hidden rounded-xl shadow-lg">
            <Image
              src={post.thumbnail}
              alt={post.title}
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
          html={post.content_html || ''}
          className="prose prose-lg prose-gray max-w-none
            prose-headings:font-bold prose-headings:tracking-tight
            prose-h2:mt-10 prose-h2:text-2xl
            prose-h3:mt-8 prose-h3:text-xl
            prose-p:leading-relaxed
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-lg prose-img:shadow-md
            prose-blockquote:border-l-blue-500 prose-blockquote:bg-gray-50 prose-blockquote:py-1
            prose-code:rounded prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5
            prose-pre:bg-gray-900 prose-pre:shadow-lg"
        />
      </div>
      
      {/* フッター */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link 
            href="/blog"
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
            記事一覧に戻る
          </Link>
        </div>
      </footer>
    </article>
    </>
  )
}

