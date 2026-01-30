'use client'

// 4つのプロセスステップデータ
const processSteps = [
  {
    id: 'planning',
    category: '全体設計',
    title: 'プランニング',
    description: 'パートナー戦略の全体設計と目標設定',
    cards: [
      {
        title: 'パートナー戦略策定',
        description: 'ビジネス目標に基づいたパートナー戦略の立案',
      },
      {
        title: 'KPI設計',
        description: '成功を測定するための指標とマイルストーン設定',
      },
      {
        title: 'パートナー選定基準',
        description: '最適なパートナー像の定義と選定プロセス設計',
      },
    ],
  },
  {
    id: 'onboarding',
    category: '育成と支援',
    title: 'オンボーディング',
    description: 'パートナーの立ち上げ支援と教育',
    cards: [
      {
        title: 'トレーニングプログラム',
        description: '製品知識・販売スキルの習得を支援',
      },
      {
        title: 'セールスキット提供',
        description: '提案資料・デモ環境・事例集の整備',
      },
    ],
  },
  {
    id: 'activation',
    category: '稼働と成功体験',
    title: 'アクティベーション',
    description: 'パートナーの稼働促進と初期成功の創出',
    cards: [
      {
        title: '共同営業支援',
        description: '初期案件の共同クロージングサポート',
      },
      {
        title: 'インセンティブ設計',
        description: '成果に応じた報酬・特典プログラム',
      },
    ],
  },
  {
    id: 'retention',
    category: '継続成果と効率化',
    title: 'リテンション',
    description: 'パートナー関係の継続と成果の最大化',
    cards: [
      {
        title: 'パフォーマンス分析',
        description: 'データに基づく改善提案とベストプラクティス共有',
      },
      {
        title: 'コミュニティ形成',
        description: 'パートナー間のネットワーキングと情報交換',
      },
    ],
  },
]

export function ProcessStepsSection() {
  return (
    <section className="react-section bg-white py-20 md:py-32" aria-labelledby="process-heading">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-24">
          <p className="text-sm font-medium text-[#86868b] uppercase tracking-wider mb-4">
            Process
          </p>
          <h2
            id="process-heading"
            className="text-5xl md:text-6xl lg:text-7xl font-semibold text-[#1d1d1f] tracking-tight leading-[1.1] mb-6"
          >
            パートナーマーケティングの4ステップ
          </h2>
          <p className="text-lg text-[#86868b] max-w-2xl mx-auto">
            戦略策定から継続的な成果創出まで、
            <br className="hidden md:inline" />
            PartnerPropがすべてのプロセスをサポートします
          </p>
        </div>

        {/* Process Steps */}
        <div className="space-y-16 md:space-y-24">
          {processSteps.map((step, stepIndex) => (
            <div key={step.id} className="relative">
              {/* Step Number & Category */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#1d1d1f] text-white font-semibold text-lg">
                  {stepIndex + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#F93832] uppercase tracking-wider">
                    {step.category}
                  </p>
                  <h3 className="text-2xl md:text-3xl font-semibold text-[#1d1d1f]">
                    {step.title}
                  </h3>
                </div>
              </div>

              {/* Step Description */}
              <p className="text-base text-[#86868b] mb-8 pl-16">
                {step.description}
              </p>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pl-0 md:pl-16">
                {step.cards.map((card, cardIndex) => (
                  <div
                    key={cardIndex}
                    className="group relative bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-100 transition-all duration-300 hover:bg-white hover:shadow-lg hover:border-gray-200"
                  >
                    {/* Placeholder Image */}
                    <div className="w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-6 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>

                    {/* Card Content */}
                    <h4 className="text-lg font-semibold text-[#1d1d1f] mb-2">
                      {card.title}
                    </h4>
                    <p className="text-sm text-[#86868b] leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Connector Line (except last step) */}
              {stepIndex < processSteps.length - 1 && (
                <div className="hidden md:block absolute left-6 top-16 w-0.5 h-full bg-gradient-to-b from-[#1d1d1f] to-transparent -z-10" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
