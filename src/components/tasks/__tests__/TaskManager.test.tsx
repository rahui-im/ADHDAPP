import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../../tests/utils/test-utils'
import TaskManager from '../TaskManager'
import { createMockTask } from '../../../tests/utils/test-utils'

describe('TaskManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render task manager with tabs', () => {
    render(<TaskManager />)
    
    expect(screen.getByText('오늘 할 일')).toBeInTheDocument()
    expect(screen.getByText('모든 작업')).toBeInTheDocument()
    expect(screen.getByText('완료된 작업')).toBeInTheDocument()
  })

  it('should display empty state when no tasks', () => {
    render(<TaskManager />)
    
    expect(screen.getByText(/작업이 없습니다/i)).toBeInTheDocument()
  })

  it('should show add task button', () => {
    render(<TaskManager />)
    
    const addButton = screen.getByRole('button', { name: /새 작업/i })
    expect(addButton).toBeInTheDocument()
  })

  it('should switch between tabs', async () => {
    const user = userEvent.setup()
    render(<TaskManager />)
    
    const allTasksTab = screen.getByText('모든 작업')
    await user.click(allTasksTab)
    
    expect(allTasksTab).toHaveClass('text-primary-600')
  })

  it('should render tasks when provided', () => {
    const mockTask = createMockTask({ title: 'Test Task' })
    
    render(<TaskManager />, {
      initialState: {
        tasks: {
          items: [mockTask],
          filter: { status: null, category: null, priority: null },
          searchQuery: '',
          selectedTasks: [],
          loading: false,
          error: null
        }
      }
    })
    
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('should filter tasks by status', async () => {
    const user = userEvent.setup()
    const pendingTask = createMockTask({ title: 'Pending Task', status: 'pending' })
    const completedTask = createMockTask({ title: 'Completed Task', status: 'completed' })
    
    render(<TaskManager />, {
      initialState: {
        tasks: {
          items: [pendingTask, completedTask],
          filter: { status: null, category: null, priority: null },
          searchQuery: '',
          selectedTasks: [],
          loading: false,
          error: null
        }
      }
    })
    
    // Click on completed tasks tab
    const completedTab = screen.getByText('완료된 작업')
    await user.click(completedTab)
    
    // Should only show completed task
    expect(screen.queryByText('Pending Task')).not.toBeInTheDocument()
    expect(screen.getByText('Completed Task')).toBeInTheDocument()
  })

  it('should handle task search', async () => {
    const user = userEvent.setup()
    const task1 = createMockTask({ title: 'Important Task' })
    const task2 = createMockTask({ title: 'Regular Task' })
    
    render(<TaskManager />, {
      initialState: {
        tasks: {
          items: [task1, task2],
          filter: { status: null, category: null, priority: null },
          searchQuery: '',
          selectedTasks: [],
          loading: false,
          error: null
        }
      }
    })
    
    const searchInput = screen.getByPlaceholderText(/검색/i)
    await user.type(searchInput, 'Important')
    
    await waitFor(() => {
      expect(screen.getByText('Important Task')).toBeInTheDocument()
      expect(screen.queryByText('Regular Task')).not.toBeInTheDocument()
    })
  })

  it('should display loading state', () => {
    render(<TaskManager />, {
      initialState: {
        tasks: {
          items: [],
          filter: { status: null, category: null, priority: null },
          searchQuery: '',
          selectedTasks: [],
          loading: true,
          error: null
        }
      }
    })
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should display error state', () => {
    const errorMessage = 'Failed to load tasks'
    
    render(<TaskManager />, {
      initialState: {
        tasks: {
          items: [],
          filter: { status: null, category: null, priority: null },
          searchQuery: '',
          selectedTasks: [],
          loading: false,
          error: errorMessage
        }
      }
    })
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })
})