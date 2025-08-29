import { configureStore } from '@reduxjs/toolkit'
import taskReducer from './taskSlice'
import timerReducer from './timerSlice'
import userReducer from './userSlice'
import analyticsReducer from './analyticsSlice'

export const store = configureStore({
  reducer: {
    tasks: taskReducer,
    timer: timerReducer,
    user: userReducer,
    analytics: analyticsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Date 객체를 허용하기 위한 설정
        ignoredActions: [
          'tasks/createTask',
          'tasks/updateTask',
          'tasks/toggleSubtask',
          'user/initializeUser',
          'user/updateUser',
          'user/loadUser',
          'user/updateLastActive',
          'analytics/addSession',
          'analytics/updateSession',
          'analytics/updateDailyStats',
          'analytics/updateStreak',
          'analytics/generateWeeklyInsight',
        ],
        ignoredPaths: [
          'tasks.tasks',
          'tasks.currentTask',
          'user.currentUser',
          'analytics.sessions',
          'analytics.dailyStats',
          'analytics.weeklyInsights',
        ],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// 타입이 지정된 hooks
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux'

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// 전역 스토어 접근을 위한 설정 (개발 환경에서만)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__REDUX_STORE__ = store
}