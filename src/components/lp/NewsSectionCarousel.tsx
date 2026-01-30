'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// ニュースデータ（プレースホルダー）
const newsItems = [
  {
    id: 1,
    date: '2026.01.26',
    category: 'プレスリリース',
    title: 'T15株式会社が「PartnerProp」を導入し、ワンプラットフォーム',
    slug: 'news-1',
  },
  {
    id: 2,
    date: '2026.01.12',
    category: 'プレスリリース',
    title: '【プレスリリース】「パートナーマーケティング」を実現する',
    slug: 'news-2',
  },
  {
    id: 3,
    date: '2025.04.13',
    category: 'メディア掲載',
    title: '【メディア掲載】日本経済新聞電子版に掲載されました。',
    slug: 'news-3',
  },
  {
    id: 4,
    date: '2025.04.27',
    category: 'プレスリリース',
    title: '【プレスリリース】パートナーチャネルの成果拡大と企業成',
    slug: 'news-4',
  },
  {
    id: 5,
    date: '2025.06.15',
    category: 'プレスリリース',
    title: '【プレスリリース】パートナープロップ、ギーゴツドと連携強化',
    slug: 'news-5',
  },
]

export function NewsSectionCarousel() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 280
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  return (
    <section className="react-section bg-[#F5F5F7] py-16 md:py-24" aria-labelledby="news-heading">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <p className="text-sm font-medium text-[#86868b] uppercase tracking-wider mb-2">
              News
            </p>
            <h2
              id="news-heading"
              className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold text-[#1d1d1f] tracking-[-0.015em] leading-[1.08] mb-2"
            >
              お知らせ
            </h2>
            <p className="text-base text-[#86868b]">
              PartnerPropはスタートアップからエンタープライズ企業まで幅広くご導入いただいています
            </p>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="前へ"
            >
              <ChevronLeft className="w-5 h-5 text-[#1d1d1f]" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="次へ"
            >
              <ChevronRight className="w-5 h-5 text-[#1d1d1f]" />
            </button>
          </div>
        </div>

        {/* Cards Carousel */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-6 px-6"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {newsItems.map((news) => (
            <Link
              key={news.id}
              href={`/news/${news.slug}`}
              className="group flex-shrink-0 w-[260px] snap-start"
            >
              <div className="bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-apple-md h-full">
                {/* Image Placeholder */}
                <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 relative">
                  {/* PartnerProp Logo Placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-2xl font-bold text-gray-300">
                      PartnerProp
                    </div>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-[#F93832] text-white text-xs px-2 py-1 rounded">
                      {news.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="text-xs text-[#86868b] mb-2">{news.date}</p>
                  <h3 className="text-sm font-medium text-[#1d1d1f] line-clamp-2 group-hover:text-[#F93832] transition-colors">
                    {news.title}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link
            href="/news"
            className="inline-flex items-center justify-center rounded-full border-2 border-[#1d1d1f] bg-white px-8 py-4 text-[17px] font-medium text-[#1d1d1f] transition-all hover:bg-[#F5F5F7] active:scale-[0.98]"
          >
            お知らせをすべて見る
          </Link>
        </div>
      </div>
    </section>
  )
}
