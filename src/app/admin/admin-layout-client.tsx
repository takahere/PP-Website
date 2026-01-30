'use client'

import { useState, useEffect } from 'react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminSidebar } from './admin-sidebar'
import { UserRole } from '@/lib/types/user'

interface AdminLayoutClientProps {
  children: React.ReactNode
  userEmail: string
  userRole: UserRole
}

export function AdminLayoutClient({
  children,
  userEmail,
  userRole,
}: AdminLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // 画面リサイズ時にメニューを閉じる
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // メニューが開いている時はbodyのスクロールを無効化
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  return (
    <div className="admin-layout flex flex-col h-screen overflow-hidden">
      {/* トップヘッダー */}
      <AdminHeader
        userEmail={userEmail}
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* サイドバー + メインコンテンツ */}
      <div className="flex flex-1 overflow-hidden relative">
        <AdminSidebar
          userRole={userRole}
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8 bg-gray-100 min-h-full">{children}</div>
        </main>
      </div>
    </div>
  )
}
