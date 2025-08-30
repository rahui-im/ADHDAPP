import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import App from '../../App'
import taskReducer from '../../store/taskSlice'
import timerReducer from '../../store/timerSlice'
import userReducer from '../../store/userSlice'
import analyticsReducer from '../../store/analyticsSlice'
// import { Task } from '../../types' - unused import

// Mock services
jest.mock('../../services/timerService', () => ({
  timerService: {
    start: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    stop: jest.fn(),
    isRunning: jest.fn(() => false),
    formatTime: jest.fn((seconds) => {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }),
    calculateProgress: jest.fn((duration, remaining) => 
      duration > 0 ? ((duration - remaining) / duration) * 100 : 0
    ),
    createSession: jest.fn(() => ({
      id: 'session-1',
      taskId: 'task-1',
      type: 'focus',
      plannedDuration: 25,
      actualDuration: 25,
      startedAt: new Date(),
      completedAt: new Date(),
      wasInterrupted: false,
      interruptionReasons: [],
      energyBefore: 3,
      energyAfter: 3,
    })),
    saveTimerState: jest.fn(),
    restoreTimerState: jest.fn(() => null),
    clearSavedState: jest.fn(),
  },
}))

jest.mock('../../services/notificationService', () => ({
  notificationService: {
    requestPermission: jest.fn(),
    showNotification: jest.fn(),
  },
}))

