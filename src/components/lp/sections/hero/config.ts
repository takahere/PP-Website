import type { VariantOption } from '../../core/types'
import type { HeroContent } from './types'

export const heroLabel = 'ヒーロー'

export const heroDescription = 'ページの最上部に表示される大きなキャッチコピーエリア'

export const heroVariants: VariantOption[] = [
  { value: 'simple', label: 'シンプル' },
  { value: 'with-image', label: '画像付き' },
  { value: 'centered', label: '中央寄せ' },
]

export const heroDefaultContent: HeroContent = {
  headline: '見出しテキスト',
  subheadline: 'サブテキスト',
  cta_text: '詳しく見る',
  cta_link: '/contact',
  background_image: '',
}
