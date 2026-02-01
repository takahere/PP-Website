/**
 * SEOスコアリング用の型定義
 */

// SEOランク判定
export type SEORank = 'S' | 'A' | 'B' | 'C'

// SEOスコアの重み付け
export interface SEOWeights {
  rank: number        // 検索順位の重み
  ctr: number         // CTRの重み
  transition: number  // Lab→サービス遷移率の重み
  engagement: number  // エンゲージメント率の重み
}

// デフォルトの重み付け
export const DEFAULT_SEO_WEIGHTS: SEOWeights = {
  rank: 0.30,
  ctr: 0.25,
  transition: 0.25,
  engagement: 0.20,
}

// 記事のSEOメトリクス
export interface ArticleSEOMetrics {
  slug: string
  title: string
  // GSCメトリクス
  position: number       // 平均検索順位
  impressions: number    // 表示回数
  clicks: number         // クリック数
  ctr: number           // CTR（%）
  // GA4メトリクス
  sessions: number       // セッション数
  transitionRate: number // Lab→サービス遷移率（%）
  engagementRate: number // エンゲージメント率（%）
  avgSessionDuration: number // 平均セッション時間（秒）
  bounceRate: number     // 直帰率（%）
}

// SEOスコア結果
export interface ArticleSEOScore {
  slug: string
  title: string
  seoScore: number       // 総合SEOスコア（0-100）
  rank: SEORank          // S/A/B/Cランク
  metrics: {
    position: number
    ctr: number
    transitionRate: number
    engagementRate: number
  }
  scores: {
    rankScore: number       // 順位スコア
    ctrScore: number        // CTRスコア
    transitionScore: number // 遷移率スコア
    engagementScore: number // エンゲージメントスコア
  }
  category?: string
  tags?: string[]
  contentType?: string
}

// 成功記事フィルター
export interface SuccessArticleFilter {
  minRank?: SEORank        // 最低ランク（S, A, B, C）
  category?: string        // カテゴリでフィルタ
  contentType?: string     // コンテンツタイプでフィルタ
  limit?: number           // 取得件数上限
}

// 成功パターン
export interface SuccessPattern {
  // 構成パターン
  avgH2Count: number       // 平均H2数
  avgH3Count: number       // 平均H3数
  avgWordCount: number     // 平均文字数
  commonH2Patterns: string[] // よく使われるH2パターン
  // 文体特徴
  avgParagraphLength: number  // 平均段落長（文字）
  bulletPointRate: number     // 箇条書き使用率（%）
  avgSentenceLength: number   // 平均文長（文字）
  // サンプル記事
  sampleArticles: {
    slug: string
    title: string
    seoScore: number
    excerpt: string          // 冒頭100文字
  }[]
}

// 関連クエリ
export interface RelatedQuery {
  query: string
  impressions: number
  clicks: number
  ctr: number
  position: number
}

// GSCから取得したページデータ
export interface GSCPageData {
  page: string       // URL
  impressions: number
  clicks: number
  ctr: number
  position: number
}

// GA4から取得したページデータ
export interface GA4PageData {
  pagePath: string
  sessions: number
  transitionSessions: number
  transitionRate: number
  engagementRate: number
  avgSessionDuration: number
  bounceRate: number
}
