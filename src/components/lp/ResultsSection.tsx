import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const WP_CDN_URL = process.env.NEXT_PUBLIC_WP_CDN_URL || 'https://partner-prop.com'

export function ResultsSection() {
  return (
    <section id="resultsArea" className="contentWrap react-section py-16 sm:py-20 bg-white">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8 items-center">
          {/* コピー */}
          <div className="lg:col-span-3 text-center mb-8">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              パートナーマーケティングで
              <span className="bg-gradient-to-r from-red-400 via-rose-400 to-fuchsia-500 bg-clip-text text-transparent">
                パートナー経由の成果
              </span>
              を増やしませんか？
            </p>
          </div>

          {/* 商談数 */}
          <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 rounded-2xl p-8 text-center">
            <p className="text-sm font-semibold text-gray-600 mb-4">商談数</p>
            <div className="mb-6">
              <Image
                src={`${WP_CDN_URL}/wp-content/themes/partnerprop/assets/img/top_results_600.svg`}
                alt="600%"
                width={200}
                height={80}
                className="mx-auto"
              />
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              PRM上に登録された案件をバイネームで議論でき、商談の量・質が向上
            </p>
          </div>

          {/* 生産性 */}
          <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 rounded-2xl p-8 text-center">
            <p className="text-sm font-semibold text-gray-600 mb-4">生産性</p>
            <div className="mb-6">
              <Image
                src={`${WP_CDN_URL}/wp-content/themes/partnerprop/assets/img/top_results_200.svg`}
                alt="200%"
                width={200}
                height={80}
                className="mx-auto"
              />
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              情報共有・連絡ツールの一元化・育成の効率化により、業務工数も大幅削減
            </p>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-center">
            <Button
              size="lg"
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-6 px-8 rounded-full"
              asChild
            >
              <Link href="/knowledge/service-form/">
                資料をダウンロードする
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}











