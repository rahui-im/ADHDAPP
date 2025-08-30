import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import App from '../../App'
import taskReducer from '../../store/taskSlice'
import timerReducer from '../../store/timerSlice'
import userReducer from '../../store/userSlice'
import analyticsReducer from '../../store/analyticsSlice'

// Mock services
jest.mock('../../services/schedulingService', () => ({
  schedulingService: {
    adjustPriorityOnPostpone: jest.fn(() => [
      {
        taskId: 'task-1',
        newPriority: 'high',
        newPosition: 0,
        reason: 'postponed',
      },
    ]),
    scheduleTasksByType: jest.fn((tasks) => tasks),
    recommendTasksByEnergy: jest.fn((tasks) => tasks),
  },
}))

jest.mock('../../services/goalAdjustmentService', () => ({
  goalAdjustmentService: {
    adjustGoalsForLowCompletion: jest.fn(() => ({
      type: 'reduce_tasks',
      suggestedTasks: [],
      message: '목표를 조정했습니다',
      confidence: 0.8,
    })),
    suggestRealisticGoals: jest.fn((tasks) => tasks.slice(0, 3)),
  },
}))

const createTestStore = () => {
  return configureStore({
    reducer: {
      tasks: taskReducer,
      timer: timerReducer,
      user: userReducer,
      analytics: analyticsReducer,
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
            theme: 'light' as const,
            language: 'ko' as const,
            timezone: 'Asia/Seoul',
            focusMode: {
              hideNotifications: true,
              blockDistractions: false,
              showBreathingReminders: true,
              inactivityThreshold: 15,
            },
            timer: {
              focusDurations: [15, 25, 45] as [number, number, number],
              shortBreakDurations: [5, 10, 15] as [number, number, number],
              longBreakDuration: 25 as 25,
              cyclesBeforeLongBreak: 3 as 3,
            },
          },
          createdAt: new Date(),
          lastActiveAt: new Date(),
        },
        isAuthenticated: true,
        energyLevel: 'medium' as const,
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
      timer: {
        mode: 'focus' as const,
        duration: 1500,
        remaining: 1500,
        isRunning: false,
        isPaused: false,
        currentCycle: 1,
        totalCycles: 0,
        currentTaskId: undefined,
        settings: {
          focusDurations: [15, 25, 45] as [15, 25, 45],
          shortBreakDurations: [5, 10, 15] as [5, 10, 15],
          longBreakDuration: 25 as 25,
          cyclesBeforeLongBreak: 3 as 3,
        },
        isInitialized: true,
      },
      analytics: {
        sessions: [],
        dailyStats: [],
        weeklyInsights: [],
        currentStreak: 0,
        longestStreak: 0,
        totalFocusTime: 0,
        totalCompletedTasks: 0,
        loading: false,
        error: null,
      },
    },
  })
}

