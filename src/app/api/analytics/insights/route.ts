import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: Request) {
  try {
    const { gaData, gscData, gaSummary, gscSummary } = await request.json()

    // OpenAI APIキーがない場合はデモ応答
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        insights: generateDemoInsights(gaSummary, gscSummary),
        demo: true,
      })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const prompt = `あなたはWebマーケティングの専門家です。
以下のGoogle AnalyticsとSearch Consoleのデータを分析し、
日本語で簡潔かつ実用的なインサイトと改善提案を提供してください。

## Google Analytics サマリー（過去30日）
- 総ユーザー数: ${gaSummary?.totalUsers?.toLocaleString() || 'N/A'}
- 総セッション数: ${gaSummary?.totalSessions?.toLocaleString() || 'N/A'}
- 総ページビュー: ${gaSummary?.totalPageviews?.toLocaleString() || 'N/A'}
- 平均直帰率: ${gaSummary?.avgBounceRate || 'N/A'}%
- 平均セッション時間: ${gaSummary?.avgSessionDuration || 'N/A'}秒
- 前週比ユーザー増減: ${gaSummary?.usersTrend > 0 ? '+' : ''}${gaSummary?.usersTrend || 0}%

## Google Analytics 日別推移（直近7日）
${JSON.stringify(gaData?.slice(-7) || [], null, 2)}

## Search Console サマリー（過去28日）
- 総クリック数: ${gscSummary?.totalClicks?.toLocaleString() || 'N/A'}
- 総表示回数: ${gscSummary?.totalImpressions?.toLocaleString() || 'N/A'}
- 平均CTR: ${gscSummary?.avgCtr || 'N/A'}%
- 平均掲載順位: ${gscSummary?.avgPosition || 'N/A'}

## 検索クエリ Top10
${JSON.stringify(gscData?.queries?.slice(0, 10) || [], null, 2)}

## 回答形式（以下の構造で回答してください）
### 📊 主要な発見
（データから読み取れる重要なトレンドや特徴を2-3点）

### ⚠️ 注目すべき課題
（改善が必要な点を2-3点、具体的な数値を引用）

### 🚀 アクション提案
（具体的で実行可能な施策を3つ、優先度順に）

### 💡 追加の推奨事項
（中長期的な観点からの提案を1-2点）`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.7,
    })

    return NextResponse.json({
      insights: completion.choices[0].message.content,
      demo: false,
      model: 'gpt-4.1',
    })
  } catch (error) {
    console.error('AI Insights Error:', error)

    // エラー時はデモ応答を返す
    return NextResponse.json({
      insights: generateDemoInsights(null, null),
      demo: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

function generateDemoInsights(
  gaSummary: { totalUsers?: number; usersTrend?: number } | null,
  gscSummary: { avgCtr?: number; avgPosition?: number } | null
): string {
  const users = gaSummary?.totalUsers || 3850
  const trend = gaSummary?.usersTrend || 12
  const ctr = gscSummary?.avgCtr || 9.27
  const position = gscSummary?.avgPosition || 12.4

  return `### 📊 主要な発見

1. **トラフィックは堅調に推移** - 過去30日で${users.toLocaleString()}ユーザーを獲得し、前週比${trend > 0 ? '+' : ''}${trend}%と成長傾向にあります。

2. **検索流入が安定** - 平均CTR ${ctr}%は業界平均（約3-5%）を上回っており、タイトル・メタディスクリプションの最適化が効いています。

3. **「パートナーマーケティング」関連キーワードが強い** - ブランドキーワードでの検索が多く、市場での認知度が高まっています。

### ⚠️ 注目すべき課題

1. **平均掲載順位${position}位は改善余地あり** - Top10入りすることでCTRが大幅に向上する可能性があります。

2. **週末のトラフィック減少** - B2Bサイトの特性上想定内ですが、コンテンツマーケティングで非営業時間のリード獲得を検討できます。

3. **一部の高インプレッションキーワードでCTRが低い** - タイトルの訴求力強化が必要です。

### 🚀 アクション提案

1. **【優先度：高】検索順位10-20位のキーワードを特定し、該当ページのコンテンツを強化** - 内部リンクの追加、見出し構造の最適化、最新情報へのアップデートを実施

2. **【優先度：高】CTRが低いページのタイトル・メタディスクリプションをA/Bテスト** - 数値や具体的なベネフィットを含めた訴求に変更

3. **【優先度：中】導入事例ページの更新頻度を上げる** - 新規事例の追加でロングテールキーワードからの流入増加を狙う

### 💡 追加の推奨事項

- **FAQ構造化データの実装** - 検索結果でのリッチスニペット表示により、CTR向上が期待できます
- **パートナーマーケティング関連の用語集ページ作成** - 情報検索意図のユーザーを獲得し、ナーチャリングにつなげましょう

---
*⚠️ これはデモ分析です。実際のデータに基づく分析を行うには、OpenAI APIキーを設定してください。*`
}














