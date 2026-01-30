'use client'

import Image from 'next/image'

const WP_CDN_URL = process.env.NEXT_PUBLIC_WP_CDN_URL || 'https://partner-prop.com'

export function TrustResultsSection() {
  return (
    <section className="react-section bg-white py-16 md:py-24" aria-labelledby="trust-heading">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Title - Apple iPhone風の超巨大タイポグラフィ */}
        <div className="text-center mb-16 md:mb-20">
          <h2
            id="trust-heading"
            className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold text-[#1d1d1f] tracking-[-0.015em] leading-[1.08]"
          >
            国内TOPの
            <br className="sm:hidden" />
            実績と信頼
          </h2>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left: World Map */}
          <div className="relative">
            {/* World Map Placeholder - Simplified design */}
            <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden">
              {/* Simple world map visualization */}
              <svg
                viewBox="0 0 400 300"
                className="w-full h-full"
                aria-label="グローバル展開を示す世界地図"
              >
                {/* Japan highlight (main) */}
                <circle cx="340" cy="120" r="12" fill="#F93832" opacity="0.8" />
                <circle cx="340" cy="120" r="24" fill="#F93832" opacity="0.2" />
                {/* Asia dots */}
                <circle cx="300" cy="140" r="6" fill="#F93832" opacity="0.6" />
                <circle cx="280" cy="150" r="5" fill="#F93832" opacity="0.5" />
                <circle cx="260" cy="130" r="5" fill="#F93832" opacity="0.4" />
                <circle cx="320" cy="160" r="4" fill="#F93832" opacity="0.5" />
                {/* Europe dots */}
                <circle cx="180" cy="100" r="6" fill="#F93832" opacity="0.5" />
                <circle cx="190" cy="115" r="5" fill="#F93832" opacity="0.4" />
                <circle cx="165" cy="90" r="4" fill="#F93832" opacity="0.4" />
                {/* Americas dots */}
                <circle cx="80" cy="120" r="6" fill="#F93832" opacity="0.5" />
                <circle cx="100" cy="145" r="5" fill="#F93832" opacity="0.4" />
                <circle cx="65" cy="160" r="4" fill="#F93832" opacity="0.3" />
                {/* Connection Lines */}
                <path
                  d="M340 120 Q 280 80 180 100"
                  stroke="#F93832"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="6 6"
                  opacity="0.3"
                />
                <path
                  d="M340 120 Q 200 150 80 120"
                  stroke="#F93832"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="6 6"
                  opacity="0.3"
                />
              </svg>
            </div>
          </div>

          {/* Right: Text & Badge */}
          <div className="flex flex-col">
            <p className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[#1d1d1f] leading-tight mb-8">
              全世界50,000社を超える企業で、
              <br />
              活用されるリーダーカンパニーです
            </p>

            {/* ITreview Badge */}
            <div className="flex items-start gap-6 p-6 bg-[#F5F5F7] rounded-2xl">
              {/* ITreview Logo */}
              <div className="flex-shrink-0">
                <Image
                  src={`${WP_CDN_URL}/wp-content/themes/partnerprop/assets/img/icon_itreview.png`}
                  alt="ITreview"
                  width={80}
                  height={40}
                  className="h-10 w-auto"
                />
              </div>

              {/* Badge Content */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block px-3 py-1 bg-[#F93832] text-white text-xs font-medium rounded-full">
                    Leader
                  </span>
                  <span className="text-sm text-[#86868b]">最高位獲得</span>
                </div>
                <p className="text-sm text-[#86868b]">
                  ITreview Grid Award で最高評価を獲得
                </p>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="p-4 bg-[#F5F5F7] rounded-xl text-center">
                <p className="text-3xl md:text-4xl font-bold text-[#F93832]">50,000+</p>
                <p className="text-sm text-[#86868b] mt-1">導入企業数</p>
              </div>
              <div className="p-4 bg-[#F5F5F7] rounded-xl text-center">
                <p className="text-3xl md:text-4xl font-bold text-[#F93832]">40+</p>
                <p className="text-sm text-[#86868b] mt-1">対応国・地域</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
