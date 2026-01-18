import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 利用可能なデータソース
const DATA_SOURCES = [
  'ga',           // GA4基本データ（PV、セッション、ユーザー数）
  'gsc',          // Google Search Console（検索クエリ、順位）
  'lab-metrics',  // パートナーラボメトリクス
  'page-performance', // ページ別パフォーマンス
  'landing-pages', // ランディングページ
  'exit-pages',   // 離脱ページ
  'site-search',  // サイト内検索
  'user-funnel',  // ユーザーファネル
  'user-segments', // ユーザーセグメント
  'campaigns',    // UTMキャンペーン
  'realtime',     // リアルタイムデータ
  'web-vitals',   // パフォーマンス指標
  'form-analysis', // フォーム分析
  'trends',       // トレンド比較
  'engagement',   // エンゲージメント
  'acquisition',  // ユーザー獲得
  'tech-environment', // デバイス・ブラウザ
  'content-groups', // コンテンツグループ
  'lab-attribution', // アトリビューション
  'lab-conversion-paths', // コンバージョンパス
  'cohorts',      // コホート分析
  'experiments',  // A/Bテスト
  'benchmarks',   // ベンチマーク
  'events',       // カスタムイベント
  'technical-issues', // 技術的問題
] as const

// 確認質問のスキーマ
const ClarifyingQuestionsSchema = z.object({
  needsClarification: z.boolean().describe('追加の確認が必要かどうか'),
  questions: z.array(
    z.object({
      id: z.string().describe('質問の一意なID'),
      question: z.string().describe('質問文'),
      options: z.array(
        z.object({
          label: z.string().describe('選択肢の表示テキスト'),
          value: z.string().describe('選択肢の値'),
        })
      ).describe('選択肢（2-4個）'),
      allowCustom: z.boolean().describe('「その他」で自由入力を許可するか'),
    })
  ).describe('確認質問のリスト（1-3個）'),
  readyToAnalyze: z.boolean().describe('分析実行可能な状態か'),
  analysisRequest: z.string().optional().describe('最終的な分析リクエスト文'),
  summary: z.string().optional().describe('確定した分析条件のサマリー'),
  dataSources: z.array(z.enum(DATA_SOURCES)).describe('この分析に必要なデータソース（1-5個に絞る）'),
})

export async function POST(req: Request) {
  try {
    const { request, answers = [] } = await req.json()

    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'OpenAI API key is not configured',
          message: 'OPENAI_API_KEYを.env.localに設定してください',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 既存の回答を整形
    const answeredContext = answers.length > 0
      ? `\n\n既に回答された内容:\n${answers.map((a: { questionId: string; answer: string }) => `- ${a.questionId}: ${a.answer}`).join('\n')}`
      : ''

    const systemPrompt = `あなたはPartnerPropのWebサイトアナリティクス専門AIアシスタントです。
ユーザーが分析したい内容を正確に理解するため、適切な確認質問を生成し、必要なデータソースを特定します。

## 利用可能なデータソース（重要: 必要なものだけを選択）
- ga: GA4基本データ（PV、セッション、ユーザー数、滞在時間、直帰率、チャネル）
- gsc: Google Search Console（検索クエリ、表示回数、クリック数、CTR、順位）
- lab-metrics: パートナーラボ記事のメトリクス（記事別PV、ダウンロード数）
- page-performance: ページ別パフォーマンス（滞在時間、直帰率）
- landing-pages: ランディングページ分析
- exit-pages: 離脱ページ分析
- site-search: サイト内検索データ
- user-funnel: ユーザーファネル・コンバージョン経路
- user-segments: ユーザーセグメント（新規/リピーター）
- campaigns: UTMキャンペーン・マーケティング分析
- realtime: リアルタイムデータ
- web-vitals: パフォーマンス指標（LCP、FID、CLS）
- form-analysis: フォーム分析
- trends: トレンド比較（前期比較）
- engagement: エンゲージメント指標
- acquisition: ユーザー獲得（流入元）
- tech-environment: デバイス・ブラウザ分析
- content-groups: コンテンツグループ別分析
- lab-attribution: パートナーラボのアトリビューション
- lab-conversion-paths: コンバージョンパス分析
- cohorts: コホート分析
- experiments: A/Bテスト結果
- benchmarks: 業界ベンチマーク比較
- events: カスタムイベント
- technical-issues: 技術的問題（404エラー等）

## データソース選択ルール（重要）
- **必ず1-5個に絞る** - 不要なデータは含めない
- PV・セッション関連 → ga
- 検索順位・キーワード → gsc
- ページ別分析 → page-performance または landing-pages
- 流入元分析 → acquisition または campaigns
- デバイス分析 → tech-environment
- パートナーラボ記事 → lab-metrics
- 複数データソースが必要な場合でも最大5個まで

## 確認すべき主な項目
1. **期間**: どの期間のデータを見たいか
2. **指標**: 何を知りたいか（PV、CV、直帰率、検索順位など）
3. **対象**: どのページ/コンテンツ/セグメントを対象とするか

## 回答生成ルール
- 質問は1-3個に絞る
- 各質問の選択肢は2-4個
- 十分な情報が集まったら readyToAnalyze: true を返す
- 具体的なリクエスト（例：「今月のPVを教えて」）は確認不要で readyToAnalyze: true
- dataSourcesは常に含める（needsClarification: true でも推測で設定）`

    const userPrompt = `ユーザーのリクエスト: "${request}"${answeredContext}

このリクエストを分析するために、追加で確認が必要な情報があれば質問を生成してください。
十分な情報があれば、readyToAnalyze: true として最終的な分析リクエスト文とサマリーを生成してください。`

    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: ClarifyingQuestionsSchema,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.5,
    })

    return new Response(JSON.stringify(result.object), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Clarify API Error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to generate clarifying questions',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
