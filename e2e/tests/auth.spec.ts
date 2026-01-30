import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/login.page'
import { testUser } from '../fixtures/auth'

test.describe('Authentication', () => {
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    await loginPage.goto()
  })

  test('should display login page correctly', async () => {
    expect(await loginPage.isLoaded()).toBe(true)
    await expect(loginPage.emailInput).toBeVisible()
    await expect(loginPage.passwordInput).toBeVisible()
    await expect(loginPage.submitButton).toBeVisible()
  })

  test('should show error for invalid credentials', async () => {
    await loginPage.login('invalid@example.com', 'wrongpassword')
    await loginPage.expectErrorMessage()
  })

  test('should show error for empty email', async ({ page }) => {
    await loginPage.passwordInput.fill('somepassword')
    await loginPage.submitButton.click()

    // HTML5 validation or custom error
    const emailInput = loginPage.emailInput
    const isInvalid = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    )
    expect(isInvalid).toBe(true)
  })

  test('should show error for empty password', async ({ page }) => {
    await loginPage.emailInput.fill('test@example.com')
    await loginPage.submitButton.click()

    // HTML5 validation or custom error
    const passwordInput = loginPage.passwordInput
    const isInvalid = await passwordInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    )
    expect(isInvalid).toBe(true)
  })

  test.skip('should login successfully with valid credentials', async () => {
    // このテストは実際のテストアカウントが必要
    // E2E_TEST_EMAIL と E2E_TEST_PASSWORD 環境変数を設定して実行
    await loginPage.login(testUser.email, testUser.password)
    await loginPage.expectRedirectToDashboard()
  })

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/admin/dashboard')
    // 未認証の場合はログインページにリダイレクト
    await expect(page).toHaveURL(/.*login.*/)
  })
})

test.describe('Session Management', () => {
  test.skip('should maintain session across page refreshes', async ({ page }) => {
    // 認証済みセッションでテスト
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(testUser.email, testUser.password)
    await loginPage.expectRedirectToDashboard()

    // ページリフレッシュ
    await page.reload()

    // ダッシュボードに留まることを確認
    await expect(page).toHaveURL(/.*dashboard.*/)
  })

  test.skip('should clear session on logout', async ({ page }) => {
    // 認証済みセッションでテスト
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(testUser.email, testUser.password)
    await loginPage.expectRedirectToDashboard()

    // ログアウト
    await page.click('[data-testid="user-menu"]')
    await page.click('text=ログアウト')

    // ログインページにリダイレクト
    await expect(page).toHaveURL(/.*login.*/)

    // ダッシュボードにアクセスできないことを確認
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/.*login.*/)
  })
})
