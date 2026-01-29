import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 全26種類のデータソースを取得（サマリー版）
async function fetchAllAnalyticsData() {
  // サーバー側なので内部URLを使用
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:3001')
  const data: Record<string, unknown> = {}

  const endpoints = [
    'ga', 'gsc', 'lab-metrics', 'events', 'lab-attribution', 'lab-conversion-paths',
    'page-performance', 'user-funnel', 'user-segments', 'realtime', 'content-groups',
    'engagement', 'trends', 'site-search', 'web-vitals', 'landing-pages', 'exit-pages',
    'campaigns', 'form-analysis', 'technical-issues', 'cohorts', 'tech-environment',
    'acquisition', 'experiments', 'benchmarks'
  ]

  await Promise.all(
    endpoints.map(async (endpoint) => {
      try {
        const response = await fetch(`${baseUrl}/api/analytics/${endpoint}`, {
          cache: 'no-store',
        })
        if (response.ok) {
          const result = await response.json()
          // data プロパティがあればそれを使用、なければ result 全体を使用
          const rawData = result.data || result
          
          // データを要約（AIのコンテキスト制限を考慮）
          data[endpoint] = summarizeData(endpoint, rawData)
        } else {
          data[endpoint] = { error: 'データ取得失敗' }
        }
      } catch (error) {
        data[endpoint] = { error: 'データ取得失敗' }
      }
    })
  )

  return data
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnalyticsData = Record<string, any>

// データを要約してコンテキストサイズを削減
function summarizeData(endpoint: string, rawData: unknown): Record<string, unknown> | { status: string } {
  if (!rawData) return { status: 'データなし' }

  const data = rawData as AnalyticsData

  // 各エンドポイントの重要な情報のみを抽出
  switch (endpoint) {
    case 'ga':
      return {
        summary: data.summary,
        topPages: data.pages?.slice(0, 5) || data.topPages?.slice(0, 5),
        channels: data.channels?.slice(0, 5),
        devices: data.devices,
      }
    
    case 'gsc':
      return {
        summary: data.summary,
        topQueries: data.queries?.slice(0, 5) || data.topQueries?.slice(0, 5),
        topPages: data.pages?.slice(0, 5) || data.topPages?.slice(0, 5),
      }
    
    case 'lab-metrics':
      return {
        currentMonth: data.currentMonth,
        summary: data.summary,
        trend: data.previousMonths?.slice(0, 3),
      }
    
    case 'site-search':
      return {
        overview: data.overview,
        topSearchTerms: data.topSearchTerms?.slice(0, 5),
        zeroResultSearches: data.zeroResultSearches?.slice(0, 3),
        insights: data.insights,
      }
    
    case 'landing-pages':
      return {
        overview: data.overview,
        topLandingPages: data.topLandingPages?.slice(0, 5),
        insights: data.insights,
      }
    
    case 'exit-pages':
      return {
        overview: data.overview,
        topExitPages: data.topExitPages?.slice(0, 5),
        insights: data.insights,
      }
    
    case 'campaigns':
      return {
        overview: data.overview,
        campaigns: data.campaigns?.slice(0, 5),
        insights: data.insights,
      }
    
    case 'benchmarks':
      return {
        yourSite: data.yourSite,
        industryAverage: data.industryAverage,
        comparison: data.comparison,
        ranking: data.ranking,
        insights: data.insights,
      }
    
    case 'realtime':
      return {
        activeUsers: data.activeUsers,
        activeUsersLastMinute: data.activeUsersLastMinute,
        topPages: data.topPages?.slice(0, 3),
        topDevices: data.topDevices,
      }
    
    // その他のエンドポイントは overview と insights のみ
    default:
      return {
        overview: data.overview,
        insights: data.insights,
        summary: data.summary,
      }
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // OpenAI APIキーの確認
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'OpenAI API key is not configured',
          message: 'OPENAI_API_KEYを.env.localに設定してください',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 全データを取得
    const analyticsData = await fetchAllAnalyticsData()

    // 動的にシステムプロンプトを生成（簡潔版）
    const systemPrompt = `あなたはPartnerProp（パートナーマーケティングPRMツール）のWebサイトアナリティクス専門AIアシスタントです。

## 利用可能なデータ（26種類）

**基本データ:**
- GA4: ${JSON.stringify(analyticsData.ga)}
- GSC: ${JSON.stringify(analyticsData.gsc)}
- パートナーラボ: ${JSON.stringify(analyticsData['lab-metrics'])}
- リアルタイム: ${JSON.stringify(analyticsData.realtime)}

**行動分析:**
- カスタムイベント: ${JSON.stringify(analyticsData.events)}
- サイト内検索: ${JSON.stringify(analyticsData['site-search'])}
- ユーザーフロー: ${JSON.stringify(analyticsData['user-funnel'])}
- エンゲージメント: ${JSON.stringify(analyticsData.engagement)}

**ページ分析:**
- ランディングページ: ${JSON.stringify(analyticsData['landing-pages'])}
- 離脱ページ: ${JSON.stringify(analyticsData['exit-pages'])}
- ページパフォーマンス: ${JSON.stringify(analyticsData['page-performance'])}
- Web Vitals: ${JSON.stringify(analyticsData['web-vitals'])}

**マーケティング:**
- UTMキャンペーン: ${JSON.stringify(analyticsData.campaigns)}
- ユーザー獲得: ${JSON.stringify(analyticsData.acquisition)}
- アトリビューション: ${JSON.stringify(analyticsData['lab-attribution'])}
- コンバージョンパス: ${JSON.stringify(analyticsData['lab-conversion-paths'])}

**セグメント:**
- ユーザーセグメント: ${JSON.stringify(analyticsData['user-segments'])}
- コンテンツグループ: ${JSON.stringify(analyticsData['content-groups'])}
- コホート: ${JSON.stringify(analyticsData.cohorts)}

**最適化:**
- フォーム分析: ${JSON.stringify(analyticsData['form-analysis'])}
- A/Bテスト: ${JSON.stringify(analyticsData.experiments)}
- 技術的問題: ${JSON.stringify(analyticsData['technical-issues'])}

**比較:**
- トレンド: ${JSON.stringify(analyticsData.trends)}
- ベンチマーク: ${JSON.stringify(analyticsData.benchmarks)}
- 技術環境: ${JSON.stringify(analyticsData['tech-environment'])}

## 回答スタイル
✅ 具体的な数値で回答
📊 複数データを横断分析
💡 実行可能な改善提案
🎯 簡潔で分かりやすく
⚠️ 問題点を明確に指摘`

    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages,
      maxOutputTokens: 2000,
      temperature: 0.7,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Chat API Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

