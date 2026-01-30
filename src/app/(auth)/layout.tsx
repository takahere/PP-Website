import type { Metadata } from 'next'

// Admin と同じスタイルを使用（Legacyリセット + クリーンなUI）
import '@/styles/admin.css'

export const metadata: Metadata = {
  title: {
    default: 'ログイン | PartnerProp',
    template: '%s | PartnerProp',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="auth-layout min-h-screen bg-gray-100">
      {children}
    </div>
  )
}
