import { vi, beforeAll, afterAll, afterEach } from 'vitest'

// グローバルモック
beforeAll(() => {
  // 環境変数のモック
  vi.stubEnv('GOOGLE_SERVICE_ACCOUNT_JSON', JSON.stringify({
    type: 'service_account',
    project_id: 'test-project',
    private_key: 'test-key',
    client_email: 'test@test.iam.gserviceaccount.com',
  }))
  vi.stubEnv('GA4_PROPERTY_ID', '123456789')
  vi.stubEnv('GSC_SITE_URL', 'https://test-site.com/')
  vi.stubEnv('SLACK_WEBHOOK_URL', 'https://hooks.slack.com/services/TEST')
  vi.stubEnv('CRON_SECRET', 'test-secret')
})

afterEach(() => {
  vi.clearAllMocks()
})

afterAll(() => {
  vi.unstubAllEnvs()
})

// fetch モック
global.fetch = vi.fn()

// console.log/error をテスト中は抑制（必要に応じてコメントアウト）
// vi.spyOn(console, 'log').mockImplementation(() => {})
// vi.spyOn(console, 'error').mockImplementation(() => {})
