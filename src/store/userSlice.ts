import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { User, UserPreferences, UserSettings } from '../types'

export interface UserState {
  currentUser: User | null
  isAuthenticated: boolean
  energyLevel: 'low' | 'medium' | 'high'
  focusMode: boolean
  loading: boolean
  error: string | null
}

const defaultPreferences: UserPreferences = {
  defaultFocusDuration: 25,
  defaultBreakDuration: 10,
  preferredTaskCategories: ['업무', '개인', '학습', '운동'],
  energyTrackingEnabled: true,
  notificationsEnabled: true,
}

const defaultSettings: UserSettings = {
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
}

const initialState: UserState = {
  currentUser: null,
  isAuthenticated: false,
  energyLevel: 'medium',
  focusMode: false,
  loading: false,
  error: null,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // 사용자 초기화 (첫 방문 시)
    initializeUser: (state, action: PayloadAction<{ name: string }>) => {
      const { name } = action.payload
      
      const newUser: User = {
        id: crypto.randomUUID(),
        name,
        preferences: defaultPreferences,
        settings: defaultSettings,
        createdAt: new Date(),
        lastActiveAt: new Date(),
      }
      
      state.currentUser = newUser
      state.isAuthenticated = true
    },

    // 사용자 정보 업데이트
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload }
        state.currentUser.lastActiveAt = new Date()
      }
    },

    // 사용자 설정 업데이트
    updateUserPreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      if (state.currentUser) {
        state.currentUser.preferences = {
          ...state.currentUser.preferences,
          ...action.payload,
        }
      }
    },

    // 사용자 설정 업데이트
    updateUserSettings: (state, action: PayloadAction<Partial<UserSettings>>) => {
      if (state.currentUser) {
        state.currentUser.settings = {
          ...state.currentUser.settings,
          ...action.payload,
        }
      }
    },

    // 집중 모드 설정 업데이트
    updateFocusSettings: (state, action: PayloadAction<Partial<UserSettings['focusMode']>>) => {
      if (state.currentUser) {
        state.currentUser.settings.focusMode = {
          ...state.currentUser.settings.focusMode,
          ...action.payload,
        }
      }
    },

    // 에너지 레벨 설정
    setEnergyLevel: (state, action: PayloadAction<'low' | 'medium' | 'high'>) => {
      state.energyLevel = action.payload
      
      // 사용자 정보에도 기록 (분석용)
      if (state.currentUser) {
        state.currentUser.lastActiveAt = new Date()
      }
    },

    // 집중 모드 토글
    toggleFocusMode: (state) => {
      state.focusMode = !state.focusMode
    },

    // 집중 모드 설정
    setFocusMode: (state, action: PayloadAction<boolean>) => {
      state.focusMode = action.payload
    },

    // 선호 카테고리 추가
    addPreferredCategory: (state, action: PayloadAction<string>) => {
      if (state.currentUser) {
        const category = action.payload
        if (!state.currentUser.preferences.preferredTaskCategories.includes(category)) {
          state.currentUser.preferences.preferredTaskCategories.push(category)
        }
      }
    },

    // 선호 카테고리 제거
    removePreferredCategory: (state, action: PayloadAction<string>) => {
      if (state.currentUser) {
        const category = action.payload
        state.currentUser.preferences.preferredTaskCategories = 
          state.currentUser.preferences.preferredTaskCategories.filter(c => c !== category)
      }
    },

    // 테마 변경
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      if (state.currentUser) {
        state.currentUser.settings.theme = action.payload
      }
    },

    // 언어 변경
    setLanguage: (state, action: PayloadAction<'ko' | 'en'>) => {
      if (state.currentUser) {
        state.currentUser.settings.language = action.payload
      }
    },

    // 알림 설정 토글
    toggleNotifications: (state) => {
      if (state.currentUser) {
        state.currentUser.preferences.notificationsEnabled = 
          !state.currentUser.preferences.notificationsEnabled
      }
    },

    // 에너지 추적 설정 토글
    toggleEnergyTracking: (state) => {
      if (state.currentUser) {
        state.currentUser.preferences.energyTrackingEnabled = 
          !state.currentUser.preferences.energyTrackingEnabled
      }
    },

    // 사용자 데이터 로드
    loadUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload
      state.isAuthenticated = true
      state.loading = false
    },

    // 로딩 상태 설정
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },

    // 오류 설정
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    // 사용자 로그아웃 (데이터 초기화)
    logout: (state) => {
      state.currentUser = null
      state.isAuthenticated = false
      state.energyLevel = 'medium'
      state.focusMode = false
      state.error = null
    },

    // 마지막 활동 시간 업데이트
    updateLastActive: (state) => {
      if (state.currentUser) {
        state.currentUser.lastActiveAt = new Date()
      }
    },
  },
})

export const {
  initializeUser,
  updateUser,
  updateUserPreferences,
  updateUserSettings,
  updateFocusSettings,
  setEnergyLevel,
  toggleFocusMode,
  setFocusMode,
  addPreferredCategory,
  removePreferredCategory,
  setTheme,
  setLanguage,
  toggleNotifications,
  toggleEnergyTracking,
  loadUser,
  setLoading,
  setError,
  logout,
  updateLastActive,
} = userSlice.actions

// 별칭 export
export const updatePreferences = updateUserPreferences

export default userSlice.reducer