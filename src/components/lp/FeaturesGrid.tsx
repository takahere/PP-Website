'use client'

import {
  Zap,
  Shield,
  TrendingUp,
  Users,
  Settings,
  BarChart3,
  Globe,
  Lock,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// アイコンマッピング
const iconMap: Record<string, LucideIcon> = {
  zap: Zap,
  shield: Shield,
  trending: TrendingUp,
  users: Users,
  settings: Settings,
  chart: BarChart3,
  globe: Globe,
  lock: Lock,
  sparkles: Sparkles,
}

export interface FeatureItem {
  icon?: string
  title: string
  description: string
}

export interface FeaturesGridProps {
  title?: string
  subtitle?: string
  items: FeatureItem[]
  columns?: 2 | 3 | 4
  variant?: 'cards' | 'simple' | 'icons-left'
}

export function FeaturesGrid({
  title,
  subtitle,
  items,
  columns = 3,
  variant = 'cards',
}: FeaturesGridProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        {(title || subtitle) && (
          <div className="mb-16 text-center">
            {title && (
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-4 text-lg text-gray-600">{subtitle}</p>
            )}
          </div>
        )}

        {/* グリッド */}
        <div className={cn('grid gap-8', gridCols[columns])}>
          {items.map((item, index) => {
            const IconComponent = item.icon ? iconMap[item.icon] : Sparkles

            if (variant === 'cards') {
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--pp-coral)]/10">
                    <IconComponent className="h-6 w-6 text-[var(--pp-coral)]" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              )
            }

            if (variant === 'icons-left') {
              return (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--pp-coral)]/10">
                      <IconComponent className="h-5 w-5 text-[var(--pp-coral)]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-1 text-lg font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              )
            }

            // simple variant
            return (
              <div key={index} className="text-center">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--pp-coral)]/10">
                  <IconComponent className="h-7 w-7 text-[var(--pp-coral)]" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}














