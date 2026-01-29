import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getGoogleCredentials, isGSCConfigured } from '@/lib/google-auth'

/**
 * GSCインデックス状況API
 *
 * クエリパラメータ:
 * - url: 検査するURL（必須）
 *
 * GET /api/analytics/gsc-index?url=https://example.com/page
 *
 * または
 *
 * POST /api/analytics/gsc-index
 * Body: { urls: ["https://example.com/page1", "https://example.com/page2"] }
 */

interface IndexStatus {
  url: string
  verdict: string
  coverageState: string
  robotsTxtState: string
  indexingState: string
  lastCrawlTime?: string
  pageFetchState: string
  googleCanonical?: string
  userCanonical?: string
  crawledAs?: string
  issues: string[]
}

// 単一URL検査
export async function GET(request: Request) {
  try {
    if (!isGSCConfigured()) {
      return NextResponse.json(
        {
          error: 'Google Search Console is not configured',
          message: 'Please set GOOGLE_SERVICE_ACCOUNT_JSON and GSC_SITE_URL',
          demo: true,
          data: generateDemoData(),
        },
        { status: 200 }
      )
    }

    const { searchParams } = new URL(request.url)
    const inspectionUrl = searchParams.get('url')

    if (!inspectionUrl) {
      return NextResponse.json(
        {
          error: 'Missing required parameter: url',
          message: 'Please specify a URL to inspect',
          example: '/api/analytics/gsc-index?url=https://partner-prop.com/lab',
        },
        { status: 400 }
      )
    }

    const credentials = getGoogleCredentials()
    const siteUrl = process.env.GSC_SITE_URL

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    })

    const searchconsole = google.searchconsole({ version: 'v1', auth })

    const response = await searchconsole.urlInspection.index.inspect({
      requestBody: {
        inspectionUrl,
        siteUrl,
      },
    })

    const result = response.data.inspectionResult
    const indexStatus: IndexStatus = {
      url: inspectionUrl,
      verdict: result?.indexStatusResult?.verdict || 'UNKNOWN',
      coverageState: result?.indexStatusResult?.coverageState || 'UNKNOWN',
      robotsTxtState: result?.indexStatusResult?.robotsTxtState || 'UNKNOWN',
      indexingState: result?.indexStatusResult?.indexingState || 'UNKNOWN',
      lastCrawlTime: result?.indexStatusResult?.lastCrawlTime || undefined,
      pageFetchState: result?.indexStatusResult?.pageFetchState || 'UNKNOWN',
      googleCanonical: result?.indexStatusResult?.googleCanonical || undefined,
      userCanonical: result?.indexStatusResult?.userCanonical || undefined,
      crawledAs: result?.indexStatusResult?.crawledAs || undefined,
      issues: extractIssues(result),
    }

    return NextResponse.json({
      data: indexStatus,
      interpretation: interpretStatus(indexStatus),
    })
  } catch (error) {
    console.error('GSC Index API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch index status',
        message: error instanceof Error ? error.message : 'Unknown error',
        demo: true,
        data: generateDemoData(),
      },
      { status: 200 }
    )
  }
}

