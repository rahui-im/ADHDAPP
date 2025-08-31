import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TimerState, TimerSettings, TimerTemplate, TimerHistory, SoundSettings } from '../types'

export interface TimerSliceState extends TimerState {
  settings: TimerSettings
  isInitialized: boolean
  lastStartTime?: number
  templates: TimerTemplate[]
  currentTemplateId?: string
  history: TimerHistory[]
  soundSettings: SoundSettings
  customDuration?: number // Custom duration in minutes
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
  templates: [],
  history: [],
  soundSettings: {
    enabled: false,
    volume: 50,
    selectedSoundId: undefined,
    mixSounds: false,
    activeSounds: [],
    fadeInDuration: 2,
    fadeOutDuration: 2,
  },
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

    // 타이머 템플릿 관련 액션
    addTemplate: (state, action: PayloadAction<TimerTemplate>) => {
      state.templates.push(action.payload)
    },

    updateTemplate: (state, action: PayloadAction<{ id: string; updates: Partial<TimerTemplate> }>) => {
      const { id, updates } = action.payload
      const index = state.templates.findIndex(t => t.id === id)
      if (index !== -1) {
        state.templates[index] = { ...state.templates[index], ...updates }
      }
    },

    deleteTemplate: (state, action: PayloadAction<string>) => {
      state.templates = state.templates.filter(t => t.id !== action.payload)
    },

    applyTemplate: (state, action: PayloadAction<string>) => {
      const template = state.templates.find(t => t.id === action.payload)
      if (template) {
        state.currentTemplateId = template.id
        state.settings.focusDurations = [template.focusDuration, template.focusDuration, template.focusDuration]
        state.settings.shortBreakDurations = [template.shortBreakDuration, template.shortBreakDuration, template.shortBreakDuration]
        state.settings.longBreakDuration = template.longBreakDuration
        state.settings.cyclesBeforeLongBreak = template.cyclesBeforeLongBreak
        
        // Update current duration based on mode
        if (state.mode === 'focus') {
          state.duration = template.focusDuration * 60
        } else if (state.mode === 'short-break') {
          state.duration = template.shortBreakDuration * 60
        } else {
          state.duration = template.longBreakDuration * 60
        }
        
        if (!state.isRunning) {
          state.remaining = state.duration
        }
        
        // Update template usage stats
        template.lastUsedAt = new Date()
        template.usageCount++
      }
    },

    // 커스텀 시간 설정
    setCustomDuration: (state, action: PayloadAction<number>) => {
      const minutes = action.payload
      state.customDuration = minutes
      state.duration = minutes * 60
      if (!state.isRunning) {
        state.remaining = minutes * 60
      }
    },

    // 타이머 히스토리 관련 액션
    addHistory: (state, action: PayloadAction<TimerHistory>) => {
      state.history.unshift(action.payload) // Add to beginning
      // Keep only last 100 entries
      if (state.history.length > 100) {
        state.history = state.history.slice(0, 100)
      }
    },

    clearHistory: (state) => {
      state.history = []
    },

    // 사운드 설정 관련 액션
    updateSoundSettings: (state, action: PayloadAction<Partial<SoundSettings>>) => {
      state.soundSettings = { ...state.soundSettings, ...action.payload }
    },

    toggleSound: (state) => {
      state.soundSettings.enabled = !state.soundSettings.enabled
    },

    setVolume: (state, action: PayloadAction<number>) => {
      state.soundSettings.volume = Math.max(0, Math.min(100, action.payload))
    },

    selectSound: (state, action: PayloadAction<string | undefined>) => {
      state.soundSettings.selectedSoundId = action.payload
      if (action.payload && !state.soundSettings.activeSounds.includes(action.payload)) {
        if (state.soundSettings.mixSounds) {
          state.soundSettings.activeSounds.push(action.payload)
        } else {
          state.soundSettings.activeSounds = [action.payload]
        }
      }
    },

    toggleMixSounds: (state) => {
      state.soundSettings.mixSounds = !state.soundSettings.mixSounds
      if (!state.soundSettings.mixSounds && state.soundSettings.activeSounds.length > 1) {
        // Keep only the selected sound when disabling mix
        state.soundSettings.activeSounds = state.soundSettings.selectedSoundId 
          ? [state.soundSettings.selectedSoundId] 
          : []
      }
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
  addTemplate,
  updateTemplate,
  deleteTemplate,
  applyTemplate,
  setCustomDuration,
  addHistory,
  clearHistory,
  updateSoundSettings,
  toggleSound,
  setVolume,
  selectSound,
  toggleMixSounds,
} = timerSlice.actions

export default timerSlice.reducer