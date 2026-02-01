'use client'

import Image from 'next/image'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BenefitItem {
  title: string
  description: string
  image?: string
  points?: string[]
}

export interface BenefitsProps {
  title?: string
  subtitle?: string
  items: BenefitItem[]
  variant?: 'alternating' | 'list' | 'cards'
}

export function Benefits({
  title,
  subtitle,
  items,
  variant = 'alternating',
}: BenefitsProps) {
  return (
    <section className="bg-gray-50 py-20">
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

        {/* Alternating Layout */}
        {variant === 'alternating' && (
          <div className="space-y-24">
            {items.map((item, index) => (
              <div
                key={index}
                className={cn(
                  'flex flex-col gap-12 lg:flex-row lg:items-center',
                  index % 2 === 1 && 'lg:flex-row-reverse'
                )}
              >
                {/* 画像 */}
                {item.image && (
                  <div className="flex-1">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-200 shadow-lg">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* コンテンツ */}
                <div className={cn('flex-1', !item.image && 'max-w-2xl mx-auto')}>
                  <h3 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-lg text-gray-600">{item.description}</p>

                  {item.points && item.points.length > 0 && (
                    <ul className="mt-6 space-y-3">
                      {item.points.map((point, pointIndex) => (
                        <li key={pointIndex} className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--pp-coral)]">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          </div>
                          <span className="text-gray-700">{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List Layout */}
        {variant === 'list' && (
          <div className="space-y-8">
            {items.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-gray-200 bg-white p-8"
              >
                <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-gray-600">{item.description}</p>
                {item.points && item.points.length > 0 && (
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {item.points.map((point, pointIndex) => (
                      <li key={pointIndex} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-[var(--pp-coral)]" />
                        <span className="text-sm text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Cards Layout */}
        {variant === 'cards' && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                {item.image && (
                  <div className="relative aspect-[16/9]">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}















