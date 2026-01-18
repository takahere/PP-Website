'use client'

import Image from 'next/image'

interface Partner {
  name: string
  logo: string
}

interface PartnersSectionProps {
  title?: string
  partners: Partner[]
}

export function PartnersSection({ title = '導入企業', partners }: PartnersSectionProps) {
  if (partners.length === 0) return null

  return (
    <section className="bg-white py-12 border-y border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {title && (
          <p className="text-center text-sm font-medium text-gray-500 mb-8">
            {title}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className="flex h-12 items-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
            >
              <Image
                src={partner.logo}
                alt={partner.name}
                width={120}
                height={48}
                className="h-8 w-auto object-contain md:h-10"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
