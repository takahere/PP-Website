import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

// Admin専用スタイル（Legacyリセット + Tiptapエディタ + サイドバー）
import '@/styles/admin.css'
import { AdminSidebar } from './admin-sidebar'
import { LogoutButton } from './logout-button'
import { UserRole } from '@/lib/types/user'

export const metadata: Metadata = {
  title: {
    default: '管理画面 | PartnerProp',
    template: '%s | 管理画面 - PartnerProp',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole: UserRole = (profile?.role as UserRole) || 'regular'

  return (
    <div className="admin-layout flex h-screen overflow-hidden">
      <AdminSidebar userEmail={user.email || ''} userRole={userRole}>
        <LogoutButton />
      </AdminSidebar>
      <main className="flex-1 overflow-auto">
        <div className="p-8 bg-gray-100 min-h-full">{children}</div>
      </main>
    </div>
  )
}
