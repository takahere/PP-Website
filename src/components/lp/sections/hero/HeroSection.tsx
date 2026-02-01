'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { SectionComponentProps } from '../../core/types'
import type { HeroContent } from './types'

/**
 * ヒーローセクション表示コンポーネント
 *
 * 注: 現在のHeroSectionはハードコードされたコンテンツを表示しています。
 * CMSからのコンテンツ表示に対応する場合は、propsを使用するように変更してください。
 */
export function HeroSection(_props: SectionComponentProps<HeroContent>) {
  // 現状は既存の静的コンテンツを表示
  // 将来的にはcontent, variantを使用してダイナミックに描画
  return (
    <section
      id="firstContent"
      className="contentWrap react-section relative bg-[radial-gradient(185.59%_68.02%_at_51.32%_52.5%,_rgb(255,255,255)_0%,_rgb(236,236,236)_100%)] text-zinc-800 text-sm"
      aria-labelledby="hero-heading"
    >
      {/* Scoped styles for this component */}
      <style jsx>{`
        .hero-section-wrapper {
          display: flex;
          flex-direction: column;
          padding-top: 48px;
          padding-bottom: 64px;
          position: relative;
        }
        .hero-section-content {
          order: 2;
          position: relative;
          z-index: 10;
        }
        .hero-section-content h1 {
          margin-top: 24px;
        }
        .hero-section-subtitle {
          text-align: center;
          margin-bottom: 16px;
        }
        .hero-section-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .hero-section-image {
          order: 1;
          width: 100%;
          pointer-events: none;
        }
        @media (min-width: 768px) {
          .hero-section-wrapper {
            flex-direction: row;
            align-items: center;
            padding-top: 120px;
            padding-bottom: 115px;
          }
          .hero-section-content {
            order: 1;
            width: 50%;
            flex-shrink: 0;
          }
          .hero-section-content h1 {
            width: 660px;
            margin-top: 0;
            margin-bottom: 8px;
          }
          .hero-section-subtitle {
            text-align: left;
            margin-bottom: 64px;
          }
          .hero-section-buttons {
            flex-direction: row;
            gap: 16px;
          }
          .hero-section-buttons > div {
            width: 220px;
          }
          .hero-section-image {
            order: 2;
            position: absolute;
            right: -5%;
            top: 50%;
            transform: translateY(-50%);
            width: 55%;
          }
        }
      `}</style>

      {/* Container */}
      <div className="relative mx-auto w-full max-w-[1240px] px-5">
        {/* Wrapper */}
        <div className="hero-section-wrapper">
          {/* Left: Content */}
          <div className="hero-section-content">
            {/* Title Image */}
            <h1
              id="hero-heading"
              className="text-[3.5rem] font-black leading-none w-full"
            >
              <Image
                src="/img/first-content_title.svg"
                alt="パートナーマーケティングを実現するPRM"
                width={660}
                height={120}
                priority
                className="h-auto w-full max-w-full"
              />
              <span className="sr-only">
                PartnerProp - パートナーマーケティングを実現するPRM
              </span>
            </h1>

            {/* Subtitle */}
            <p className="hero-section-subtitle break-words text-base font-semibold text-stone-500">
              「パートナーマーケティング」で販売代理店・取次店・ディーラーが
              <br className="hidden sm:block" />
              売りたくなる仕組を作り、売上を向上させるPRM
            </p>

            {/* エレベータ広告放映中 */}
            <p className="text-center md:text-left text-sm text-stone-500 mb-4">
              エレベータ広告放映中
            </p>

            {/* CTA Buttons */}
            <div className="hero-section-buttons text-lg font-bold">
              {/* 無料デモボタン */}
              <div>
                <Link
                  href="/knowledge/demo/"
                  className="flex w-full items-center justify-center rounded-3xl border-2 border-gray-200 bg-white px-5 py-4 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] active:bg-gray-100"
                >
                  無料デモを申し込む
                </Link>
              </div>

              {/* 資料ダウンロードボタン */}
              <div>
                <Link
                  href="/knowledge/service-form/"
                  className="flex w-full items-center justify-center rounded-3xl bg-zinc-800 px-5 py-4 transition-all hover:bg-zinc-700 active:scale-[0.98] active:bg-zinc-900"
                  style={{ color: '#ffffff' }}
                >
                  資料をダウンロードする
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Hero Image */}
          <div className="hero-section-image">
            <Image
              src="/img/img_mv.png"
              alt="パートナーマーケティングを実現するPRM - ダッシュボード画面"
              width={968}
              height={530}
              priority
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
