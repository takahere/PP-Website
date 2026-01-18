import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

import { createClient } from '@/lib/supabase/server'
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { TableOfContents } from '@/components/article/TableOfContents'
import { addHeadingIds, extractHeadings } from '@/lib/heading-utils'
import { ContentHtmlWithForms } from '@/components/ContentHtmlRenderer'

interface Props {
  params: Promise<{ category: string; id: string }>
}

// コンテンツタイプごとのスタイル定義
type ContentType = 'research' | 'interview' | 'knowledge' | null

const CONTENT_TYPE_STYLES = {
  research: {
    name: 'リサーチ',
    headerBg: 'bg-gradient-to-b from-blue-50 to-white',
    badge: 'bg-blue-100 text-blue-800',
    accent: 'text-blue-600',
    ctaBg: 'bg-blue-50',
    ctaButton: 'bg-blue-600 hover:bg-blue-700',
    ctaOutline: 'border-blue-600 text-blue-600 hover:bg-blue-50',
    prose: 'prose-a:text-blue-600 prose-blockquote:border-l-blue-500',
  },
  interview: {
    name: 'インタビュー',
    headerBg: 'bg-gradient-to-b from-purple-50 to-white',
    badge: 'bg-purple-100 text-purple-800',
    accent: 'text-purple-600',
    ctaBg: 'bg-purple-50',
    ctaButton: 'bg-purple-600 hover:bg-purple-700',
    ctaOutline: 'border-purple-600 text-purple-600 hover:bg-purple-50',
    prose: 'prose-a:text-purple-600 prose-blockquote:border-l-purple-500',
  },
  knowledge: {
    name: 'ナレッジ',
    headerBg: 'bg-gradient-to-b from-green-50 to-white',
    badge: 'bg-green-100 text-green-800',
    accent: 'text-green-600',
    ctaBg: 'bg-green-50',
    ctaButton: 'bg-green-600 hover:bg-green-700',
    ctaOutline: 'border-green-600 text-green-600 hover:bg-green-50',
    prose: 'prose-a:text-green-600 prose-blockquote:border-l-green-500',
  },
  default: {
    name: 'PartnerLab',
    headerBg: 'bg-gradient-to-b from-indigo-50 to-white',
    badge: 'bg-indigo-100 text-indigo-800',
    accent: 'text-indigo-600',
    ctaBg: 'bg-indigo-50',
    ctaButton: 'bg-indigo-600 hover:bg-indigo-700',
    ctaOutline: 'border-indigo-600 text-indigo-600 hover:bg-indigo-50',
    prose: 'prose-a:text-indigo-600 prose-blockquote:border-l-indigo-500',
  },
}

function getContentTypeStyles(contentType: ContentType) {
  if (contentType && contentType in CONTENT_TYPE_STYLES) {
    return CONTENT_TYPE_STYLES[contentType]
  }
  return CONTENT_TYPE_STYLES.default
}

// カテゴリとIDからスラッグを生成
function buildSlug(category: string, id: string): string {
  return `${category}_${id}`
}

