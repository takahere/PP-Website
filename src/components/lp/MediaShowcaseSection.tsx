'use client'

import Image from 'next/image'

const WP_CDN_URL = process.env.NEXT_PUBLIC_WP_CDN_URL || 'https://partner-prop.com'

// メディア・書籍のデータ（プレースホルダー）
const mediaItems = [
  {
    id: 1,
    type: 'book',
    title: 'パートナーマーケティング完全ガイド',
    image: `${WP_CDN_URL}/wp-content/themes/partnerprop/assets/img/book_placeholder_1.png`,
    placeholder: true,
  },
  {
    id: 2,
    type: 'book',
    title: 'PRM導入成功事例集',
    image: `${WP_CDN_URL}/wp-content/themes/partnerprop/assets/img/book_placeholder_2.png`,
    placeholder: true,
  },
  {
    id: 3,
    type: 'book',
    title: 'パートナービジネスの教科書',
    image: `${WP_CDN_URL}/wp-content/themes/partnerprop/assets/img/book_placeholder_3.png`,
    placeholder: true,
  },
  {
    id: 4,
    type: 'video',
    title: 'PartnerProp 製品紹介動画',
    image: `${WP_CDN_URL}/wp-content/themes/partnerprop/assets/img/video_placeholder.png`,
    placeholder: true,
  },
]

export function MediaShowcaseSection() {
  return (
    <section className="react-section bg-white py-16 md:py-24" aria-labelledby="media-heading">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Title */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-sm font-medium text-[#86868b] uppercase tracking-wider mb-4">
            Media & Publications
          </p>
          <h2
            id="media-heading"
            className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold text-[#1d1d1f] tracking-[-0.015em] leading-[1.08]"
          >
            書籍・メディア掲載
          </h2>
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {mediaItems.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col items-center"
            >
              {/* Image Container */}
              <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden transition-transform duration-300 group-hover:scale-105 group-hover:shadow-apple-lg">
                {item.placeholder ? (
                  // プレースホルダー
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <div className="w-16 h-16 mb-4 rounded-full bg-gray-300 flex items-center justify-center">
                      {item.type === 'book' ? (
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      ) : (
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 text-center px-4">
                      {item.type === 'book' ? '書籍' : '動画'}
                    </p>
                  </div>
                ) : (
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                )}
              </div>

              {/* Title */}
              <p className="mt-4 text-sm text-[#1d1d1f] text-center font-medium">
                {item.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
