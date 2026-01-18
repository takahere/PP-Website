import Image from 'next/image'
import Link from 'next/link'

interface HeroSectionProps {
  headline?: string
  subheadline?: string
  cta_text?: string
  cta_link?: string
  background_image?: string
  variant?: 'simple' | 'with-image' | 'centered'
}

export function HeroSection(_props: HeroSectionProps = {}) {
  return (
    <section
      className="relative bg-[radial-gradient(185.59%_68.02%_at_51.32%_52.5%,_rgb(255,255,255)_0%,_rgb(236,236,236)_100%)] text-zinc-800 text-sm"
      aria-labelledby="hero-heading"
    >
      {/* Container */}
      <div className="mx-auto w-[91.4667%] min-[769px]:relative min-[769px]:w-full min-[769px]:max-w-[77.5rem] min-[769px]:px-5">
        {/* Wrapper */}
        <div
          className={`
            relative flex pb-16 pt-10
            pt-[62.6667vw] pb-[16vw]
            min-[769px]:pt-[9.91667%] min-[769px]:pb-[9.58333%] min-[769px]:px-0
            min-[1440px]:pt-[2.77778vw] min-[1440px]:pb-[2.77778vw]
          `}
        >
          {/* Left: Content */}
          <div className="order-1">
            {/* Title Image */}
            <h1
              id="hero-heading"
              className={`
                text-[3.5rem] font-black leading-none
                w-[91.4667vw] mt-[6.93333vw]
                min-[769px]:w-[41.25rem] min-[769px]:mt-0 min-[769px]:mb-2
                min-[1440px]:w-[45.8333vw]
              `}
            >
              <Image
                src="/img/first-content_title.svg"
                alt="パートナーマーケティングを実現するPRM"
                width={660}
                height={120}
                priority
                className="h-auto w-full max-w-full"
              />
              <span className="sr-only">
                PartnerProp - パートナーマーケティングを実現するPRM
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className={`
                break-words text-center text-base font-semibold text-stone-500
                mb-[4.26667vw]
                min-[769px]:mb-16 min-[769px]:mt-0 min-[769px]:text-left
              `}
            >
              「パートナーマーケティング」で販売代理店・取次店・ディーラーが
              <br className="hidden min-[769px]:block" />
              売りたくなる仕組を作り、売上を向上させるPRM
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 text-lg font-bold min-[769px]:flex-row min-[769px]:items-end min-[769px]:gap-0">
              {/* 無料デモボタン */}
              <div className="min-[769px]:basis-[43.9286%]">
                <Link
                  href="/knowledge/demo/"
                  className="flex w-full items-center justify-center rounded-3xl border-2 border-gray-200 bg-white px-5 py-4 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] active:bg-gray-100"
                >
                  無料デモを申し込む
                </Link>
              </div>

              {/* 資料ダウンロードボタン */}
              <div className="min-[769px]:ml-[4.28571%] min-[769px]:basis-[40.7143%]">
                <Link
                  href="/knowledge/service-form/"
                  className="flex w-full items-center justify-center rounded-3xl bg-zinc-800 px-5 py-4 text-white transition-all hover:bg-zinc-700 active:scale-[0.98] active:bg-zinc-900"
                >
                  資料をダウンロードする
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Hero Image */}
          <div
            className={`
              pointer-events-none absolute order-2
              top-[5.33333vw] w-[115.2%] right-[-12%]
              min-[769px]:bottom-[-2.13rem] min-[769px]:left-[19.13rem] min-[769px]:top-auto min-[769px]:right-auto min-[769px]:m-0 min-[769px]:w-[60.5rem]
              min-[1000px]:left-auto min-[1000px]:right-0
              min-[1440px]:bottom-[-2.36111vw] min-[1440px]:left-[max(21.25vw,280px)] min-[1440px]:right-auto min-[1440px]:w-[67.2222vw]
            `}
          >
            <div className="mx-auto w-auto min-[769px]:m-0 min-[769px]:w-full">
              <Image
                src="/img/img_mv.png"
                alt="パートナーマーケティングを実現するPRM - ダッシュボード画面"
                width={968}
                height={530}
                priority
                className="h-auto w-full max-w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
