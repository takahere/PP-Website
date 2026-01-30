import { test as base, Page } from '@playwright/test'

/**
 * テスト用の認証情報
 * 環境変数から取得、またはデフォルト値を使用
 */
export const testUser = {
  email: process.env.E2E_TEST_EMAIL || 'test@example.com',
  password: process.env.E2E_TEST_PASSWORD || 'testpassword123',
}

/**
 * 認証済みページを提供するフィクスチャ
 */
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    // ログインページへ移動
    await page.goto('/admin/login')

    // ログインフォームを待機
    await page.waitForSelector('input[type="email"]', { timeout: 10000 })

    // 認証情報を入力
    await page.fill('input[type="email"]', testUser.email)
    await page.fill('input[type="password"]', testUser.password)

    // ログインボタンをクリック
    await page.click('button[type="submit"]')

    // ダッシュボードへのリダイレクトを待機
    await page.waitForURL('**/admin/dashboard**', { timeout: 15000 })

    // 認証済みページを提供
    await use(page)
  },
})

export { expect } from '@playwright/test'

/**
 * 認証状態をストレージに保存
 */
export async function saveAuthState(page: Page, path: string): Promise<void> {
  await page.context().storageState({ path })
}

/**
 * ログアウト処理
 */
export async function logout(page: Page): Promise<void> {
  // ユーザーメニューを開く
  const userMenu = page.locator('[data-testid="user-menu"]')
  if (await userMenu.isVisible()) {
    await userMenu.click()
    await page.click('text=ログアウト')
    await page.waitForURL('**/login**')
  }
}
