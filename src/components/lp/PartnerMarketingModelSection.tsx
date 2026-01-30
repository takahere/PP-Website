'use client'

import Image from 'next/image'
import Link from 'next/link'

const WP_CDN_URL = process.env.NEXT_PUBLIC_WP_CDN_URL || 'https://partner-prop.com'

export function PartnerMarketingModelSection() {
  return (
    <section className="react-section bg-[#F5F5F7] py-16 md:py-24" aria-labelledby="model-heading">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Subtitle */}
        <div className="text-center mb-6">
          <p className="text-lg md:text-xl text-[#86868b]">
            エンタープライズからスタートアップ企業が
          </p>
        </div>

        {/* Title */}
        <div className="text-center mb-16 md:mb-20">
          <h2
            id="model-heading"
            className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold text-[#1d1d1f] tracking-[-0.015em] leading-[1.08]"
          >
            今、取り組む「パートナーマーケティング」モデル
          </h2>
        </div>

        {/* Diagram Image */}
        <div className="flex justify-center mb-12 md:mb-16">
          <div className="relative max-w-4xl w-full">
            <Image
              src={`${WP_CDN_URL}/wp-content/themes/partnerprop/assets/img/img_partner_marketing_model.png`}
              alt="パートナーマーケティングモデル図 - プランニング、リクルート、オンボーディング、フォローアップ、リテンションのサイクル"
              width={900}
              height={600}
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Link
            href="/knowledge/partner-marketing-3set/"
            className="inline-flex items-center justify-center rounded-full bg-[#1d1d1f] px-8 py-4 text-[17px] font-medium text-white transition-all hover:bg-[#424245] active:scale-[0.98]"
          >
            パートナーマーケティングを詳しく知る
          </Link>
        </div>
      </div>
    </section>
  )
}
