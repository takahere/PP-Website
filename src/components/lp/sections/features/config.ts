import type { VariantOption } from '../../core/types'
import type { FeaturesContent } from './types'

export const featuresLabel = '機能紹介'

export const featuresDescription = '製品・サービスの機能を紹介するグリッド'

export const featuresVariants: VariantOption[] = [
  { value: 'cards', label: 'カード形式' },
  { value: 'simple', label: 'シンプル' },
  { value: 'icons-left', label: 'アイコン左寄せ' },
]

export const featuresDefaultContent: FeaturesContent = {
  title: '機能紹介',
  subtitle: '主な機能をご紹介します',
  items: [],
  columns: 3,
}
