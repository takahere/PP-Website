'use client'

import { useState, useCallback } from 'react'
import { AIChat, AIChatButton } from '@/components/admin/AIChat'

export function AnalyticsAIChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleOpen = useCallback(() => {
    setIsOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setIsExpanded(false)
  }, [])

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  return (
    <>
      {/* ヘッダーに配置されるボタン */}
      <AIChatButton onClick={handleOpen} />

      {/* AIチャットモーダル */}
      <AIChat 
        isOpen={isOpen} 
        onClose={handleClose}
        isExpanded={isExpanded}
        onToggleExpand={handleToggleExpand}
      />
    </>
  )
}

