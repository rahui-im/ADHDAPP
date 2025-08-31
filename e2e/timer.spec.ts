import { test, expect } from '@playwright/test'

test.describe('Pomodoro Timer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/timer')
  })

  test('should display timer with default settings', async ({ page }) => {
    // Check timer display
    await expect(page.locator('[data-testid="timer-display"]')).toContainText('25:00')
    
    // Check timer controls
    await expect(page.getByRole('button', { name: /시작/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /리셋/i })).toBeVisible()
    
    // Check mode selector
    await expect(page.getByRole('button', { name: /집중/i })).toHaveClass(/active/)
  })

  test('should start and pause timer', async ({ page }) => {
    // Start timer
    await page.getByRole('button', { name: /시작/i }).click()
    
    // Verify timer is running
    await expect(page.getByRole('button', { name: /일시정지/i })).toBeVisible()
    
    // Wait a bit and check time decreased
    await page.waitForTimeout(2000)
    const timeText = await page.locator('[data-testid="timer-display"]').textContent()
    expect(timeText).not.toBe('25:00')
    
    // Pause timer
    await page.getByRole('button', { name: /일시정지/i }).click()
    
    // Verify timer is paused
    await expect(page.getByRole('button', { name: /재개/i })).toBeVisible()
    
    // Resume timer
    await page.getByRole('button', { name: /재개/i }).click()
    await expect(page.getByRole('button', { name: /일시정지/i })).toBeVisible()
  })

  test('should reset timer', async ({ page }) => {
    // Start timer
    await page.getByRole('button', { name: /시작/i }).click()
    
    // Wait for timer to count down
    await page.waitForTimeout(3000)
    
    // Reset timer
    await page.getByRole('button', { name: /리셋/i }).click()
    
    // Verify timer is reset
    await expect(page.locator('[data-testid="timer-display"]')).toContainText('25:00')
    await expect(page.getByRole('button', { name: /시작/i })).toBeVisible()
  })

  test('should switch between timer modes', async ({ page }) => {
    // Switch to short break
    await page.getByRole('button', { name: /짧은 휴식/i }).click()
    await expect(page.locator('[data-testid="timer-display"]')).toContainText('5:00')
    await expect(page.getByRole('button', { name: /짧은 휴식/i })).toHaveClass(/active/)
    
    // Switch to long break
    await page.getByRole('button', { name: /긴 휴식/i }).click()
    await expect(page.locator('[data-testid="timer-display"]')).toContainText('15:00')
    await expect(page.getByRole('button', { name: /긴 휴식/i })).toHaveClass(/active/)
    
    // Switch back to focus
    await page.getByRole('button', { name: /집중/i }).click()
    await expect(page.locator('[data-testid="timer-display"]')).toContainText('25:00')
    await expect(page.getByRole('button', { name: /집중/i })).toHaveClass(/active/)
  })

  test('should customize timer duration', async ({ page }) => {
    // Open timer settings
    await page.getByRole('button', { name: /설정/i }).click()
    
    // Change focus duration
    await page.getByLabel(/집중 시간/i).clear()
    await page.getByLabel(/집중 시간/i).fill('30')
    
    // Apply settings
    await page.getByRole('button', { name: /적용/i }).click()
    
    // Verify timer updated
    await expect(page.locator('[data-testid="timer-display"]')).toContainText('30:00')
  })

  test('should link timer to task', async ({ page }) => {
    // Navigate to tasks first
    await page.goto('/tasks')
    
    // Create a task
    await page.getByRole('button', { name: /새 작업 추가/i }).click()
    await page.getByLabel(/제목/i).fill('Timer Test Task')
    await page.getByLabel(/예상 시간/i).fill('25')
    await page.getByRole('button', { name: /추가/i }).click()
    
    // Start timer for the task
    const taskItem = page.locator('[data-testid="task-item"]').filter({ hasText: 'Timer Test Task' })
    await taskItem.getByRole('button', { name: /타이머 시작/i }).click()
    
    // Should navigate to timer page
    await expect(page).toHaveURL(/.*\/timer/)
    
    // Verify task is linked
    await expect(page.locator('[data-testid="linked-task"]')).toContainText('Timer Test Task')
    
    // Timer should be running
    await expect(page.getByRole('button', { name: /일시정지/i })).toBeVisible()
  })

  test('should show timer notification', async ({ page, context }) => {
    // Grant notification permission
    await context.grantPermissions(['notifications'])
    
    // Set short timer for testing
    await page.getByRole('button', { name: /설정/i }).click()
    await page.getByLabel(/집중 시간/i).clear()
    await page.getByLabel(/집중 시간/i).fill('0.1') // 6 seconds for testing
    await page.getByRole('button', { name: /적용/i }).click()
    
    // Start timer
    await page.getByRole('button', { name: /시작/i }).click()
    
    // Wait for timer to complete
    await page.waitForTimeout(7000)
    
    // Verify completion state
    await expect(page.locator('[data-testid="timer-complete-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="timer-complete-message"]')).toContainText(/완료/)
  })

  test('should track timer sessions', async ({ page }) => {
    // Complete a focus session
    await page.getByRole('button', { name: /설정/i }).click()
    await page.getByLabel(/집중 시간/i).clear()
    await page.getByLabel(/집중 시간/i).fill('0.1') // 6 seconds for testing
    await page.getByRole('button', { name: /적용/i }).click()
    
    await page.getByRole('button', { name: /시작/i }).click()
    await page.waitForTimeout(7000)
    
    // Check session count
    await expect(page.locator('[data-testid="session-count"]')).toContainText('1')
    
    // Start break
    await page.getByRole('button', { name: /짧은 휴식 시작/i }).click()
    
    // Verify break mode
    await expect(page.getByRole('button', { name: /짧은 휴식/i })).toHaveClass(/active/)
  })

  test('should handle auto-start settings', async ({ page }) => {
    // Open settings
    await page.getByRole('button', { name: /설정/i }).click()
    
    // Enable auto-start breaks
    await page.getByLabel(/자동으로 휴식 시작/i).check()
    
    // Set short timer for testing
    await page.getByLabel(/집중 시간/i).clear()
    await page.getByLabel(/집중 시간/i).fill('0.1')
    await page.getByRole('button', { name: /적용/i }).click()
    
    // Start and complete focus session
    await page.getByRole('button', { name: /시작/i }).click()
    await page.waitForTimeout(7000)
    
    // Break should start automatically
    await expect(page.getByRole('button', { name: /짧은 휴식/i })).toHaveClass(/active/)
    await expect(page.getByRole('button', { name: /일시정지/i })).toBeVisible()
  })

  test('should use timer templates', async ({ page }) => {
    // Open templates
    await page.getByRole('button', { name: /템플릿/i }).click()
    
    // Select Deep Work template
    await page.getByRole('button', { name: /Deep Work/i }).click()
    
    // Verify timer updated to Deep Work settings (45 minutes)
    await expect(page.locator('[data-testid="timer-display"]')).toContainText('45:00')
    
    // Select Quick Focus template
    await page.getByRole('button', { name: /템플릿/i }).click()
    await page.getByRole('button', { name: /Quick Focus/i }).click()
    
    // Verify timer updated to Quick Focus settings (15 minutes)
    await expect(page.locator('[data-testid="timer-display"]')).toContainText('15:00')
  })
})