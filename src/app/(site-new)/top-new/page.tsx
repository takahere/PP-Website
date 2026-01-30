import type { Metadata } from 'next'
import {
  HeroSectionNew,
  CompanyLogosSection,
  AwardsSection,
  PainPointsSection,
  PartnerMarketingModelSection,
  MediaShowcaseSection,
  OldPortalFarewellSection,
  ProcessStepsSection,
  IntegrationIconsSection,
  TrustResultsSection,
  VideoCaseStudySection,
  CaseStudiesGridSection,
  NewsSectionCarousel,
  KnowledgeSectionCarousel,
} from '@/components/lp'

export const metadata: Metadata = {
  title: '【開発中】新トップページ | PartnerProp',
  description: 'リニューアル版トップページ（開発用）',
  robots: {
    index: false,
    follow: false,
  },
}

/**
 * リニューアル版トップページ（開発用）
 *
 * 開発完了後、このコンテンツを /src/app/(site)/page.tsx に移行する
 */
export default function TopNewPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー分のスペーサー */}
      <div className="h-12 min-[1200px]:h-[86px]" />

      {/* ===== Hero Section (Apple風) ===== */}
      <HeroSectionNew />

      {/* ===== Company Logos ===== */}
      <CompanyLogosSection />

      {/* ===== Awards Section ===== */}
      <AwardsSection />

      {/* ===== Pain Points Section ===== */}
      <PainPointsSection />

      {/* ===== Partner Marketing Model Section ===== */}
      <PartnerMarketingModelSection />

      {/* ===== Media Showcase Section ===== */}
      <MediaShowcaseSection />

      {/* ===== Old Portal Farewell Section ===== */}
      <OldPortalFarewellSection />

      {/* ===== Process Steps Section (削除) ===== */}
      {/* <ProcessStepsSection /> */}

      {/* ===== Integration Icons Section ===== */}
      <IntegrationIconsSection />

      {/* ===== Trust & Results Section ===== */}
      <TrustResultsSection />

      {/* ===== Video Case Study Section ===== */}
      <VideoCaseStudySection />

      {/* ===== Case Studies Grid Section ===== */}
      <CaseStudiesGridSection />

      {/* ===== News Section Carousel ===== */}
      <NewsSectionCarousel />

      {/* ===== Knowledge Section Carousel ===== */}
      <KnowledgeSectionCarousel />
    </div>
  )
}
