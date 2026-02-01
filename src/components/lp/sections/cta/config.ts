import type { VariantOption } from '../../core/types'
import type { CTAContent } from './types'

export const ctaLabel = 'CTA'

export const ctaDescription = '行動を促すコールトゥアクションエリア'

export const ctaVariants: VariantOption[] = [
  { value: 'simple', label: 'シンプル' },
  { value: 'gradient', label: 'グラデーション' },
  { value: 'dark', label: 'ダーク' },
]

export const ctaDefaultContent: CTAContent = {
  headline: 'お問い合わせはこちら',
  description: '',
  button_text: 'お問い合わせ',
  button_link: '/contact',
}