// 複数URL一括検査
export async function POST(request: Request) {
  try {
    if (!isGSCConfigured()) {
      return NextResponse.json(
        {
          error: 'Google Search Console is not configured',
          demo: true,
          data: [generateDemoData()],
        },
        { status: 200 }
      )
    }

    const body = await request.json()
    const urls: string[] = body.urls || []

    if (urls.length === 0) {
      return NextResponse.json(
        {
          error: 'Missing required parameter: urls',
          message: 'Please provide an array of URLs to inspect',
          example: { urls: ['https://example.com/page1', 'https://example.com/page2'] },
        },
        { status: 400 }
      )
    }

    if (urls.length > 10) {
      return NextResponse.json(
        {
          error: 'Too many URLs',
          message: 'Maximum 10 URLs per request due to API rate limits',
        },
        { status: 400 }
      )
    }

    const credentials = getGoogleCredentials()
    const siteUrl = process.env.GSC_SITE_URL

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    })

    const searchconsole = google.searchconsole({ version: 'v1', auth })

    const results: IndexStatus[] = []

    // 順次実行（API制限を考慮）
    for (const inspectionUrl of urls) {
      try {
        const response = await searchconsole.urlInspection.index.inspect({
          requestBody: {
            inspectionUrl,
            siteUrl,
          },
        })

        const result = response.data.inspectionResult
        results.push({
          url: inspectionUrl,
          verdict: result?.indexStatusResult?.verdict || 'UNKNOWN',
          coverageState: result?.indexStatusResult?.coverageState || 'UNKNOWN',
          robotsTxtState: result?.indexStatusResult?.robotsTxtState || 'UNKNOWN',
          indexingState: result?.indexStatusResult?.indexingState || 'UNKNOWN',
          lastCrawlTime: result?.indexStatusResult?.lastCrawlTime || undefined,
          pageFetchState: result?.indexStatusResult?.pageFetchState || 'UNKNOWN',
          googleCanonical: result?.indexStatusResult?.googleCanonical || undefined,
          userCanonical: result?.indexStatusResult?.userCanonical || undefined,
          crawledAs: result?.indexStatusResult?.crawledAs || undefined,
          issues: extractIssues(result),
        })

        // API制限を考慮して少し待機
        await new Promise((resolve) => setTimeout(resolve, 200))
      } catch (err) {
        results.push({
          url: inspectionUrl,
          verdict: 'ERROR',
          coverageState: 'ERROR',
          robotsTxtState: 'UNKNOWN',
          indexingState: 'UNKNOWN',
          pageFetchState: 'UNKNOWN',
          issues: [err instanceof Error ? err.message : 'Unknown error'],
        })
      }
    }

    // サマリー生成
    const summary = {
      total: results.length,
      indexed: results.filter((r) => r.verdict === 'PASS').length,
      notIndexed: results.filter((r) => r.verdict === 'NEUTRAL' || r.verdict === 'FAIL').length,
      errors: results.filter((r) => r.verdict === 'ERROR').length,
    }

    return NextResponse.json({
      data: results,
      summary,
    })
  } catch (error) {
    console.error('GSC Index Batch API Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch index status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractIssues(result: any): string[] {
  const issues: string[] = []

  if (result?.indexStatusResult?.verdict === 'FAIL') {
    issues.push('ページがインデックスされていません')
  }

  if (result?.indexStatusResult?.robotsTxtState === 'DISALLOWED') {
    issues.push('robots.txtでブロックされています')
  }

  if (result?.indexStatusResult?.pageFetchState !== 'SUCCESSFUL') {
    issues.push(`ページ取得に問題: ${result?.indexStatusResult?.pageFetchState}`)
  }

  if (result?.mobileUsabilityResult?.verdict === 'FAIL') {
    issues.push('モバイルユーザビリティに問題があります')
  }

  return issues
}

function interpretStatus(status: IndexStatus): string {
  const verdictMap: Record<string, string> = {
    PASS: '✅ インデックス済み - 検索結果に表示されます',
    NEUTRAL: '⚠️ 検査中またはまだインデックスされていません',
    FAIL: '❌ インデックスされていません - 問題があります',
    UNKNOWN: '❓ 状態不明',
  }

  return verdictMap[status.verdict] || '❓ 状態不明'
}

function generateDemoData(): IndexStatus {
  return {
    url: 'https://partner-prop.com/lab',
    verdict: 'PASS',
    coverageState: 'Submitted and indexed',
    robotsTxtState: 'ALLOWED',
    indexingState: 'INDEXING_ALLOWED',
    lastCrawlTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    pageFetchState: 'SUCCESSFUL',
    googleCanonical: 'https://partner-prop.com/lab',
    crawledAs: 'DESKTOP',
    issues: [],
  }
}
