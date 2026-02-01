import type { SectionDefinition } from '../../core/types'
import type { BenefitsContent } from './types'
import {
  benefitsLabel,
  benefitsDescription,
  benefitsVariants,
  benefitsDefaultContent,
} from './config'
import { BenefitsSection } from './BenefitsSection'
import { BenefitsEditor } from './BenefitsEditor'

export type { BenefitsContent, BenefitItem } from './types'

export { BenefitsSection } from './BenefitsSection'
export { BenefitsEditor } from './BenefitsEditor'

/**
 * メリットセクション定義
 */
export const benefitsDefinition: SectionDefinition<BenefitsContent> = {
  type: 'benefits',
  label: benefitsLabel,
  description: benefitsDescription,
  defaultContent: benefitsDefaultContent,
  variants: benefitsVariants,
  Component: BenefitsSection,
  Editor: BenefitsEditor,
}
