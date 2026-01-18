import Image from 'next/image'
import Link from 'next/link'

interface CaseStudy {
  id: string
  slug: string
  title: string
  thumbnail?: string | null
  company?: string
  result?: string
}

interface CaseStudiesSectionProps {
  title?: string
  subtitle?: string
  items: CaseStudy[]
}

export function CaseStudiesSection({
  title = '導入事例',
  subtitle,
  items,
}: CaseStudiesSectionProps) {
  if (items.length === 0) return null

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[var(--pp-dark)] sm:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg text-gray-600">
              {subtitle}
            </p>
          )}
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/casestudy/${item.slug}`}
              className="group block overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                {item.thumbnail ? (
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gray-100">
                    <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="p-5">
                {item.company && (
                  <p className="text-sm font-medium text-[var(--pp-coral)] mb-1">
                    {item.company}
                  </p>
                )}
                <h3 className="text-lg font-bold text-[var(--pp-dark)] line-clamp-2 group-hover:text-[var(--pp-coral)] transition-colors">
                  {item.title}
                </h3>
                {item.result && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {item.result}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/casestudy"
            className="inline-flex items-center text-[var(--pp-coral)] font-medium hover:underline"
          >
            すべての導入事例を見る
            <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
