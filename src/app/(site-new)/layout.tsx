import type { Metadata } from 'next'

import { Header, Footer } from '@/components/layout'
import { WebSiteJsonLd, OrganizationJsonLd } from '@/components/seo/JsonLd'

// 新トップページ専用CSS
import '@/styles/site-new.css'

// レガシーCSS（.site-layout にスコープされているため、.site-new-layout には影響しない）
// フッター用に読み込む
import '@/styles/legacy/reset.css'
import '@/styles/legacy/common.css'
import '@/styles/legacy/common-2.css'
import '@/styles/site.css'

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

export default function SiteNewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="site-new-layout flex min-h-screen flex-col font-sans antialiased">
      {/* アクセシビリティ: スキップリンク */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-gray-900 focus:shadow-lg focus:rounded"
      >
        メインコンテンツへスキップ
      </a>
      {/* グローバルJSON-LD構造化データ */}
      <WebSiteJsonLd />
      <OrganizationJsonLd />
      <Header />
      <main id="main" className="flex-1">{children}</main>
      {/* フッターはレガシースタイル用にラップ */}
      <div className="site-layout">
        <Footer />
      </div>
    </div>
  )
}
