import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { OrganizationJsonLd } from '@/components/seo/JsonLd'
import { SectionRenderer } from '@/components/lp/SectionRenderer'
import { ContentHtmlWithForms } from '@/components/ContentHtmlRenderer'
import type { LPSection } from '@/components/lp'
import {
  HeroSection,
  ITReviewSection,
  CompanyLogosSection,
  IntroSection,
  ResultsSection,
  PartnerMarketingSection,
  CTASection,
} from '@/components/lp'

// content_htmlからfirstContentセクションを削除する関数
function removeFirstContentSection(html: string): string {
  // firstContentセクションを正規表現で削除
  // <section id="firstContent"...>...</section> または <div id="firstContent"...>...</div> を削除
  const firstContentRegex = /<(section|div)[^>]*id=["']firstContent["'][^>]*>[\s\S]*?<\/\1>/gi
  return html.replace(firstContentRegex, '')
}

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()

  const { data: page } = await supabase
    .from('pages')
    .select('title, seo_description, og_description, thumbnail')
    .eq('slug', 'home')
    .single()

  return {
    title: page?.title || 'PartnerProp | パートナーマーケティングを実現する PRM',
    description: page?.seo_description || 'パートナービジネスを科学し仕組みにするPRMツール「PartnerProp」。代理店・パートナー企業との連携を最適化し、売上拡大を支援します。',
    openGraph: {
      title: page?.title || 'PartnerProp | パートナーマーケティングを実現する PRM',
      description: page?.og_description || page?.seo_description || 'パートナービジネスを科学し仕組みにするPRMツール「PartnerProp」',
      images: page?.thumbnail ? [page.thumbnail] : ['/og-image.png'],
    },
  }
}

export default async function HomePage() {
  const supabase = await createClient()

  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', 'home')
    .single()

  // sectionsがある場合はセクションベースで描画
  const sections = page?.sections as LPSection[] | null
  const hasSections = sections && Array.isArray(sections) && sections.length > 0

  // content_htmlの存在チェック
  const hasContentHtml = page?.content_html && typeof page.content_html === 'string' && page.content_html.trim().length > 0

  return (
    <>
      <OrganizationJsonLd
        name="PartnerProp"
        url="https://partner-prop.com"
        logo="https://partner-prop.com/logo.png"
        description="パートナービジネスを科学し仕組みにするPRMツール「PartnerProp」。代理店・パートナー企業との連携を最適化し、売上拡大を支援します。"
      />

      {/* ヘッダー分のスペーサー */}
      <div className="h-12 min-[1200px]:h-20" />

      {hasSections ? (
        // sectionsがある場合: SectionRendererで描画
        <SectionRenderer sections={sections} />
      ) : hasContentHtml ? (
        // content_htmlがある場合: 新しいHeroSection + 残りのWordPress HTML
        <>
          <HeroSection />
          <ContentHtmlWithForms html={removeFirstContentSection(page.content_html)} />
        </>
      ) : (
        // どちらもない場合: 新しいセクションベースのデザイン
        <>
          <HeroSection />
          <ITReviewSection />
          <CompanyLogosSection />
          <IntroSection />
          <ResultsSection />
          <PartnerMarketingSection />
          <CTASection />
        </>
      )}
    </>
  )
}
