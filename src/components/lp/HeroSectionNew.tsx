'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'

const WP_CDN_URL = process.env.NEXT_PUBLIC_WP_CDN_URL || 'https://partner-prop.com'

export function HeroSectionNew() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  // スクロールに応じた変形値
  const y = useTransform(scrollYProgress, [0, 0.5], [0, -60])
  const scale = useTransform(scrollYProgress, [0, 0.3], [0.92, 1])
  const rotateX = useTransform(scrollYProgress, [0, 0.3], [8, 0])
  const opacity = useTransform(scrollYProgress, [0, 0.2], [0.85, 1])

  return (
    <section
      ref={containerRef}
      className="react-section relative bg-white"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto max-w-[1200px] px-6 py-24 md:py-32 lg:py-40">
        {/* No.1 Badge - 控えめに配置 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center mb-8"
        >
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
        </motion.div>

        {/* Main Heading - Apple iPhone風の超巨大タイポグラフィ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center"
        >
          <h1
            id="hero-heading"
            className="text-[3rem] font-semibold leading-[1.08] tracking-[-0.015em] text-[#1d1d1f] sm:text-6xl md:text-7xl lg:text-8xl xl:text-[7rem]"
          >
            <span className="block">事業成長を加速する</span>
            <span className="block mt-1 md:mt-2">パートナーマーケティング</span>
          </h1>
        </motion.div>

        {/* Sub Heading - 控えめなサブコピー */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 text-center"
        >
          <p className="text-lg text-[#86868b] sm:text-xl md:text-2xl leading-relaxed">
            代理店・卸・フランチャイズ
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> </span>
            すべてのパートナーを支援する
            <br />
            PRM（次世代型 AIパートナーポータル）
          </p>
        </motion.div>

        {/* CTA Buttons - Apple風のボタン */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6"
        >
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
        </motion.div>

        {/* Product Image - スクロール連動 3Dモックアップ */}
        <div className="mt-16 md:mt-24" style={{ perspective: '1200px' }}>
          <motion.div
            initial={{ opacity: 0, y: 60, rotateX: 12 }}
            animate={{ opacity: 1, y: 0, rotateX: 8 }}
            transition={{ duration: 0.9, delay: 0.6, ease: 'easeOut' }}
            style={{
              y,
              scale,
              rotateX,
              opacity,
              transformStyle: 'preserve-3d',
            }}
            className="relative mx-auto max-w-5xl"
          >
            {/* デスクトップモックアップフレーム */}
            <div className="relative rounded-xl bg-gradient-to-b from-[#1d1d1f] to-[#3a3a3c] p-2 shadow-2xl">
              {/* ブラウザ風トップバー */}
              <div className="flex items-center gap-2 px-4 py-2 bg-[#2d2d2f] rounded-t-lg">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-[#1d1d1f] rounded-md px-3 py-1 text-xs text-gray-400 text-center max-w-md mx-auto">
                    app.partner-prop.com
                  </div>
                </div>
              </div>

              {/* スクリーンコンテンツ */}
              <div className="relative overflow-hidden rounded-b-lg">
                <Image
                  src="/img/img_mv.png"
                  alt="PartnerProp ダッシュボード画面"
                  width={1200}
                  height={700}
                  className="h-auto w-full"
                  priority
                />

                {/* 光沢エフェクト */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>

            {/* 影（浮遊感を演出） */}
            <motion.div
              style={{
                scaleX: useTransform(scrollYProgress, [0, 0.3], [0.85, 0.95]),
                opacity: useTransform(scrollYProgress, [0, 0.3], [0.15, 0.25]),
              }}
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[90%] h-8 bg-black rounded-[50%] blur-2xl"
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
