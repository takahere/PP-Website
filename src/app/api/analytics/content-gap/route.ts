import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { LRUCache } from 'lru-cache'
import { getGoogleCredentials, isGSCConfigured } from '@/lib/google-auth'

// LRU キャッシュ設定（最大50エントリ、15分TTL）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new LRUCache<string, any>({
  max: 50,
  ttl: 15 * 60 * 1000, // 15分
})

interface KeywordOpportunity {
  keyword: string
  impressions: number
  clicks: number
  ctr: number
  position: number
  gapType: 'high_impression_low_ctr' | 'ranking_opportunity' | 'low_position'
  priority: 'high' | 'medium' | 'low'
}

interface ContentSuggestion {
  titleIdea: string
  targetKeywords: string[]
  estimatedTraffic: number
  priority: 'high' | 'medium' | 'low'
  rationale: string
}

interface TopicGap {
  topic: string
  relatedKeywords: string[]
  currentCoverage: 'none' | 'partial' | 'weak'
  suggestedAction: string
}

interface ContentGapResult {
  opportunityKeywords: KeywordOpportunity[]
  contentSuggestions: ContentSuggestion[]
  topicGaps: TopicGap[]
  summary: {
    totalOpportunities: number
    highPriorityCount: number
    estimatedTrafficGain: number
    topCategory: string
  }
}

// Supabaseクライアント
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '30')
    const forceRefresh = searchParams.get('refresh') === 'true'

    // キャッシュチェック
    const cacheKey = `content-gap-${limit}`
    if (!forceRefresh) {
      const cached = cache.get(cacheKey)
      if (cached) {
        return NextResponse.json({ data: cached, cached: true })
      }
    }

    // GSC設定チェック
    if (!isGSCConfigured()) {
      return NextResponse.json({
        error: 'Google Search Console is not configured',
        demo: true,
        data: generateDemoData(),
      })
    }

    const credentials = getGoogleCredentials()
    const siteUrl = process.env.GSC_SITE_URL

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    })

    const searchconsole = google.searchconsole({ version: 'v1', auth })

    // 過去28日のデータを取得
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 28)

    // 全クエリデータを取得（より多く）
    const queriesResponse = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: ['query'],
        rowLimit: 500,
      },
    })

    const allQueries = queriesResponse.data.rows?.map((row) => ({
      keyword: row.keys?.[0] || '',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    })) || []

    // 機会キーワードを特定
    const opportunityKeywords = identifyOpportunities(allQueries, limit)

    // 既存コンテンツのトピックを取得
    const supabase = getSupabaseClient()
    let existingTopics: string[] = []

    if (supabase) {
      const { data: articles } = await supabase
        .from('lab_articles')
        .select('title, categories, tags')
        .eq('is_published', true)
        .limit(100)

      if (articles) {
        existingTopics = articles.flatMap((a) => [
          ...(a.categories || []),
          ...(a.tags || []),
          a.title,
        ])
      }
    }

    // Claude APIでコンテンツ提案を生成
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    let contentSuggestions: ContentSuggestion[] = []
    let topicGaps: TopicGap[] = []

    if (anthropicKey) {
      const analysis = await analyzeWithClaude(
        opportunityKeywords,
        existingTopics,
        anthropicKey
      )
      contentSuggestions = analysis.contentSuggestions
      topicGaps = analysis.topicGaps
    } else {
      // Claude未設定時はルールベース
      const ruleBasedResult = ruleBasedAnalysis(opportunityKeywords, existingTopics)
      contentSuggestions = ruleBasedResult.contentSuggestions
      topicGaps = ruleBasedResult.topicGaps
    }

    // サマリー計算
    const highPriorityCount = opportunityKeywords.filter(k => k.priority === 'high').length
    const estimatedTrafficGain = opportunityKeywords
      .filter(k => k.priority === 'high')
      .reduce((sum, k) => sum + Math.round(k.impressions * 0.05), 0) // CTR 5%想定

    // カテゴリ集計
    const categoryCount = new Map<string, number>()
    opportunityKeywords.forEach(k => {
      const category = categorizeKeyword(k.keyword)
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1)
    })
    const topCategory = [...categoryCount.entries()]
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'その他'

    const result: ContentGapResult = {
      opportunityKeywords,
      contentSuggestions,
      topicGaps,
      summary: {
        totalOpportunities: opportunityKeywords.length,
        highPriorityCount,
        estimatedTrafficGain,
        topCategory,
      },
    }

    // キャッシュ更新
    cache.set(cacheKey, result)

    return NextResponse.json({ data: result, cached: false })
  } catch (error) {
    console.error('Content Gap API Error:', error)
    return NextResponse.json({
      error: 'Failed to analyze content gap',
      message: error instanceof Error ? error.message : 'Unknown error',
      demo: true,
      data: generateDemoData(),
    })
  }
}

