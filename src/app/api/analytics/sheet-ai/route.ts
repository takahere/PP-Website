import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 現在の日付を取得して動的にデモデータを生成
function generateDemoData() {
  const today = new Date()
  const daily = []
  
  for (let i = 9; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    
    daily.push({
      date: dateStr,
      users: isWeekend ? Math.floor(80 + Math.random() * 40) : Math.floor(160 + Math.random() * 80),
      sessions: isWeekend ? Math.floor(100 + Math.random() * 50) : Math.floor(200 + Math.random() * 100),
      pageviews: isWeekend ? Math.floor(250 + Math.random() * 100) : Math.floor(450 + Math.random() * 300),
      bounceRate: Math.round((40 + Math.random() * 15) * 10) / 10,
      avgSessionDuration: Math.floor(90 + Math.random() * 80),
    })
  }
  
  return daily
}

// デモデータ（GA/GSC実データが取得できない場合に使用）
const demoGAData = {
  daily: generateDemoData(),
  pages: [
    { page: '/', pageviews: 2500, avgTime: 120, bounceRate: 35.2 },
    { page: '/lab', pageviews: 1800, avgTime: 180, bounceRate: 28.5 },
    { page: '/partner-marketing', pageviews: 1200, avgTime: 240, bounceRate: 22.1 },
    { page: '/casestudy/dinii', pageviews: 800, avgTime: 300, bounceRate: 18.5 },
    { page: '/seminar', pageviews: 600, avgTime: 90, bounceRate: 45.2 },
    { page: '/knowledge', pageviews: 450, avgTime: 150, bounceRate: 32.1 },
    { page: '/news', pageviews: 380, avgTime: 60, bounceRate: 55.3 },
  ],
  channels: [
    { channel: '自然検索', users: 1925, sessions: 2500, percentage: 50 },
    { channel: 'ダイレクト', users: 770, sessions: 1000, percentage: 20 },
    { channel: '参照元サイト', users: 578, sessions: 750, percentage: 15 },
    { channel: 'SNS', users: 385, sessions: 500, percentage: 10 },
    { channel: 'その他', users: 192, sessions: 250, percentage: 5 },
  ],
  devices: [
    { device: 'デスクトップ', users: 2310, sessions: 3000, percentage: 60 },
    { device: 'モバイル', users: 1348, sessions: 1750, percentage: 35 },
    { device: 'タブレット', users: 192, sessions: 250, percentage: 5 },
  ],
}

const demoGSCData = {
  queries: [
    { query: 'パートナーマーケティング', clicks: 52, impressions: 580, ctr: 8.9, position: 4.2 },
    { query: 'PRM ツール', clicks: 45, impressions: 420, ctr: 10.7, position: 6.1 },
    { query: 'パートナービジネス', clicks: 38, impressions: 390, ctr: 9.7, position: 8.3 },
    { query: 'アライアンス 営業', clicks: 32, impressions: 350, ctr: 9.1, position: 11.2 },
    { query: 'パートナープログラム 管理', clicks: 28, impressions: 310, ctr: 9.0, position: 9.8 },
    { query: '代理店 管理 システム', clicks: 25, impressions: 280, ctr: 8.9, position: 14.5 },
    { query: 'パートナーポータル', clicks: 22, impressions: 250, ctr: 8.8, position: 12.1 },
    { query: '間接販売 効率化', clicks: 18, impressions: 220, ctr: 8.2, position: 15.3 },
    { query: 'PRM とは', clicks: 15, impressions: 180, ctr: 8.3, position: 7.5 },
    { query: 'パートナー管理', clicks: 12, impressions: 150, ctr: 8.0, position: 10.2 },
  ],
  pages: [
    { page: '/partner-marketing', clicks: 120, impressions: 1200, ctr: 10.0, position: 5.2 },
    { page: '/lab/prm-guide', clicks: 85, impressions: 950, ctr: 8.9, position: 8.1 },
    { page: '/casestudy/freee', clicks: 65, impressions: 720, ctr: 9.0, position: 11.3 },
    { page: '/', clicks: 55, impressions: 600, ctr: 9.2, position: 15.2 },
    { page: '/lab', clicks: 48, impressions: 520, ctr: 9.2, position: 12.5 },
  ],
}

// パートナーラボのメトリクスデモデータ
const demoLabMetrics = {
  currentMonth: {
    month: '202601',
    users: 1024,
    pageviews: 3277,
    downloads: 95,
    formSubmissions: 14,
    cvr: 9.28,
  },
  previousMonths: [
    { month: '202512', users: 986, pageviews: 3155, downloads: 89, formSubmissions: 13, cvr: 9.03 },
    { month: '202511', users: 1052, pageviews: 3366, downloads: 102, formSubmissions: 15, cvr: 9.70 },
    { month: '202510', users: 924, pageviews: 2957, downloads: 78, formSubmissions: 11, cvr: 8.44 },
    { month: '202509', users: 1108, pageviews: 3546, downloads: 112, formSubmissions: 17, cvr: 10.11 },
    { month: '202508', users: 897, pageviews: 2870, downloads: 71, formSubmissions: 10, cvr: 7.92 },
  ],
  summary: {
    totalUsers: 5991,
    totalDownloads: 547,
    totalFormSubmissions: 80,
    avgCvr: 9.13,
  },
}

