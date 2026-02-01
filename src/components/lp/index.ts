// レジストリシステムを初期化（セクションを登録）
import './core/registerSections'

// ========================================
// コアシステム（新アーキテクチャ）
// ========================================

// 型定義
export type {
  SectionDefinition,
  SectionComponentProps,
  SectionEditorProps,
  VariantOption,
  LPSection,
  LPSectionType,
} from './core/types'

// レジストリAPI
export {
  sectionRegistry,
  registerSection,
  getSection,
  getAllSections,
  getAllSectionTypes,
} from './core/registry'

// 新レンダラー・エディタ
export { SectionRenderer } from './core/SectionRenderer'
export { SectionEditorWrapper } from './core/SectionEditorWrapper'

// ========================================
// セクション定義（新しいディレクトリ構造）
// ========================================

// Hero
export { heroDefinition } from './sections/hero'
export type { HeroContent } from './sections/hero'

// Features
export { featuresDefinition } from './sections/features'
export type { FeaturesContent, FeatureItem } from './sections/features'

// Benefits
export { benefitsDefinition } from './sections/benefits'
export type { BenefitsContent, BenefitItem } from './sections/benefits'

// CTA
export { ctaDefinition } from './sections/cta'
export type { CTAContent } from './sections/cta'

// Form
export { formDefinition } from './sections/form'
export type { FormContent, FormField } from './sections/form'

// ========================================
// 後方互換性のためのエイリアス
// ========================================

// 旧コンポーネントのエクスポート（後方互換性）
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
export { FeaturesGrid } from './FeaturesGrid'

// 後方互換性のためのラベル・説明・デフォルトコンテンツ
// これらはレジストリから動的に取得されるようになりましたが、
// 既存のコードとの互換性のために残しています
import { sectionRegistry } from './core/registry'
import type { LPSectionType as LPSectionTypeAlias } from './core/types'

/**
 * @deprecated sectionRegistry.getLabelMap() を使用してください
 */
export const sectionTypeLabels = sectionRegistry.getLabelMap() as Record<
  LPSectionTypeAlias,
  string
>

/**
 * @deprecated sectionRegistry.getDescriptionMap() を使用してください
 */
export const sectionTypeDescriptions = sectionRegistry.getDescriptionMap() as Record<
  LPSectionTypeAlias,
  string
>

/**
 * @deprecated sectionRegistry.getDefaultContentMap() を使用してください
 */
export const defaultSectionContent = sectionRegistry.getDefaultContentMap() as Record<
  LPSectionTypeAlias,
  Record<string, unknown>
>
