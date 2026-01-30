'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// 企業事例データ（プレースホルダー）
const caseStudies = [
  {
    id: 1,
    company: '三菱地所株式会社',
    logo: 'MITSUBISHI ESTATE',
    title: 'インサイドセールスチームの立ち上げ',
    description: '商談化率40%超を安定化させる仕組みを構築、誰もが「勝ちパターン」を再現できるインサイドセールスの基盤',
    category: '不動産',
    slug: 'mitsubishi-estate',
  },
  {
    id: 2,
    company: '株式会社ネオキャリア',
    logo: 'neocareer',
    title: '受注1.5倍　翌入化の解消',
    description: 'メンバーの9割が目標達成、営業のトップセールス依存体制を変えた「AI活用術」',
    category: '人材',
    slug: 'neocareer',
  },
  {
    id: 3,
    company: '株式会社WHERE',
    logo: 'WHERE',
    title: '売上単価が昨対比に伸びる、事業成長戦力へのインパクトを最大化する「戦略」と「スピード」の仕組み',
    description: '売上単価が昨対比に伸びる、事業成長戦力へのインパクトを最大化',
    category: 'SaaS',
    slug: 'where',
  },
  {
    id: 4,
    company: 'GOジョブ株式会社',
    logo: 'GOジョブ',
    title: '導入3ヶ月で売上に貢献',
    description: '「見つけよう」インセンティブセールスマネジメントで成果を最大化',
    category: '人材',
    slug: 'go-job',
  },
  {
    id: 5,
    company: '株式会社HOMETACT',
    logo: 'HOMETACT',
    title: '再現性の高い組織づくり',
    description: '属人化していた営業プロセスを標準化し、組織全体の生産性を向上',
    category: '不動産テック',
    slug: 'hometact',
  },
]

export function CaseStudiesGridSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  return (
    <section className="react-section bg-white py-16 md:py-24" aria-labelledby="case-studies-heading">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-sm font-medium text-[#86868b] uppercase tracking-wider mb-2">
              Case Studies
            </p>
            <h2
              id="case-studies-heading"
              className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold text-[#1d1d1f] tracking-[-0.015em] leading-[1.08]"
            >
              導入事例
            </h2>
          </div>

          {/* Navigation Arrows */}
          <div className="hidden md:flex items-center gap-2">
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
          {caseStudies.map((study) => (
            <Link
              key={study.id}
              href={`/case-study/${study.slug}`}
              className="group flex-shrink-0 w-[280px] md:w-[300px] snap-start"
            >
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-apple-lg hover:border-gray-200">
                {/* Image Placeholder */}
                <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 relative">
                  {/* Company Logo Placeholder */}
                  <div className="absolute top-4 left-4 bg-white px-3 py-1.5 rounded-lg shadow-apple-sm">
                    <span className="text-xs font-medium text-gray-700">
                      {study.logo}
                    </span>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-[#1d1d1f] text-white text-xs px-2 py-1 rounded">
                      {study.category}
                    </span>
                  </div>

                  {/* Image Icon Placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <p className="text-xs text-[#86868b] mb-2">{study.company}</p>
                  <h3 className="text-base font-semibold text-[#1d1d1f] mb-2 line-clamp-2 group-hover:text-[#F93832] transition-colors">
                    {study.title}
                  </h3>
                  <p className="text-sm text-[#86868b] line-clamp-2">
                    {study.description}
                  </p>

                  {/* Arrow */}
                  <div className="mt-4 flex items-center text-[#F93832] text-sm font-medium">
                    詳しく見る
                    <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link
            href="/case-study"
            className="inline-flex items-center justify-center rounded-full border-2 border-[#1d1d1f] bg-white px-8 py-4 text-[17px] font-medium text-[#1d1d1f] transition-all hover:bg-[#F5F5F7] active:scale-[0.98]"
          >
            導入事例をすべて見る
          </Link>
        </div>
      </div>
    </section>
  )
}
