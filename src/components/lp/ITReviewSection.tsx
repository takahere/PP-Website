import Image from 'next/image'

const WP_CDN_URL = process.env.NEXT_PUBLIC_WP_CDN_URL || 'https://partner-prop.com'

export function ITReviewSection() {
  return (
    <section className="react-section py-8 sm:py-12" aria-labelledby="itreview-heading">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 bg-white rounded-2xl p-6 sm:p-8 lg:p-10">
          {/* ITreviewアイコン */}
          <div className="w-40 sm:w-48 lg:w-56 flex-shrink-0">
            <Image
              src={`${WP_CDN_URL}/wp-content/themes/partnerprop/assets/img/icon_itreview.png`}
              alt="ITreview"
              width={655}
              height={323}
              className="w-full h-auto"
            />
          </div>

          {/* テキストコンテンツ */}
          <div className="flex-1 text-center lg:text-left">
            <h2 id="itreview-heading" className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
              PartnerPropは国内トップクラスの評価を誇るPRMです。
            </h2>
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              PartnerPropは、パートナービジネスにおけるあらゆる課題を解決するPRMツールです。
              <br className="hidden sm:inline" />
              スタートアップからエンタープライズなどの幅広い企業で活用されています。
            </p>
          </div>

          {/* レーダーチャート */}
          <div className="w-32 sm:w-40 lg:w-48 flex-shrink-0">
            <Image
              src={`${WP_CDN_URL}/wp-content/themes/partnerprop/assets/img/img_itreview_rader_chart.png`}
              alt="ITreview評価レーダーチャート"
              width={562}
              height={547}
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  )
}










