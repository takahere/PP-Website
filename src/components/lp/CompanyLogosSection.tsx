'use client'

import Image from 'next/image'

const WP_CDN_URL = process.env.NEXT_PUBLIC_WP_CDN_URL || 'https://partner-prop.com'

const logos = [
  { name: 'みずほ銀行', src: '/img/img_banner16.png' },
  { name: 'エン・ジャパン', src: '/img/img_banner02.png' },
  { name: 'リクルート', src: '/img/img_banner32.png' },
  { name: 'NTT印刷', src: '/img/img_banner03.png' },
  { name: 'TIS', src: '/img/img_banner31.png' },
  { name: 'kakaku.com', src: '/img/img_banner04.png' },
  { name: 'Timee', src: '/img/img_banner06.png' },
  { name: 'Sales Marker', src: '/img/img_banner10.png' },
  { name: 'Dinii Inc.', src: '/img/img_banner15.png' },
]

const logos2 = [
  { name: 'freee', src: '/img/img_banner34.png' },
  { name: 'SAKURA internet', src: '/img/img_banner26.png' },
  { name: 'MoneyForward', src: '/img/img_banner01_3.png' },
  { name: 'Leverages', src: '/img/img_banner29.png' },
  { name: 'TSUNAGU GROUP HOLDINGS inc.', src: '/img/img_banner07.png' },
  { name: 'Another works, Inc', src: '/img/img_banner13.png' },
  { name: 'b-dash', src: '/img/img_banner11.png' },
  { name: 'FLN', src: '/img/img_banner19.png' },
  { name: 'TORETA', src: '/img/img_banner27.png' },
]

export function CompanyLogosSection() {
  return (
    <section className="react-section py-10 overflow-hidden bg-white" aria-label="導入企業実績">
      <h2 className="sr-only">導入企業</h2>
      
      <div className="relative">
        {/* 1行目のロゴスクロール */}
        <div className="flex gap-8 mb-4 animate-scroll">
          {[...logos, ...logos].map((logo, index) => (
            <div
              key={`logo1-${index}`}
              className="flex-shrink-0 w-32 sm:w-40 h-12 sm:h-16 flex items-center justify-center grayscale hover:grayscale-0 transition-all"
            >
              <Image
                src={`${WP_CDN_URL}${logo.src}`}
                alt={logo.name}
                width={160}
                height={80}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ))}
        </div>

        {/* 2行目のロゴスクロール（逆方向） */}
        <div className="flex gap-8 animate-scroll-reverse">
          {[...logos2, ...logos2].map((logo, index) => (
            <div
              key={`logo2-${index}`}
              className="flex-shrink-0 w-32 sm:w-40 h-12 sm:h-16 flex items-center justify-center grayscale hover:grayscale-0 transition-all"
            >
              <Image
                src={`${WP_CDN_URL}${logo.src}`}
                alt={logo.name}
                width={160}
                height={80}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}










