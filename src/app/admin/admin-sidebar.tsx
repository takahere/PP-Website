'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  File,
  BookOpen,
  ExternalLink,
  BarChart3,
  PanelsTopLeft,
  Tags,
  ChevronDown,
  List,
  Table2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children?: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }[]
}

const navigation: NavItem[] = [
  { name: 'ダッシュボード', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'アナリティクス', href: '/admin/analytics', icon: BarChart3 },
  { name: 'データ分析', href: '/admin/data-analysis', icon: Table2 },
  { name: 'キャンバス', href: '/admin/canvas', icon: PanelsTopLeft },
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
]

interface AdminSidebarProps {
  userEmail: string
  children: React.ReactNode
}

export function AdminSidebar({ userEmail, children }: AdminSidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside 
      className={cn(
        "border-r bg-gray-50 flex flex-col transition-all duration-300 shrink-0 h-screen overflow-y-auto",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* ロゴ + 折りたたみボタン */}
      <div className="p-4 border-b flex items-center justify-between shrink-0">
        {!isCollapsed && (
          <Link href="/admin/dashboard" className="block">
            <Image
              src="/logo.svg"
              alt="PartnerProp"
              width={180}
              height={40}
              className="h-8 w-auto"
              priority
            />
            <p className="text-xs text-gray-500 mt-1">管理画面</p>
          </Link>
        )}
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

      {/* ナビゲーション */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin/lab' && pathname.startsWith(item.href))
            const isLabSection = item.href === '/admin/lab'
            const isLabActive = isLabSection && pathname.startsWith('/admin/lab')

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isLabSection
                      ? isLabActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      : isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                    isCollapsed && 'justify-center'
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && (
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
                {item.children && isLabActive && !isCollapsed && (
                  <ul className="mt-1 ml-4 space-y-1">
                    {item.children.map((child) => {
                      const isChildActive = pathname === child.href
                      return (
                        <li key={child.name}>
                          <Link
                            href={child.href}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                              isChildActive
                                ? 'bg-gray-200 text-gray-900'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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

      {/* ユーザー情報 */}
      {!isCollapsed && (
        <div className="p-4 border-t bg-gray-50 shrink-0">
          <p className="text-sm text-gray-500 mb-2 truncate">{userEmail}</p>
          {children}
        </div>
      )}
    </aside>
  )
}
