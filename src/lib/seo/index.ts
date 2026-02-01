/**
 * SEOサービス統合エクスポート
 */

// Types
export * from './types'

// Scoring Service
export {
  calculateRankScore,
  calculateCtrScore,
  calculateTransitionScore,
  calculateEngagementScore,
  calculateSEOScore,
  determineRank,
  calculateAllArticleSEOScores,
  getArticlesByRank,
  generateDemoSEOScores,
} from './scoring-service'

// Success Article Service
export {
  getSuccessArticles,
  analyzeSuccessPatterns,
  getStyleSamples,
  getSEOScoreSummary,
} from './success-article-service'

// Pattern Extractor
export {
  extractOutlinePatterns,
  generateRecommendedOutline,
  type OutlinePattern,
} from './pattern-extractor'

// Style Analyzer
export {
  analyzeSuccessArticleStyles,
  generateStylePrompt,
  type StyleAnalysis,
} from './style-analyzer'

// Related Queries
export {
  getRelatedQueries,
  selectOptimalQueries,
  generateRelatedQueriesPrompt,
  getPopularQueriesByCategory,
} from './related-queries'
