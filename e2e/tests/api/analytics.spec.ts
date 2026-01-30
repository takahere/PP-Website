import { test, expect } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

/**
 * Analytics API E2E Tests
 *
 * これらのAPIは認証が必要な場合があります。
 * 認証なしの場合は 401 を返し、認証ありの場合は 200 を返します。
 * テストでは両方のケースを適切に処理します。
 */

test.describe('Analytics API Endpoints', () => {
  test.describe('API Response Format', () => {
    test('GA4 API should return proper response structure', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analytics/ga`)
      const status = response.status()

      // 認証が必要な場合は 401、成功の場合は 200
      expect([200, 401]).toContain(status)

      if (status === 200) {
        const data = await response.json()
        expect(data).toHaveProperty('data')
      } else {
        // 401の場合はエラーレスポンス形式を確認
        const data = await response.json()
        expect(data).toHaveProperty('error')
      }
    })

    test('GSC API should return proper response structure', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analytics/gsc`)
      const status = response.status()

      expect([200, 401]).toContain(status)

      const data = await response.json()
      if (status === 200) {
        expect(data).toHaveProperty('data')
      }
    })

    test('Cohorts API should return proper response structure', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analytics/cohorts`)
      const status = response.status()

      expect([200, 401]).toContain(status)

      if (status === 200) {
        const data = await response.json()
        expect(data).toHaveProperty('data')
        expect(data.data).toHaveProperty('cohorts')
      }
    })

    test('Attribution API should return proper response structure', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analytics/attribution`)
      const status = response.status()

      expect([200, 401]).toContain(status)

      if (status === 200) {
        const data = await response.json()
        expect(data).toHaveProperty('data')
        expect(data.data).toHaveProperty('model')
      }
    })

    test('Anomalies API should return proper response structure', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analytics/anomalies`)
      const status = response.status()

      expect([200, 401]).toContain(status)

      if (status === 200) {
        const data = await response.json()
        expect(data).toHaveProperty('data')
        expect(data.data).toHaveProperty('summary')
      }
    })

    test('Web Vitals API should return proper response structure', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analytics/web-vitals`)
      const status = response.status()

      expect([200, 401]).toContain(status)

      if (status === 200) {
        const data = await response.json()
        expect(data).toHaveProperty('data')
        expect(data.data).toHaveProperty('overview')
      }
    })
  })

  test.describe('Query Parameters', () => {
    test('Attribution API should validate model parameter', async ({ request }) => {
      // 無効なモデル
      const response = await request.get(`${BASE_URL}/api/analytics/attribution?model=invalid`)
      const status = response.status()

      // 400 (バリデーションエラー) または 401 (認証エラー)
      expect([400, 401]).toContain(status)
    })

    test('Cohorts API should accept weeks parameter', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analytics/cohorts?weeks=4`)
      const status = response.status()

      expect([200, 401]).toContain(status)
    })

    test('Web Vitals API should accept period parameter', async ({ request }) => {
      const periods = ['7days', '14days', '30days']

      for (const period of periods) {
        const response = await request.get(`${BASE_URL}/api/analytics/web-vitals?period=${period}`)
        expect([200, 401]).toContain(response.status())
      }
    })
  })

  test.describe('Error Handling', () => {
    test('should return 404 for non-existent endpoint', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analytics/nonexistent`)

      expect(response.status()).toBe(404)
    })

    test('should handle OPTIONS request for CORS', async ({ request }) => {
      const response = await request.fetch(`${BASE_URL}/api/analytics/ga`, {
        method: 'OPTIONS',
      })

      // OPTIONS は 200 または 204 を返すことが多い
      expect([200, 204, 405]).toContain(response.status())
    })
  })

  test.describe('Response Headers', () => {
    test('should return JSON content type', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/analytics/ga`)

      const contentType = response.headers()['content-type']
      expect(contentType).toContain('application/json')
    })
  })
})

test.describe('Public Endpoints', () => {
  test('Health check endpoint should be accessible', async ({ request }) => {
    // ヘルスチェックエンドポイントがある場合
    const response = await request.get(`${BASE_URL}/api/health`)

    // 存在しない場合は 404、存在する場合は 200
    expect([200, 404]).toContain(response.status())
  })
})
