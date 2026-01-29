import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getGoogleCredentials, isGSCConfigured } from '@/lib/google-auth'

/**
 * サイトマップ情報API
 *
 * 取得データ:
 * - 登録済みサイトマップ一覧
 * - 各サイトマップのインデックス状況
 * - エラー情報
 */

interface SitemapInfo {
  path: string
  lastSubmitted?: string
  lastDownloaded?: string
  isPending: boolean
  isSitemapsIndex: boolean
  warnings: number
  errors: number
  contents?: {
    type: string
    submitted: number
    indexed: number
  }[]
}

export async function GET() {
  try {
    if (!isGSCConfigured()) {
      return NextResponse.json({
        error: 'Google Search Console is not configured',
        demo: true,
        sitemaps: generateDemoData(),
      }, { status: 200 })
    }

    const credentials = getGoogleCredentials()
    const siteUrl = process.env.GSC_SITE_URL

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    })

    const searchconsole = google.searchconsole({ version: 'v1', auth })

    // サイトマップ一覧取得
    const response = await searchconsole.sitemaps.list({
      siteUrl,
    })

    const sitemaps: SitemapInfo[] = response.data.sitemap?.map((sitemap) => ({
      path: sitemap.path || '',
      lastSubmitted: sitemap.lastSubmitted || undefined,
      lastDownloaded: sitemap.lastDownloaded || undefined,
      isPending: sitemap.isPending || false,
      isSitemapsIndex: sitemap.isSitemapsIndex || false,
      warnings: sitemap.warnings ? Number(sitemap.warnings) : 0,
      errors: sitemap.errors ? Number(sitemap.errors) : 0,
      contents: sitemap.contents?.map((content) => ({
        type: content.type || '',
        submitted: Number(content.submitted) || 0,
        indexed: Number(content.indexed) || 0,
      })),
    })) || []

    // サマリー計算
    const summary = {
      totalSitemaps: sitemaps.length,
      totalSubmitted: sitemaps.reduce((sum, s) =>
        sum + (s.contents?.reduce((cs, c) => cs + c.submitted, 0) || 0), 0
      ),
      totalIndexed: sitemaps.reduce((sum, s) =>
        sum + (s.contents?.reduce((cs, c) => cs + c.indexed, 0) || 0), 0
      ),
      totalWarnings: sitemaps.reduce((sum, s) => sum + s.warnings, 0),
      totalErrors: sitemaps.reduce((sum, s) => sum + s.errors, 0),
    }

    return NextResponse.json({
      siteUrl,
      sitemaps,
      summary,
    })
  } catch (error) {
    console.error('Sitemaps API Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch sitemaps data',
      message: error instanceof Error ? error.message : 'Unknown error',
      demo: true,
      sitemaps: generateDemoData(),
    }, { status: 200 })
  }
}

// サイトマップ送信
export async function POST(request: Request) {
  try {
    if (!isGSCConfigured()) {
      return NextResponse.json({
        error: 'Google Search Console is not configured',
      }, { status: 400 })
    }

    const body = await request.json()
    const feedpath = body.feedpath

    if (!feedpath) {
      return NextResponse.json({
        error: 'Missing required parameter: feedpath',
        example: { feedpath: 'https://example.com/sitemap.xml' },
      }, { status: 400 })
    }

    const credentials = getGoogleCredentials()
    const siteUrl = process.env.GSC_SITE_URL

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/webmasters'],
    })

    const searchconsole = google.searchconsole({ version: 'v1', auth })

    await searchconsole.sitemaps.submit({
      siteUrl,
      feedpath,
    })

    return NextResponse.json({
      success: true,
      message: `Sitemap submitted: ${feedpath}`,
    })
  } catch (error) {
    console.error('Sitemap Submit Error:', error)
    return NextResponse.json({
      error: 'Failed to submit sitemap',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

function generateDemoData(): SitemapInfo[] {
  return [
    {
      path: 'https://partner-prop.com/sitemap.xml',
      lastSubmitted: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastDownloaded: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      isPending: false,
      isSitemapsIndex: true,
      warnings: 0,
      errors: 0,
      contents: [
        { type: 'web', submitted: 245, indexed: 238 },
      ],
    },
    {
      path: 'https://partner-prop.com/sitemap-posts.xml',
      lastSubmitted: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastDownloaded: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isPending: false,
      isSitemapsIndex: false,
      warnings: 2,
      errors: 0,
      contents: [
        { type: 'web', submitted: 85, indexed: 82 },
      ],
    },
    {
      path: 'https://partner-prop.com/sitemap-lab.xml',
      lastSubmitted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      lastDownloaded: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      isPending: false,
      isSitemapsIndex: false,
      warnings: 0,
      errors: 0,
      contents: [
        { type: 'web', submitted: 120, indexed: 118 },
      ],
    },
  ]
}
