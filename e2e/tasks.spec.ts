import { test, expect } from '@playwright/test'

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tasks')
  })

  test('should create a new task', async ({ page }) => {
    // Click add task button
    await page.getByRole('button', { name: /새 작업 추가/i }).click()
    
    // Fill in task form
    await page.getByLabel(/제목/i).fill('E2E Test Task')
    await page.getByLabel(/설명/i).fill('This is an automated test task')
    await page.getByLabel(/우선순위/i).selectOption('high')
    await page.getByLabel(/카테고리/i).selectOption('업무')
    await page.getByLabel(/예상 시간/i).fill('30')
    
    // Submit form
    await page.getByRole('button', { name: /추가/i }).click()
    
    // Verify task appears in list
    const taskItem = page.locator('[data-testid="task-item"]').filter({ hasText: 'E2E Test Task' })
    await expect(taskItem).toBeVisible()
    await expect(taskItem).toContainText('높음')
    await expect(taskItem).toContainText('30분')
  })

  test('should edit an existing task', async ({ page }) => {
    // Create a task first
    await page.getByRole('button', { name: /새 작업 추가/i }).click()
    await page.getByLabel(/제목/i).fill('Task to Edit')
    await page.getByRole('button', { name: /추가/i }).click()
    
    // Find and edit the task
    const taskItem = page.locator('[data-testid="task-item"]').filter({ hasText: 'Task to Edit' })
    await taskItem.getByRole('button', { name: /편집/i }).click()
    
    // Update task details
    await page.getByLabel(/제목/i).clear()
    await page.getByLabel(/제목/i).fill('Updated Task Title')
    await page.getByLabel(/우선순위/i).selectOption('low')
    
    // Save changes
    await page.getByRole('button', { name: /저장/i }).click()
    
    // Verify changes
    const updatedTask = page.locator('[data-testid="task-item"]').filter({ hasText: 'Updated Task Title' })
    await expect(updatedTask).toBeVisible()
    await expect(updatedTask).toContainText('낮음')
  })

  test('should complete a task', async ({ page }) => {
    // Create a task
    await page.getByRole('button', { name: /새 작업 추가/i }).click()
    await page.getByLabel(/제목/i).fill('Task to Complete')
    await page.getByRole('button', { name: /추가/i }).click()
    
    // Mark task as complete
    const taskItem = page.locator('[data-testid="task-item"]').filter({ hasText: 'Task to Complete' })
    await taskItem.getByRole('checkbox').check()
    
    // Verify task is marked as complete
    await expect(taskItem).toHaveClass(/completed/)
    await expect(taskItem.locator('text=Task to Complete')).toHaveCSS('text-decoration', /line-through/)
  })

  test('should delete a task', async ({ page }) => {
    // Create a task
    await page.getByRole('button', { name: /새 작업 추가/i }).click()
    await page.getByLabel(/제목/i).fill('Task to Delete')
    await page.getByRole('button', { name: /추가/i }).click()
    
    // Delete the task
    const taskItem = page.locator('[data-testid="task-item"]').filter({ hasText: 'Task to Delete' })
    await taskItem.getByRole('button', { name: /삭제/i }).click()
    
    // Confirm deletion
    await page.getByRole('button', { name: /확인/i }).click()
    
    // Verify task is removed
    await expect(taskItem).not.toBeVisible()
  })

  test('should filter tasks by status', async ({ page }) => {
    // Create multiple tasks with different statuses
    // Create pending task
    await page.getByRole('button', { name: /새 작업 추가/i }).click()
    await page.getByLabel(/제목/i).fill('Pending Task')
    await page.getByRole('button', { name: /추가/i }).click()
    
    // Create and complete a task
    await page.getByRole('button', { name: /새 작업 추가/i }).click()
    await page.getByLabel(/제목/i).fill('Completed Task')
    await page.getByRole('button', { name: /추가/i }).click()
    const completedTask = page.locator('[data-testid="task-item"]').filter({ hasText: 'Completed Task' })
    await completedTask.getByRole('checkbox').check()
    
    // Filter by completed status
    await page.getByRole('tab', { name: /완료된 작업/i }).click()
    
    // Verify only completed tasks are shown
    await expect(page.locator('[data-testid="task-item"]').filter({ hasText: 'Completed Task' })).toBeVisible()
    await expect(page.locator('[data-testid="task-item"]').filter({ hasText: 'Pending Task' })).not.toBeVisible()
    
    // Filter by pending status
    await page.getByRole('tab', { name: /진행 중/i }).click()
    
    // Verify only pending tasks are shown
    await expect(page.locator('[data-testid="task-item"]').filter({ hasText: 'Pending Task' })).toBeVisible()
    await expect(page.locator('[data-testid="task-item"]').filter({ hasText: 'Completed Task' })).not.toBeVisible()
  })

  test('should search for tasks', async ({ page }) => {
    // Create multiple tasks
    await page.getByRole('button', { name: /새 작업 추가/i }).click()
    await page.getByLabel(/제목/i).fill('Important Meeting')
    await page.getByRole('button', { name: /추가/i }).click()
    
    await page.getByRole('button', { name: /새 작업 추가/i }).click()
    await page.getByLabel(/제목/i).fill('Regular Task')
    await page.getByRole('button', { name: /추가/i }).click()
    
    // Search for specific task
    await page.getByPlaceholder(/검색/i).fill('Meeting')
    
    // Verify search results
    await expect(page.locator('[data-testid="task-item"]').filter({ hasText: 'Important Meeting' })).toBeVisible()
    await expect(page.locator('[data-testid="task-item"]').filter({ hasText: 'Regular Task' })).not.toBeVisible()
    
    // Clear search
    await page.getByPlaceholder(/검색/i).clear()
    
    // Verify all tasks are shown again
    await expect(page.locator('[data-testid="task-item"]').filter({ hasText: 'Important Meeting' })).toBeVisible()
    await expect(page.locator('[data-testid="task-item"]').filter({ hasText: 'Regular Task' })).toBeVisible()
  })

  test('should perform bulk operations', async ({ page }) => {
    // Create multiple tasks
    for (let i = 1; i <= 3; i++) {
      await page.getByRole('button', { name: /새 작업 추가/i }).click()
      await page.getByLabel(/제목/i).fill(`Bulk Task ${i}`)
      await page.getByRole('button', { name: /추가/i }).click()
    }
    
    // Select all tasks
    await page.getByRole('checkbox', { name: /모두 선택/i }).check()
    
    // Verify selection count
    await expect(page.locator('text=/3개 선택됨/i')).toBeVisible()
    
    // Open bulk operations menu
    await page.getByRole('button', { name: /대량 작업/i }).click()
    
    // Mark all as complete
    await page.getByRole('menuitem', { name: /모두 완료/i }).click()
    
    // Verify all tasks are completed
    const tasks = page.locator('[data-testid="task-item"]')
    const count = await tasks.count()
    for (let i = 0; i < count; i++) {
      await expect(tasks.nth(i)).toHaveClass(/completed/)
    }
  })

  test('should handle task with subtasks', async ({ page }) => {
    // Create task with subtasks
    await page.getByRole('button', { name: /새 작업 추가/i }).click()
    await page.getByLabel(/제목/i).fill('Main Task with Subtasks')
    
    // Add subtasks
    await page.getByRole('button', { name: /하위 작업 추가/i }).click()
    await page.getByPlaceholder(/하위 작업 1/i).fill('Subtask 1')
    
    await page.getByRole('button', { name: /하위 작업 추가/i }).click()
    await page.getByPlaceholder(/하위 작업 2/i).fill('Subtask 2')
    
    // Submit
    await page.getByRole('button', { name: /추가/i }).click()
    
    // Expand task to see subtasks
    const taskItem = page.locator('[data-testid="task-item"]').filter({ hasText: 'Main Task with Subtasks' })
    await taskItem.getByRole('button', { name: /확장/i }).click()
    
    // Verify subtasks are visible
    await expect(taskItem.locator('text=Subtask 1')).toBeVisible()
    await expect(taskItem.locator('text=Subtask 2')).toBeVisible()
    
    // Complete a subtask
    await taskItem.locator('[data-testid="subtask-checkbox"]').first().check()
    
    // Verify progress update
    await expect(taskItem.locator('text=/1\/2 완료/i')).toBeVisible()
  })
})