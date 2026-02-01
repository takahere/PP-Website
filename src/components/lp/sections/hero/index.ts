import type { SectionDefinition } from '../../core/types'
import type { HeroContent } from './types'
import { heroLabel, heroDescription, heroVariants, heroDefaultContent } from './config'
import { HeroSection } from './HeroSection'
import { HeroEditor } from './HeroEditor'

export type { HeroContent }

export { HeroSection } from './HeroSection'
export { HeroEditor } from './HeroEditor'

/**
 * ヒーローセクション定義
 */
export const heroDefinition: SectionDefinition<HeroContent> = {
  type: 'hero',
  label: heroLabel,
  description: heroDescription,
  defaultContent: heroDefaultContent,
  variants: heroVariants,
  Component: HeroSection,
  Editor: HeroEditor,
}
