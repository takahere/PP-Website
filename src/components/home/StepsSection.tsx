import { cn } from '@/lib/utils'

interface Step {
  number: number
  title: string
  description: string
  icon?: React.ReactNode
}

interface StepsSectionProps {
  title?: string
  subtitle?: string
  steps: Step[]
}

export function StepsSection({ title, subtitle, steps }: StepsSectionProps) {
  return (
    <section className="bg-[var(--pp-bg-light)] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="text-center mb-16">
            {title && (
              <h2 className="text-3xl font-bold text-[var(--pp-dark)] sm:text-4xl">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-4 text-lg text-gray-600">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={cn(
                'relative bg-white rounded-2xl p-6 shadow-sm',
                'border border-gray-100',
                'transition-all duration-300 hover:shadow-md hover:-translate-y-1'
              )}
            >
              {/* ステップ番号 */}
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pp-coral)] text-white font-bold text-lg">
                  {step.number}
                </span>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[calc(100%+1rem)] w-[calc(100%-2rem)] h-0.5 bg-gray-200" />
                )}
              </div>

              {/* アイコン */}
              {step.icon && (
                <div className="mb-4 text-[var(--pp-coral)]">
                  {step.icon}
                </div>
              )}

              {/* タイトル */}
              <h3 className="text-xl font-bold text-[var(--pp-dark)] mb-2">
                {step.title}
              </h3>

              {/* 説明 */}
              <p className="text-gray-600 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
