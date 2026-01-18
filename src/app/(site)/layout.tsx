import type { Metadata } from 'next'

import { Header, Footer } from '@/components/layout'

export const metadata: Metadata = {
  title: {
    default: 'PartnerProp | パートナーマーケティングを実現する PRM',
    template: '%s | PartnerProp',
  },
  description: 'パートナービジネスを科学し仕組みにするPRMツール「PartnerProp」',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: 'PartnerProp',
  },
}

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

