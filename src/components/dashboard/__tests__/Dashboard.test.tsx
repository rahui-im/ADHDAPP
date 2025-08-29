import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { Dashboard } from '../Dashboard'
import taskReducer from '../../../store/taskSlice'
import timerReducer from '../../../store/timerSlice'
import userReducer from '../../../store/userSlice'
import analyticsReducer from '../../../store/analyticsSlice'
import { Task, User } from '../../../types'

// Mock components that might not be fully implemented
jest.mock('../EnergyLevelTracker', () => ({
  EnergyLevelTracker: () => <div data-testid="energy-tracker">Energy Tracker</div>
}))

jest.mock('../StreakDisplay', () => ({
  StreakDisplay: ({ streak }: { streak: number }) => <div data-testid="streak-display">Streak: {streak}</div>
}))

jest.mock('../CurrentTaskDisplay', () => ({
  CurrentTaskDisplay: ({ task }: { task: Task | null }) => (
    <div data-testid="current-task">{task ? task.title : 'No current task'}</div>
  )
}))

jest.mock('../TaskRecommendations', () => ({
  TaskRecommendations: () => <div data-testid="task-recommendations">Task Recommendations</div>
}))

jest.mock('../AchievementBadges', () => ({
  AchievementBadges: () => <div data-testid="achievement-badges">Achievement Badges</div>
}))

const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Complete project proposal',
    description: 'Write and review project proposal',
    estimatedDuration: 60,
    subtasks: [
      { id: 'sub-1', title: 'Research', duration: 30, isCompleted: true },
      { id: 'sub-2', title: 'Write draft', duration: 30, isCompleted: false },
    ],
    priority: 'high',
    category: '업무',
    isFlexible: false,
    status: 'in-progress',
    createdAt: new Date('2024-01-15T09:00:00'),
  },
  {
    id: 'task-2',
    title: 'Review team feedback',
    description: 'Go through team feedback and make notes',
    estimatedDuration: 30,
    subtasks: [],
    priority: 'medium',
    category: '업무',
    isFlexible: true,
    status: 'pending',
    createdAt: new Date('2024-01-15T10:00:00'),
  },
  {
    id: 'task-3',
    title: 'Exercise routine',
    description: 'Daily workout session',
    estimatedDuration: 45,
    subtasks: [],
    priority: 'low',
    category: '건강',
    isFlexible: true,
    status: 'completed',
    createdAt: new Date('2024-01-15T07:00:00'),
    completedAt: new Date('2024-01-15T08:00:00'),
  },
]