// 機会キーワードを特定
function identifyOpportunities(
  queries: Array<{ keyword: string; clicks: number; impressions: number; ctr: number; position: number }>,
  limit: number
): KeywordOpportunity[] {
  const opportunities: KeywordOpportunity[] = []

  for (const q of queries) {
    let gapType: KeywordOpportunity['gapType'] | null = null
    let priority: KeywordOpportunity['priority'] = 'low'

    // 高インプレッション・低CTR（改善余地あり）
    if (q.impressions >= 100 && q.ctr < 0.02) {
      gapType = 'high_impression_low_ctr'
      if (q.impressions >= 500) priority = 'high'
      else if (q.impressions >= 200) priority = 'medium'
    }
    // ランキング機会（11-20位で改善可能）
    else if (q.position >= 11 && q.position <= 20 && q.impressions >= 50) {
      gapType = 'ranking_opportunity'
      if (q.impressions >= 200) priority = 'high'
      else if (q.impressions >= 100) priority = 'medium'
    }
    // 低順位だが検索されている
    else if (q.position > 20 && q.impressions >= 100) {
      gapType = 'low_position'
      if (q.impressions >= 300) priority = 'medium'
    }

    if (gapType) {
      opportunities.push({
        keyword: q.keyword,
        impressions: q.impressions,
        clicks: q.clicks,
        ctr: Math.round(q.ctr * 10000) / 100,
        position: Math.round(q.position * 10) / 10,
        gapType,
        priority,
      })
    }
  }

  // 優先度順にソート
  return opportunities
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      return b.impressions - a.impressions
    })
    .slice(0, limit)
}

// Claude APIで分析
async function analyzeWithClaude(
  opportunities: KeywordOpportunity[],
  existingTopics: string[],
  apiKey: string
): Promise<{ contentSuggestions: ContentSuggestion[]; topicGaps: TopicGap[] }> {
  const client = new Anthropic({ apiKey })

  const prompt = `あなたはSEOとコンテンツマーケティングの専門家です。以下のデータを分析して、コンテンツ戦略の提案をしてください。

## 機会キーワード（高インプレッションだがCTRや順位が低い）
${opportunities.slice(0, 20).map(o =>
  `- "${o.keyword}" (表示回数:${o.impressions}, CTR:${o.ctr}%, 順位:${o.position})`
).join('\n')}

## 既存コンテンツのトピック
${existingTopics.slice(0, 30).join(', ')}

以下のJSON形式で分析結果を返してください：
{
  "contentSuggestions": [
    {
      "titleIdea": "記事タイトル案",
      "targetKeywords": ["キーワード1", "キーワード2"],
      "estimatedTraffic": 予想月間PV数,
      "priority": "high|medium|low",
      "rationale": "なぜこのコンテンツが必要か"
    }
  ],
  "topicGaps": [
    {
      "topic": "不足しているトピック",
      "relatedKeywords": ["関連KW1", "関連KW2"],
      "currentCoverage": "none|partial|weak",
      "suggestedAction": "具体的なアクション"
    }
  ]
}

contentSuggestionsは3-5件、topicGapsは3-5件を出力してください。
JSONのみを返してください。`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    const result = JSON.parse(content.text)
    return {
      contentSuggestions: result.contentSuggestions || [],
      topicGaps: result.topicGaps || [],
    }
  } catch (error) {
    console.error('Claude analysis error:', error)
    return ruleBasedAnalysis(opportunities, existingTopics)
  }
}

// ルールベース分析（Claude未設定時のフォールバック）
function ruleBasedAnalysis(
  opportunities: KeywordOpportunity[],
  existingTopics: string[]
): { contentSuggestions: ContentSuggestion[]; topicGaps: TopicGap[] } {
  const contentSuggestions: ContentSuggestion[] = []
  const topicGaps: TopicGap[] = []

  // 高優先度キーワードからコンテンツ提案を生成
  const highPriority = opportunities.filter(o => o.priority === 'high').slice(0, 5)

  for (const opp of highPriority) {
    const category = categorizeKeyword(opp.keyword)
    const covered = existingTopics.some(t =>
      t.toLowerCase().includes(opp.keyword.toLowerCase()) ||
      opp.keyword.toLowerCase().includes(t.toLowerCase())
    )

    if (!covered) {
      contentSuggestions.push({
        titleIdea: `${opp.keyword}完全ガイド - 基礎から実践まで`,
        targetKeywords: [opp.keyword],
        estimatedTraffic: Math.round(opp.impressions * 0.05),
        priority: 'high',
        rationale: `月間${opp.impressions}回表示されるキーワードでコンテンツが不足`,
      })
    }

    if (!topicGaps.find(g => g.topic === category)) {
      topicGaps.push({
        topic: category,
        relatedKeywords: opportunities
          .filter(o => categorizeKeyword(o.keyword) === category)
          .slice(0, 5)
          .map(o => o.keyword),
        currentCoverage: covered ? 'partial' : 'none',
        suggestedAction: covered
          ? '既存コンテンツを最適化・拡充'
          : '新規コンテンツの作成を検討',
      })
    }
  }

  return { contentSuggestions: contentSuggestions.slice(0, 5), topicGaps: topicGaps.slice(0, 5) }
}

