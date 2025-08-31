import { test, expect } from '@playwright/test'

test.describe('ADHD Task Manager App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display homepage with main navigation', async ({ page }) => {
    // Check main title
    await expect(page.locator('h1')).toContainText(/ADHD Task Manager/i)
    
    // Check navigation links
    await expect(page.getByRole('link', { name: /대시보드/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /작업/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /타이머/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /설정/i })).toBeVisible()
  })

  test('should navigate between pages', async ({ page }) => {
    // Navigate to Tasks
    await page.getByRole('link', { name: /작업/i }).click()
    await expect(page).toHaveURL(/.*\/tasks/)
    await expect(page.locator('h1')).toContainText(/작업 관리/i)
    
    // Navigate to Timer
    await page.getByRole('link', { name: /타이머/i }).click()
    await expect(page).toHaveURL(/.*\/timer/)
    await expect(page.locator('h1')).toContainText(/포모도로 타이머/i)
    
    // Navigate to Settings
    await page.getByRole('link', { name: /설정/i }).click()
    await expect(page).toHaveURL(/.*\/settings/)
    await expect(page.locator('h1')).toContainText(/설정/i)
    
    // Navigate back to Dashboard
    await page.getByRole('link', { name: /대시보드/i }).click()
    await expect(page).toHaveURL(/.*\/$/)
  })

  test('should toggle dark mode', async ({ page }) => {
    // Find and click dark mode toggle
    const darkModeToggle = page.getByRole('button', { name: /다크 모드/i })
    await darkModeToggle.click()
    
    // Check if dark mode class is applied
    await expect(page.locator('html')).toHaveClass(/dark/)
    
    // Toggle back to light mode
    await darkModeToggle.click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })

  test('should show focus mode toggle', async ({ page }) => {
    // Check focus mode toggle exists
    const focusModeToggle = page.getByRole('button', { name: /집중 모드/i })
    await expect(focusModeToggle).toBeVisible()
    
    // Enable focus mode
    await focusModeToggle.click()
    
    // Check focus mode indicator
    await expect(page.locator('[data-testid="focus-mode-indicator"]')).toBeVisible()
    
    // Disable focus mode
    await focusModeToggle.click()
    await expect(page.locator('[data-testid="focus-mode-indicator"]')).not.toBeVisible()
  })
})