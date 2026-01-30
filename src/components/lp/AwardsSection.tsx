'use client'

import Image from 'next/image'

const WP_CDN_URL = process.env.NEXT_PUBLIC_WP_CDN_URL || 'https://partner-prop.com'

const awards = [
  {
    title: 'ITreview',
    subtitle: '最高位',
    highlight: 'Leader受賞',
    image: `${WP_CDN_URL}/wp-content/themes/partnerprop/assets/img/icon_itreview.png`,
  },
  {
    title: '累計',
    subtitle: '導入社数',
    highlight: 'No.1',
    badge: '経営管理クラウド',
  },
  {
    title: '年間新規',
    subtitle: '導入社数',
    highlight: 'No.1',
    badge: '経営管理クラウド',
  },
]

export function AwardsSection() {
  return (
    <section className="react-section bg-white py-16 md:py-24" aria-labelledby="awards-heading">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Title */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-lg md:text-xl text-[#86868b] mb-4">
            代理店・卸・フランチャイズすべてのパートナーを支援する
          </p>
          <h2
            id="awards-heading"
            className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold text-[#1d1d1f] tracking-[-0.015em] leading-[1.08]"
          >
            国内No.1のPRM（次世代型 AIパートナーポータル）
          </h2>
        </div>

        {/* Awards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {awards.map((award, index) => (
            <div
              key={index}
              className="relative flex flex-col items-center justify-center p-8 md:p-10 bg-gray-50 rounded-2xl"
            >
              {/* Badge */}
              {award.badge && (
                <div className="absolute top-4 right-4 bg-[#1d1d1f] text-white text-xs px-3 py-1 rounded-full">
                  {award.badge}
                </div>
              )}

              {/* Image (for ITreview) */}
              {award.image && (
                <div className="mb-4">
                  <Image
                    src={award.image}
                    alt={award.title}
                    width={80}
                    height={40}
                    className="h-10 w-auto"
                  />
                </div>
              )}

              {/* Title */}
              <p className="text-sm text-[#86868b] mb-1">{award.title}</p>

              {/* Subtitle */}
              <p className="text-lg font-medium text-[#1d1d1f] mb-2">{award.subtitle}</p>

              {/* Highlight */}
              <p className="text-4xl md:text-5xl font-semibold text-[#F93832]">
                {award.highlight}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