// データソースとエンドポイントのマッピング
const DATA_SOURCE_ENDPOINTS: Record<string, string> = {
  'ga': 'ga',
  'gsc': 'gsc',
  'lab-metrics': 'lab-metrics',
  'page-performance': 'page-performance',
  'landing-pages': 'landing-pages',
  'exit-pages': 'exit-pages',
  'site-search': 'site-search',
  'user-funnel': 'user-funnel',
  'user-segments': 'user-segments',
  'campaigns': 'campaigns',
  'realtime': 'realtime',
  'web-vitals': 'web-vitals',
  'form-analysis': 'form-analysis',
  'trends': 'trends',
  'engagement': 'engagement',
  'acquisition': 'acquisition',
  'tech-environment': 'tech-environment',
  'content-groups': 'content-groups',
  'lab-attribution': 'lab-attribution',
  'lab-conversion-paths': 'lab-conversion-paths',
  'cohorts': 'cohorts',
  'experiments': 'experiments',
  'benchmarks': 'benchmarks',
  'events': 'events',
  'technical-issues': 'technical-issues',
}

export async function POST(req: Request) {
  try {
    const { command, dataSources } = await req.json()

    if (!command) {
      return Response.json({ error: 'コマンドが指定されていません' }, { status: 400 })
    }

    // 指定されたデータソースがない場合はデフォルトで基本的なものを使用
    const requestedSources: string[] = dataSources && dataSources.length > 0
      ? dataSources
      : ['ga', 'gsc']  // デフォルトは最小限のデータソース

    // OpenAI APIキーの確認
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        {
          error: 'OpenAI API key is not configured',
          message: 'OPENAI_API_KEYを.env.localに設定してください',
        },
        { status: 500 }
      )
    }

    // 選択的にデータを取得（指定されたソースのみ）
    const actualData: Record<string, unknown> = {}
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    console.log(`[sheet-ai] Fetching ${requestedSources.length} data sources: ${requestedSources.join(', ')}`)

    // 並列で必要なデータのみ取得
    await Promise.all(
      requestedSources.map(async (source) => {
        const endpoint = DATA_SOURCE_ENDPOINTS[source]
        if (!endpoint) return

        try {
          const response = await fetch(`${baseUrl}/api/analytics/${endpoint}`, {
            cache: 'no-store',
          })
          if (response.ok) {
            const result = await response.json()
            // データの取得方法はエンドポイントによって異なる
            if (source === 'ga') {
              actualData.ga = result.demo ? demoGAData : {
                daily: result.data,
                summary: result.summary,
                channels: result.channels,
                devices: result.devices,
                userTypes: result.userTypes,
                pageEngagement: result.pageEngagement,
                categories: result.categories,
              }
            } else if (source === 'gsc') {
              actualData.gsc = result.demo ? demoGSCData : {
                queries: result.queries,
                pages: result.pages,
                summary: result.summary,
              }
            } else if (source === 'lab-metrics') {
              actualData.labMetrics = result.demo ? demoLabMetrics : result.data
            } else {
              // その他のエンドポイントは data プロパティを使用
              actualData[source] = result.data || result
            }
          }
        } catch (error) {
          console.error(`Failed to fetch ${source}:`, error)
        }
      })
    )

    // 動的にシステムプロンプトを構築（取得したデータのみ含める）
    const dataDescriptions: Record<string, { name: string; description: string }> = {
      'ga': { name: 'Google Analytics データ', description: '日別データ、チャネル、デバイス、ユーザータイプなど' },
      'gsc': { name: 'Search Console データ', description: '検索クエリ、ページ別クリック数、CTR、掲載順位' },
      'lab-metrics': { name: 'パートナーラボ 月次メトリクス', description: 'ユーザー数、PV、ダウンロード数、CVR' },
      'events': { name: 'カスタムイベントデータ', description: '資料ダウンロード、デモ申込、フォーム送信など' },
      'lab-attribution': { name: 'アトリビューション分析', description: 'パートナーラボの直接・間接コンバージョン貢献度' },
      'lab-conversion-paths': { name: 'コンバージョンパス分析', description: 'CVユーザーが読んだ記事、経路パターン' },
      'page-performance': { name: 'ページ別パフォーマンス', description: '滞在時間、直帰率、離脱率、スクロール率' },
      'user-funnel': { name: 'ユーザーファネル', description: 'コンバージョンファネル、動線パターン' },
      'user-segments': { name: 'ユーザーセグメント', description: '新規/リピーター、チャネル別、デバイス別、地域別' },
      'realtime': { name: 'リアルタイムデータ', description: '現在のアクティブユーザー、閲覧ページ' },
      'content-groups': { name: 'コンテンツグループ別', description: 'コンテンツタイプ別パフォーマンス' },
      'engagement': { name: 'エンゲージメント', description: 'セッション品質、スクロール深度、インタラクション' },
      'trends': { name: 'トレンド分析', description: '日別/週別/月別推移、成長トレンド、予測' },
      'site-search': { name: 'サイト内検索', description: '検索キーワード、ゼロ結果検索' },
      'web-vitals': { name: 'Core Web Vitals', description: 'LCP、FID、CLS等のパフォーマンス' },
      'landing-pages': { name: 'ランディングページ', description: '流入元、直帰率、CVR' },
      'exit-pages': { name: '離脱ページ', description: '離脱率が高いページ、離脱パターン' },
      'campaigns': { name: 'UTMキャンペーン', description: 'キャンペーン別パフォーマンス、ROI' },
      'form-analysis': { name: 'フォーム分析', description: '完了率、離脱フィールド' },
      'technical-issues': { name: '技術的問題', description: '404エラー、JSエラー' },
      'cohorts': { name: 'コホート分析', description: 'リテンション率、LTV' },
      'tech-environment': { name: '技術環境', description: 'ブラウザ、OS、画面サイズ' },
      'acquisition': { name: 'ユーザー獲得', description: 'チャネル別獲得、CPA' },
      'experiments': { name: 'A/Bテスト', description: '実験結果、アップリフト率' },
      'benchmarks': { name: 'ベンチマーク', description: '業界平均との比較' },
    }

    // 取得したデータソースに基づいて動的にプロンプトを構築
    let dataSection = '## 利用可能なデータ\n\n'
    let dataIndex = 1

    for (const source of requestedSources) {
      const desc = dataDescriptions[source]
      const dataKey = source === 'lab-metrics' ? 'labMetrics' : source
      const data = actualData[dataKey]

      if (data && desc) {
        dataSection += `### ${dataIndex}. ${desc.name}\n`
        dataSection += `${JSON.stringify(data, null, 2)}\n\n`
        dataSection += `**説明:** ${desc.description}\n\n`
        dataIndex++
      }
    }

    const dynamicSystemPrompt = `あなたはデータ分析の専門家です。ユーザーの指示に基づいて、提供されたデータを分析し、スプレッドシート形式のJSONデータを生成してください。

${dataSection}

## 出力形式
必ず以下のJSON形式のみで出力してください。説明文や装飾は一切不要です。

{
  "columns": ["A", "B", "C"],
  "rows": [
    {"A": "ヘッダー1", "B": "ヘッダー2", "C": "ヘッダー3"},
    {"A": "値1", "B": 100, "C": 50.5}
  ],
  "chart": {
    "type": "line",
    "dataKeys": ["B", "C"],
    "xAxisKey": "A",
    "title": "グラフタイトル"
  },
  "summary": "データの説明"
}

## ルール
1. columns: 列名の配列（A, B, C, D, E...）
2. rows: 各行のデータオブジェクトの配列。最初の行はヘッダー
3. chart: グラフ設定。type は "line", "bar", "pie", "area" のいずれか。不要な場合は null
4. summary: データの簡単な説明（1文）
5. 数値は数値型、テキストは文字列型で出力`

    // データが取得できているか確認
    const fetchedSourceCount = Object.keys(actualData).length
    console.log(`[sheet-ai] Fetched ${fetchedSourceCount} data sources`)

    if (fetchedSourceCount === 0) {
      // データが1つも取得できない場合はデモデータを使用
      actualData.ga = demoGAData
      actualData.gsc = demoGSCData
      console.log('[sheet-ai] Using demo data as fallback')
    }

    // AIでシートデータを生成（gpt-4o-miniはレート制限が緩い）
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: dynamicSystemPrompt,
      prompt: command,
      temperature: 0.3,
      maxOutputTokens: 2000,
    })

    // JSONをパース
    let jsonText = result.text.trim()
    console.log('[sheet-ai] Raw AI response:', jsonText.substring(0, 200))

    // マークダウンコードブロックを除去
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7)
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3)
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3)
    }
    jsonText = jsonText.trim()

    let data
    try {
      data = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('[sheet-ai] JSON parse error:', parseError)
      console.error('[sheet-ai] Raw text:', jsonText)
      throw new Error(`JSONパースエラー: ${parseError instanceof Error ? parseError.message : 'Unknown'}`)
    }

    return Response.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('[sheet-ai] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // エラータイプに応じたメッセージ
    let userMessage = 'シートデータの生成に失敗しました'
    if (errorMessage.includes('rate limit') || errorMessage.includes('Rate limit')) {
      userMessage = 'APIレート制限に達しました。しばらく待ってから再度お試しください。'
    } else if (errorMessage.includes('JSON')) {
      userMessage = 'AIからの応答をパースできませんでした。もう一度お試しください。'
    } else if (errorMessage.includes('API key')) {
      userMessage = 'OpenAI APIキーが設定されていません。'
    }

    return Response.json(
      {
        error: userMessage,
        message: errorMessage,
      },
      { status: 500 }
    )
  }
}
