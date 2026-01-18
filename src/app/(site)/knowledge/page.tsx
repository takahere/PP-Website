import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'ナレッジ | PartnerProp',
  description: 'パートナービジネスに関するナレッジ、ノウハウ、お役立ち情報をご紹介します。',
  openGraph: {
    title: 'ナレッジ | PartnerProp',
    description: 'パートナービジネスに関するナレッジ、ノウハウ、お役立ち情報をご紹介します。',
  },
}

// ナレッジ一覧を取得
async function getKnowledgeList() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('pages')
    .select('id, slug, title, thumbnail, seo_description')
    .eq('type', 'knowledge')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching knowledge:', error)
    return []
  }
  
  return data || []
}

export default async function KnowledgeListPage() {
  const items = await getKnowledgeList()
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-amber-500 to-amber-700 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight">ナレッジ</h1>
          <p className="mt-4 text-lg text-amber-100">
            パートナービジネスに関するナレッジ、ノウハウ、お役立ち情報
          </p>
        </div>
      </header>
      
      {/* コンテンツ */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">ナレッジはまだありません</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="group overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
              >
                <Link href={`/knowledge/${item.slug}`}>
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
                      <div className="flex h-full items-center justify-center bg-amber-50">
                        <span className="text-4xl text-amber-200">📚</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5">
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      ナレッジ
                    </span>
                    <h2 className="mt-2 text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-amber-600">
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
        <div className="mt-16 rounded-2xl bg-amber-50 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            さらに深く学びたい方へ
          </h2>
          <p className="mt-4 text-gray-600">
            PartnerLabでは、パートナービジネスに関する最新トレンドやベストプラクティスを発信しています。
          </p>
          <Link
            href="/lab"
            className="mt-6 inline-flex items-center rounded-lg bg-amber-600 px-6 py-3 text-white hover:bg-amber-700"
          >
            PartnerLabを見る
          </Link>
        </div>
      </main>
    </div>
  )
}
