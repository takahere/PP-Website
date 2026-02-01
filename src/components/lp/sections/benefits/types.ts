/**
 * メリットアイテム型
 */
export interface BenefitItem {
  title: string
  description: string
  image?: string
  points?: string[]
}

/**
 * メリットセクションのコンテンツ型
 */
export interface BenefitsContent {
  title: string
  subtitle: string
  items: BenefitItem[]
}
