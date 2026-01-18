import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'メンバー | PartnerProp',
  description: 'パートナープロップのメンバー紹介。パートナービジネスの専門家チームがお客様の成長を支援します。',
  openGraph: {
    title: 'メンバー | PartnerProp',
    description: 'パートナープロップのメンバー紹介。パートナービジネスの専門家チームがお客様の成長を支援します。',
  },
}

interface Member {
  id: string
  slug: string
  name: string
  name_en: string | null
  position: string | null
  company: string | null
  image_url: string | null
  display_order: number
}

async function getMembers(): Promise<Member[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('members')
    .select('id, slug, name, name_en, position, company, image_url, display_order')
    .eq('is_published', true)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching members:', error)
    return []
  }

  return data || []
}

export default async function MemberListPage() {
  const members = await getMembers()

  // 経営陣とその他のメンバーを分類
  const executives = members.filter((m) =>
    ['CEO', 'COO', 'CTO', 'CISO', 'CFO'].includes(m.position || '')
  )
  const otherMembers = members.filter((m) =>
    !['CEO', 'COO', 'CTO', 'CISO', 'CFO'].includes(m.position || '')
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-slate-700 to-slate-900 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold">メンバー</h1>
          <p className="mt-4 text-lg text-slate-300">
            パートナービジネスの専門家チームがお客様の成長を支援します
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* 経営陣セクション */}
        {executives.length > 0 && (
          <section className="mb-16">
            <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">経営陣</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {executives.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          </section>
        )}

        {/* メンバーセクション */}
        {otherMembers.length > 0 && (
          <section>
            <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">メンバー</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {otherMembers.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function MemberCard({ member }: { member: Member }) {
  return (
    <Link
      href={`/member/${member.slug}`}
      className="group block overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {member.image_url ? (
          <Image
            src={member.image_url}
            alt={member.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <span className="text-5xl text-slate-300">👤</span>
          </div>
        )}
      </div>
      <div className="p-5 text-center">
        {member.position && (
          <p className="mb-1 text-sm font-medium uppercase tracking-wide text-blue-600">
            {member.position}
          </p>
        )}
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
          {member.name}
        </h3>
        {member.name_en && (
          <p className="mt-0.5 text-sm text-gray-500">{member.name_en}</p>
        )}
        {member.company && (
          <p className="mt-2 text-xs text-gray-400">
            {member.company.replace('経歴 ', '')}
          </p>
        )}
      </div>
    </Link>
  )
}

