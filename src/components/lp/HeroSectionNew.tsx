'use client'

import Image from 'next/image'
import Link from 'next/link'

const WP_CDN_URL = process.env.NEXT_PUBLIC_WP_CDN_URL || 'https://partner-prop.com'

export function HeroSectionNew() {
  return (
    <section className="react-section relative bg-white" aria-labelledby="hero-heading">
      <div className="mx-auto max-w-[1200px] px-6 py-24 md:py-32 lg:py-40">
        {/* No.1 Badge - 控えめに配置 */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-600">
            <Image
              src={`${WP_CDN_URL}/wp-content/themes/partnerprop/assets/img/icon_itreview.png`}
              alt="ITreview"
              width={24}
              height={24}
              className="h-6 w-auto"
            />
            <span className="font-medium">経営管理クラウド No.1</span>
          </div>
        </div>

        {/* Main Heading - Apple iPhone風の超巨大タイポグラフィ */}
        <div className="text-center">
          <h1
            id="hero-heading"
            className="text-[3rem] font-semibold leading-[1.08] tracking-[-0.015em] text-[#1d1d1f] sm:text-6xl md:text-7xl lg:text-8xl xl:text-[7rem]"
          >
            <span className="block">事業成長を加速する</span>
            <span className="block mt-1 md:mt-2">パートナーマーケティング</span>
          </h1>
        </div>

        {/* Sub Heading - 控えめなサブコピー */}
        <div className="mt-8 text-center">
          <p className="text-lg text-[#86868b] sm:text-xl md:text-2xl leading-relaxed">
            代理店・卸・フランチャイズ
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> </span>
            すべてのパートナーを支援する
            <br />
            PRM（次世代型 AIパートナーポータル）
          </p>
        </div>

        {/* CTA Buttons - Apple風のボタン */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <Link
            href="/knowledge/service-form/"
            className="inline-flex min-w-[200px] items-center justify-center rounded-full bg-[#1d1d1f] px-8 py-4 text-[17px] font-medium text-white transition-all hover:bg-[#424245] active:scale-[0.98]"
          >
            資料をダウンロード
          </Link>
          <Link
            href="/knowledge/demo/"
            className="inline-flex min-w-[200px] items-center justify-center rounded-full border-2 border-[#1d1d1f] bg-white px-8 py-4 text-[17px] font-medium text-[#1d1d1f] transition-all hover:bg-[#F5F5F7] active:scale-[0.98]"
          >
            無料デモを申し込む
          </Link>
        </div>

        {/* Product Image - 大きくプロダクト画面を表示 */}
        <div className="mt-16 md:mt-24">
          <div className="relative mx-auto max-w-5xl">
            <Image
              src="/img/img_mv.png"
              alt="PartnerProp ダッシュボード画面"
              width={1200}
              height={700}
              className="h-auto w-full rounded-xl shadow-apple-xl"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
