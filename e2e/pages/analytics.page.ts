import { Page, Locator, expect } from '@playwright/test'

/**
 * アナリティクスダッシュボードのPage Object Model
 */
export class AnalyticsPage {
  readonly page: Page
  readonly tabList: Locator
  readonly overviewTab: Locator
  readonly labTab: Locator
  readonly seoTab: Locator
  readonly charts: Locator
  readonly metricCards: Locator
  readonly loadingIndicator: Locator
  readonly errorMessage: Locator
  readonly refreshButton: Locator
  readonly dateRangePicker: Locator

  constructor(page: Page) {
    this.page = page
    this.tabList = page.locator('[role="tablist"]')
    this.overviewTab = page.locator('[role="tab"]:has-text("概要"), [role="tab"]:has-text("Overview")')
    this.labTab = page.locator('[role="tab"]:has-text("Lab")')
    this.seoTab = page.locator('[role="tab"]:has-text("SEO")')
    this.charts = page.locator('.recharts-wrapper, [data-testid="chart"]')
    this.metricCards = page.locator('[data-testid="metric-card"], .metric-card')
    this.loadingIndicator = page.locator('[data-testid="loading"], .animate-spin')
    this.errorMessage = page.locator('[data-testid="error"], .text-red-500')
    this.refreshButton = page.locator('button:has-text("更新"), button:has-text("Refresh")')
    this.dateRangePicker = page.locator('[data-testid="date-range-picker"]')
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/analytics')
    await this.page.waitForLoadState('networkidle')
  }

  async isLoaded(): Promise<boolean> {
    try {
      await this.tabList.waitFor({ timeout: 10000 })
      return true
    } catch {
      return false
    }
  }

  async waitForDataLoad(): Promise<void> {
    // ローディングが終わるまで待機
    try {
      await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 30000 })
    } catch {
      // ローディングインジケーターがない場合はスキップ
    }
  }

  async switchToTab(tabName: 'overview' | 'lab' | 'seo'): Promise<void> {
    const tabMap = {
      overview: this.overviewTab,
      lab: this.labTab,
      seo: this.seoTab,
    }
    await tabMap[tabName].click()
    await this.waitForDataLoad()
  }

  async getActiveTabName(): Promise<string> {
    const activeTab = this.page.locator('[role="tab"][aria-selected="true"]')
    return await activeTab.innerText()
  }

  async getChartsCount(): Promise<number> {
    await this.waitForDataLoad()
    return await this.charts.count()
  }

  async getMetricCardsCount(): Promise<number> {
    return await this.metricCards.count()
  }

  async expectNoError(): Promise<void> {
    await expect(this.errorMessage).not.toBeVisible()
  }

  async expectChartsVisible(): Promise<void> {
    await this.waitForDataLoad()
    const count = await this.getChartsCount()
    expect(count).toBeGreaterThan(0)
  }

  async refresh(): Promise<void> {
    if (await this.refreshButton.isVisible()) {
      await this.refreshButton.click()
      await this.waitForDataLoad()
    }
  }
}
