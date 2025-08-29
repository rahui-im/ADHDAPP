import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { TaskForm } from '../TaskForm'
import taskReducer from '../../../store/taskSlice'
import userReducer from '../../../store/userSlice'
import { CreateTaskRequest } from '../../../types'

const createTestStore = () => {
  return configureStore({
    reducer: {
      tasks: taskReducer,
      user: userReducer,
    },
    preloadedState: {
      user: {
        currentUser: {
          id: 'user-1',
          name: 'Test User',
          preferences: {
            defaultFocusDuration: 25,
            defaultBreakDuration: 10,
            preferredTaskCategories: ['업무', '개인', '학습'],
            energyTrackingEnabled: true,
            notificationsEnabled: true,
          },
          settings: {
            theme: 'light',
            language: 'ko',
            timezone: 'Asia/Seoul',
            focusMode: {
              hideNotifications: true,
              blockDistractions: false,
              showBreathingReminders: true,
              inactivityThreshold: 15,
            },
            timer: {
              focusDurations: [15, 25, 45],
              shortBreakDurations: [5, 10, 15],
              longBreakDuration: 25,
              cyclesBeforeLongBreak: 3,
            },
          },
          createdAt: new Date(),
          lastActiveAt: new Date(),
        },
        isAuthenticated: true,
        energyLevel: 'medium',
        focusMode: false,
        loading: false,
        error: null,
      },
      tasks: {
        tasks: [],
        currentTask: null,
        dailySchedule: null,
        goalAdjustment: null,
        loading: false,
        error: null,
      },
    },
  })
}

const renderWithStore = (component: React.ReactElement, store = createTestStore()) => {
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  )
}

