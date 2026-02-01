'use client'

import { sectionRegistry } from './registry'
import type { LPSection } from './types'

interface SectionRendererProps {
  sections: LPSection[]
}

/**
 * レジストリベースのセクションレンダラー
 * 登録されたセクション定義を使用してセクションを描画
 */
export function SectionRenderer({ sections }: SectionRendererProps) {
  const sortedSections = [...sections].sort((a, b) => a.order - b.order)

  return (
    <div>
      {sortedSections.map((section) => {
        const definition = sectionRegistry.get(section.type)

        if (!definition) {
          // 未登録のセクションタイプ
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              `[SectionRenderer] Unknown section type: "${section.type}"`
            )
          }
          return null
        }

        const Component = definition.Component

        return (
          <Component
            key={section.id}
            content={section.content}
            variant={section.variant}
          />
        )
      })}
    </div>
  )
}
