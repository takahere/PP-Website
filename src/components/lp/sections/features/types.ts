/**
 * 機能アイテム型
 */
export interface FeatureItem {
  icon?: string
  title: string
  description: string
}

/**
 * 機能紹介セクションのコンテンツ型
 */
export interface FeaturesContent {
  title: string
  subtitle: string
  items: FeatureItem[]
  columns: 2 | 3 | 4
}
