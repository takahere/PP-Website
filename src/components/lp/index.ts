export { HeroSection } from './HeroSection'
export { HeroSectionNew } from './HeroSectionNew'
export { ITReviewSection } from './ITReviewSection'
export { CompanyLogosSection } from './CompanyLogosSection'
export { IntroSection } from './IntroSection'
export { ResultsSection } from './ResultsSection'
export { PartnerMarketingSection } from './PartnerMarketingSection'
export { PartnerMarketingModelSection } from './PartnerMarketingModelSection'
export { AwardsSection } from './AwardsSection'
export { PainPointsSection } from './PainPointsSection'
export { MediaShowcaseSection } from './MediaShowcaseSection'
export { OldPortalFarewellSection } from './OldPortalFarewellSection'
export { ProcessStepsSection } from './ProcessStepsSection'
export { IntegrationIconsSection } from './IntegrationIconsSection'
export { TrustResultsSection } from './TrustResultsSection'
export { VideoCaseStudySection } from './VideoCaseStudySection'
export { CaseStudiesGridSection } from './CaseStudiesGridSection'
export { NewsSectionCarousel } from './NewsSectionCarousel'
export { KnowledgeSectionCarousel } from './KnowledgeSectionCarousel'
export { CTASection } from './CTASection'
export { Benefits } from './Benefits'
export { ContactForm } from './ContactForm'
export { FeaturesGrid, type FeatureItem } from './FeaturesGrid'
export { SectionRenderer } from './SectionRenderer'

// Re-export types from individual components
export type { BenefitItem } from './Benefits'
export type { FormField } from './ContactForm'

// LP Section types
export type LPSectionType = 'hero' | 'features' | 'benefits' | 'cta' | 'form'

export interface LPSection {
  id: string
  type: LPSectionType
  order: number
  content: Record<string, unknown>
  variant?: string
}

// Section configuration
export const sectionTypeLabels: Record<LPSectionType, string> = {
  hero: 'ヒーロー',
  features: '機能紹介',
  benefits: 'メリット',
  cta: 'CTA',
  form: 'フォーム',
}

export const sectionTypeDescriptions: Record<LPSectionType, string> = {
  hero: 'ページの最上部に表示される大きなキャッチコピーエリア',
  features: '製品・サービスの機能を紹介するグリッド',
  benefits: '導入メリットを紹介するセクション',
  cta: '行動を促すコールトゥアクションエリア',
  form: 'お問い合わせフォーム',
}

export const defaultSectionContent: Record<LPSectionType, Record<string, unknown>> = {
  hero: {
    headline: '見出しテキスト',
    subheadline: 'サブテキスト',
    cta_text: '詳しく見る',
    cta_link: '/contact',
    background_image: '',
  },
  features: {
    title: '機能紹介',
    subtitle: '主な機能をご紹介します',
    items: [],
    columns: 3,
  },
  benefits: {
    title: '導入メリット',
    subtitle: '',
    items: [],
  },
  cta: {
    headline: 'お問い合わせはこちら',
    description: '',
    button_text: 'お問い合わせ',
    button_link: '/contact',
  },
  form: {
    title: 'お問い合わせ',
    description: '',
    fields: [],
    submit_text: '送信する',
  },
}
