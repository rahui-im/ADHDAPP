import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TimerState, TimerSettings } from '../types'

export interface TimerSliceState extends TimerState {
  settings: TimerSettings
  isInitialized: boolean
  lastStartTime?: number
}

const initialState: TimerSliceState = {
  mode: 'focus',
  duration: 25 * 60, // 25분 기본값 (초)
  remaining: 25 * 60,
  isRunning: false,
  isPaused: false,
  currentCycle: 1,
  totalCycles: 0,
  currentTaskId: undefined,
  settings: {
    focusDurations: [15, 25, 45],
    shortBreakDurations: [5, 10, 15],
    longBreakDuration: 25,
    cyclesBeforeLongBreak: 3,
  },
  isInitialized: false,
}

const timerSlice = createSlice({
  name: 'timer',
  initialState,
  reducers: {
    // 타이머 시작
    startTimer: (state, action: PayloadAction<{ taskId?: string; duration?: number }>) => {
      const { taskId, duration } = action.payload
      
      if (!state.isRunning) {
        state.isRunning = true
        state.isPaused = false
        state.lastStartTime = Date.now()
        
        if (taskId) {
          state.currentTaskId = taskId
        }
        
        if (duration) {
          state.duration = duration * 60 // 분을 초로 변환
          state.remaining = duration * 60
        }
      }
    },

    // 타이머 일시정지
    pauseTimer: (state) => {
      if (state.isRunning && !state.isPaused) {
        state.isPaused = true
        state.isRunning = false
      }
    },

    // 타이머 재시작
    resumeTimer: (state) => {
      if (state.isPaused) {
        state.isRunning = true
        state.isPaused = false
        state.lastStartTime = Date.now()
      }
    },

    // 타이머 정지
    stopTimer: (state) => {
      state.isRunning = false
      state.isPaused = false
      state.remaining = state.duration
      state.lastStartTime = undefined
    },

    // 타이머 리셋
    resetTimer: (state) => {
      state.isRunning = false
      state.isPaused = false
      state.remaining = state.duration
      state.currentCycle = 1
      state.totalCycles = 0
      state.currentTaskId = undefined
      state.lastStartTime = undefined
    },

    // 남은 시간 업데이트 (매초 호출)
    updateRemaining: (state, action: PayloadAction<number>) => {
      if (state.isRunning && !state.isPaused) {
        state.remaining = Math.max(0, action.payload)
      }
    },

    // 타이머 완료 처리
    completeTimer: (state) => {
      state.isRunning = false
      state.isPaused = false
      state.remaining = 0
      
      if (state.mode === 'focus') {
        // 집중 시간 완료
        state.totalCycles += 1
        
        // 긴 휴식 시간인지 확인
        if (state.totalCycles % state.settings.cyclesBeforeLongBreak === 0) {
          state.mode = 'long-break'
          state.duration = state.settings.longBreakDuration * 60
        } else {
          state.mode = 'short-break'
          state.duration = state.settings.shortBreakDurations[1] * 60 // 기본 10분
        }
      } else {
        // 휴식 완료 후 집중 모드로
        const wasLongBreak = state.mode === 'long-break'
        state.mode = 'focus'
        state.duration = state.settings.focusDurations[1] * 60 // 기본 25분
        
        // 긴 휴식 후에는 새로운 사이클 시작
        if (wasLongBreak) {
          state.currentCycle = 1
        } else {
          state.currentCycle += 1
        }
      }
      
      state.remaining = state.duration
    },

    // 모드 변경 (focus, short-break, long-break)
    setMode: (state, action: PayloadAction<TimerState['mode']>) => {
      const mode = action.payload
      state.mode = mode
      
      // 모드에 따른 기본 시간 설정
      if (mode === 'focus') {
        state.duration = state.settings.focusDurations[1] * 60 // 25분
      } else if (mode === 'short-break') {
        state.duration = state.settings.shortBreakDurations[1] * 60 // 10분
      } else if (mode === 'long-break') {
        state.duration = state.settings.longBreakDuration * 60 // 25분
      }
      
      state.remaining = state.duration
    },

    // 집중 시간 설정
    setFocusDuration: (state, action: PayloadAction<15 | 25 | 45>) => {
      const duration = action.payload
      if (state.mode === 'focus') {
        state.duration = duration * 60
        if (!state.isRunning) {
          state.remaining = duration * 60
        }
      }
    },

    // 휴식 시간 설정
    setBreakDuration: (state, action: PayloadAction<5 | 10 | 15>) => {
      const duration = action.payload
      if (state.mode === 'short-break') {
        state.duration = duration * 60
        if (!state.isRunning) {
          state.remaining = duration * 60
        }
      }
    },

    // 타이머 설정 업데이트
    updateTimerSettings: (state, action: PayloadAction<Partial<TimerSettings>>) => {
      state.settings = { ...state.settings, ...action.payload }
    },

    // 현재 작업 ID 설정
    setCurrentTaskId: (state, action: PayloadAction<string | undefined>) => {
      state.currentTaskId = action.payload
    },

    // 타이머 상태 복구 (페이지 새로고침 등)
    restoreTimerState: (state, action: PayloadAction<Partial<TimerSliceState>>) => {
      const restoredState = action.payload
      
      // 실행 중이었다면 경과 시간 계산
      if (restoredState.isRunning && restoredState.lastStartTime) {
        const elapsed = Math.floor((Date.now() - restoredState.lastStartTime) / 1000)
        const newRemaining = Math.max(0, (restoredState.remaining || 0) - elapsed)
        
        Object.assign(state, restoredState, {
          remaining: newRemaining,
          isRunning: newRemaining > 0,
          lastStartTime: newRemaining > 0 ? Date.now() : undefined,
        })
      } else {
        Object.assign(state, restoredState)
      }
      
      state.isInitialized = true
    },

    // 초기화 완료 표시
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload
    },
  },
})

export const {
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  resetTimer,
  updateRemaining,
  completeTimer,
  setMode,
  setFocusDuration,
  setBreakDuration,
  updateTimerSettings,
  setCurrentTaskId,
  restoreTimerState,
  setInitialized,
} = timerSlice.actions

export default timerSlice.reducer