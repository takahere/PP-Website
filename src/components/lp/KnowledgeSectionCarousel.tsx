'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react'

// お役立ち資料データ（プレースホルダー）
const knowledgeItems = [
  {
    id: 1,
    date: '2025.11.25',
    title: '代理店営業の今を可視化する「パートナービジネスのKPI設計ガイド」',
    slug: 'kpi-guide',
    type: 'PDF',
  },
  {
    id: 2,
    date: '2025.03.25',
    title: 'パートナーマーケティング白書 2025free',
    slug: 'whitepaper-2025',
    type: 'PDF',
  },
  {
    id: 3,
    date: '2025.05.03',
    title: '業界別パートナーマーケティング実践事例',
    slug: 'industry-cases',
    type: 'PDF',
  },
  {
    id: 4,
    date: '2025.08.13',
    title: 'パートナーマーケティング施策大全',
    slug: 'tactics-guide',
    type: 'PDF',
  },
  {
    id: 5,
    date: '2025.07.11',
    title: 'SaaS経営者の戦略的提携・再販戦略（後編全3部構成）',
    slug: 'saas-strategy',
    type: 'PDF',
  },
]

export function KnowledgeSectionCarousel() {
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
    <section className="react-section bg-white py-16 md:py-24" aria-labelledby="knowledge-heading">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <p className="text-sm font-medium text-[#86868b] uppercase tracking-wider mb-2">
              Knowledge
            </p>
            <h2
              id="knowledge-heading"
              className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold text-[#1d1d1f] tracking-[-0.015em] leading-[1.08] mb-2"
            >
              お役立ち資料
            </h2>
            <p className="text-base text-[#86868b]">
              お役立ち資料を今すぐチェック
            </p>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="前へ"
            >
              <ChevronLeft className="w-5 h-5 text-[#1d1d1f]" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
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
          {knowledgeItems.map((item) => (
            <Link
              key={item.id}
              href={`/knowledge/${item.slug}`}
              className="group flex-shrink-0 w-[260px] snap-start"
            >
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-apple-md hover:border-gray-200 h-full">
                {/* PDF Thumbnail Placeholder */}
                <div className="aspect-[4/5] bg-gradient-to-br from-gray-50 to-gray-100 relative">
                  {/* PartnerProp Document Style */}
                  <div className="absolute inset-4 bg-white rounded-lg shadow-apple-sm border border-gray-200 p-4 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-[#F93832] rounded flex items-center justify-center">
                        <FileText className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-medium text-[#F93832]">
                        PartnerProp
                      </span>
                    </div>

                    {/* Title Preview */}
                    <div className="flex-1">
                      <div className="h-2 bg-gray-200 rounded w-full mb-2" />
                      <div className="h-2 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-2 bg-gray-200 rounded w-1/2" />
                    </div>

                    {/* PDF Badge */}
                    <div className="mt-auto">
                      <span className="inline-block bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded">
                        {item.type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="text-xs text-[#86868b] mb-2">{item.date}</p>
                  <h3 className="text-sm font-medium text-[#1d1d1f] line-clamp-2 group-hover:text-[#F93832] transition-colors">
                    {item.title}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link
            href="/knowledge"
            className="inline-flex items-center justify-center rounded-full border-2 border-[#1d1d1f] bg-white px-8 py-4 text-[17px] font-medium text-[#1d1d1f] transition-all hover:bg-[#F5F5F7] active:scale-[0.98]"
          >
            お役立ち資料をすべて見る
          </Link>
        </div>
      </div>
    </section>
  )
}