const mockUser: User = {
  id: 'user-1',
  name: 'Test User',
  preferences: {
    defaultFocusDuration: 25,
    defaultBreakDuration: 10,
    preferredTaskCategories: ['업무', '개인', '건강'],
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
  createdAt: new Date('2024-01-01'),
  lastActiveAt: new Date('2024-01-15T12:00:00'),
}

const createTestStore = (overrides = {}) => {
  return configureStore({
    reducer: {
      tasks: taskReducer,
      timer: timerReducer,
      user: userReducer,
      analytics: analyticsReducer,
    },
    preloadedState: {
      tasks: {
        tasks: mockTasks,
        currentTask: mockTasks[0],
        dailySchedule: null,
        goalAdjustment: null,
        loading: false,
        error: null,
      },
      timer: {
        mode: 'focus',
        duration: 1500,
        remaining: 1200,
        isRunning: true,
        isPaused: false,
        currentCycle: 2,
        totalCycles: 3,
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
        currentUser: mockUser,
        isAuthenticated: true,
        energyLevel: 'medium',
        focusMode: false,
        loading: false,
        error: null,
      },
      analytics: {
        sessions: [],
        dailyStats: [
          {
            date: new Date('2024-01-15'),
            tasksCompleted: 1,
            tasksPlanned: 3,
            focusMinutes: 75,
            breakMinutes: 20,
            pomodorosCompleted: 3,
            averageEnergyLevel: 3.5,
            distractions: ['website'],
          },
        ],
        weeklyInsights: [],
        currentStreak: 5,
        longestStreak: 12,
        totalFocusTime: 450,
        totalCompletedTasks: 15,
        loading: false,
        error: null,
      },
      ...overrides,
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

describe('Dashboard', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-15T14:30:00'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should render dashboard with main sections', () => {
    renderWithStore(<Dashboard />)
    
    expect(screen.getByText('대시보드')).toBeInTheDocument()
    expect(screen.getByTestId('energy-tracker')).toBeInTheDocument()
    expect(screen.getByTestId('streak-display')).toBeInTheDocument()
    expect(screen.getByTestId('current-task')).toBeInTheDocument()
    expect(screen.getByTestId('task-recommendations')).toBeInTheDocument()
    expect(screen.getByTestId('achievement-badges')).toBeInTheDocument()
  })

  it('should display current streak', () => {
    renderWithStore(<Dashboard />)
    
    expect(screen.getByText('Streak: 5')).toBeInTheDocument()
  })

  it('should display current task', () => {
    renderWithStore(<Dashboard />)
    
    expect(screen.getByText('Complete project proposal')).toBeInTheDocument()
  })

  it('should show today\'s statistics', () => {
    renderWithStore(<Dashboard />)
    
    expect(screen.getByText('오늘의 진행상황')).toBeInTheDocument()
    expect(screen.getByText('완료된 작업')).toBeInTheDocument()
    expect(screen.getByText('1 / 3')).toBeInTheDocument() // 1 completed out of 3 total
    expect(screen.getByText('집중 시간')).toBeInTheDocument()
    expect(screen.getByText('75분')).toBeInTheDocument()
    expect(screen.getByText('완료된 포모도로')).toBeInTheDocument()
    expect(screen.getByText('3개')).toBeInTheDocument()
  })

  it('should show progress percentage', () => {
    renderWithStore(<Dashboard />)
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveAttribute('aria-valuenow', '33') // 1/3 * 100 = 33%
  })

  it('should display pending tasks for today', () => {
    renderWithStore(<Dashboard />)
    
    expect(screen.getByText('오늘의 작업')).toBeInTheDocument()
    expect(screen.getByText('Review team feedback')).toBeInTheDocument()
  })

  it('should show completed tasks', () => {
    renderWithStore(<Dashboard />)
    
    expect(screen.getByText('완료된 작업')).toBeInTheDocument()
    expect(screen.getByText('Exercise routine')).toBeInTheDocument()
  })

  it('should handle empty task list', () => {
    const store = createTestStore({
      tasks: {
        tasks: [],
        currentTask: null,
        dailySchedule: null,
        goalAdjustment: null,
        loading: false,
        error: null,
      },
    })
    
    renderWithStore(<Dashboard />, store)
    
    expect(screen.getByText('오늘 계획된 작업이 없습니다')).toBeInTheDocument()
    expect(screen.getByText('새 작업 추가')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    const store = createTestStore({
      tasks: {
        tasks: [],
        currentTask: null,
        dailySchedule: null,
        goalAdjustment: null,
        loading: true,
        error: null,
      },
    })
    
    renderWithStore(<Dashboard />, store)
    
    expect(screen.getByText('로딩 중...')).toBeInTheDocument()
  })

  it('should display error state', () => {
    const store = createTestStore({
      tasks: {
        tasks: [],
        currentTask: null,
        dailySchedule: null,
        goalAdjustment: null,
        loading: false,
        error: '작업을 불러오는데 실패했습니다',
      },
    })
    
    renderWithStore(<Dashboard />, store)
    
    expect(screen.getByText('작업을 불러오는데 실패했습니다')).toBeInTheDocument()
    expect(screen.getByText('다시 시도')).toBeInTheDocument()
  })

  it('should handle retry on error', () => {
    const store = createTestStore({
      tasks: {
        tasks: [],
        currentTask: null,
        dailySchedule: null,
        goalAdjustment: null,
        loading: false,
        error: '네트워크 오류',
      },
    })
    
    renderWithStore(<Dashboard />, store)
    
    const retryButton = screen.getByText('다시 시도')
    fireEvent.click(retryButton)
    
    // Should dispatch retry action (implementation would depend on actual store setup)
    expect(retryButton).toBeInTheDocument()
  })

  it('should show focus mode indicator when active', () => {
    const store = createTestStore({
      user: {
        currentUser: mockUser,
        isAuthenticated: true,
        energyLevel: 'medium',
        focusMode: true,
        loading: false,
        error: null,
      },
    })
    
    renderWithStore(<Dashboard />, store)
    
    expect(screen.getByText('집중 모드 활성화')).toBeInTheDocument()
    expect(screen.getByTestId('focus-mode-indicator')).toBeInTheDocument()
  })

  it('should show timer status when running', () => {
    renderWithStore(<Dashboard />)
    
    expect(screen.getByText('타이머 실행 중')).toBeInTheDocument()
    expect(screen.getByText('20:00')).toBeInTheDocument() // 1200 seconds = 20 minutes
    expect(screen.getByText('사이클 2/3')).toBeInTheDocument()
  })

  it('should show quick actions', () => {
    renderWithStore(<Dashboard />)
    
    expect(screen.getByText('빠른 작업')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /새 작업 추가/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /타이머 시작/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /집중 모드/i })).toBeInTheDocument()
  })

  it('should handle quick action clicks', () => {
    renderWithStore(<Dashboard />)
    
    const newTaskButton = screen.getByRole('button', { name: /새 작업 추가/i })
    fireEvent.click(newTaskButton)
    
    // Should open task creation modal or navigate to task form
    expect(screen.getByText('새 작업 만들기')).toBeInTheDocument()
  })

  it('should show motivational message based on progress', () => {
    renderWithStore(<Dashboard />)
    
    // With 33% completion rate, should show encouraging message
    expect(screen.getByText(/좋은 시작이에요!/i)).toBeInTheDocument()
  })

  it('should show different message for high completion rate', () => {
    const store = createTestStore({
      analytics: {
        sessions: [],
        dailyStats: [
          {
            date: new Date('2024-01-15'),
            tasksCompleted: 8,
            tasksPlanned: 10,
            focusMinutes: 180,
            breakMinutes: 45,
            pomodorosCompleted: 8,
            averageEnergyLevel: 4,
            distractions: [],
          },
        ],
        weeklyInsights: [],
        currentStreak: 5,
        longestStreak: 12,
        totalFocusTime: 450,
        totalCompletedTasks: 15,
        loading: false,
        error: null,
      },
    })
    
    renderWithStore(<Dashboard />, store)
    
    expect(screen.getByText(/훌륭해요!/i)).toBeInTheDocument()
  })

  it('should be responsive', () => {
    renderWithStore(<Dashboard />)
    
    const dashboard = screen.getByTestId('dashboard-container')
    expect(dashboard).toHaveClass('grid', 'gap-6')
    
    // Should have responsive grid classes
    expect(dashboard).toHaveClass('lg:grid-cols-3', 'md:grid-cols-2')
  })

  it('should be accessible', () => {
    renderWithStore(<Dashboard />)
    
    // Main heading should be present
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('대시보드')
    
    // Progress bar should have proper ARIA attributes
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-label', '오늘의 작업 진행률')
    expect(progressBar).toHaveAttribute('aria-valuenow', '33')
    expect(progressBar).toHaveAttribute('aria-valuemin', '0')
    expect(progressBar).toHaveAttribute('aria-valuemax', '100')
    
    // Sections should have proper headings
    expect(screen.getByRole('heading', { name: '오늘의 진행상황' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '오늘의 작업' })).toBeInTheDocument()
  })

  it('should update in real-time', async () => {
    const store = createTestStore()
    renderWithStore(<Dashboard />, store)
    
    // Simulate timer tick
    store.dispatch({ type: 'timer/updateRemaining', payload: 1140 }) // 19 minutes
    
    await waitFor(() => {
      expect(screen.getByText('19:00')).toBeInTheDocument()
    })
  })

  it('should handle task completion', async () => {
    const store = createTestStore()
    renderWithStore(<Dashboard />, store)
    
    // Simulate task completion
    store.dispatch({ 
      type: 'tasks/updateTaskStatus', 
      payload: { id: 'task-2', status: 'completed' }
    })
    
    await waitFor(() => {
      expect(screen.getByText('2 / 3')).toBeInTheDocument() // Updated completion count
    })
  })
})