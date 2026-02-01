import type { VariantOption } from '../../core/types'
import type { BenefitsContent } from './types'

export const benefitsLabel = 'メリット'

export const benefitsDescription = '導入メリットを紹介するセクション'

export const benefitsVariants: VariantOption[] = [
  { value: 'alternating', label: '左右交互' },
  { value: 'list', label: 'リスト形式' },
  { value: 'cards', label: 'カード形式' },
]

export const benefitsDefaultContent: BenefitsContent = {
  title: '導入メリット',
  subtitle: '',
  items: [],
}
