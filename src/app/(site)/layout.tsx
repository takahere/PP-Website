import type { Metadata } from 'next'

import { Header, Footer } from '@/components/layout'
import { FadeContentFix } from '@/components/FadeContentFix'
import { SlickSliderInit } from '@/components/SlickSliderInit'
import { LiteYoutubeInit } from '@/components/LiteYoutubeInit'
import { FloatingBanner } from '@/components/FloatingBanner'
import { WebSiteJsonLd, OrganizationJsonLd } from '@/components/seo/JsonLd'

// Legacy CSS を公開サイトでのみ読み込む（Tailwind v4 の @import 制限を回避）
import '@/styles/legacy/reset.css'
import '@/styles/legacy/common.css'
import '@/styles/legacy/common-2.css'
import '@/styles/legacy/top.css'
import '@/styles/legacy/top-2.css'
import '@/styles/legacy/slick.css'
import '@/styles/legacy/lite-yt-embed.css'

// Site専用スタイル（メンバーカード、ロゴアニメーション、HeroSection等）
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

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="site-layout flex min-h-screen flex-col">
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
      {/* スクロールアニメーションの制御 */}
      <FadeContentFix />
      {/* Slick Slider の初期化 */}
      <SlickSliderInit />
      {/* lite-youtube-embed の初期化 */}
      <LiteYoutubeInit />
      <Header />
      <main id="main" className="flex-1">{children}</main>
      <Footer />
      {/* フローティングバナー（おすすめ資料3点セット） */}
      <FloatingBanner />
    </div>
  )
}

