'use client'

// アプリアイコンの色パレット
const iconColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-lime-500',
  'bg-sky-500',
]

// プレースホルダーアイコンを生成
const generateIcons = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    color: iconColors[i % iconColors.length],
    // ランダムな形状（円形、角丸など）
    shape: i % 3 === 0 ? 'rounded-full' : i % 3 === 1 ? 'rounded-xl' : 'rounded-2xl',
  }))
}

const icons = generateIcons(48)

export function IntegrationIconsSection() {
  return (
    <section className="react-section bg-white py-16 md:py-24" aria-labelledby="integration-heading">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Title - Apple iPhone風の超巨大タイポグラフィ */}
        <div className="text-center mb-12 md:mb-16">
          <h2
            id="integration-heading"
            className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold text-[#1d1d1f] tracking-[-0.015em] leading-[1.08]"
          >
            <span className="block">サイロ化？いいえ。</span>
            <span className="block mt-2 md:mt-4 text-[2rem] sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-[#86868b]">
              1,000を超えるサービスと
              <br className="sm:hidden" />
              自動連携可能です。
            </span>
          </h2>
        </div>

        {/* Icons Grid */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 md:p-12">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-gray-900/80 pointer-events-none z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-transparent to-gray-900/80 pointer-events-none z-10" />

          {/* Icons */}
          <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-3 md:gap-4">
            {icons.map((icon) => (
              <div
                key={icon.id}
                className={`
                  aspect-square ${icon.color} ${icon.shape}
                  flex items-center justify-center
                  transition-transform duration-300
                  hover:scale-110 hover:z-20
                  shadow-apple-md
                `}
              >
                {/* アイコンプレースホルダー - シンプルな形状 */}
                <div className="w-1/2 h-1/2 bg-white/20 rounded" />
              </div>
            ))}
          </div>

          {/* Center Highlight */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-48 md:h-48 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full pointer-events-none" />
        </div>

        {/* Subtitle */}
        <div className="text-center mt-8">
          <p className="text-base md:text-lg text-[#86868b]">
            Salesforce、HubSpot、Slack、Google Workspace など主要サービスと連携
          </p>
        </div>
      </div>
    </section>
  )
}
