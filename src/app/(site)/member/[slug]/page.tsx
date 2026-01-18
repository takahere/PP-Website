import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ExternalLink, Twitter, ArrowLeft } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { PersonJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'

interface Props {
  params: Promise<{ slug: string }>
}

interface Member {
  id: string
  slug: string
  name: string
  name_en: string | null
  position: string | null
  company: string | null
  bio: string | null
  image_url: string | null
  interview_url: string | null
  x_url: string | null
  content_html: string | null
  is_published: boolean | null
}

async function getMember(slug: string): Promise<Member | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error || !data) {
    return null
  }

  return data as Member
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const member = await getMember(slug)

  if (!member) {
    return {
      title: 'メンバーが見つかりません | PartnerProp',
    }
  }

  // bioからHTMLタグを除去してdescription用のテキストを作成
  const plainBio = member.bio?.replace(/<[^>]*>/g, '').slice(0, 150) || ''

  // 未公開メンバーはnoindex
  const robotsConfig = member.is_published === false
    ? { index: false, follow: false }
    : undefined

  return {
    title: `${member.name} - ${member.position || 'メンバー'} | PartnerProp`,
    description: plainBio,
    alternates: {
      canonical: `/member/${slug}`,
    },
    robots: robotsConfig,
    openGraph: {
      title: `${member.name} - ${member.position}`,
      description: plainBio,
      images: member.image_url ? [member.image_url] : [],
    },
  }
}

export default async function MemberDetailPage({ params }: Props) {
  const { slug } = await params
  const member = await getMember(slug)

  if (!member) {
    notFound()
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://partner-prop.com'
  const pageUrl = `${baseUrl}/member/${slug}`
  const plainBio = member.bio?.replace(/<[^>]*>/g, '').slice(0, 150) || ''

  return (
    <>
      <PersonJsonLd
        name={member.name}
        description={plainBio}
        image={member.image_url || undefined}
        jobTitle={member.position || undefined}
        url={pageUrl}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'ホーム', url: baseUrl },
          { name: 'メンバー', url: `${baseUrl}/member` },
          { name: member.name, url: pageUrl },
        ]}
      />
      <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-slate-700 to-slate-900 py-6 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-4 text-sm text-slate-300">
            <Link href="/" className="hover:text-white">ホーム</Link>
            <span className="mx-2">/</span>
            <Link href="/member" className="hover:text-white">メンバー</Link>
            <span className="mx-2">/</span>
            <span>{member.name}</span>
          </nav>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <article className="overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="md:flex">
            {/* 画像 */}
            <div className="md:w-1/3">
              {member.image_url ? (
                <div className="relative aspect-square md:aspect-auto md:h-full">
                  <Image
                    src={member.image_url}
                    alt={member.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              ) : (
                <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 md:h-full">
                  <span className="text-6xl text-slate-300">👤</span>
                </div>
              )}
            </div>

            {/* プロフィール情報 */}
            <div className="flex-1 p-8">
              {member.position && (
                <p className="mb-2 text-sm font-medium uppercase tracking-wide text-blue-600">
                  {member.position}
                </p>
              )}
              <h1 className="text-3xl font-bold text-gray-900">{member.name}</h1>
              {member.name_en && (
                <p className="mt-1 text-lg text-gray-500">{member.name_en}</p>
              )}

              {member.company && (
                <p className="mt-4 text-sm text-gray-600">
                  <span className="font-medium">経歴:</span> {member.company.replace('経歴 ', '')}
                </p>
              )}

              {/* ソーシャルリンク */}
              <div className="mt-6 flex flex-wrap gap-3">
                {member.x_url && (
                  <a
                    href={member.x_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
                  >
                    <Twitter className="h-4 w-4" />
                    <span>X (Twitter)</span>
                  </a>
                )}
                {member.interview_url && (
                  <a
                    href={member.interview_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>インタビュー記事</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* バイオ */}
          {member.bio && (
            <div className="border-t bg-gray-50 px-8 py-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">プロフィール</h2>
              <div
                className="prose prose-gray max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: member.bio }}
              />
            </div>
          )}
        </article>

        {/* 戻るリンク */}
        <div className="mt-8 text-center">
          <Link href="/member">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              メンバー一覧に戻る
            </Button>
          </Link>
        </div>
      </main>
    </div>
    </>
  )
}

