import Image from 'next/image'
import Link from 'next/link'

export function PartnerMarketingSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-32 bg-white">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* タイトル */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-center mb-12 sm:mb-16">
          <span className="bg-gradient-to-r from-red-400 via-rose-400 to-fuchsia-500 bg-clip-text text-transparent">
            パートナー<br className="sm:hidden" />マーケティング
          </span>
          とは
        </h2>

        {/* 説明とビデオ */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16 lg:mb-20">
          {/* テキスト */}
          <div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-relaxed">
              契約→育成→商談→受注に至る<br />
              パートナージャーニーを<br />
              見える化・仕組み化することで、<br />
              「売りやすい仕組」を整える
            </p>
          </div>

          {/* ビデオプレースホルダー */}
          <div className="rounded-2xl overflow-hidden bg-gray-900 aspect-video">
            <div className="relative w-full h-full bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <p className="text-lg font-bold mb-2">2か月で1,500商談を作った"freeeの成功の秘訣"</p>
                <p className="text-base">「パートナーマーケティング」</p>
              </div>
            </div>
          </div>
        </div>

        {/* 比較グリッド */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="grid grid-cols-5 gap-4 min-w-[800px]">
              {/* ヘッダー行 */}
              <div className="bg-white" />
              <div className="bg-gray-800 text-white rounded-lg p-4 text-center font-bold">契約開始</div>
              <div className="bg-gray-800 text-white rounded-lg p-4 text-center font-bold">育成</div>
              <div className="bg-gray-800 text-white rounded-lg p-4 text-center font-bold">商談実施</div>
              <div className="bg-gray-800 text-white rounded-lg p-4 text-center font-bold">受注（成果）</div>

              {/* 従来のアプローチ行 */}
              <div className="bg-gray-400 text-white rounded-lg p-4 flex items-center justify-center font-bold">
                従来のアプローチ
              </div>
              <ComparisonCard
                imageSrc="https://partner-prop.com/wp-content/themes/partnerprop/assets/img/img_assignment01.png"
                text="契約情報・企業情報が分散してしまう"
              />
              <ComparisonCard
                imageSrc="https://partner-prop.com/wp-content/themes/partnerprop/assets/img/img_assignment02.png"
                text="勉強会など一方通行な育成"
              />
              <ComparisonCard
                imageSrc="https://partner-prop.com/wp-content/themes/partnerprop/assets/img/img_assignment04.png"
                text="パートナーの稼働状況が分からない"
              />
              <ComparisonCard
                imageSrc="https://partner-prop.com/wp-content/themes/partnerprop/assets/img/img_assignment03.png"
                text="契約しても紹介や商談が実施されない"
              />

              {/* パートナーマーケティング行 */}
              <div className="bg-gradient-to-r from-red-400 via-rose-400 to-fuchsia-500 text-white rounded-lg p-4 flex items-center justify-center font-bold">
                パートナーマーケ
              </div>
              <ComparisonCard
                imageSrc="https://partner-prop.com/wp-content/themes/partnerprop/assets/img/img_assignment05.png"
                text="契約情報を一元化"
                highlight
              />
              <ComparisonCard
                imageSrc="https://partner-prop.com/wp-content/themes/partnerprop/assets/img/img_assignment06.png"
                text="Eラーニングで履歴管理"
                highlight
              />
              <ComparisonCard
                imageSrc="https://partner-prop.com/wp-content/themes/partnerprop/assets/img/img_assignment07.png"
                text="個人単位で案件管理・進捗を可視化"
                highlight
              />
              <ComparisonCard
                imageSrc="https://partner-prop.com/wp-content/themes/partnerprop/assets/img/img_assignment08.png"
                text="売りたくなる仕組とフォロー体制を整備"
                highlight
              />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/knowledge/partner-marketing-3set/"
            className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 px-8 rounded-full transition-colors"
          >
            <span>パートナーマーケティングを詳しく知る</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

function ComparisonCard({
  imageSrc,
  text,
  highlight = false,
}: {
  imageSrc: string
  text: string
  highlight?: boolean
}) {
  return (
    <div className={`${highlight ? 'bg-gray-50' : 'bg-gray-200'} rounded-lg p-6 flex flex-col items-center gap-4`}>
      <Image
        src={imageSrc}
        alt={text}
        width={180}
        height={180}
        className="w-32 h-auto"
      />
      <p
        className={`text-center text-base font-bold ${
          highlight
            ? 'bg-gradient-to-r from-red-400 via-rose-400 to-fuchsia-500 bg-clip-text text-transparent'
            : 'text-gray-800'
        }`}
      >
        {text}
      </p>
    </div>
  )
}



