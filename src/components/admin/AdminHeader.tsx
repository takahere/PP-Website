'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { LogOut, ChevronDown, Menu, X } from 'lucide-react'
import { logout } from '@/app/(auth)/login/actions'
import { useIsDesktop } from '@/hooks/useMediaQuery'

interface AdminHeaderProps {
  userEmail?: string
  companyName?: string
  onMenuToggle?: () => void
  isMobileMenuOpen?: boolean
}

export function AdminHeader({
  userEmail,
  companyName = '株式会社パートナープロップ',
  onMenuToggle,
  isMobileMenuOpen = false,
}: AdminHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isDesktop = useIsDesktop()

  // ユーザー名の頭文字を取得
  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : 'A'

  // クリック外でドロップダウンを閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="h-14 bg-gray-900 text-white flex items-center justify-between px-4 md:px-6 shrink-0">
      {/* 左: ハンバーガーメニュー + ロゴ */}
      <div className="flex items-center gap-3">
        {/* モバイルのみハンバーガーメニュー表示 */}
        {!isDesktop && (
          <button
            onClick={onMenuToggle}
            className="p-2 -ml-2 text-white hover:bg-gray-800 rounded transition-colors"
            aria-label={isMobileMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        )}

        {/* ロゴ */}
        <Image
          src="/logo-header.svg"
          alt="PartnerProp"
          width={120}
          height={24}
          style={{ height: isDesktop ? '28px' : '16px', width: 'auto' }}
          priority
        />
      </div>

      {/* 右: 会社名 + ユーザープロフィール */}
      <div className="flex items-center gap-4">
        {/* デスクトップのみ会社名表示 */}
        {isDesktop && (
          <span className="text-sm text-gray-300">{companyName}</span>
        )}

        {/* ユーザードロップダウン */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 hover:bg-gray-800 rounded-lg px-2 py-1.5 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-medium">
              {initial}
            </div>
            {isDesktop && (
              <span className="text-sm">{userEmail || 'Admin'}</span>
            )}
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* ドロップダウンメニュー */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  ログアウト
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
