import { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { SectionRenderer } from '@/components/lp/SectionRenderer'
import { ContentHtmlWithForms } from '@/components/ContentHtmlRenderer'
import type { LPSection } from '@/components/lp'

interface Props {
  params: Promise<{ slug: string }>
}

// 専用ルートがあるためスキップするスラッグ
const RESERVED_SLUGS = [
  'casestudy',
  'knowledge',
  'seminar',
  'news',
  'member',
  'lab',
  'admin',
  'login',
  'blog',
]

// 静的生成用のスラッグ（ビルド時に生成）
const STATIC_SLUGS = [
  'company',
  'partner-marketing',
  'privacy',
  'privacy-en',
  'terms',
  'terms-en',
  'security_policy',
  'recruitment',
  'brandsite',
  'inquiry',
  'about',
  'lp-sim1',
]

// 日英ページのマッピング（hreflang用）
const LANGUAGE_ALTERNATES: Record<string, { ja?: string; en?: string }> = {
  'privacy': { ja: '/privacy', en: '/privacy-en' },
  'privacy-en': { ja: '/privacy', en: '/privacy-en' },
  'terms': { ja: '/terms', en: '/terms-en' },
  'terms-en': { ja: '/terms', en: '/terms-en' },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://partner-prop.com'

  const { data: page } = await supabase
    .from('pages')
    .select('title, seo_description, thumbnail')
    .eq('slug', slug)
    .single()

  if (!page) {
    return {
      title: 'ページが見つかりません',
    }
  }

  // hreflang設定（日英ページ対応）
  const langAlternates = LANGUAGE_ALTERNATES[slug]
  const alternates = langAlternates
    ? {
        canonical: `/${slug}`,
        languages: {
          'ja': langAlternates.ja,
          'en': langAlternates.en,
          'x-default': langAlternates.ja, // デフォルトは日本語
        },
      }
    : {
        canonical: `/${slug}`,
      }

  return {
    title: page.title,
    description: page.seo_description || undefined,
    alternates,
    openGraph: {
      title: page.title,
      description: page.seo_description || undefined,
      images: page.thumbnail ? [page.thumbnail] : undefined,
      locale: slug.endsWith('-en') ? 'en_US' : 'ja_JP',
    },
  }
}

export default async function StaticPage({ params }: Props) {
  const { slug } = await params
  
  // 予約されたスラッグは専用ルートで処理するため、ここでは処理しない
  if (RESERVED_SLUGS.includes(slug)) {
    notFound()
  }

  const supabase = await createClient()

  const { data: page, error } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !page) {
    notFound()
  }

  // sectionsがある場合はセクションベースで描画
  const sections = page.sections as LPSection[] | null
  const hasSections = sections && Array.isArray(sections) && sections.length > 0

  if (hasSections) {
    return <SectionRenderer sections={sections} />
  }

  // HTMLコンテンツで描画
  return (
    <article className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 py-16 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-bold text-white md:text-4xl">
            {page.title}
          </h1>
          {page.seo_description && (
            <p className="mt-4 text-gray-300">
              {page.seo_description}
            </p>
          )}
        </div>
      </header>

      {/* サムネイル */}
      {page.thumbnail && (
        <div className="relative mx-auto -mt-8 max-w-4xl px-4">
          <div className="relative aspect-video overflow-hidden rounded-lg shadow-lg">
            <Image
              src={page.thumbnail}
              alt={page.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      )}

      {/* 本文 */}
      <div className="mx-auto max-w-4xl px-4 py-12">
        <ContentHtmlWithForms
          html={page.content_html || ''}
          className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-a:text-[var(--pp-coral)] prose-img:rounded-lg"
        />
      </div>
    </article>
  )
}

// 静的生成用
export async function generateStaticParams() {
  return STATIC_SLUGS.map((slug) => ({ slug }))
}
