import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../tests/utils/test-utils'
import App from '../../App'

describe('Task Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should complete full task creation and management workflow', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Navigate to tasks page
    const tasksLink = screen.getByRole('link', { name: /작업/i })
    await user.click(tasksLink)
    
    // Click add task button
    const addButton = screen.getByRole('button', { name: /새 작업/i })
    await user.click(addButton)
    
    // Fill in task form
    const titleInput = screen.getByLabelText(/제목/i)
    await user.type(titleInput, 'Integration Test Task')
    
    const descriptionInput = screen.getByLabelText(/설명/i)
    await user.type(descriptionInput, 'This is a test task created in integration test')
    
    const prioritySelect = screen.getByLabelText(/우선순위/i)
    await user.selectOptions(prioritySelect, 'high')
    
    const estimatedTimeInput = screen.getByLabelText(/예상 시간/i)
    await user.clear(estimatedTimeInput)
    await user.type(estimatedTimeInput, '30')
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /추가/i })
    await user.click(submitButton)
    
    // Verify task appears in list
    await waitFor(() => {
      expect(screen.getByText('Integration Test Task')).toBeInTheDocument()
    })
    
    // Mark task as complete
    const taskCheckbox = screen.getByRole('checkbox', { name: /완료/i })
    await user.click(taskCheckbox)
    
    // Verify task is marked as complete
    await waitFor(() => {
      const completedTask = screen.getByText('Integration Test Task')
      expect(completedTask).toHaveClass('line-through')
    })
  })

  it('should handle task filtering and search', async () => {
    const user = userEvent.setup()
    
    // Create initial state with multiple tasks
    const initialState = {
      tasks: {
        items: [
          {
            id: '1',
            title: 'High Priority Task',
            priority: 'high',
            status: 'pending',
            estimatedDuration: 25,
            category: '업무',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            title: 'Low Priority Task',
            priority: 'low',
            status: 'pending',
            estimatedDuration: 15,
            category: '개인',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '3',
            title: 'Completed Task',
            priority: 'medium',
            status: 'completed',
            estimatedDuration: 20,
            category: '학습',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedAt: new Date().toISOString()
          }
        ],
        filter: { status: null, category: null, priority: null },
        searchQuery: '',
        selectedTasks: [],
        loading: false,
        error: null
      }
    }
    
    render(<App />, { initialState })
    
    // Navigate to tasks
    const tasksLink = screen.getByRole('link', { name: /작업/i })
    await user.click(tasksLink)
    
    // Filter by priority
    const priorityFilter = screen.getByLabelText(/우선순위 필터/i)
    await user.selectOptions(priorityFilter, 'high')
    
    await waitFor(() => {
      expect(screen.getByText('High Priority Task')).toBeInTheDocument()
      expect(screen.queryByText('Low Priority Task')).not.toBeInTheDocument()
    })
    
    // Clear filter
    await user.selectOptions(priorityFilter, '')
    
    // Search for task
    const searchInput = screen.getByPlaceholderText(/검색/i)
    await user.type(searchInput, 'Completed')
    
    await waitFor(() => {
      expect(screen.getByText('Completed Task')).toBeInTheDocument()
      expect(screen.queryByText('High Priority Task')).not.toBeInTheDocument()
    })
  })

  it('should integrate task with timer', async () => {
    const user = userEvent.setup()
    
    const initialState = {
      tasks: {
        items: [
          {
            id: 'timer-task',
            title: 'Task for Timer',
            priority: 'medium',
            status: 'pending',
            estimatedDuration: 25,
            category: '업무',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        filter: { status: null, category: null, priority: null },
        searchQuery: '',
        selectedTasks: [],
        loading: false,
        error: null
      }
    }
    
    render(<App />, { initialState })
    
    // Navigate to tasks
    const tasksLink = screen.getByRole('link', { name: /작업/i })
    await user.click(tasksLink)
    
    // Start timer for task
    const startTimerButton = screen.getByRole('button', { name: /타이머 시작/i })
    await user.click(startTimerButton)
    
    // Verify timer started
    await waitFor(() => {
      expect(screen.getByText(/25:00/)).toBeInTheDocument()
    })
    
    // Navigate to timer page
    const timerLink = screen.getByRole('link', { name: /타이머/i })
    await user.click(timerLink)
    
    // Verify task is linked to timer
    expect(screen.getByText('Task for Timer')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /일시정지/i })).toBeInTheDocument()
  })

  it('should handle bulk operations', async () => {
    const user = userEvent.setup()
    
    const initialState = {
      tasks: {
        items: [
          {
            id: '1',
            title: 'Task 1',
            status: 'pending',
            priority: 'medium',
            estimatedDuration: 25,
            category: '업무',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            title: 'Task 2',
            status: 'pending',
            priority: 'medium',
            estimatedDuration: 25,
            category: '업무',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '3',
            title: 'Task 3',
            status: 'pending',
            priority: 'medium',
            estimatedDuration: 25,
            category: '업무',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        filter: { status: null, category: null, priority: null },
        searchQuery: '',
        selectedTasks: [],
        loading: false,
        error: null
      }
    }
    
    render(<App />, { initialState })
    
    // Navigate to tasks
    const tasksLink = screen.getByRole('link', { name: /작업/i })
    await user.click(tasksLink)
    
    // Select multiple tasks
    const selectAllCheckbox = screen.getByRole('checkbox', { name: /모두 선택/i })
    await user.click(selectAllCheckbox)
    
    // Verify all tasks selected
    expect(screen.getByText(/3개 선택됨/i)).toBeInTheDocument()
    
    // Open bulk operations menu
    const bulkOperationsButton = screen.getByRole('button', { name: /대량 작업/i })
    await user.click(bulkOperationsButton)
    
    // Update priority for all
    const updatePriorityOption = screen.getByRole('menuitem', { name: /우선순위 변경/i })
    await user.click(updatePriorityOption)
    
    const highPriorityOption = screen.getByRole('option', { name: /높음/i })
    await user.click(highPriorityOption)
    
    // Verify all tasks updated
    await waitFor(() => {
      const highPriorityBadges = screen.getAllByText(/높음/i)
      expect(highPriorityBadges).toHaveLength(3)
    })
  })
})