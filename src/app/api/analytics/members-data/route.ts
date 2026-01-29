import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { LRUCache } from 'lru-cache'

/**
 * メンバーデータAPI
 *
 * pagesテーブルからtype='member'のデータを取得し、
 * メンバー情報と関連データを分析
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new LRUCache<string, any>({
  max: 100,
  ttl: 5 * 60 * 1000,
})

interface MemberData {
  slug: string
  name: string
  thumbnail: string | null
  seoDescription: string | null
  originalUrl: string | null
  publishedAt: string | null
  updatedAt: string
  // HTMLから抽出した情報
  hasInterviewLink: boolean
  hasSocialLinks: boolean
  socialLinks: {
    twitter?: string
    linkedin?: string
    facebook?: string
    other?: string[]
  }
  profileCompleteness: number
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'

    const cacheKey = 'members-data'
    if (!forceRefresh) {
      const cached = cache.get(cacheKey)
      if (cached) {
        return NextResponse.json({ ...cached as object, cached: true })
      }
    }

    const supabase = createAdminClient()

    // メンバーページを取得
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('type', 'member')
      .order('title')

    if (error) {
      throw error
    }

    const members = data || []

    // メンバーデータを整形・分析
    const memberData: MemberData[] = members.map(member => {
      const { socialLinks, hasInterviewLink } = extractLinksFromHtml(member.content_html || '')

      // プロフィール完成度を計算
      let completeness = 0
      if (member.title) completeness += 20
      if (member.thumbnail) completeness += 20
      if (member.seo_description) completeness += 20
      if (member.content_html && member.content_html.length > 100) completeness += 20
      if (Object.keys(socialLinks).length > 0 || hasInterviewLink) completeness += 20

      return {
        slug: member.slug,
        name: member.title,
        thumbnail: member.thumbnail,
        seoDescription: member.seo_description,
        originalUrl: member.original_url,
        publishedAt: member.published_at,
        updatedAt: member.updated_at,
        hasInterviewLink,
        hasSocialLinks: Object.keys(socialLinks).length > 0,
        socialLinks,
        profileCompleteness: completeness,
      }
    })

    // サマリー
    const summary = {
      totalMembers: memberData.length,
      membersWithThumbnail: memberData.filter(m => m.thumbnail).length,
      membersWithSeoDescription: memberData.filter(m => m.seoDescription).length,
      membersWithInterviewLink: memberData.filter(m => m.hasInterviewLink).length,
      membersWithSocialLinks: memberData.filter(m => m.hasSocialLinks).length,
      avgProfileCompleteness: memberData.length > 0
        ? Math.round(memberData.reduce((sum, m) => sum + m.profileCompleteness, 0) / memberData.length)
        : 0,
      completeProfiles: memberData.filter(m => m.profileCompleteness === 100).length,
    }

    // ソーシャルリンク統計
    const socialStats = {
      twitter: memberData.filter(m => m.socialLinks.twitter).length,
      linkedin: memberData.filter(m => m.socialLinks.linkedin).length,
      facebook: memberData.filter(m => m.socialLinks.facebook).length,
      other: memberData.filter(m => m.socialLinks.other && m.socialLinks.other.length > 0).length,
    }

    // プロフィール完成度が低いメンバー
    const incompleteProfiles = memberData
      .filter(m => m.profileCompleteness < 100)
      .sort((a, b) => a.profileCompleteness - b.profileCompleteness)
      .slice(0, 10)
      .map(m => ({
        name: m.name,
        slug: m.slug,
        completeness: m.profileCompleteness,
        missing: getMissingItems(m),
      }))

    const responseData = {
      summary,
      socialStats,
      members: memberData,
      incompleteProfiles,
    }

    cache.set(cacheKey, responseData)

    return NextResponse.json({ ...responseData, cached: false })
  } catch (error) {
    console.error('Members Data API Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch members data',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

/**
 * HTMLからソーシャルリンクとインタビューリンクを抽出
 */
function extractLinksFromHtml(html: string): {
  socialLinks: MemberData['socialLinks']
  hasInterviewLink: boolean
} {
  const socialLinks: MemberData['socialLinks'] = {}
  let hasInterviewLink = false

  if (!html) {
    return { socialLinks, hasInterviewLink }
  }

  // Twitter/X リンク
  const twitterMatch = html.match(/href=["'](https?:\/\/(twitter\.com|x\.com)\/[^"']+)["']/i)
  if (twitterMatch) {
    socialLinks.twitter = twitterMatch[1]
  }

  // LinkedIn リンク
  const linkedinMatch = html.match(/href=["'](https?:\/\/(www\.)?linkedin\.com\/[^"']+)["']/i)
  if (linkedinMatch) {
    socialLinks.linkedin = linkedinMatch[1]
  }

  // Facebook リンク
  const facebookMatch = html.match(/href=["'](https?:\/\/(www\.)?facebook\.com\/[^"']+)["']/i)
  if (facebookMatch) {
    socialLinks.facebook = facebookMatch[1]
  }

  // その他のソーシャルリンク（Instagram, GitHub等）
  const otherSocialPatterns = [
    /href=["'](https?:\/\/(www\.)?instagram\.com\/[^"']+)["']/i,
    /href=["'](https?:\/\/(www\.)?github\.com\/[^"']+)["']/i,
    /href=["'](https?:\/\/(www\.)?note\.com\/[^"']+)["']/i,
    /href=["'](https?:\/\/(www\.)?wantedly\.com\/[^"']+)["']/i,
  ]

  const otherLinks: string[] = []
  otherSocialPatterns.forEach(pattern => {
    const match = html.match(pattern)
    if (match) {
      otherLinks.push(match[1])
    }
  })

  if (otherLinks.length > 0) {
    socialLinks.other = otherLinks
  }

  // インタビューリンク（interview, 対談, インタビュー などを含むリンク）
  const interviewPattern = /href=["'][^"']*(?:interview|インタビュー|対談)[^"']*["']/i
  hasInterviewLink = interviewPattern.test(html)

  // または「インタビュー」というテキストを含むリンク
  if (!hasInterviewLink) {
    const linkTextPattern = /<a[^>]*>[^<]*(?:interview|インタビュー|対談)[^<]*<\/a>/i
    hasInterviewLink = linkTextPattern.test(html)
  }

  return { socialLinks, hasInterviewLink }
}

/**
 * 不足している項目を取得
 */
function getMissingItems(member: MemberData): string[] {
  const missing: string[] = []
  if (!member.name) missing.push('名前')
  if (!member.thumbnail) missing.push('サムネイル')
  if (!member.seoDescription) missing.push('SEO説明文')
  if (!member.hasSocialLinks && !member.hasInterviewLink) missing.push('SNS/インタビューリンク')
  return missing
}