describe('TaskForm', () => {
  const mockOnSubmit = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
  }

  it('should render empty form for new task', () => {
    renderWithStore(<TaskForm {...defaultProps} />)
    
    expect(screen.getByLabelText('작업 제목')).toHaveValue('')
    expect(screen.getByLabelText('설명')).toHaveValue('')
    expect(screen.getByLabelText('예상 시간 (분)')).toHaveValue(25)
    expect(screen.getByLabelText('우선순위')).toHaveValue('medium')
    expect(screen.getByLabelText('카테고리')).toHaveValue('업무')
  })

  it('should render form with initial values for editing', () => {
    const initialTask = {
      title: 'Existing Task',
      description: 'Task description',
      estimatedDuration: 45,
      priority: 'high' as const,
      category: '개인',
      isFlexible: false,
    }
    
    renderWithStore(<TaskForm {...defaultProps} initialValues={initialTask} />)
    
    expect(screen.getByLabelText('작업 제목')).toHaveValue('Existing Task')
    expect(screen.getByLabelText('설명')).toHaveValue('Task description')
    expect(screen.getByLabelText('예상 시간 (분)')).toHaveValue(45)
    expect(screen.getByLabelText('우선순위')).toHaveValue('high')
    expect(screen.getByLabelText('카테고리')).toHaveValue('개인')
    expect(screen.getByLabelText('유연한 일정')).not.toBeChecked()
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    renderWithStore(<TaskForm {...defaultProps} />)
    
    const submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)
    
    expect(screen.getByText('작업 제목을 입력해주세요')).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('should validate minimum duration', async () => {
    const user = userEvent.setup()
    renderWithStore(<TaskForm {...defaultProps} />)
    
    const titleInput = screen.getByLabelText('작업 제목')
    const durationInput = screen.getByLabelText('예상 시간 (분)')
    
    await user.type(titleInput, 'Test Task')
    await user.clear(durationInput)
    await user.type(durationInput, '0')
    
    const submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)
    
    expect(screen.getByText('최소 5분 이상이어야 합니다')).toBeInTheDocument()
  })

  it('should validate maximum duration', async () => {
    const user = userEvent.setup()
    renderWithStore(<TaskForm {...defaultProps} />)
    
    const titleInput = screen.getByLabelText('작업 제목')
    const durationInput = screen.getByLabelText('예상 시간 (분)')
    
    await user.type(titleInput, 'Test Task')
    await user.clear(durationInput)
    await user.type(durationInput, '500')
    
    const submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)
    
    expect(screen.getByText('최대 480분(8시간)까지 가능합니다')).toBeInTheDocument()
  })

  it('should submit valid form data', async () => {
    const user = userEvent.setup()
    renderWithStore(<TaskForm {...defaultProps} />)
    
    const titleInput = screen.getByLabelText('작업 제목')
    const descriptionInput = screen.getByLabelText('설명')
    const durationInput = screen.getByLabelText('예상 시간 (분)')
    const prioritySelect = screen.getByLabelText('우선순위')
    const categorySelect = screen.getByLabelText('카테고리')
    const flexibleCheckbox = screen.getByLabelText('유연한 일정')
    
    await user.type(titleInput, 'New Task')
    await user.type(descriptionInput, 'Task description')
    await user.clear(durationInput)
    await user.type(durationInput, '60')
    await user.selectOptions(prioritySelect, 'high')
    await user.selectOptions(categorySelect, '학습')
    await user.click(flexibleCheckbox)
    
    const submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      title: 'New Task',
      description: 'Task description',
      estimatedDuration: 60,
      priority: 'high',
      category: '학습',
      isFlexible: true,
    })
  })

  it('should show task splitting suggestion for long tasks', async () => {
    const user = userEvent.setup()
    renderWithStore(<TaskForm {...defaultProps} />)
    
    const titleInput = screen.getByLabelText('작업 제목')
    const durationInput = screen.getByLabelText('예상 시간 (분)')
    
    await user.type(titleInput, 'Long Task')
    await user.clear(durationInput)
    await user.type(durationInput, '90')
    
    // Blur to trigger validation
    await user.tab()
    
    expect(screen.getByText(/이 작업은 자동으로 작은 단위로 분할됩니다/)).toBeInTheDocument()
    expect(screen.getByText(/약 4개의 하위 작업/)).toBeInTheDocument()
  })

  it('should not show splitting suggestion for short tasks', async () => {
    const user = userEvent.setup()
    renderWithStore(<TaskForm {...defaultProps} />)
    
    const durationInput = screen.getByLabelText('예상 시간 (분)')
    
    await user.clear(durationInput)
    await user.type(durationInput, '20')
    await user.tab()
    
    expect(screen.queryByText(/자동으로 작은 단위로 분할/)).not.toBeInTheDocument()
  })

  it('should populate category dropdown with user preferences', () => {
    renderWithStore(<TaskForm {...defaultProps} />)
    
    const categorySelect = screen.getByLabelText('카테고리')
    const options = Array.from(categorySelect.querySelectorAll('option')).map(option => option.textContent)
    
    expect(options).toContain('업무')
    expect(options).toContain('개인')
    expect(options).toContain('학습')
  })

  it('should allow adding custom category', async () => {
    const user = userEvent.setup()
    renderWithStore(<TaskForm {...defaultProps} />)
    
    const categorySelect = screen.getByLabelText('카테고리')
    await user.selectOptions(categorySelect, '기타')
    
    const customCategoryInput = screen.getByLabelText('새 카테고리')
    await user.type(customCategoryInput, '운동')
    
    const titleInput = screen.getByLabelText('작업 제목')
    await user.type(titleInput, 'Exercise Task')
    
    const submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)
    
    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        category: '운동',
      })
    )
  })

  it('should handle cancel button', async () => {
    const user = userEvent.setup()
    renderWithStore(<TaskForm {...defaultProps} />)
    
    const cancelButton = screen.getByRole('button', { name: /취소/i })
    await user.click(cancelButton)
    
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should reset form when reset button is clicked', async () => {
    const user = userEvent.setup()
    renderWithStore(<TaskForm {...defaultProps} />)
    
    const titleInput = screen.getByLabelText('작업 제목')
    await user.type(titleInput, 'Test Task')
    
    const resetButton = screen.getByRole('button', { name: /초기화/i })
    await user.click(resetButton)
    
    expect(titleInput).toHaveValue('')
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    const store = createTestStore()
    
    // Mock a slow submission
    const slowOnSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)))
    
    renderWithStore(<TaskForm {...defaultProps} onSubmit={slowOnSubmit} />, store)
    
    const titleInput = screen.getByLabelText('작업 제목')
    await user.type(titleInput, 'Test Task')
    
    const submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)
    
    expect(screen.getByRole('button', { name: /저장 중.../i })).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('should be accessible', () => {
    renderWithStore(<TaskForm {...defaultProps} />)
    
    // All form fields should have proper labels
    expect(screen.getByLabelText('작업 제목')).toBeInTheDocument()
    expect(screen.getByLabelText('설명')).toBeInTheDocument()
    expect(screen.getByLabelText('예상 시간 (분)')).toBeInTheDocument()
    expect(screen.getByLabelText('우선순위')).toBeInTheDocument()
    expect(screen.getByLabelText('카테고리')).toBeInTheDocument()
    expect(screen.getByLabelText('유연한 일정')).toBeInTheDocument()
    
    // Form should have proper role
    const form = screen.getByRole('form')
    expect(form).toBeInTheDocument()
  })

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup()
    renderWithStore(<TaskForm {...defaultProps} />)
    
    const titleInput = screen.getByLabelText('작업 제목')
    titleInput.focus()
    
    // Tab through form fields
    await user.tab()
    expect(screen.getByLabelText('설명')).toHaveFocus()
    
    await user.tab()
    expect(screen.getByLabelText('예상 시간 (분)')).toHaveFocus()
    
    await user.tab()
    expect(screen.getByLabelText('우선순위')).toHaveFocus()
  })

  it('should show field help text', () => {
    renderWithStore(<TaskForm {...defaultProps} />)
    
    expect(screen.getByText('작업에 대한 간단한 설명을 입력하세요')).toBeInTheDocument()
    expect(screen.getByText('예상 소요 시간을 분 단위로 입력하세요')).toBeInTheDocument()
    expect(screen.getByText('체크하면 일정 조정 시 우선순위가 낮아집니다')).toBeInTheDocument()
  })

  it('should preserve form data on validation errors', async () => {
    const user = userEvent.setup()
    renderWithStore(<TaskForm {...defaultProps} />)
    
    const titleInput = screen.getByLabelText('작업 제목')
    const descriptionInput = screen.getByLabelText('설명')
    const durationInput = screen.getByLabelText('예상 시간 (분)')
    
    await user.type(descriptionInput, 'Some description')
    await user.clear(durationInput)
    await user.type(durationInput, '0') // Invalid duration
    
    const submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)
    
    // Form should show error but preserve other field values
    expect(screen.getByText('작업 제목을 입력해주세요')).toBeInTheDocument()
    expect(descriptionInput).toHaveValue('Some description')
  })
})