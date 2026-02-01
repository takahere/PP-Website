'use client'

import { useState, useEffect } from 'react'
import { sectionRegistry } from './registry'
import type { LPSection } from './types'

interface SectionEditorWrapperProps {
  section: LPSection
  onUpdate: (content: Record<string, unknown>) => void
}

/**
 * レジストリベースのセクションエディタラッパー
 * 登録されたセクション定義のエディタを使用
 */
export function SectionEditorWrapper({
  section,
  onUpdate,
}: SectionEditorWrapperProps) {
  const [content, setContent] = useState(section.content)

  // セクションが変更されたときにローカル状態を同期
  useEffect(() => {
    setContent(section.content)
  }, [section.id, section.content])

  const handleChange = (newContent: Record<string, unknown>) => {
    setContent(newContent)
    onUpdate(newContent)
  }

  const definition = sectionRegistry.get(section.type)

  if (!definition) {
    return (
      <div className="py-4 text-muted-foreground">
        セクションタイプ「{section.type}」のエディタが見つかりません
      </div>
    )
  }

  const Editor = definition.Editor

  return <Editor content={content} onChange={handleChange} />
}