// PartnerLab記事データを取得
async function getLabArticle(category: string, id: string) {
  const supabase = await createClient()
  const slug = buildSlug(category, id)
  
  const { data, error } = await supabase
    .from('lab_articles')
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
  const { category, id } = await params
  const article = await getLabArticle(category, id)
  
  if (!article) {
    return {
      title: '記事が見つかりません | PartnerLab',
    }
  }
  
  // 未公開記事はnoindex
  const robotsConfig = article.is_published === false
    ? { index: false, follow: false }
    : undefined

  return {
    title: `${article.title} | PartnerLab`,
    description: article.seo_description || article.og_description || '',
    alternates: {
      canonical: `/lab/${category}/${id}`,
    },
    robots: robotsConfig,
    openGraph: {
      title: article.title,
      description: article.og_description || article.seo_description || '',
      images: article.thumbnail ? [article.thumbnail] : [],
      type: 'article',
      publishedTime: article.published_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.og_description || article.seo_description || '',
      images: article.thumbnail ? [article.thumbnail] : [],
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

export default async function LabArticleByCategoryPage({ params }: Props) {
  const { category, id } = await params
  const article = await getLabArticle(category, id)
  
  if (!article) {
    notFound()
  }

  // カテゴリとタグを配列として取得
  const categories = article.categories || []
  const tags = article.tags || []
  
  // コンテンツタイプに応じたスタイルを取得
  const contentType = article.content_type as ContentType
  const styles = getContentTypeStyles(contentType)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://partner-prop.com'
  // 旧形式のURL（category/id）を使用
  const pageUrl = `${baseUrl}/lab/${category}/${id}`
  
  // HTMLにheading IDを付与（目次のリンク用）
  const contentWithIds = addHeadingIds(article.content_html || '')
  // 目次用の見出しを抽出
  const tocItems = extractHeadings(contentWithIds)
  
  return (
    <>
      <ArticleJsonLd
        title={article.title}
        description={article.seo_description || article.og_description}
        image={article.thumbnail}
        publishedAt={article.published_at}
        updatedAt={article.updated_at}
        url={pageUrl}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'ホーム', url: baseUrl },
          { name: 'PartnerLab', url: `${baseUrl}/lab` },
          { name: article.title, url: pageUrl },
        ]}
      />
      <article className="min-h-screen bg-white">
      {/* ヘッダー部分 - コンテンツタイプに応じた色 */}
      <header className={`${styles.headerBg} py-12 md:py-16`}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* パンくずリスト */}
          <nav className="mb-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">ホーム</Link>
            <span className="mx-2">/</span>
            <Link href="/lab" className="hover:text-gray-700">PartnerLab</Link>
            {contentType && (
              <>
                <span className="mx-2">/</span>
                <Link 
                  href={`/lab/content_type/${contentType}`} 
                  className="hover:text-gray-700"
                >
                  {styles.name}
                </Link>
              </>
            )}
            <span className="mx-2">/</span>
            <span className="text-gray-900">{article.title}</span>
          </nav>
          
          {/* コンテンツタイプ・カテゴリバッジ */}
          <div className="mb-4 flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${styles.badge}`}>
              {styles.name}
            </span>
            {categories.map((cat: string) => (
              <span 
                key={cat}
                className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700"
              >
                {cat}
              </span>
            ))}
          </div>
          
          {/* タイトル */}
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {article.title}
          </h1>
          
          {/* 公開日 */}
          {article.published_at && (
            <time 
              dateTime={article.published_at}
              className="mt-4 block text-sm text-gray-500"
            >
              {formatDate(article.published_at)}
            </time>
          )}
        </div>
      </header>
      
      {/* アイキャッチ画像 */}
      {article.thumbnail && (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative aspect-video overflow-hidden rounded-xl shadow-lg">
            <Image
              src={article.thumbnail}
              alt={article.title}
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
        {/* 目次 */}
        <TableOfContents items={tocItems} className="mb-10" />
        
        <ContentHtmlWithForms
          html={contentWithIds}
          className={`prose prose-lg prose-gray max-w-none
            prose-headings:font-bold prose-headings:tracking-tight
            prose-h2:mt-10 prose-h2:text-2xl prose-h2:scroll-mt-20
            prose-h3:mt-8 prose-h3:text-xl prose-h3:scroll-mt-20
            prose-p:leading-relaxed
            prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-lg prose-img:shadow-md
            prose-blockquote:bg-gray-50 prose-blockquote:py-1
            ${styles.prose}`}
        />
        
        {/* タグ */}
        {tags.length > 0 && (
          <div className="mt-12 border-t border-gray-200 pt-8">
            <h3 className="text-sm font-semibold text-gray-500">タグ</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag: string) => (
                <Link
                  key={tag}
                  href={`/lab/tag/${encodeURIComponent(tag)}`}
                  className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* CTA - コンテンツタイプに応じた色 */}
      <div className={`${styles.ctaBg} py-12`}>
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900">
            パートナービジネスを加速させませんか？
          </h2>
          <p className="mt-4 text-gray-600">
            PartnerPropは、パートナービジネスの成果拡大を支援するPRMツールです。
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/contact"
              className={`inline-flex items-center rounded-lg px-6 py-3 text-white ${styles.ctaButton}`}
            >
              資料請求・お問い合わせ
            </Link>
            <Link
              href="/lab"
              className={`inline-flex items-center rounded-lg border px-6 py-3 ${styles.ctaOutline}`}
            >
              他の記事を読む
            </Link>
          </div>
        </div>
      </div>
      
      {/* フッター */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link 
            href="/lab"
            className={`inline-flex items-center text-sm font-medium ${styles.accent} hover:opacity-80`}
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
      </footer>
    </article>
    </>
  )
}

