import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { PomodoroTimer } from '../PomodoroTimer'
import timerReducer from '../../../store/timerSlice'
import userReducer from '../../../store/userSlice'
import { Task } from '../../../types'

// Mock the timer service
jest.mock('../../../services/timerService', () => ({
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
  },
}))

// Mock notifications
jest.mock('../../../services/notificationService', () => ({
  notificationService: {
    requestPermission: jest.fn(),
    showNotification: jest.fn(),
  },
}))

const mockTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  description: 'Test Description',
  estimatedDuration: 25,
  subtasks: [],
  priority: 'medium',
  category: '업무',
  isFlexible: true,
  status: 'pending',
  createdAt: new Date(),
}

const createTestStore = () => {
  return configureStore({
    reducer: {
      timer: timerReducer,
      user: userReducer,
    },
    preloadedState: {
      timer: {
        mode: 'focus',
        duration: 1500, // 25 minutes
        remaining: 1500,
        isRunning: false,
        isPaused: false,
        currentCycle: 1,
        totalCycles: 0,
        currentTaskId: 'task-1',
        settings: {
          focusDurations: [15, 25, 45],
          shortBreakDurations: [5, 10, 15],
          longBreakDuration: 25,
          cyclesBeforeLongBreak: 3,
        },
        isInitialized: true,
      },
      user: {
        currentUser: {
          id: 'user-1',
          name: 'Test User',
          preferences: {
            defaultFocusDuration: 25,
            defaultBreakDuration: 10,
            preferredTaskCategories: ['업무'],
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

describe('PomodoroTimer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should render timer display', () => {
    renderWithStore(<PomodoroTimer task={mockTask} />)
    
    expect(screen.getByText('25:00')).toBeInTheDocument()
    expect(screen.getByText('집중 시간')).toBeInTheDocument()
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('should show timer controls', () => {
    renderWithStore(<PomodoroTimer task={mockTask} />)
    
    expect(screen.getByRole('button', { name: /시작/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /정지/i })).toBeInTheDocument()
  })

  it('should start timer when start button is clicked', () => {
    const { timerService } = require('../../../services/timerService')
    renderWithStore(<PomodoroTimer task={mockTask} />)
    
    const startButton = screen.getByRole('button', { name: /시작/i })
    fireEvent.click(startButton)
    
    expect(timerService.start).toHaveBeenCalled()
  })

  it('should show pause button when timer is running', () => {
    const store = createTestStore()
    store.dispatch({ type: 'timer/startTimer', payload: { taskId: 'task-1' } })
    
    renderWithStore(<PomodoroTimer task={mockTask} />, store)
    
    expect(screen.getByRole('button', { name: /일시정지/i })).toBeInTheDocument()
  })

  it('should pause timer when pause button is clicked', () => {
    const { timerService } = require('../../../services/timerService')
    const store = createTestStore()
    store.dispatch({ type: 'timer/startTimer', payload: { taskId: 'task-1' } })
    
    renderWithStore(<PomodoroTimer task={mockTask} />, store)
    
    const pauseButton = screen.getByRole('button', { name: /일시정지/i })
    fireEvent.click(pauseButton)
    
    expect(timerService.pause).toHaveBeenCalled()
  })

  it('should show resume button when timer is paused', () => {
    const store = createTestStore()
    store.dispatch({ type: 'timer/startTimer', payload: { taskId: 'task-1' } })
    store.dispatch({ type: 'timer/pauseTimer' })
    
    renderWithStore(<PomodoroTimer task={mockTask} />, store)
    
    expect(screen.getByRole('button', { name: /재시작/i })).toBeInTheDocument()
  })

  it('should resume timer when resume button is clicked', () => {
    const { timerService } = require('../../../services/timerService')
    const store = createTestStore()
    store.dispatch({ type: 'timer/startTimer', payload: { taskId: 'task-1' } })
    store.dispatch({ type: 'timer/pauseTimer' })
    
    renderWithStore(<PomodoroTimer task={mockTask} />, store)
    
    const resumeButton = screen.getByRole('button', { name: /재시작/i })
    fireEvent.click(resumeButton)
    
    expect(timerService.resume).toHaveBeenCalled()
  })

  it('should stop timer when stop button is clicked', () => {
    const { timerService } = require('../../../services/timerService')
    renderWithStore(<PomodoroTimer task={mockTask} />)
    
    const stopButton = screen.getByRole('button', { name: /정지/i })
    fireEvent.click(stopButton)
    
    expect(timerService.stop).toHaveBeenCalled()
  })

  it('should display progress circle', () => {
    renderWithStore(<PomodoroTimer task={mockTask} />)
    
    const progressCircle = screen.getByTestId('progress-circle')
    expect(progressCircle).toBeInTheDocument()
  })

  it('should update progress as timer runs', () => {
    const store = createTestStore()
    store.dispatch({ type: 'timer/updateRemaining', payload: 1200 }) // 20 minutes remaining
    
    renderWithStore(<PomodoroTimer task={mockTask} />, store)
    
    expect(screen.getByText('20:00')).toBeInTheDocument()
  })

  it('should show current cycle information', () => {
    const store = createTestStore()
    store.dispatch({ type: 'timer/startTimer', payload: { taskId: 'task-1' } })
    
    renderWithStore(<PomodoroTimer task={mockTask} />, store)
    
    expect(screen.getByText(/사이클 1/i)).toBeInTheDocument()
  })

  it('should show break mode when in break', () => {
    const store = createTestStore()
    store.dispatch({ type: 'timer/setMode', payload: 'short-break' })
    
    renderWithStore(<PomodoroTimer task={mockTask} />, store)
    
    expect(screen.getByText('휴식 시간')).toBeInTheDocument()
  })

  it('should show long break mode', () => {
    const store = createTestStore()
    store.dispatch({ type: 'timer/setMode', payload: 'long-break' })
    
    renderWithStore(<PomodoroTimer task={mockTask} />, store)
    
    expect(screen.getByText('긴 휴식')).toBeInTheDocument()
  })

  it('should handle timer completion', async () => {
    const onComplete = jest.fn()
    const store = createTestStore()
    
    renderWithStore(<PomodoroTimer task={mockTask} onComplete={onComplete} />, store)
    
    // Simulate timer completion
    store.dispatch({ type: 'timer/completeTimer' })
    
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(25)
    })
  })

  it('should show timer settings button', () => {
    renderWithStore(<PomodoroTimer task={mockTask} />)
    
    const settingsButton = screen.getByRole('button', { name: /설정/i })
    expect(settingsButton).toBeInTheDocument()
  })

  it('should open timer settings modal', () => {
    renderWithStore(<PomodoroTimer task={mockTask} />)
    
    const settingsButton = screen.getByRole('button', { name: /설정/i })
    fireEvent.click(settingsButton)
    
    expect(screen.getByText('타이머 설정')).toBeInTheDocument()
  })

  it('should allow changing focus duration', () => {
    renderWithStore(<PomodoroTimer task={mockTask} />)
    
    const settingsButton = screen.getByRole('button', { name: /설정/i })
    fireEvent.click(settingsButton)
    
    const duration45Button = screen.getByRole('button', { name: /45분/i })
    fireEvent.click(duration45Button)
    
    expect(screen.getByText('45:00')).toBeInTheDocument()
  })

  it('should show keyboard shortcuts help', () => {
    renderWithStore(<PomodoroTimer task={mockTask} />)
    
    // Press ? key to show shortcuts
    fireEvent.keyDown(document, { key: '?' })
    
    expect(screen.getByText('키보드 단축키')).toBeInTheDocument()
  })

  it('should handle keyboard shortcuts', () => {
    const { timerService } = require('../../../services/timerService')
    renderWithStore(<PomodoroTimer task={mockTask} />)
    
    // Space key should start/pause timer
    fireEvent.keyDown(document, { key: ' ' })
    expect(timerService.start).toHaveBeenCalled()
    
    // Escape key should stop timer
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(timerService.stop).toHaveBeenCalled()
  })

  it('should be accessible', () => {
    renderWithStore(<PomodoroTimer task={mockTask} />)
    
    const timerDisplay = screen.getByRole('timer')
    expect(timerDisplay).toHaveAttribute('aria-label')
    
    const startButton = screen.getByRole('button', { name: /시작/i })
    expect(startButton).toHaveAttribute('aria-describedby')
  })

  it('should announce timer state changes to screen readers', () => {
    const store = createTestStore()
    renderWithStore(<PomodoroTimer task={mockTask} />, store)
    
    // Start timer
    store.dispatch({ type: 'timer/startTimer', payload: { taskId: 'task-1' } })
    
    const announcement = screen.getByRole('status')
    expect(announcement).toHaveTextContent('타이머가 시작되었습니다')
  })

  it('should handle focus mode integration', () => {
    const store = createTestStore()
    store.dispatch({ type: 'user/setFocusMode', payload: true })
    
    renderWithStore(<PomodoroTimer task={mockTask} />, store)
    
    expect(screen.getByTestId('focus-mode-indicator')).toBeInTheDocument()
  })

  it('should show energy level tracking', () => {
    renderWithStore(<PomodoroTimer task={mockTask} />)
    
    expect(screen.getByText('시작 전 에너지 레벨')).toBeInTheDocument()
    expect(screen.getByRole('slider')).toBeInTheDocument()
  })

  it('should handle timer recovery on mount', () => {
    const { timerService } = require('../../../services/timerService')
    timerService.restoreTimerState = jest.fn(() => ({
      mode: 'focus',
      remaining: 1200,
      isRunning: true,
      currentTaskId: 'task-1',
    }))
    
    renderWithStore(<PomodoroTimer task={mockTask} />)
    
    expect(timerService.restoreTimerState).toHaveBeenCalled()
  })
})