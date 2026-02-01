import type { SectionDefinition } from '../../core/types'
import type { FeaturesContent } from './types'
import {
  featuresLabel,
  featuresDescription,
  featuresVariants,
  featuresDefaultContent,
} from './config'
import { FeaturesSection } from './FeaturesSection'
import { FeaturesEditor } from './FeaturesEditor'

export type { FeaturesContent, FeatureItem } from './types'

export { FeaturesSection } from './FeaturesSection'
export { FeaturesEditor } from './FeaturesEditor'

/**
 * 機能紹介セクション定義
 */
export const featuresDefinition: SectionDefinition<FeaturesContent> = {
  type: 'features',
  label: featuresLabel,
  description: featuresDescription,
  defaultContent: featuresDefaultContent,
  variants: featuresVariants,
  Component: FeaturesSection,
  Editor: FeaturesEditor,
}
