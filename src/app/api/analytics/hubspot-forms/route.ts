import { NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'

/**
 * HubSpot フォーム分析API
 *
 * HubSpot API v3を使用してフォームデータを取得
 * 必要: HUBSPOT_ACCESS_TOKEN 環境変数
 *
 * 取得データ:
 * - フォーム一覧
 * - 送信数
 * - フォーム詳細
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new LRUCache<string, any>({
  max: 100,
  ttl: 10 * 60 * 1000, // 10分キャッシュ
})

interface HubSpotForm {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  archived: boolean
  formType: string
  configuration?: {
    language: string
    cloneable: boolean
  }
}

interface FormSubmission {
  submittedAt: string
  values: Record<string, string>
  pageUrl?: string
}

function isHubSpotConfigured(): boolean {
  return !!process.env.HUBSPOT_ACCESS_TOKEN
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'
    const formId = searchParams.get('formId')

    if (!isHubSpotConfigured()) {
      return NextResponse.json({
        error: 'HubSpot is not configured',
        demo: true,
        ...generateDemoData(),
      }, { status: 200 })
    }

    const accessToken = process.env.HUBSPOT_ACCESS_TOKEN

    // 特定フォームの送信データを取得
    if (formId) {
      const cacheKey = `hubspot-form-submissions-${formId}`
      if (!forceRefresh) {
        const cached = cache.get(cacheKey)
        if (cached) {
          return NextResponse.json({ ...cached as object, cached: true })
        }
      }

      const submissionsResponse = await fetch(
        `https://api.hubapi.com/form-integrations/v1/submissions/forms/${formId}?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!submissionsResponse.ok) {
        throw new Error(`HubSpot API error: ${submissionsResponse.statusText}`)
      }

      const submissionsData = await submissionsResponse.json()

      const submissions: FormSubmission[] = submissionsData.results?.map((sub: {
        submittedAt: number
        values: Array<{ name: string; value: string }>
        pageUrl?: string
      }) => ({
        submittedAt: new Date(sub.submittedAt).toISOString(),
        values: sub.values.reduce((acc: Record<string, string>, v) => {
          acc[v.name] = v.value
          return acc
        }, {}),
        pageUrl: sub.pageUrl,
      })) || []

      const responseData = {
        formId,
        totalSubmissions: submissionsData.total || submissions.length,
        submissions,
      }

      cache.set(cacheKey, responseData)
      return NextResponse.json({ ...responseData, cached: false })
    }

    // フォーム一覧を取得
    const cacheKey = 'hubspot-forms-list'
    if (!forceRefresh) {
      const cached = cache.get(cacheKey)
      if (cached) {
        return NextResponse.json({ ...cached as object, cached: true })
      }
    }

    const formsResponse = await fetch(
      'https://api.hubapi.com/marketing/v3/forms?limit=100',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!formsResponse.ok) {
      throw new Error(`HubSpot API error: ${formsResponse.statusText}`)
    }

    const formsData = await formsResponse.json()

    const forms: HubSpotForm[] = formsData.results?.map((form: {
      id: string
      name: string
      createdAt: string
      updatedAt: string
      archived: boolean
      formType: string
      configuration?: {
        language: string
        cloneable: boolean
      }
    }) => ({
      id: form.id,
      name: form.name,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      archived: form.archived,
      formType: form.formType,
      configuration: form.configuration,
    })) || []

    // アクティブなフォームのみ
    const activeForms = forms.filter(f => !f.archived)

    // サマリー
    const summary = {
      totalForms: forms.length,
      activeForms: activeForms.length,
      archivedForms: forms.length - activeForms.length,
      formTypes: [...new Set(forms.map(f => f.formType))],
    }

    const responseData = {
      summary,
      forms: activeForms,
      note: '各フォームの送信数を取得するには ?formId=xxx を指定してください',
    }

    cache.set(cacheKey, responseData)

    return NextResponse.json({ ...responseData, cached: false })
  } catch (error) {
    console.error('HubSpot Forms API Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch HubSpot forms data',
      message: error instanceof Error ? error.message : 'Unknown error',
      demo: true,
      ...generateDemoData(),
    }, { status: 200 })
  }
}

function generateDemoData() {
  return {
    summary: {
      totalForms: 5,
      activeForms: 4,
      archivedForms: 1,
      formTypes: ['hubspot', 'flow'],
    },
    forms: [
      {
        id: 'demo-form-1',
        name: '資料ダウンロード',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-12-01T15:30:00Z',
        archived: false,
        formType: 'hubspot',
      },
      {
        id: 'demo-form-2',
        name: 'デモ申込',
        createdAt: '2024-03-20T09:00:00Z',
        updatedAt: '2024-11-25T11:00:00Z',
        archived: false,
        formType: 'hubspot',
      },
      {
        id: 'demo-form-3',
        name: 'お問い合わせ',
        createdAt: '2024-02-10T14:00:00Z',
        updatedAt: '2024-12-05T16:45:00Z',
        archived: false,
        formType: 'hubspot',
      },
      {
        id: 'demo-form-4',
        name: 'メルマガ登録',
        createdAt: '2024-04-01T08:00:00Z',
        updatedAt: '2024-10-15T12:00:00Z',
        archived: false,
        formType: 'flow',
      },
    ],
    note: 'これはデモデータです。HUBSPOT_ACCESS_TOKEN を設定すると実データが取得されます',
  }
}
