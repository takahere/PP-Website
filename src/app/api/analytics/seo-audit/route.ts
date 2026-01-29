import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { LRUCache } from 'lru-cache'

/**
 * SEO監査API
 *
 * Supabaseのコンテンツを分析し、SEO観点での問題を検出
 * - SEO description設定率
 * - OG description設定率
 * - サムネイル設定率
 * - コンテンツ長さの分析
 * - 画像alt属性のチェック（content_html解析）
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new LRUCache<string, any>({
  max: 100,
  ttl: 10 * 60 * 1000,
})

interface SEOIssue {
  table: string
  slug: string
  title: string
  issues: string[]
  severity: 'critical' | 'warning' | 'info'
}

interface ContentSEOStatus {
  slug: string
  title: string
  hasSeoDescription: boolean
  hasOgDescription: boolean
  hasThumbnail: boolean
  contentLength: number
  imagesWithoutAlt: number
  totalImages: number
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'
    const table = searchParams.get('table') // pages, posts, lab_articles, or all

    const cacheKey = `seo-audit-${table || 'all'}`
    if (!forceRefresh) {
      const cached = cache.get(cacheKey)
      if (cached) {
        return NextResponse.json({ ...cached as object, cached: true })
      }
    }

    const supabase = createAdminClient()

    // コンテンツを取得
    const tablesToAudit = table ? [table] : ['pages', 'posts', 'lab_articles']
    const results: { table: string; data: ContentSEOStatus[]; issues: SEOIssue[] }[] = []

    for (const tableName of tablesToAudit) {
      const { data, error } = await supabase
        .from(tableName)
        .select('slug, title, seo_description, og_description, thumbnail, content_html')

      if (error) {
        console.error(`Error fetching ${tableName}:`, error)
        continue
      }

      const contents = data || []
      const contentStatuses: ContentSEOStatus[] = []
      const issues: SEOIssue[] = []

      contents.forEach(content => {
        // 画像解析
        const { imagesWithoutAlt, totalImages } = analyzeImages(content.content_html || '')

        const status: ContentSEOStatus = {
          slug: content.slug,
          title: content.title,
          hasSeoDescription: !!content.seo_description && content.seo_description.length >= 50,
          hasOgDescription: !!content.og_description && content.og_description.length >= 50,
          hasThumbnail: !!content.thumbnail,
          contentLength: (content.content_html || '').replace(/<[^>]*>/g, '').length,
          imagesWithoutAlt,
          totalImages,
        }

        contentStatuses.push(status)

        // 問題を検出
        const contentIssues: string[] = []

        if (!content.seo_description) {
          contentIssues.push('SEO descriptionが未設定')
        } else if (content.seo_description.length < 50) {
          contentIssues.push('SEO descriptionが短すぎる（50文字未満）')
        } else if (content.seo_description.length > 160) {
          contentIssues.push('SEO descriptionが長すぎる（160文字超）')
        }

        if (!content.og_description) {
          contentIssues.push('OG descriptionが未設定')
        }

        if (!content.thumbnail) {
          contentIssues.push('サムネイルが未設定')
        }

        if (status.contentLength < 300) {
          contentIssues.push('コンテンツが短すぎる（300文字未満）')
        }

        if (imagesWithoutAlt > 0) {
          contentIssues.push(`alt属性のない画像が${imagesWithoutAlt}件`)
        }

        if (contentIssues.length > 0) {
          // 重大度を判定
          let severity: 'critical' | 'warning' | 'info' = 'info'
          if (!content.seo_description || !content.thumbnail) {
            severity = 'critical'
          } else if (!content.og_description || imagesWithoutAlt > 0) {
            severity = 'warning'
          }

          issues.push({
            table: tableName,
            slug: content.slug,
            title: content.title,
            issues: contentIssues,
            severity,
          })
        }
      })

      results.push({
        table: tableName,
        data: contentStatuses,
        issues,
      })
    }

    // 全体サマリー
    const allContents = results.flatMap(r => r.data)
    const allIssues = results.flatMap(r => r.issues)

    const summary = {
      totalContent: allContents.length,
      withSeoDescription: allContents.filter(c => c.hasSeoDescription).length,
      withOgDescription: allContents.filter(c => c.hasOgDescription).length,
      withThumbnail: allContents.filter(c => c.hasThumbnail).length,
      seoDescriptionRate: allContents.length > 0
        ? Math.round(allContents.filter(c => c.hasSeoDescription).length / allContents.length * 100)
        : 0,
      ogDescriptionRate: allContents.length > 0
        ? Math.round(allContents.filter(c => c.hasOgDescription).length / allContents.length * 100)
        : 0,
      thumbnailRate: allContents.length > 0
        ? Math.round(allContents.filter(c => c.hasThumbnail).length / allContents.length * 100)
        : 0,
      totalIssues: allIssues.length,
      criticalIssues: allIssues.filter(i => i.severity === 'critical').length,
      warningIssues: allIssues.filter(i => i.severity === 'warning').length,
      infoIssues: allIssues.filter(i => i.severity === 'info').length,
      totalImages: allContents.reduce((sum, c) => sum + c.totalImages, 0),
      imagesWithoutAlt: allContents.reduce((sum, c) => sum + c.imagesWithoutAlt, 0),
      avgContentLength: allContents.length > 0
        ? Math.round(allContents.reduce((sum, c) => sum + c.contentLength, 0) / allContents.length)
        : 0,
    }

    // テーブル別サマリー
    const tableSummaries = results.map(r => ({
      table: r.table,
      total: r.data.length,
      seoDescriptionRate: r.data.length > 0
        ? Math.round(r.data.filter(c => c.hasSeoDescription).length / r.data.length * 100)
        : 0,
      ogDescriptionRate: r.data.length > 0
        ? Math.round(r.data.filter(c => c.hasOgDescription).length / r.data.length * 100)
        : 0,
      thumbnailRate: r.data.length > 0
        ? Math.round(r.data.filter(c => c.hasThumbnail).length / r.data.length * 100)
        : 0,
      issueCount: r.issues.length,
    }))

    // 重要度順にソートした問題リスト
    const sortedIssues = allIssues
      .sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 }
        return severityOrder[a.severity] - severityOrder[b.severity]
      })
      .slice(0, 50)

    const responseData = {
      summary,
      tableSummaries,
      issues: sortedIssues,
    }

    cache.set(cacheKey, responseData)

    return NextResponse.json({ ...responseData, cached: false })
  } catch (error) {
    console.error('SEO Audit API Error:', error)
    return NextResponse.json({
      error: 'Failed to perform SEO audit',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

/**
 * HTML内の画像を解析し、alt属性の有無をチェック
 */
function analyzeImages(html: string): { imagesWithoutAlt: number; totalImages: number } {
  if (!html) return { imagesWithoutAlt: 0, totalImages: 0 }

  // img タグを抽出
  const imgRegex = /<img[^>]*>/gi
  const images = html.match(imgRegex) || []

  let imagesWithoutAlt = 0

  images.forEach(img => {
    // alt属性があるかチェック
    const hasAlt = /alt\s*=\s*["'][^"']+["']/i.test(img)
    // alt="" の空のaltは問題なし（装飾画像）
    const hasEmptyAlt = /alt\s*=\s*["']["']/i.test(img)

    if (!hasAlt && !hasEmptyAlt) {
      imagesWithoutAlt++
    }
  })

  return {
    imagesWithoutAlt,
    totalImages: images.length,
  }
}
