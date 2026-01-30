'use client'

import { Play } from 'lucide-react'

export function VideoCaseStudySection() {
  return (
    <section className="react-section bg-[#F5F5F7] py-16 md:py-24" aria-labelledby="video-case-heading">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Title */}
        <div className="text-center mb-16 md:mb-20 max-w-5xl mx-auto">
          <h2
            id="video-case-heading"
            className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold text-[#1d1d1f] tracking-[-0.015em] leading-[1.08]"
          >
            <span className="block md:inline">数多くの企業が</span>
            <span className="block md:inline">『パートナーマーケティング』で、</span>
            <span className="bg-gradient-to-r from-[#F93832] to-[#FF6B6B] bg-clip-text text-transparent">
              "売上"
            </span>
            を上げています。
          </h2>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left: Video Player */}
          <div className="relative">
            <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-apple-xl">
              {/* Video Thumbnail Placeholder */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                {/* Thumbnail Background */}
                <div className="absolute inset-0 opacity-60">
                  {/* Placeholder image pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 to-gray-900" />
                  {/* freee branding hint */}
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded text-sm font-bold">
                    freee
                  </div>
                  {/* SPONSORED badge */}
                  <div className="absolute bottom-4 left-4 bg-yellow-500 text-black px-2 py-0.5 rounded text-xs font-medium">
                    SPONSORED
                  </div>
                </div>

                {/* Play Button */}
                <button
                  className="relative z-10 w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-apple-md transition-transform hover:scale-110"
                  aria-label="動画を再生"
                >
                  <Play className="w-8 h-8 text-[#F93832] ml-1" fill="currentColor" />
                </button>
              </div>

              {/* Text Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white font-semibold text-lg">
                  パートナーマーケター
                </p>
                <p className="text-white/80 text-sm">
                  2名で"1500商談"の秘訣に迫る
                </p>
              </div>
            </div>
          </div>

          {/* Right: Text Content */}
          <div className="flex flex-col">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="px-3 py-1 bg-red-100 text-[#F93832] text-sm font-medium rounded-full">
                PIVOT
              </span>
              <span className="text-sm text-[#86868b]">ビジネス動画メディア</span>
            </div>

            {/* Main Text */}
            <h3 className="text-2xl md:text-3xl font-semibold text-[#1d1d1f] leading-tight mb-6">
              ビジネス動画メディア「PIVOT」で解説！
            </h3>

            <p className="text-xl md:text-2xl font-medium text-[#1d1d1f] mb-4">
              「2ヶ月」「2名」で1,500商談を実現した
              <br />
              freeeの『パートナーマーケティング』とは？
            </p>

            <p className="text-base text-[#86868b] leading-relaxed mb-8">
              クラウド会計ソフトを提供するfreee株式会社が、
              パートナーマーケティングを活用して短期間で大きな成果を上げた事例を、
              ビジネス動画メディア「PIVOT」で詳しく解説しています。
            </p>

            {/* CTA */}
            <a
              href="#"
              className="inline-flex items-center gap-2 text-[#F93832] font-medium hover:underline"
            >
              <Play className="w-5 h-5" />
              動画を視聴する
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