describe('Task Management Integration', () => {
  let store: ReturnType<typeof createTestStore>
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    store = createTestStore()
    user = userEvent.setup()
    jest.clearAllMocks()
  })

  const renderApp = () => {
    return render(
      <Provider store={store}>
        <App />
      </Provider>
    )
  }

  it('should complete full task lifecycle from creation to completion', async () => {
    renderApp()

    // Step 1: Create a new task
    const newTaskButton = screen.getByRole('button', { name: /새 작업 추가/i })
    await user.click(newTaskButton)

    // Fill out task form
    const titleInput = screen.getByLabelText('작업 제목')
    await user.type(titleInput, 'Complete project documentation')

    const descriptionInput = screen.getByLabelText('설명')
    await user.type(descriptionInput, 'Write comprehensive documentation for the project')

    const durationInput = screen.getByLabelText('예상 시간 (분)')
    await user.clear(durationInput)
    await user.type(durationInput, '90')

    const prioritySelect = screen.getByLabelText('우선순위')
    await user.selectOptions(prioritySelect, 'high')

    const categorySelect = screen.getByLabelText('카테고리')
    await user.selectOptions(categorySelect, '업무')

    const submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)

    // Step 2: Verify task was created and auto-split
    await waitFor(() => {
      expect(screen.getByText('Complete project documentation')).toBeInTheDocument()
    })

    // Should show subtask splitting suggestion
    expect(screen.getByText(/약 4개의 하위 작업/)).toBeInTheDocument()

    // Step 3: Start working on the task
    const taskElement = screen.getByText('Complete project documentation')
    const taskContainer = taskElement.closest('[data-testid="task-item"]')
    const startButton = taskContainer?.querySelector('button[aria-label*="시작"]')
    
    if (startButton) {
      await user.click(startButton)
    }

    // Verify task is set as current task
    await waitFor(() => {
      expect(screen.getByText('현재 작업: Complete project documentation')).toBeInTheDocument()
    })

    // Step 4: Complete subtasks one by one
    const subtaskCheckboxes = screen.getAllByRole('checkbox', { name: /하위 작업/i })
    
    for (let i = 0; i < subtaskCheckboxes.length - 1; i++) {
      await user.click(subtaskCheckboxes[i])
      
      await waitFor(() => {
        expect(subtaskCheckboxes[i]).toBeChecked()
      })
    }

    // Step 5: Complete the last subtask (should complete entire task)
    const lastSubtask = subtaskCheckboxes[subtaskCheckboxes.length - 1]
    await user.click(lastSubtask)

    await waitFor(() => {
      expect(screen.getByText('작업 완료!')).toBeInTheDocument()
      expect(screen.getByTestId('completion-animation')).toBeInTheDocument()
    })

    // Step 6: Verify task moved to completed section
    await waitFor(() => {
      const completedSection = screen.getByText('완료된 작업')
      expect(completedSection).toBeInTheDocument()
      
      const completedTasksContainer = completedSection.closest('section')
      expect(completedTasksContainer).toHaveTextContent('Complete project documentation')
    })
  })

  it('should handle task postponement and priority adjustment', async () => {
    const { schedulingService } = require('../../services/schedulingService')
    
    renderApp()

    // Create multiple tasks
    const tasks = [
      { title: 'High priority task', priority: 'high' },
      { title: 'Medium priority task', priority: 'medium' },
      { title: 'Low priority task', priority: 'low' },
    ]

    for (const task of tasks) {
      const newTaskButton = screen.getByRole('button', { name: /새 작업 추가/i })
      await user.click(newTaskButton)

      const titleInput = screen.getByLabelText('작업 제목')
      await user.type(titleInput, task.title)

      const prioritySelect = screen.getByLabelText('우선순위')
      await user.selectOptions(prioritySelect, task.priority)

      const submitButton = screen.getByRole('button', { name: /저장/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(task.title)).toBeInTheDocument()
      })
    }

    // Postpone the medium priority task
    const mediumTaskElement = screen.getByText('Medium priority task')
    const taskContainer = mediumTaskElement.closest('[data-testid="task-item"]')
    const postponeButton = taskContainer?.querySelector('button[aria-label*="연기"]')
    
    if (postponeButton) {
      await user.click(postponeButton)
    }

    // Verify postponement dialog
    expect(screen.getByText('작업을 연기하시겠습니까?')).toBeInTheDocument()
    
    const confirmButton = screen.getByRole('button', { name: /연기/i })
    await user.click(confirmButton)

    // Verify scheduling service was called
    expect(schedulingService.adjustPriorityOnPostpone).toHaveBeenCalled()

    // Verify task status changed
    await waitFor(() => {
      expect(screen.getByText('연기됨')).toBeInTheDocument()
    })
  })

  it('should handle energy-based task recommendations', async () => {
    const { schedulingService } = require('../../services/schedulingService')
    
    renderApp()

    // Create tasks with different characteristics
    const tasks = [
      { title: 'Quick email check', duration: '15', category: '업무' },
      { title: 'Creative brainstorming', duration: '45', category: '기획' },
      { title: 'Complex analysis', duration: '120', category: '분석' },
    ]

    for (const task of tasks) {
      const newTaskButton = screen.getByRole('button', { name: /새 작업 추가/i })
      await user.click(newTaskButton)

      const titleInput = screen.getByLabelText('작업 제목')
      await user.type(titleInput, task.title)

      const durationInput = screen.getByLabelText('예상 시간 (분)')
      await user.clear(durationInput)
      await user.type(durationInput, task.duration)

      const categorySelect = screen.getByLabelText('카테고리')
      await user.selectOptions(categorySelect, task.category)

      const submitButton = screen.getByRole('button', { name: /저장/i })
      await user.click(submitButton)
    }

    // Change energy level to low
    const energySlider = screen.getByRole('slider', { name: /에너지 레벨/i })
    fireEvent.change(energySlider, { target: { value: '1' } })

    await waitFor(() => {
      expect(screen.getByText('낮음')).toBeInTheDocument()
    })

    // Verify task recommendations changed
    expect(schedulingService.recommendTasksByEnergy).toHaveBeenCalledWith(
      expect.any(Array),
      'low'
    )

    // Should show appropriate task recommendations
    expect(screen.getByText('추천 작업')).toBeInTheDocument()
    expect(screen.getByText('에너지 레벨이 낮을 때는 짧고 창의적인 작업을 추천합니다')).toBeInTheDocument()
  })

  it('should handle goal adjustment for low completion rates', async () => {
    const { goalAdjustmentService } = require('../../services/goalAdjustmentService')
    
    renderApp()

    // Create many tasks to simulate overplanning
    const taskTitles = [
      'Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 5',
      'Task 6', 'Task 7', 'Task 8', 'Task 9', 'Task 10'
    ]

    for (const title of taskTitles) {
      const newTaskButton = screen.getByRole('button', { name: /새 작업 추가/i })
      await user.click(newTaskButton)

      const titleInput = screen.getByLabelText('작업 제목')
      await user.type(titleInput, title)

      const submitButton = screen.getByRole('button', { name: /저장/i })
      await user.click(submitButton)
    }

    // Complete only 2 tasks (20% completion rate)
    const task1 = screen.getByText('Task 1')
    const task1Container = task1.closest('[data-testid="task-item"]')
    const completeButton1 = task1Container?.querySelector('button[aria-label*="완료"]')
    
    if (completeButton1) {
      await user.click(completeButton1)
    }

    const task2 = screen.getByText('Task 2')
    const task2Container = task2.closest('[data-testid="task-item"]')
    const completeButton2 = task2Container?.querySelector('button[aria-label*="완료"]')
    
    if (completeButton2) {
      await user.click(completeButton2)
    }

    // Simulate end of day trigger
    const endDayButton = screen.getByRole('button', { name: /하루 마무리/i })
    await user.click(endDayButton)

    // Should trigger goal adjustment
    await waitFor(() => {
      expect(goalAdjustmentService.adjustGoalsForLowCompletion).toHaveBeenCalled()
    })

    // Should show goal adjustment modal
    expect(screen.getByText('목표 조정 제안')).toBeInTheDocument()
    expect(screen.getByText('오늘 완료율이 낮아 내일 목표를 조정하는 것을 추천합니다')).toBeInTheDocument()

    // Accept adjustment
    const acceptButton = screen.getByRole('button', { name: /조정 수락/i })
    await user.click(acceptButton)

    await waitFor(() => {
      expect(screen.getByText('목표가 조정되었습니다')).toBeInTheDocument()
    })
  })

  it('should handle task dependencies and blocking', async () => {
    renderApp()

    // Create dependent tasks
    const newTaskButton = screen.getByRole('button', { name: /새 작업 추가/i })
    
    // Create prerequisite task
    await user.click(newTaskButton)
    let titleInput = screen.getByLabelText('작업 제목')
    await user.type(titleInput, 'Setup development environment')
    let submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)

    // Create dependent task
    await user.click(newTaskButton)
    titleInput = screen.getByLabelText('작업 제목')
    await user.type(titleInput, 'Write unit tests')
    
    // Add dependency
    const dependencySelect = screen.getByLabelText('의존성')
    await user.selectOptions(dependencySelect, 'Setup development environment')
    
    submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)

    // Verify dependent task is blocked
    const dependentTask = screen.getByText('Write unit tests')
    const dependentContainer = dependentTask.closest('[data-testid="task-item"]')
    const startButton = dependentContainer?.querySelector('button[aria-label*="시작"]')
    
    expect(startButton).toBeDisabled()
    expect(screen.getByText('의존성 대기 중')).toBeInTheDocument()

    // Complete prerequisite task
    const prerequisiteTask = screen.getByText('Setup development environment')
    const prerequisiteContainer = prerequisiteTask.closest('[data-testid="task-item"]')
    const completeButton = prerequisiteContainer?.querySelector('button[aria-label*="완료"]')
    
    if (completeButton) {
      await user.click(completeButton)
    }

    // Verify dependent task is now available
    await waitFor(() => {
      const updatedStartButton = dependentContainer?.querySelector('button[aria-label*="시작"]')
      expect(updatedStartButton).not.toBeDisabled()
    })
  })

  it('should handle task editing and updates', async () => {
    renderApp()

    // Create initial task
    const newTaskButton = screen.getByRole('button', { name: /새 작업 추가/i })
    await user.click(newTaskButton)

    const titleInput = screen.getByLabelText('작업 제목')
    await user.type(titleInput, 'Original task title')

    const durationInput = screen.getByLabelText('예상 시간 (분)')
    await user.clear(durationInput)
    await user.type(durationInput, '30')

    const submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)

    // Edit the task
    const taskElement = screen.getByText('Original task title')
    const taskContainer = taskElement.closest('[data-testid="task-item"]')
    const editButton = taskContainer?.querySelector('button[aria-label*="편집"]')
    
    if (editButton) {
      await user.click(editButton)
    }

    // Update task details
    const editTitleInput = screen.getByLabelText('작업 제목')
    await user.clear(editTitleInput)
    await user.type(editTitleInput, 'Updated task title')

    const editDurationInput = screen.getByLabelText('예상 시간 (분)')
    await user.clear(editDurationInput)
    await user.type(editDurationInput, '60')

    const updateButton = screen.getByRole('button', { name: /수정/i })
    await user.click(updateButton)

    // Verify updates
    await waitFor(() => {
      expect(screen.getByText('Updated task title')).toBeInTheDocument()
      expect(screen.queryByText('Original task title')).not.toBeInTheDocument()
    })

    // Should show new subtask split for 60 minutes
    expect(screen.getByText(/약 3개의 하위 작업/)).toBeInTheDocument()
  })

  it('should handle task deletion with confirmation', async () => {
    renderApp()

    // Create task to delete
    const newTaskButton = screen.getByRole('button', { name: /새 작업 추가/i })
    await user.click(newTaskButton)

    const titleInput = screen.getByLabelText('작업 제목')
    await user.type(titleInput, 'Task to delete')

    const submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)

    // Delete the task
    const taskElement = screen.getByText('Task to delete')
    const taskContainer = taskElement.closest('[data-testid="task-item"]')
    const deleteButton = taskContainer?.querySelector('button[aria-label*="삭제"]')
    
    if (deleteButton) {
      await user.click(deleteButton)
    }

    // Confirm deletion
    expect(screen.getByText('작업을 삭제하시겠습니까?')).toBeInTheDocument()
    
    const confirmButton = screen.getByRole('button', { name: /삭제/i })
    await user.click(confirmButton)

    // Verify task was deleted
    await waitFor(() => {
      expect(screen.queryByText('Task to delete')).not.toBeInTheDocument()
    })

    // Should show success message
    expect(screen.getByText('작업이 삭제되었습니다')).toBeInTheDocument()
  })
})