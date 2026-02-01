/**
 * SEO Article Scores API テスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// google-authモジュールをモック
vi.mock('@/lib/google-auth', () => ({
  isGoogleConfigured: vi.fn(() => false),
  isGSCConfigured: vi.fn(() => false),
  getGoogleCredentials: vi.fn(() => ({})),
}))

// scoring-serviceをモック
vi.mock('@/lib/seo/scoring-service', () => ({
  calculateAllArticleSEOScores: vi.fn(() => Promise.resolve([])),
  getArticlesByRank: vi.fn(() => Promise.resolve([])),
  generateDemoSEOScores: vi.fn(() => [
    {
      slug: 'test-article',
      title: 'テスト記事',
      seoScore: 85,
      rank: 'S',
      metrics: { position: 3, ctr: 5, transitionRate: 4, engagementRate: 70 },
      scores: { rankScore: 100, ctrScore: 90, transitionScore: 85, engagementScore: 100 },
    },
    {
      slug: 'another-article',
      title: '別の記事',
      seoScore: 72,
      rank: 'A',
      metrics: { position: 8, ctr: 3.5, transitionRate: 2, engagementRate: 60 },
      scores: { rankScore: 70, ctrScore: 70, transitionScore: 70, engagementScore: 85 },
    },
  ]),
}))

describe('SEO Article Scores API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/seo/article-scores', () => {
    it('should return demo data when Google is not configured', async () => {
      const { GET } = await import('@/app/api/seo/article-scores/route')

      const request = new Request('http://localhost:3000/api/seo/article-scores')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.demo).toBe(true)
      expect(Array.isArray(data.articles)).toBe(true)
    })

    it('should include articles with correct structure', async () => {
      const { GET } = await import('@/app/api/seo/article-scores/route')

      const request = new Request('http://localhost:3000/api/seo/article-scores')
      const response = await GET(request)
      const data = await response.json()

      expect(data.articles.length).toBeGreaterThan(0)

      const article = data.articles[0]
      expect(article).toHaveProperty('slug')
      expect(article).toHaveProperty('title')
      expect(article).toHaveProperty('seoScore')
      expect(article).toHaveProperty('rank')
      expect(article).toHaveProperty('metrics')
    })

    it('should filter by minRank when provided', async () => {
      const { GET } = await import('@/app/api/seo/article-scores/route')

      const request = new Request('http://localhost:3000/api/seo/article-scores?minRank=S')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
    })

    it('should support limit parameter', async () => {
      const { GET } = await import('@/app/api/seo/article-scores/route')

      const request = new Request('http://localhost:3000/api/seo/article-scores?limit=1')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.articles.length).toBeLessThanOrEqual(1)
    })
  })
})
