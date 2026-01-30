import { Page, Locator, expect } from '@playwright/test'

/**
 * 管理ダッシュボードのPage Object Model
 */
export class DashboardPage {
  readonly page: Page
  readonly sidebar: Locator
  readonly header: Locator
  readonly mainContent: Locator
  readonly statsCards: Locator
  readonly recentActivity: Locator
  readonly userMenu: Locator

  constructor(page: Page) {
    this.page = page
    this.sidebar = page.locator('[data-testid="admin-sidebar"], aside')
    this.header = page.locator('[data-testid="admin-header"], header')
    this.mainContent = page.locator('main')
    this.statsCards = page.locator('[data-testid="stat-card"], .stat-card')
    this.recentActivity = page.locator('[data-testid="recent-activity"]')
    this.userMenu = page.locator('[data-testid="user-menu"]')
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/dashboard')
    await this.page.waitForLoadState('networkidle')
  }

  async isLoaded(): Promise<boolean> {
    try {
      await this.mainContent.waitFor({ timeout: 10000 })
      return true
    } catch {
      return false
    }
  }

  async navigateTo(menuItem: string): Promise<void> {
    const link = this.sidebar.locator(`a:has-text("${menuItem}")`)
    await link.click()
    await this.page.waitForLoadState('networkidle')
  }

  async getStatsCount(): Promise<number> {
    return await this.statsCards.count()
  }

  async expectSidebarVisible(): Promise<void> {
    await expect(this.sidebar).toBeVisible()
  }

  async expectHeaderVisible(): Promise<void> {
    await expect(this.header).toBeVisible()
  }

  async openUserMenu(): Promise<void> {
    await this.userMenu.click()
  }

  async logout(): Promise<void> {
    await this.openUserMenu()
    await this.page.click('text=ログアウト')
    await this.page.waitForURL('**/login**')
  }
}
