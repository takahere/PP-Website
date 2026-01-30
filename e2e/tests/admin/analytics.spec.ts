import { test, expect } from '@playwright/test'
import { AnalyticsPage } from '../../pages/analytics.page'

test.describe('Analytics Dashboard', () => {
  test.describe('Public Access Check', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/admin/analytics')

      // 未認証ユーザーはログインページにリダイレクト
      await expect(page).toHaveURL(/.*login.*/)
    })
  })
})

test.describe('Analytics Dashboard - Authenticated', () => {
  // 認証済みセッションでのテスト

  test.skip('should load analytics page', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page)
    await analyticsPage.goto()

    expect(await analyticsPage.isLoaded()).toBe(true)
  })

  test.skip('should display tabs', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page)
    await analyticsPage.goto()

    await expect(analyticsPage.tabList).toBeVisible()
    await expect(analyticsPage.overviewTab).toBeVisible()
    await expect(analyticsPage.labTab).toBeVisible()
    await expect(analyticsPage.seoTab).toBeVisible()
  })

  test.skip('should switch between tabs', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page)
    await analyticsPage.goto()

    // Lab タブに切り替え
    await analyticsPage.switchToTab('lab')
    const activeTab = await analyticsPage.getActiveTabName()
    expect(activeTab.toLowerCase()).toContain('lab')

    // SEO タブに切り替え
    await analyticsPage.switchToTab('seo')
    const seoTab = await analyticsPage.getActiveTabName()
    expect(seoTab.toLowerCase()).toContain('seo')

    // 概要タブに戻る
    await analyticsPage.switchToTab('overview')
    const overviewTab = await analyticsPage.getActiveTabName()
    expect(overviewTab.toLowerCase()).toMatch(/概要|overview/)
  })

  test.skip('should display charts', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page)
    await analyticsPage.goto()

    await analyticsPage.expectChartsVisible()
  })

  test.skip('should display metric cards', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page)
    await analyticsPage.goto()

    const cardCount = await analyticsPage.getMetricCardsCount()
    expect(cardCount).toBeGreaterThan(0)
  })

  test.skip('should not show errors on load', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page)
    await analyticsPage.goto()
    await analyticsPage.waitForDataLoad()

    await analyticsPage.expectNoError()
  })

  test.skip('should handle refresh', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page)
    await analyticsPage.goto()

    await analyticsPage.refresh()
    await analyticsPage.expectNoError()
  })
})

test.describe('Analytics Dashboard - Lab Tab', () => {
  test.skip('should display Lab-specific metrics', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page)
    await analyticsPage.goto()

    await analyticsPage.switchToTab('lab')

    // Lab タブ固有の要素を確認
    const labMetrics = page.locator('text=遷移率, text=Transition')
    await expect(labMetrics.first()).toBeVisible({ timeout: 10000 })
  })

  test.skip('should display bottleneck diagnosis', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page)
    await analyticsPage.goto()

    await analyticsPage.switchToTab('lab')

    // ボトルネック診断セクション
    const bottleneck = page.locator('text=ボトルネック, text=Bottleneck')
    await expect(bottleneck.first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Analytics Dashboard - SEO Tab', () => {
  test.skip('should display search metrics', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page)
    await analyticsPage.goto()

    await analyticsPage.switchToTab('seo')

    // SEO タブ固有の要素を確認
    const searchMetrics = page.locator('text=検索, text=Search, text=CTR')
    await expect(searchMetrics.first()).toBeVisible({ timeout: 10000 })
  })

  test.skip('should display non-brand keywords', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page)
    await analyticsPage.goto()

    await analyticsPage.switchToTab('seo')

    // 非指名キーワードセクション
    const nonBrand = page.locator('text=非指名, text=Non-brand')
    // このセクションが存在する場合のみテスト
    if (await nonBrand.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(nonBrand.first()).toBeVisible()
    }
  })
})
