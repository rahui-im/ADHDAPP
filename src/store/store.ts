import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { 
  persistStore, 
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER
} from 'redux-persist'
import storage from 'redux-persist/lib/storage' // localStorage

import taskReducer from './taskSlice'
import timerReducer from './timerSlice'
import userReducer from './userSlice'
import analyticsReducer from './analyticsSlice'

// Persist configuration
const persistConfig = {
  key: 'adhd-time-manager',
  version: 1,
  storage,
  whitelist: ['tasks', 'user', 'analytics'], // timer state는 제외 (세션 기반)
  blacklist: ['timer'] // timer는 세션 중에만 유지
}

// Root reducer
const rootReducer = combineReducers({
  tasks: taskReducer,
  timer: timerReducer,
  user: userReducer,
  analytics: analyticsReducer,
})

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Redux Persist와 Date 객체를 위한 설정
        ignoredActions: [
          FLUSH,
          REHYDRATE,
          PAUSE,
          PERSIST,
          PURGE,
          REGISTER,
          'tasks/createTask',
          'tasks/updateTask',
          'tasks/toggleSubtask',
          'tasks/createTaskAsync/fulfilled',
          'tasks/updateTaskAsync/fulfilled',
          'user/initializeUser',
          'user/updateUser',
          'user/loadUser',
          'user/updateLastActive',
          'analytics/addSession',
          'analytics/updateSession',
          'analytics/updateDailyStats',
          'analytics/updateStreak',
          'analytics/generateWeeklyInsight',
          'timer/startTimer',
          'timer/pauseTimer',
          'timer/resumeTimer',
          'timer/stopTimer',
          'timer/completeTimer',
          'timer/updateRemaining',
          'timer/restoreTimerState',
        ],
        ignoredPaths: [
          'tasks.tasks',
          'tasks.currentTask',
          'user.currentUser',
          'analytics.sessions',
          'analytics.dailyStats',
          'analytics.weeklyInsights',
          'timer',
          '_persist',
        ],
      },
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// 타입이 지정된 hooks
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux'

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// 전역 스토어 접근을 위한 설정 (개발 환경에서만)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__REDUX_STORE__ = store
  (window as any).__REDUX_PERSISTOR__ = persistor
}