jest.mock('../../services/analyticsService', () => ({
  analyticsService: {
    startSession: jest.fn(() => Promise.resolve('session-1')),
    completeSession: jest.fn(() => Promise.resolve()),
    updateDailyStatsForDate: jest.fn(() => Promise.resolve({
      date: new Date(),
      tasksCompleted: 1,
      tasksPlanned: 3,
      focusMinutes: 25,
      breakMinutes: 5,
      pomodorosCompleted: 1,
      averageEnergyLevel: 3,
      distractions: [],
    })),
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
            preferredTaskCategories: ['업무', '개인'],
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

describe('Timer Workflow Integration', () => {
  let store: ReturnType<typeof createTestStore>
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    store = createTestStore()
    user = userEvent.setup()
    jest.useFakeTimers()
    jest.clearAllMocks()
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

  it('should complete full pomodoro cycle workflow', async () => {
    const { timerService } = require('../../services/timerService')
    const { analyticsService } = require('../../services/analyticsService')
    
    renderApp()

    // Step 1: Create a new task
    const newTaskButton = screen.getByRole('button', { name: /새 작업 추가/i })
    await user.click(newTaskButton)

    const titleInput = screen.getByLabelText('작업 제목')
    await user.type(titleInput, 'Complete integration test')

    const submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)

    // Verify task was created
    await waitFor(() => {
      expect(screen.getByText('Complete integration test')).toBeInTheDocument()
    })

    // Step 2: Start timer for the task
    const startTimerButton = screen.getByRole('button', { name: /타이머 시작/i })
    await user.click(startTimerButton)

    // Verify timer started
    expect(timerService.start).toHaveBeenCalled()
    expect(analyticsService.startSession).toHaveBeenCalledWith(
      expect.any(String), // taskId
      'focus',
      25,
      expect.any(Number) // energyLevel
    )

    // Step 3: Simulate timer running
    store.dispatch({ type: 'timer/startTimer', payload: { taskId: 'task-1' } })
    
    await waitFor(() => {
      expect(screen.getByText('타이머 실행 중')).toBeInTheDocument()
    })

    // Step 4: Pause timer
    const pauseButton = screen.getByRole('button', { name: /일시정지/i })
    await user.click(pauseButton)

    expect(timerService.pause).toHaveBeenCalled()

    // Step 5: Resume timer
    store.dispatch({ type: 'timer/pauseTimer' })
    
    const resumeButton = screen.getByRole('button', { name: /재시작/i })
    await user.click(resumeButton)

    expect(timerService.resume).toHaveBeenCalled()

    // Step 6: Complete timer
    store.dispatch({ type: 'timer/resumeTimer' })
    store.dispatch({ type: 'timer/completeTimer' })

    await waitFor(() => {
      expect(analyticsService.completeSession).toHaveBeenCalled()
    })

    // Step 7: Verify break mode
    await waitFor(() => {
      expect(screen.getByText('휴식 시간')).toBeInTheDocument()
    })

    // Step 8: Complete break and start next cycle
    store.dispatch({ type: 'timer/setMode', payload: 'short-break' })
    store.dispatch({ type: 'timer/completeTimer' })

    await waitFor(() => {
      expect(screen.getByText('집중 시간')).toBeInTheDocument()
      expect(screen.getByText(/사이클 2/i)).toBeInTheDocument()
    })
  })

  it('should handle timer interruption and recovery', async () => {
    const { timerService } = require('../../services/timerService')
    // const { analyticsService } = require('../../services/analyticsService') - unused
    
    renderApp()

    // Create and start task
    const newTaskButton = screen.getByRole('button', { name: /새 작업 추가/i })
    await user.click(newTaskButton)

    const titleInput = screen.getByLabelText('작업 제목')
    await user.type(titleInput, 'Test interruption')

    const submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)

    const startTimerButton = screen.getByRole('button', { name: /타이머 시작/i })
    await user.click(startTimerButton)

    store.dispatch({ type: 'timer/startTimer', payload: { taskId: 'task-1' } })

    // Simulate interruption (user navigates away)
    store.dispatch({ type: 'timer/pauseTimer' })

    // Simulate page refresh - timer should recover
    timerService.restoreTimerState.mockReturnValueOnce({
      mode: 'focus',
      remaining: 1200,
      isRunning: true,
      currentTaskId: 'task-1',
      lastStartTime: Date.now() - 5000,
    })

    // Re-render app to simulate page refresh
    renderApp()

    await waitFor(() => {
      expect(timerService.restoreTimerState).toHaveBeenCalled()
      expect(screen.getByText('20:00')).toBeInTheDocument() // Recovered time
    })
  })

  it('should complete long break cycle after 3 pomodoros', async () => {
    renderApp()

    // Create task
    const newTaskButton = screen.getByRole('button', { name: /새 작업 추가/i })
    await user.click(newTaskButton)

    const titleInput = screen.getByLabelText('작업 제목')
    await user.type(titleInput, 'Long cycle test')

    const submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)

    // Complete 3 focus sessions
    for (let i = 1; i <= 3; i++) {
      // Start focus session
      const startButton = screen.getByRole('button', { name: /타이머 시작|시작/i })
      await user.click(startButton)

      store.dispatch({ type: 'timer/startTimer', payload: { taskId: 'task-1' } })
      store.dispatch({ type: 'timer/completeTimer' })

      if (i < 3) {
        // Should be short break
        await waitFor(() => {
          expect(screen.getByText('휴식 시간')).toBeInTheDocument()
        })

        // Complete short break
        store.dispatch({ type: 'timer/setMode', payload: 'short-break' })
        store.dispatch({ type: 'timer/completeTimer' })
      }
    }

    // After 3rd pomodoro, should show long break
    await waitFor(() => {
      expect(screen.getByText('긴 휴식')).toBeInTheDocument()
      expect(screen.getByText('25:00')).toBeInTheDocument() // Long break duration
    })

    // Complete long break
    store.dispatch({ type: 'timer/setMode', payload: 'long-break' })
    store.dispatch({ type: 'timer/completeTimer' })

    // Should reset to cycle 1
    await waitFor(() => {
      expect(screen.getByText('집중 시간')).toBeInTheDocument()
      expect(screen.getByText(/사이클 1/i)).toBeInTheDocument()
    })
  })

  it('should track analytics throughout timer sessions', async () => {
    const { analyticsService } = require('../../services/analyticsService')
    
    renderApp()

    // Create task
    const newTaskButton = screen.getByRole('button', { name: /새 작업 추가/i })
    await user.click(newTaskButton)

    const titleInput = screen.getByLabelText('작업 제목')
    await user.type(titleInput, 'Analytics test task')

    const submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)

    // Start timer
    const startButton = screen.getByRole('button', { name: /타이머 시작/i })
    await user.click(startButton)

    expect(analyticsService.startSession).toHaveBeenCalledWith(
      expect.any(String),
      'focus',
      25,
      expect.any(Number)
    )

    // Simulate timer completion
    store.dispatch({ type: 'timer/startTimer', payload: { taskId: 'task-1' } })
    store.dispatch({ type: 'timer/completeTimer' })

    await waitFor(() => {
      expect(analyticsService.completeSession).toHaveBeenCalledWith(
        'session-1',
        expect.any(Number), // energyAfter
        false, // wasInterrupted
        [] // interruptionReasons
      )
    })

    // Verify daily stats update
    expect(analyticsService.updateDailyStatsForDate).toHaveBeenCalledWith(
      expect.any(Date)
    )
  })

  it('should handle focus mode during timer sessions', async () => {
    renderApp()

    // Create task
    const newTaskButton = screen.getByRole('button', { name: /새 작업 추가/i })
    await user.click(newTaskButton)

    const titleInput = screen.getByLabelText('작업 제목')
    await user.type(titleInput, 'Focus mode test')

    const submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)

    // Enable focus mode
    const focusModeButton = screen.getByRole('button', { name: /집중 모드/i })
    await user.click(focusModeButton)

    await waitFor(() => {
      expect(screen.getByText('집중 모드 활성화')).toBeInTheDocument()
    })

    // Start timer in focus mode
    const startButton = screen.getByRole('button', { name: /타이머 시작/i })
    await user.click(startButton)

    store.dispatch({ type: 'timer/startTimer', payload: { taskId: 'task-1' } })

    // Verify focus mode UI changes
    await waitFor(() => {
      expect(screen.getByTestId('focus-mode-indicator')).toBeInTheDocument()
      // Should hide non-essential UI elements
      expect(screen.queryByText('빠른 작업')).not.toBeInTheDocument()
    })

    // Disable focus mode
    await user.click(focusModeButton)

    await waitFor(() => {
      expect(screen.queryByText('집중 모드 활성화')).not.toBeInTheDocument()
    })
  })

  it('should handle timer settings changes during session', async () => {
    renderApp()

    // Create task
    const newTaskButton = screen.getByRole('button', { name: /새 작업 추가/i })
    await user.click(newTaskButton)

    const titleInput = screen.getByLabelText('작업 제목')
    await user.type(titleInput, 'Settings test')

    const submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)

    // Open timer settings
    const settingsButton = screen.getByRole('button', { name: /설정/i })
    await user.click(settingsButton)

    // Change focus duration to 45 minutes
    const duration45Button = screen.getByRole('button', { name: /45분/i })
    await user.click(duration45Button)

    // Close settings
    const closeButton = screen.getByRole('button', { name: /닫기/i })
    await user.click(closeButton)

    // Verify timer duration changed
    await waitFor(() => {
      expect(screen.getByText('45:00')).toBeInTheDocument()
    })

    // Start timer with new duration
    const startButton = screen.getByRole('button', { name: /타이머 시작/i })
    await user.click(startButton)

    store.dispatch({ type: 'timer/startTimer', payload: { taskId: 'task-1', duration: 45 } })

    await waitFor(() => {
      expect(screen.getByText('타이머 실행 중')).toBeInTheDocument()
    })
  })

  it('should handle multiple task switching during timer sessions', async () => {
    const { timerService } = require('../../services/timerService')
    
    renderApp()

    // Create first task
    const newTaskButton = screen.getByRole('button', { name: /새 작업 추가/i })
    await user.click(newTaskButton)

    let titleInput = screen.getByLabelText('작업 제목')
    await user.type(titleInput, 'First task')

    let submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)

    // Create second task
    await user.click(newTaskButton)

    titleInput = screen.getByLabelText('작업 제목')
    await user.type(titleInput, 'Second task')

    submitButton = screen.getByRole('button', { name: /저장/i })
    await user.click(submitButton)

    // Start timer for first task
    const firstTaskElement = screen.getByText('First task')
    const startButton1 = firstTaskElement.closest('[data-testid="task-item"]')
      ?.querySelector('button[aria-label*="시작"]')
    
    if (startButton1) {
      await user.click(startButton1)
    }

    store.dispatch({ type: 'timer/startTimer', payload: { taskId: 'task-1' } })

    // Switch to second task (should stop current timer)
    const secondTaskElement = screen.getByText('Second task')
    const startButton2 = secondTaskElement.closest('[data-testid="task-item"]')
      ?.querySelector('button[aria-label*="시작"]')
    
    if (startButton2) {
      await user.click(startButton2)
    }

    expect(timerService.stop).toHaveBeenCalled()
    
    store.dispatch({ type: 'timer/stopTimer' })
    store.dispatch({ type: 'timer/startTimer', payload: { taskId: 'task-2' } })

    await waitFor(() => {
      expect(screen.getByText('Second task')).toBeInTheDocument()
    })
  })
})