// キーワードをカテゴリ分類
function categorizeKeyword(keyword: string): string {
  const categories: Record<string, string[]> = {
    'PRM・パートナー管理': ['prm', 'パートナー管理', 'パートナープログラム', 'パートナーポータル'],
    'パートナーマーケティング': ['パートナーマーケティング', 'チャネルマーケティング', '代理店マーケティング'],
    'セールス・営業': ['セールス', '営業', '販売', 'チャネル'],
    'アライアンス': ['アライアンス', '提携', 'パートナーシップ'],
    'ツール・システム': ['ツール', 'システム', 'ソフトウェア', 'saas'],
  }

  const lowerKeyword = keyword.toLowerCase()
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(k => lowerKeyword.includes(k.toLowerCase()))) {
      return category
    }
  }
  return 'その他'
}

// デモデータ生成
function generateDemoData(): ContentGapResult {
  return {
    opportunityKeywords: [
      {
        keyword: 'パートナーマーケティング 戦略',
        impressions: 850,
        clicks: 12,
        ctr: 1.4,
        position: 15.2,
        gapType: 'ranking_opportunity',
        priority: 'high',
      },
      {
        keyword: 'PRM ツール 比較',
        impressions: 620,
        clicks: 8,
        ctr: 1.3,
        position: 18.5,
        gapType: 'ranking_opportunity',
        priority: 'high',
      },
      {
        keyword: '代理店 管理 システム',
        impressions: 480,
        clicks: 5,
        ctr: 1.0,
        position: 22.3,
        gapType: 'low_position',
        priority: 'medium',
      },
      {
        keyword: 'チャネルパートナー 育成',
        impressions: 320,
        clicks: 3,
        ctr: 0.9,
        position: 25.1,
        gapType: 'low_position',
        priority: 'medium',
      },
      {
        keyword: 'パートナービジネス 成功事例',
        impressions: 280,
        clicks: 4,
        ctr: 1.4,
        position: 19.8,
        gapType: 'ranking_opportunity',
        priority: 'medium',
      },
    ],
    contentSuggestions: [
      {
        titleIdea: 'パートナーマーケティング戦略完全ガイド【2024年最新版】',
        targetKeywords: ['パートナーマーケティング 戦略', 'パートナーマーケティング 成功'],
        estimatedTraffic: 450,
        priority: 'high',
        rationale: '高インプレッションながら自社コンテンツが弱い領域。競合記事を上回る包括的なガイドで上位獲得可能。',
      },
      {
        titleIdea: 'PRMツール10選比較｜選び方と導入ポイント',
        targetKeywords: ['PRM ツール 比較', 'PRM システム おすすめ'],
        estimatedTraffic: 320,
        priority: 'high',
        rationale: '検討段階のユーザーが検索するキーワード。比較記事でリード獲得につながりやすい。',
      },
      {
        titleIdea: 'チャネルパートナー育成プログラムの作り方',
        targetKeywords: ['チャネルパートナー 育成', 'パートナー教育'],
        estimatedTraffic: 180,
        priority: 'medium',
        rationale: '既存顧客の関心が高いトピック。深い専門性を示すコンテンツで差別化可能。',
      },
    ],
    topicGaps: [
      {
        topic: 'パートナープログラム設計',
        relatedKeywords: ['パートナープログラム 設計', 'パートナー報酬 設計', 'パートナー契約'],
        currentCoverage: 'none',
        suggestedAction: 'パートナープログラム設計に関する包括的なガイドコンテンツを作成',
      },
      {
        topic: 'PRM導入・活用',
        relatedKeywords: ['PRM 導入', 'PRM 活用', 'PRM ROI'],
        currentCoverage: 'partial',
        suggestedAction: '導入事例とROI分析を含む実践的なコンテンツで拡充',
      },
      {
        topic: 'パートナーイネーブルメント',
        relatedKeywords: ['パートナーイネーブルメント', 'パートナー支援', 'パートナートレーニング'],
        currentCoverage: 'weak',
        suggestedAction: 'イネーブルメントのベストプラクティスと事例紹介',
      },
    ],
    summary: {
      totalOpportunities: 5,
      highPriorityCount: 2,
      estimatedTrafficGain: 770,
      topCategory: 'パートナーマーケティング',
    },
  }
}
