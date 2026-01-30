'use client'

import { Eye, BookOpen, Settings } from 'lucide-react'

const painPoints = [
  {
    icon: Eye,
    title: '見えない',
    description: '契約締結後にパートナーとの情報が分断、現状や課題がわからない',
  },
  {
    icon: BookOpen,
    title: 'ナレッジがない',
    description: 'パートナーチャネルの型化したナレッジがなく上手く行かせる方法がない',
  },
  {
    icon: Settings,
    title: '仕組みがない',
    description: '仕組みがなく勉強会の繰り返しなど人のリソースに頼り続ける',
  },
]

export function PainPointsSection() {
  return (
    <section className="react-section bg-white py-16 md:py-24" aria-labelledby="painpoints-heading">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Title - Apple iPhone風の超巨大タイポグラフィ */}
        <div className="text-center mb-16 md:mb-20">
          <h2
            id="painpoints-heading"
            className="text-[2.75rem] sm:text-6xl md:text-7xl lg:text-8xl xl:text-[7rem] font-semibold text-[#1d1d1f] tracking-[-0.015em] leading-[1.08]"
          >
            パートナービジネスの成長は、
            <br className="md:hidden" />
            ここで止まる。
          </h2>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {painPoints.map((point, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-8 md:p-10 bg-[#F5F5F7] rounded-2xl border border-gray-100"
            >
              {/* Icon */}
              <div className="w-16 h-16 mb-6 flex items-center justify-center rounded-full bg-gray-200">
                <point.icon className="w-8 h-8 text-[#86868b]" strokeWidth={1.5} />
              </div>

              {/* Title */}
              <h3 className="text-xl md:text-2xl font-semibold text-[#1d1d1f] mb-4">
                {point.title}
              </h3>

              {/* Description */}
              <p className="text-base text-[#86868b] leading-relaxed">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
