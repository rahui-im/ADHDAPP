import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import taskReducer from '../../store/taskSlice'
import timerReducer from '../../store/timerSlice'
import userReducer from '../../store/userSlice'
import analyticsReducer from '../../store/analyticsSlice'

// 테스트용 Redux store 생성
export const createTestStore = (preloadedState?: any) => {
  return configureStore({
    reducer: {
      tasks: taskReducer,
      timer: timerReducer,
      user: userReducer,
      analytics: analyticsReducer,
    },
    preloadedState,
  })
}

// 테스트용 Provider 래퍼
interface AllTheProvidersProps {
  children: React.ReactNode
  initialState?: any
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ 
  children, 
  initialState 
}) => {
  const store = createTestStore(initialState)
  
  return (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  )
}

// 커스텀 render 함수
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { initialState?: any }
) => {
  const { initialState, ...renderOptions } = options || {}
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders initialState={initialState}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })
}

// 테스트용 데이터 생성 헬퍼
export const createMockTask = (overrides = {}) => ({
  id: 'task-1',
  title: 'Test Task',
  description: 'Test Description',
  estimatedDuration: 25,
  actualDuration: null,
  priority: 'medium' as const,
  status: 'pending' as const,
  category: '업무',
  subtasks: [],
  energyLevel: 'medium' as const,
  isFlexible: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  completedAt: null,
  postponedCount: 0,
  ...overrides,
})

export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  preferences: {
    defaultFocusDuration: 25,
    defaultBreakDuration: 5,
    preferredTaskCategories: ['업무', '개인', '학습'],
    energyTrackingEnabled: true,
    notificationsEnabled: true,
  },
  settings: {
    theme: 'light' as const,
    language: 'ko',
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
      longBreakDuration: 25,
      cyclesBeforeLongBreak: 3,
    },
  },
  createdAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
  ...overrides,
})

export const createMockSession = (overrides = {}) => ({
  id: 'session-1',
  taskId: 'task-1',
  type: 'focus' as const,
  plannedDuration: 25,
  actualDuration: 25,
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  interrupted: false,
  interruptions: [],
  energyLevel: 'medium' as const,
  notes: '',
  ...overrides,
})

// 비동기 작업 대기 헬퍼
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// 테스트용 날짜 mock
export const mockDate = (date: string | Date) => {
  const RealDate = Date
  global.Date = class extends RealDate {
    constructor() {
      super()
      return new RealDate(date)
    }
    static now() {
      return new RealDate(date).getTime()
    }
  } as any
}

// Redux action 대기 헬퍼
export const waitForAction = (store: any, actionType: string) => {
  return new Promise((resolve) => {
    const unsubscribe = store.subscribe(() => {
      const actions = store.getState().lastAction
      if (actions && actions.type === actionType) {
        unsubscribe()
        resolve(actions)
      }
    })
  })
}

export * from '@testing-library/react'
export { customRender as render }