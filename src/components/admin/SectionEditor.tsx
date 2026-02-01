'use client'

import { useState, useEffect } from 'react'
import { sectionRegistry, type LPSection, type LPSectionType } from '@/components/lp'

interface SectionEditorProps {
  section: LPSection
  onUpdate: (content: Record<string, unknown>) => void
}

/**
 * セクションエディタ
 * レジストリから適切なエディタコンポーネントを取得して表示
 */
export function SectionEditor({ section, onUpdate }: SectionEditorProps) {
  const [content, setContent] = useState(section.content)

  // セクションが変更されたときにローカル状態を同期
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContent(section.content)
  }, [section.id, section.content])

  const handleChange = (newContent: Record<string, unknown>) => {
    setContent(newContent)
    onUpdate(newContent)
  }

  // レジストリからセクション定義を取得
  const definition = sectionRegistry.get(section.type)

  if (!definition) {
    return (
      <div className="py-4 text-muted-foreground">
        このセクションタイプのエディタは準備中です
      </div>
    )
  }

  // レジストリに登録されたエディタを使用
  const Editor = definition.Editor

  return <Editor content={content} onChange={handleChange} />
}

// エクスポート用の型
export type { LPSection, LPSectionType }
