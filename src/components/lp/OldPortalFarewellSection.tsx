'use client'

import { useState } from 'react'

export function OldPortalFarewellSection() {
  const [isTransformed, setIsTransformed] = useState(false)

  return (
    <section className="react-section bg-[#1d1d1f] py-16 md:py-24" aria-labelledby="farewell-heading">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Subtitle */}
        <div className="text-center mb-8">
          <p className="text-lg md:text-xl text-gray-400">
            パートナーマーケティングは、
          </p>
          <p className="text-lg md:text-xl text-gray-400 mt-2">
            パートナチャネルの「
            <span className="bg-gradient-to-r from-[#F93832] to-[#FF6B6B] bg-clip-text text-transparent font-semibold">
              売上
            </span>
            」を上げる"PLAY BOOK"です
          </p>
        </div>

        {/* Main Heading - Apple iPhone風の超巨大タイポグラフィ */}
        <div className="text-center mb-16 md:mb-20">
          <h2
            id="farewell-heading"
            className="text-[2.75rem] sm:text-6xl md:text-7xl lg:text-8xl xl:text-[7rem] font-semibold text-white tracking-[-0.015em] leading-[1.08]"
          >
            古いパートナーポータルとは、
            <br className="md:hidden" />
            おさらば。
          </h2>
        </div>

        {/* Description Box */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="bg-[#2d2d2f] rounded-2xl p-8 md:p-12 text-center">
            <p className="text-base md:text-lg text-gray-300 leading-relaxed">
              メーカーとパートナー共に、
              <span className="bg-gradient-to-r from-[#F93832] to-[#FF6B6B] bg-clip-text text-transparent font-semibold">
                『売上』
              </span>
              げることを目的にした
              <br className="hidden md:inline" />
              「パートナーマーケティングAIエンジン」搭載
            </p>
          </div>
        </div>

        {/* Interactive Before/After Animation */}
        <div className="max-w-4xl mx-auto">
          <div
            className="relative cursor-pointer group"
            onClick={() => setIsTransformed(!isTransformed)}
            onMouseEnter={() => setIsTransformed(true)}
            onMouseLeave={() => setIsTransformed(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsTransformed(!isTransformed)
              }
            }}
            aria-label="旧式から次世代型へのアニメーションを切り替え"
          >
            {/* Before State */}
            <div
              className={`transition-all duration-700 ease-out ${
                isTransformed
                  ? 'opacity-0 scale-95 pointer-events-none'
                  : 'opacity-100 scale-100'
              }`}
            >
              <div className="bg-[#2d2d2f] rounded-2xl p-8 md:p-12 border border-gray-700">
                <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                  {/* Old Portal Icon */}
                  <div className="w-24 h-24 rounded-xl bg-gray-700 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-gray-500 text-sm mb-2">従来のパートナーポータル</p>
                    <p className="text-xl md:text-2xl text-gray-400 font-medium">
                      情報共有だけの静的なツール
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      触れて変化を確認
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* After State */}
            <div
              className={`absolute inset-0 transition-all duration-700 ease-out ${
                isTransformed
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-105 pointer-events-none'
              }`}
            >
              <div className="bg-gradient-to-br from-[#F93832] to-[#FF6B6B] rounded-2xl p-8 md:p-12 shadow-apple-xl shadow-red-500/15">
                <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                  {/* New Portal Icon */}
                  <div className="w-24 h-24 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-white/80 text-sm mb-2">次世代型 AIパートナーポータル</p>
                    <p className="text-xl md:text-2xl text-white font-semibold">
                      売上を生み出すエンジン
                    </p>
                    <p className="text-sm text-white/70 mt-2">
                      AIが最適なアクションを提案
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instruction Text */}
          <p className="text-center text-gray-500 text-sm mt-6">
            ※ カードにホバーまたはタップで変化
          </p>
        </div>
      </div>
    </section>
  )
}
