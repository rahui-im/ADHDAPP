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
jest.mock('../../services/notificationService', () => ({
  notificationService: {
    requestPermission: jest.fn(() => Promise.resolve('granted')),
    showNotification: jest.fn(),
  },
}))

jest.mock('../../services/distractionService', () => ({
  distractionService: {
    detectInactivity: jest.fn(),
    showGentleReminder: jest.fn(),
    suggestBreathingExercise: jest.fn(),
  },
}))

jest.mock('../../services/achievementService', () => ({
  achievementService: {
    checkAchievements: jest.fn(() => [
      {
        id: 'first-pomodoro',
        title: '첫 포모도로 완료',
        description: '첫 번째 포모도로를 완료했습니다!',
        icon: '🍅',
        unlockedAt: new Date(),
      },
    ]),
    getAvailableBadges: jest.fn(() => []),
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
              focusDurations: [15, 25, 45] as [15, 25, 45],
              shortBreakDurations: [5, 10, 15] as [5, 10, 15],
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

describe('User Experience Integration', () => {
  let store: ReturnType<typeof createTestStore>
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    store = createTestStore()
    user = userEvent.setup()
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const renderApp = () => {
    return render(
      <Provider store={store}>
        <App />
      </Provider>
    )
  }

  it('should provide ADHD-friendly user experience throughout the workflow', async () => {
    renderApp()

    // Step 1: Verify large, clear UI elements
    const newTaskButton = screen.getByRole('button', { name: /새 작업 추가/i })
    expect(newTaskButton).toHaveClass('text-lg', 'px-6', 'py-3') // Large button

    // Step 2: Create task with clear visual feedback
    await user.click(newTaskButton)

    const titleInput = screen.getByLabelText('작업 제목')
    expect(titleInput).toHaveClass('text-lg') // Large text input

    await user.type(titleInput, 'ADHD-friendly task')

    // Should show character count for clarity
    expect(screen.getByText(/17자/)).toBeInTheDocument()

    const durationInput = screen.getByLabelText('예상 시간 (분)')
    await user.clear(durationInput)
    await user.type(durationInput, '60')

    // Should show auto-split suggestion immediately
    await waitFor(() => {
      expect(screen.getByText(/자동으로 작은 단위로 분할됩니다/)).toBeInTheDocument()
    })

    const submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)

    // Step 3: Verify visual progress indicators
    await waitFor(() => {
      expect(screen.getByText('ADHD-friendly task')).toBeInTheDocument()
    })

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveAttribute('aria-label', '작업 진행률')

    // Step 4: Start timer with clear visual feedback
    const startButton = screen.getByRole('button', { name: /타이머 시작/i })
    await user.click(startButton)

    store.dispatch({ type: 'timer/startTimer', payload: { taskId: 'task-1' } })

    // Should show large timer display
    await waitFor(() => {
      const timerDisplay = screen.getByText('25:00')
      expect(timerDisplay).toHaveClass('text-6xl') // Very large timer
    })

    // Should show progress circle
    const progressCircle = screen.getByTestId('progress-circle')
    expect(progressCircle).toBeInTheDocument()

    // Step 5: Test focus mode for distraction reduction
    const focusModeButton = screen.getByRole('button', { name: /집중 모드/i })
    await user.click(focusModeButton)

    await waitFor(() => {
      // Should hide non-essential elements
      expect(screen.queryByText('빠른 작업')).not.toBeInTheDocument()
      expect(screen.getByText('집중 모드 활성화')).toBeInTheDocument()
    })

    // Step 6: Test gentle interruption handling
    store.dispatch({ type: 'timer/pauseTimer' })

    await waitFor(() => {
      expect(screen.getByText('타이머가 일시정지되었습니다')).toBeInTheDocument()
      expect(screen.getByText('괜찮아요, 다시 시작하면 됩니다')).toBeInTheDocument()
    })
  })

  it('should handle inactivity detection and gentle reminders', async () => {
    const { distractionService } = require('../../services/distractionService')
    
    renderApp()

    // Create and start task
    const newTaskButton = screen.getByRole('button', { name: /새 작업 추가/i })
    await user.click(newTaskButton)

    const titleInput = screen.getByLabelText('작업 제목')
    await user.type(titleInput, 'Focus test task')

    const submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)

    const startButton = screen.getByRole('button', { name: /타이머 시작/i })
    await user.click(startButton)

    store.dispatch({ type: 'timer/startTimer', payload: { taskId: 'task-1' } })

    // Simulate 15 minutes of inactivity
    jest.advanceTimersByTime(15 * 60 * 1000)

    await waitFor(() => {
      expect(distractionService.detectInactivity).toHaveBeenCalled()
    })

    // Should show gentle reminder
    expect(screen.getByText('잠깐 쉬고 계신가요?')).toBeInTheDocument()
    expect(screen.getByText('괜찮습니다. 준비되면 다시 시작하세요.')).toBeInTheDocument()

    // Should offer breathing exercise
    const breathingButton = screen.getByRole('button', { name: /호흡 운동/i })
    await user.click(breathingButton)

    expect(distractionService.suggestBreathingExercise).toHaveBeenCalled()
    expect(screen.getByText('깊게 숨을 들이마시세요')).toBeInTheDocument()
  })

  it('should provide encouraging feedback and achievements', async () => {
    const { achievementService } = require('../../services/achievementService')
    
    renderApp()

    // Create and complete a task
    const newTaskButton = screen.getByRole('button', { name: /새 작업 추가/i })
    await user.click(newTaskButton)

    const titleInput = screen.getByLabelText('작업 제목')
    await user.type(titleInput, 'Achievement test')

    const submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)

    // Complete the task
    const taskElement = screen.getByText('Achievement test')
    const taskContainer = taskElement.closest('[data-testid="task-item"]')
    const completeButton = taskContainer?.querySelector('button[aria-label*="완료"]')
    
    if (completeButton) {
      await user.click(completeButton)
    }

    // Should show completion animation
    await waitFor(() => {
      expect(screen.getByTestId('completion-animation')).toBeInTheDocument()
      expect(screen.getByText('훌륭해요! 🎉')).toBeInTheDocument()
    })

    // Should check for achievements
    expect(achievementService.checkAchievements).toHaveBeenCalled()

    // Should show achievement notification
    await waitFor(() => {
      expect(screen.getByText('새로운 성취를 달성했습니다!')).toBeInTheDocument()
      expect(screen.getByText('첫 포모도로 완료')).toBeInTheDocument()
      expect(screen.getByText('🍅')).toBeInTheDocument()
    })
  })

  it('should handle low completion rates with supportive messaging', async () => {
    renderApp()

    // Create multiple tasks
    const taskTitles = ['Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 5']
    
    for (const title of taskTitles) {
      const newTaskButton = screen.getByRole('button', { name: /새 작업 추가/i })
      await user.click(newTaskButton)

      const titleInput = screen.getByLabelText('작업 제목')
      await user.type(titleInput, title)

      const submitButton = screen.getByRole('button', { name: /저장/i })
      await user.click(submitButton)
    }

    // Complete only one task (20% completion rate)
    const task1 = screen.getByText('Task 1')
    const task1Container = task1.closest('[data-testid="task-item"]')
    const completeButton = task1Container?.querySelector('button[aria-label*="완료"]')
    
    if (completeButton) {
      await user.click(completeButton)
    }

    // Trigger end of day
    const endDayButton = screen.getByRole('button', { name: /하루 마무리/i })
    await user.click(endDayButton)

    // Should show supportive message, not criticism
    await waitFor(() => {
      expect(screen.getByText('오늘도 수고하셨습니다')).toBeInTheDocument()
      expect(screen.getByText('완료한 작업이 있다는 것만으로도 성취입니다')).toBeInTheDocument()
      expect(screen.queryByText('실패')).not.toBeInTheDocument()
      expect(screen.queryByText('부족')).not.toBeInTheDocument()
    })

    // Should offer gentle adjustment
    expect(screen.getByText('내일은 더 현실적인 목표로 시작해보는 것은 어떨까요?')).toBeInTheDocument()
  })

  it('should provide accessible keyboard navigation', async () => {
    renderApp()

    // Test keyboard navigation through main interface
    const newTaskButton = screen.getByRole('button', { name: /새 작업 추가/i })
    newTaskButton.focus()
    
    expect(newTaskButton).toHaveFocus()

    // Tab to next focusable element
    await user.tab()
    const timerButton = screen.getByRole('button', { name: /타이머 시작/i })
    expect(timerButton).toHaveFocus()

    // Test keyboard shortcuts
    fireEvent.keyDown(document, { key: ' ' }) // Space to start timer
    
    store.dispatch({ type: 'timer/startTimer', payload: { taskId: 'task-1' } })

    await waitFor(() => {
      expect(screen.getByText('타이머 실행 중')).toBeInTheDocument()
    })

    // Escape to stop timer
    fireEvent.keyDown(document, { key: 'Escape' })
    
    store.dispatch({ type: 'timer/stopTimer' })

    await waitFor(() => {
      expect(screen.queryByText('타이머 실행 중')).not.toBeInTheDocument()
    })

    // ? key to show help
    fireEvent.keyDown(document, { key: '?' })

    expect(screen.getByText('키보드 단축키')).toBeInTheDocument()
    expect(screen.getByText('스페이스: 타이머 시작/일시정지')).toBeInTheDocument()
    expect(screen.getByText('ESC: 타이머 정지')).toBeInTheDocument()
  })

  it('should handle theme and accessibility preferences', async () => {
    renderApp()

    // Open settings
    const settingsButton = screen.getByRole('button', { name: /설정/i })
    await user.click(settingsButton)

    // Change to dark theme
    const darkThemeButton = screen.getByRole('button', { name: /다크 모드/i })
    await user.click(darkThemeButton)

    await waitFor(() => {
      expect(document.body).toHaveClass('dark')
    })

    // Increase font size for better readability
    const fontSizeSlider = screen.getByRole('slider', { name: /글자 크기/i })
    fireEvent.change(fontSizeSlider, { target: { value: '18' } })

    await waitFor(() => {
      expect(document.documentElement.style.fontSize).toBe('18px')
    })

    // Enable high contrast mode
    const highContrastToggle = screen.getByRole('switch', { name: /고대비 모드/i })
    await user.click(highContrastToggle)

    await waitFor(() => {
      expect(document.body).toHaveClass('high-contrast')
    })

    // Test reduced motion preference
    const reducedMotionToggle = screen.getByRole('switch', { name: /애니메이션 줄이기/i })
    await user.click(reducedMotionToggle)

    await waitFor(() => {
      expect(document.body).toHaveClass('reduce-motion')
    })
  })

  it('should provide real-time feedback and status updates', async () => {
    renderApp()

    // Create task
    const newTaskButton = screen.getByRole('button', { name: /새 작업 추가/i })
    await user.click(newTaskButton)

    const titleInput = screen.getByLabelText('작업 제목')
    await user.type(titleInput, 'Real-time feedback test')

    const submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)

    // Start timer
    const startButton = screen.getByRole('button', { name: /타이머 시작/i })
    await user.click(startButton)

    store.dispatch({ type: 'timer/startTimer', payload: { taskId: 'task-1' } })

    // Should show live status updates
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('타이머가 시작되었습니다')
    })

    // Simulate timer progress
    store.dispatch({ type: 'timer/updateRemaining', payload: 1200 })

    await waitFor(() => {
      expect(screen.getByText('20:00')).toBeInTheDocument()
    })

    // Should update progress bar
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '20') // 5 minutes progress out of 25

    // Pause timer
    const pauseButton = screen.getByRole('button', { name: /일시정지/i })
    await user.click(pauseButton)

    store.dispatch({ type: 'timer/pauseTimer' })

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('타이머가 일시정지되었습니다')
    })
  })

  it('should handle error states gracefully with helpful messages', async () => {
    renderApp()

    // Simulate network error
    store.dispatch({ type: 'tasks/setError', payload: '네트워크 연결을 확인해주세요' })

    await waitFor(() => {
      expect(screen.getByText('앗, 문제가 발생했습니다')).toBeInTheDocument()
      expect(screen.getByText('네트워크 연결을 확인해주세요')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /다시 시도/i })).toBeInTheDocument()
    })

    // Should not show technical error details
    expect(screen.queryByText('500')).not.toBeInTheDocument()
    expect(screen.queryByText('Internal Server Error')).not.toBeInTheDocument()

    // Test retry functionality
    const retryButton = screen.getByRole('button', { name: /다시 시도/i })
    await user.click(retryButton)

    store.dispatch({ type: 'tasks/setError', payload: null })
    store.dispatch({ type: 'tasks/setLoading', payload: false })

    await waitFor(() => {
      expect(screen.queryByText('앗, 문제가 발생했습니다')).not.toBeInTheDocument()
    })
  })
})