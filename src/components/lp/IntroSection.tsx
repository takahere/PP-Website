import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function IntroSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-32 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* タイトル画像 */}
        <h2 className="text-center mb-12 sm:mb-16 lg:mb-20">
          <Image
            src="https://partner-prop.com/wp-content/themes/partnerprop/assets/img/introarea-title.svg"
            alt="パートナーマーケティングの新時代"
            width={1200}
            height={100}
            className="mx-auto w-full max-w-4xl h-auto"
          />
        </h2>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* テキストコンテンツ */}
          <div>
            <h3 className="text-3xl sm:text-4xl font-black mb-6 leading-tight">
              PRM<span className="text-xl sm:text-2xl font-normal">(パートナー連携ポータル)</span>の活用で、
              <span className="block mt-2">企業間を超えるデータを集約し、</span>
              <span className="block mt-2">パートナービジネスを科学せよ。</span>
            </h3>

            <div className="space-y-4 mb-8 text-gray-300 leading-relaxed">
              <p>
                過去のパートナービジネスは、各担当者に依存した属人性の高いチャネルとなっており、定量的な施策実行やナレッジの型化が進んでいませんでした。
              </p>
              <p>
                しかし、PRMを活用することによって、契約・育成・営業情報などあらゆるデータを収集し、データに基づいた意思決定を行うことができるようになります。
              </p>
              <p>
                PartnerPropは高機能なPRMとして、パートナービジネスをより確かなチャネルへと導きます。
              </p>
            </div>

            <Button
              variant="outline"
              size="lg"
              className="text-white border-white hover:bg-white hover:text-gray-900 transition-colors"
              asChild
            >
              <Link href="/knowledge/service-form/">
                資料をダウンロードする
              </Link>
            </Button>
          </div>

          {/* 画像 */}
          <div>
            <Image
              src="https://partner-prop.com/wp-content/themes/partnerprop/assets/img/img_intro.png"
              alt="PRM（パートナー連携ポータル）の活用で、企業間を超えるデータを集約し、パートナービジネスを科学せよ。"
              width={714}
              height={460}
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  )
}



