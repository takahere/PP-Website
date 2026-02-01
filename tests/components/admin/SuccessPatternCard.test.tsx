/**
 * SuccessPatternCard コンポーネントテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { SuccessPatternCard } from '@/components/admin/SuccessPatternCard'

// fetchをモック
global.fetch = vi.fn()

describe('SuccessPatternCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading state initially', () => {
    // fetchがpendingのままにする
    ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    )

    render(<SuccessPatternCard />)

    // ローディングアイコンを確認（Loader2コンポーネント）
    expect(document.querySelector('.animate-spin')).toBeTruthy()
  })

  it('should display data after loading', async () => {
    const mockData = {
      articles: [
        {
          slug: 'test-article',
          title: 'テスト記事',
          seoScore: 85,
          rank: 'S',
          metrics: { position: 3, ctr: 5, transitionRate: 4, engagementRate: 70 },
        },
      ],
      summary: {
        totalArticles: 1,
        rankDistribution: { S: 1, A: 0, B: 0, C: 0 },
        avgScore: 85,
      },
    }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    render(<SuccessPatternCard />)

    await waitFor(() => {
      // getAllByTextを使用して複数要素に対応
      const elements = screen.getAllByText('85')
      expect(elements.length).toBeGreaterThan(0)
    })
  })

  it('should display error message on fetch failure', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
    })

    render(<SuccessPatternCard />)

    await waitFor(() => {
      expect(screen.getByText('データの取得に失敗しました')).toBeTruthy()
    })
  })

  it('should pass category prop to API', async () => {
    const mockData = {
      articles: [],
      summary: {
        totalArticles: 0,
        rankDistribution: { S: 0, A: 0, B: 0, C: 0 },
        avgScore: 0,
      },
    }

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    render(<SuccessPatternCard category="partner-marketing" />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('category=partner-marketing')
      )
    })
  })
})
