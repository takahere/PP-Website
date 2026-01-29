'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  extractSeminarMetadata,
  formatEventDate,
  type SeminarMetadata,
} from '@/lib/seminar-utils'
import { useMemo } from 'react'

interface SeminarItem {
  id: string
  slug: string
  title: string
  thumbnail: string | null
  content_html: string | null
  published_at: string | null
  seo_description: string | null
}

interface SeminarCardProps {
  item: SeminarItem
  isPast?: boolean
}

export function SeminarCard({ item, isPast = false }: SeminarCardProps) {
  // content_html からメタデータを抽出
  const metadata: SeminarMetadata = useMemo(() => {
    return extractSeminarMetadata(item.content_html || '')
  }, [item.content_html])

  return (
    <article className="seminar-card group">
      <Link href={`/seminar/${item.slug}`}>
        <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100">
          {/* バッジ（画像上にオーバーレイ） */}
          <div className="absolute left-2 top-2 z-10">
            {isPast ? (
              <span className="seminar-badge-past">終了</span>
            ) : metadata.isOnline ? (
              <span className="seminar-badge-online">オンライン開催</span>
            ) : (
              <span className="seminar-badge-offline">オフライン開催</span>
            )}
          </div>

          {/* サムネイル画像 */}
          {item.thumbnail ? (
            <Image
              src={item.thumbnail}
              alt={item.title}
              fill
              className="object-cover transition group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-50">
              <span className="text-4xl text-gray-300">🎤</span>
            </div>
          )}
        </div>

        <div className="pt-4">
          <h2 className="headline mt-1 line-clamp-2 text-lg font-bold text-gray-900 group-hover:text-gray-600">
            {item.title}
          </h2>
          {metadata.eventDateText && (
            <time className="date mt-1 block text-sm text-gray-500">
              {metadata.eventDateText}
            </time>
          )}
        </div>
      </Link>
    </article>
  )
}
