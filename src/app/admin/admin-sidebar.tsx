'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  File,
  BookOpen,
  ExternalLink,
  BarChart3,
  PencilRuler,
  Tags,
  ChevronDown,
  List,
  Table2,
  ChevronLeft,
  ChevronRight,
  Users,
  X,
} from 'lucide-react'

import { UserRole } from '@/lib/types/user'

import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children?: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }[]
  adminOnly?: boolean
}

const navigation: NavItem[] = [
  { name: 'ダッシュボード', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'アナリティクス', href: '/admin/analytics', icon: BarChart3 },
  { name: 'データ分析', href: '/admin/data-analysis', icon: Table2 },
  { name: 'キャンバス', href: '/admin/canvas', icon: PencilRuler },
  { name: '記事管理', href: '/admin/posts', icon: FileText },
  { name: 'ページ管理', href: '/admin/pages', icon: File },
  {
    name: 'Lab記事',
    href: '/admin/lab',
    icon: BookOpen,
    children: [
      { name: 'カテゴリー・タグ', href: '/admin/lab/taxonomy', icon: Tags },
    ],
  },
  { name: '一覧ページ', href: '/admin/list-pages', icon: List },
  { name: 'リダイレクト', href: '/admin/redirects', icon: ExternalLink },
  { name: 'ユーザー管理', href: '/admin/users', icon: Users },
]

interface AdminSidebarProps {
  userRole?: UserRole
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export function AdminSidebar({
  userRole = 'regular',
  isMobileOpen = false,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Filter navigation based on user role
  const visibleNavigation = navigation.filter(item => {
    if (item.adminOnly && userRole !== 'admin') return false
    return true
  })

  // ナビリンククリック時にモバイルメニューを閉じる
  const handleLinkClick = () => {
    if (onMobileClose) {
      onMobileClose()
    }
  }

  return (
    <>
      {/* モバイル: オーバーレイ */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "border-r bg-gray-50 flex flex-col transition-all duration-300 shrink-0 h-full",
          // デスクトップ: 常時表示
          "hidden md:flex",
          isCollapsed ? "w-16" : "w-64",
          // モバイル: 固定ドロワー
          isMobileOpen && "!flex fixed inset-y-0 left-0 top-14 z-50 w-64"
        )}
      >
        {/* 閉じるボタン（モバイルのみ） */}
        {isMobileOpen && (
          <div className="md:hidden p-2 border-b flex items-center justify-end shrink-0">
            <button
              onClick={onMobileClose}
              className="p-1.5 rounded-md hover:bg-gray-200 transition-colors"
              title="メニューを閉じる"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* ナビゲーション */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {visibleNavigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/admin/lab' && pathname.startsWith(item.href))
              const isLabSection = item.href === '/admin/lab'
              const isLabActive = isLabSection && pathname.startsWith('/admin/lab')

              // モバイルでは折りたたみ状態を無視（常に展開表示）
              const showText = isMobileOpen || !isCollapsed

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={handleLinkClick}
                    className={cn(
                      'sidebar-nav-item flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isLabSection
                        ? isLabActive
                          ? 'bg-gray-900 active'
                          : 'hover:bg-gray-100'
                        : isActive
                          ? 'bg-gray-900 active'
                          : 'hover:bg-gray-100',
                      !showText && 'justify-center'
                    )}
                    title={!showText ? item.name : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {showText && (
                      <>
                        <span className="flex-1">{item.name}</span>
                        {item.children && item.children.length > 0 && (
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 transition-transform',
                              isLabActive ? 'rotate-180' : ''
                            )}
                          />
                        )}
                      </>
                    )}
                  </Link>

                  {/* サブアイテム */}
                  {item.children && isLabActive && showText && (
                    <ul className="mt-1 ml-4 space-y-1">
                      {item.children.map((child) => {
                        const isChildActive = pathname === child.href
                        return (
                          <li key={child.name}>
                            <Link
                              href={child.href}
                              onClick={handleLinkClick}
                              className={cn(
                                'sidebar-nav-item flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                                isChildActive
                                  ? 'bg-gray-200 active'
                                  : 'hover:bg-gray-100'
                              )}
                            >
                              <child.icon className="h-4 w-4" />
                              {child.name}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        {/* 折りたたみボタン（デスクトップのみ・下部配置） */}
        <div className="hidden md:flex p-2 border-t items-center justify-end shrink-0 mt-auto">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "p-1.5 rounded-md hover:bg-gray-200 transition-colors",
              isCollapsed && "mx-auto"
            )}
            title={isCollapsed ? "サイドバーを開く" : "サイドバーを閉じる"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
