import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: '導入事例 | PartnerProp',
  description: 'PartnerPropを導入いただいた企業様の成功事例をご紹介します。',
  openGraph: {
    title: '導入事例 | PartnerProp',
    description: 'PartnerPropを導入いただいた企業様の成功事例をご紹介します。',
  },
}

// 導入事例一覧を取得
async function getCasestudyList() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('pages')
    .select('id, slug, title, thumbnail, seo_description')
    .eq('type', 'casestudy')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching casestudies:', error)
    return []
  }
  
  return data || []
}

export default async function CasestudyListPage() {
  const items = await getCasestudyList()
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-emerald-600 to-emerald-800 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight">導入事例</h1>
          <p className="mt-4 text-lg text-emerald-100">
            PartnerPropを導入いただいた企業様の成功事例
          </p>
        </div>
      </header>
      
      {/* コンテンツ */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">導入事例はまだありません</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="group overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
              >
                <Link href={`/casestudy/${item.slug}`}>
                  <div className="relative aspect-video overflow-hidden bg-gray-100">
                    {item.thumbnail ? (
                      <Image
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        className="object-cover transition group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-emerald-50">
                        <span className="text-4xl text-emerald-200">🏢</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                      導入事例
                    </span>
                    <h2 className="mt-2 text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-emerald-600">
                      {item.title}
                    </h2>
                    {item.seo_description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {item.seo_description}
                      </p>
                    )}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
        
        {/* CTA */}
        <div className="mt-16 rounded-2xl bg-emerald-50 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            導入をご検討ですか？
          </h2>
          <p className="mt-4 text-gray-600">
            パートナービジネスの課題解決について、お気軽にご相談ください。
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center rounded-lg bg-emerald-600 px-6 py-3 text-white hover:bg-emerald-700"
          >
            お問い合わせ
          </Link>
        </div>
      </main>
    </div>
  )
}
