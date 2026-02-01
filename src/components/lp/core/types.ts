import type { ComponentType } from 'react'

/**
 * セクションコンポーネントに渡されるprops
 */
export interface SectionComponentProps<T = Record<string, unknown>> {
  content: T
  variant?: string
}

/**
 * セクションエディタに渡されるprops
 */
export interface SectionEditorProps<T = Record<string, unknown>> {
  content: T
  onChange: (content: T) => void
}

/**
 * バリアント定義
 */
export interface VariantOption {
  value: string
  label: string
}

/**
 * セクション定義（各セクションタイプごとに1つ）
 */
export interface SectionDefinition<T = Record<string, unknown>> {
  /** セクションタイプID（例: 'hero', 'features'） */
  type: string
  /** 表示ラベル（例: 'ヒーロー'） */
  label: string
  /** 説明文 */
  description: string
  /** アイコンコンポーネント（オプション） */
  icon?: ComponentType<{ className?: string }>
  /** デフォルトコンテンツ */
  defaultContent: T
  /** 利用可能なバリアント */
  variants?: VariantOption[]
  /** 表示コンポーネント */
  Component: ComponentType<SectionComponentProps<T>>
  /** エディタコンポーネント */
  Editor: ComponentType<SectionEditorProps<T>>
}

/**
 * LPセクションインスタンス（DB保存用）
 */
export interface LPSection {
  id: string
  type: string
  order: number
  content: Record<string, unknown>
  variant?: string
}

/**
 * 後方互換性のためのエイリアス
 */
export type LPSectionType = 'hero' | 'features' | 'benefits' | 'cta' | 'form'
