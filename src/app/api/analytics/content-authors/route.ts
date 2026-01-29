import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { LRUCache } from 'lru-cache'

/**
 * 著者別コンテンツ分析API
 *
 * lab_authorsの情報を取得し、著者貢献度を分析
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new LRUCache<string, any>({
  max: 100,
  ttl: 5 * 60 * 1000,
})

interface AuthorData {
  slug: string
  name: string
  bio: string | null
  avatarUrl: string | null
  originalUrl: string | null
  createdAt: string
  updatedAt: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'

    const cacheKey = 'content-authors'
    if (!forceRefresh) {
      const cached = cache.get(cacheKey)
      if (cached) {
        return NextResponse.json({ ...cached as object, cached: true })
      }
    }

    const supabase = createAdminClient()

    // 著者データを取得
    const authorsResult = await supabase
      .from('lab_authors')
      .select('*')
      .order('name')

    const authors = authorsResult.data || []

    // 著者データを整形
    const authorData: AuthorData[] = authors.map(author => ({
      slug: author.slug,
      name: author.name,
      bio: author.bio,
      avatarUrl: author.avatar_url,
      originalUrl: author.original_url,
      createdAt: author.created_at,
      updatedAt: author.updated_at,
    }))

    // プロフィール完成度を計算
    const profileCompleteness = authorData.map(author => {
      let score = 0
      if (author.name) score += 25
      if (author.bio) score += 25
      if (author.avatarUrl) score += 25
      if (author.originalUrl) score += 25
      return {
        name: author.name,
        slug: author.slug,
        completeness: score,
      }
    })

    // 完成度が低い著者
    const incompleteProfiles = profileCompleteness
      .filter(p => p.completeness < 100)
      .sort((a, b) => a.completeness - b.completeness)

    // サマリー
    const summary = {
      totalAuthors: authors.length,
      authorsWithBio: authorData.filter(a => a.bio).length,
      authorsWithAvatar: authorData.filter(a => a.avatarUrl).length,
      authorsWithUrl: authorData.filter(a => a.originalUrl).length,
      avgProfileCompleteness: authors.length > 0
        ? Math.round(profileCompleteness.reduce((sum, p) => sum + p.completeness, 0) / authors.length)
        : 0,
      completeProfiles: profileCompleteness.filter(p => p.completeness === 100).length,
    }

    const responseData = {
      summary,
      authors: authorData,
      profileCompleteness,
      incompleteProfiles: incompleteProfiles.slice(0, 10),
    }

    cache.set(cacheKey, responseData)

    return NextResponse.json({ ...responseData, cached: false })
  } catch (error) {
    console.error('Content Authors API Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch content authors',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
