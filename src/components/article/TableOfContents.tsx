'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, List } from 'lucide-react'

import type { TocItem } from '@/lib/heading-utils'

interface TableOfContentsProps {
  items: TocItem[]
  className?: string
}

/**
 * サーバーから渡されたTocItemsを表示する目次コンポーネント
 */
export function TableOfContents({ items, className = '' }: TableOfContentsProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    // スクロールに応じてアクティブな見出しを更新
    const handleScroll = () => {
      const headingElements = items.map(item => document.getElementById(item.id)).filter(Boolean)
      
      for (let i = headingElements.length - 1; i >= 0; i--) {
        const el = headingElements[i]
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 100) {
            setActiveId(items[i].id)
            return
          }
        }
      }
      
      if (items.length > 0) {
        setActiveId(items[0].id)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // 初期状態を設定

    return () => window.removeEventListener('scroll', handleScroll)
  }, [items])

  // 見出しが3つ未満なら目次を表示しない
  if (items.length < 3) {
    return null
  }

  const handleClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 80 // ヘッダーの高さ分オフセット
      const top = element.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  // H2の番号付けのためのカウンター
  let h2Counter = 0

  return (
    <nav 
      className={`rounded-xl border border-gray-200 bg-gray-50 ${className}`}
      aria-label="目次"
    >
      {/* ヘッダー */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-gray-500" />
          <span className="font-semibold text-gray-900">目次</span>
          <span className="text-sm text-gray-500">({items.length}項目)</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {/* 目次リスト */}
      {isOpen && (
        <ul className="border-t border-gray-200 px-5 py-4">
          {items.map((item) => {
            if (item.level === 2) {
              h2Counter++
            }
            
            return (
              <li 
                key={item.id}
                className={item.level === 3 ? 'ml-4' : ''}
              >
                <button
                  onClick={() => handleClick(item.id)}
                  className={`
                    block w-full py-1.5 text-left text-sm transition-colors
                    ${item.level === 2 ? 'font-medium' : 'text-gray-600'}
                    ${activeId === item.id 
                      ? 'text-indigo-600' 
                      : 'text-gray-700 hover:text-indigo-600'
                    }
                  `}
                >
                  <span className="mr-2 text-gray-400">
                    {item.level === 2 ? `${h2Counter}.` : '・'}
                  </span>
                  {item.text}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </nav>
  )
}
