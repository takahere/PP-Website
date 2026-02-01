import type { SectionDefinition } from '../../core/types'
import type { CTAContent } from './types'
import { ctaLabel, ctaDescription, ctaVariants, ctaDefaultContent } from './config'
import { CTASection } from './CTASection'
import { CTAEditor } from './CTAEditor'

export type { CTAContent }

export { CTASection } from './CTASection'
export { CTAEditor } from './CTAEditor'

/**
 * CTAセクション定義
 */
export const ctaDefinition: SectionDefinition<CTAContent> = {
  type: 'cta',
  label: ctaLabel,
  description: ctaDescription,
  defaultContent: ctaDefaultContent,
  variants: ctaVariants,
  Component: CTASection,
  Editor: CTAEditor,
}
