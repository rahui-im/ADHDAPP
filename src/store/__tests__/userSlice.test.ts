import { configureStore } from '@reduxjs/toolkit'
import userReducer, {
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
} from '../userSlice'
import { User, UserPreferences, UserSettings } from '../../types'

describe('userSlice', () => {
  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    store = configureStore({
      reducer: {
        user: userReducer,
      },
    })
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().user
      
      expect(state.currentUser).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.energyLevel).toBe('medium')
      expect(state.focusMode).toBe(false)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('user initialization', () => {
    it('should initialize new user', () => {
      const userName = 'Test User'
      store.dispatch(initializeUser({ name: userName }))
      
      const state = store.getState().user
      expect(state.currentUser).toBeDefined()
      expect(state.currentUser?.name).toBe(userName)
      expect(state.isAuthenticated).toBe(true)
      expect(state.currentUser?.preferences).toBeDefined()
      expect(state.currentUser?.settings).toBeDefined()
      expect(state.currentUser?.createdAt).toBeInstanceOf(Date)
      expect(state.currentUser?.lastActiveAt).toBeInstanceOf(Date)
    })

    it('should initialize user with default preferences', () => {
      store.dispatch(initializeUser({ name: 'Test User' }))
      
      const state = store.getState().user
      const preferences = state.currentUser?.preferences
      
      expect(preferences?.defaultFocusDuration).toBe(25)
      expect(preferences?.defaultBreakDuration).toBe(10)
      expect(preferences?.preferredTaskCategories).toEqual(['업무', '개인', '학습', '운동'])
      expect(preferences?.energyTrackingEnabled).toBe(true)
      expect(preferences?.notificationsEnabled).toBe(true)
    })

    it('should initialize user with default settings', () => {
      store.dispatch(initializeUser({ name: 'Test User' }))
      
      const state = store.getState().user
      const settings = state.currentUser?.settings
      
      expect(settings?.theme).toBe('light')
      expect(settings?.language).toBe('ko')
      expect(settings?.timezone).toBe('Asia/Seoul')
      expect(settings?.focusMode).toBeDefined()
      expect(settings?.timer).toBeDefined()
    })
  })

  describe('user updates', () => {
    beforeEach(() => {
      store.dispatch(initializeUser({ name: 'Test User' }))
    })

    it('should update user information', () => {
      const updates = { name: 'Updated User' }
      store.dispatch(updateUser(updates))
      
      const state = store.getState().user
      expect(state.currentUser?.name).toBe('Updated User')
      expect(state.currentUser?.lastActiveAt).toBeInstanceOf(Date)
    })

    it('should update user preferences', () => {
      const preferences: Partial<UserPreferences> = {
        defaultFocusDuration: 45,
        defaultBreakDuration: 15,
      }
      
      store.dispatch(updateUserPreferences(preferences))
      
      const state = store.getState().user
      expect(state.currentUser?.preferences.defaultFocusDuration).toBe(45)
      expect(state.currentUser?.preferences.defaultBreakDuration).toBe(15)
      // Other preferences should remain unchanged
      expect(state.currentUser?.preferences.energyTrackingEnabled).toBe(true)
    })

    it('should update user settings', () => {
      const settings: Partial<UserSettings> = {
        theme: 'dark',
        language: 'en',
      }
      
      store.dispatch(updateUserSettings(settings))
      
      const state = store.getState().user
      expect(state.currentUser?.settings.theme).toBe('dark')
      expect(state.currentUser?.settings.language).toBe('en')
      // Other settings should remain unchanged
      expect(state.currentUser?.settings.timezone).toBe('Asia/Seoul')
    })

    it('should update focus settings', () => {
      const focusSettings = {
        hideNotifications: false,
        inactivityThreshold: 20,
      }
      
      store.dispatch(updateFocusSettings(focusSettings))
      
      const state = store.getState().user
      expect(state.currentUser?.settings.focusMode.hideNotifications).toBe(false)
      expect(state.currentUser?.settings.focusMode.inactivityThreshold).toBe(20)
      // Other focus settings should remain unchanged
      expect(state.currentUser?.settings.focusMode.showBreathingReminders).toBe(true)
    })
  })

  describe('energy level and focus mode', () => {
    beforeEach(() => {
      store.dispatch(initializeUser({ name: 'Test User' }))
    })

    it('should set energy level', () => {
      store.dispatch(setEnergyLevel('high'))
      
      const state = store.getState().user
      expect(state.energyLevel).toBe('high')
    })

    it('should update last active time when setting energy level', () => {
      const initialLastActive = store.getState().user.currentUser?.lastActiveAt
      
      // Wait a bit to ensure time difference
      setTimeout(() => {
        store.dispatch(setEnergyLevel('low'))
        
        const state = store.getState().user
        expect(state.currentUser?.lastActiveAt).not.toBe(initialLastActive)
      }, 10)
    })

    it('should toggle focus mode', () => {
      expect(store.getState().user.focusMode).toBe(false)
      
      store.dispatch(toggleFocusMode())
      expect(store.getState().user.focusMode).toBe(true)
      
      store.dispatch(toggleFocusMode())
      expect(store.getState().user.focusMode).toBe(false)
    })

    it('should set focus mode', () => {
      store.dispatch(setFocusMode(true))
      expect(store.getState().user.focusMode).toBe(true)
      
      store.dispatch(setFocusMode(false))
      expect(store.getState().user.focusMode).toBe(false)
    })
  })

  describe('preferred categories', () => {
    beforeEach(() => {
      store.dispatch(initializeUser({ name: 'Test User' }))
    })

    it('should add preferred category', () => {
      const newCategory = '건강'
      store.dispatch(addPreferredCategory(newCategory))
      
      const state = store.getState().user
      expect(state.currentUser?.preferences.preferredTaskCategories).toContain(newCategory)
    })

    it('should not add duplicate category', () => {
      const existingCategory = '업무'
      const initialLength = store.getState().user.currentUser?.preferences.preferredTaskCategories.length
      
      store.dispatch(addPreferredCategory(existingCategory))
      
      const state = store.getState().user
      expect(state.currentUser?.preferences.preferredTaskCategories.length).toBe(initialLength)
    })

    it('should remove preferred category', () => {
      const categoryToRemove = '업무'
      store.dispatch(removePreferredCategory(categoryToRemove))
      
      const state = store.getState().user
      expect(state.currentUser?.preferences.preferredTaskCategories).not.toContain(categoryToRemove)
    })
  })

  describe('theme and language', () => {
    beforeEach(() => {
      store.dispatch(initializeUser({ name: 'Test User' }))
    })

    it('should set theme', () => {
      store.dispatch(setTheme('dark'))
      
      const state = store.getState().user
      expect(state.currentUser?.settings.theme).toBe('dark')
    })

    it('should set language', () => {
      store.dispatch(setLanguage('en'))
      
      const state = store.getState().user
      expect(state.currentUser?.settings.language).toBe('en')
    })
  })

  describe('toggles', () => {
    beforeEach(() => {
      store.dispatch(initializeUser({ name: 'Test User' }))
    })

    it('should toggle notifications', () => {
      const initialNotifications = store.getState().user.currentUser?.preferences.notificationsEnabled
      
      store.dispatch(toggleNotifications())
      
      const state = store.getState().user
      expect(state.currentUser?.preferences.notificationsEnabled).toBe(!initialNotifications)
    })

    it('should toggle energy tracking', () => {
      const initialEnergyTracking = store.getState().user.currentUser?.preferences.energyTrackingEnabled
      
      store.dispatch(toggleEnergyTracking())
      
      const state = store.getState().user
      expect(state.currentUser?.preferences.energyTrackingEnabled).toBe(!initialEnergyTracking)
    })
  })

  describe('user loading and error handling', () => {
    it('should load user', () => {
      const mockUser: User = {
        id: 'user-1',
        name: 'Loaded User',
        preferences: {
          defaultFocusDuration: 30,
          defaultBreakDuration: 5,
          preferredTaskCategories: ['테스트'],
          energyTrackingEnabled: false,
          notificationsEnabled: false,
        },
        settings: {
          theme: 'dark',
          language: 'en',
          timezone: 'UTC',
          focusMode: {
            hideNotifications: true,
            blockDistractions: false,
            showBreathingReminders: false,
            inactivityThreshold: 10,
          },
          timer: {
            focusDurations: [20, 30, 40],
            shortBreakDurations: [5, 10, 15],
            longBreakDuration: 20,
            cyclesBeforeLongBreak: 4,
          },
        },
        createdAt: new Date('2024-01-01'),
        lastActiveAt: new Date('2024-01-02'),
      }
      
      store.dispatch(loadUser(mockUser))
      
      const state = store.getState().user
      expect(state.currentUser).toEqual(mockUser)
      expect(state.isAuthenticated).toBe(true)
      expect(state.loading).toBe(false)
    })

    it('should set loading state', () => {
      store.dispatch(setLoading(true))
      
      const state = store.getState().user
      expect(state.loading).toBe(true)
    })

    it('should set error state', () => {
      const errorMessage = 'Test error'
      store.dispatch(setError(errorMessage))
      
      const state = store.getState().user
      expect(state.error).toBe(errorMessage)
    })

    it('should logout user', () => {
      store.dispatch(initializeUser({ name: 'Test User' }))
      store.dispatch(setEnergyLevel('high'))
      store.dispatch(setFocusMode(true))
      store.dispatch(setError('Some error'))
      
      store.dispatch(logout())
      
      const state = store.getState().user
      expect(state.currentUser).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.energyLevel).toBe('medium')
      expect(state.focusMode).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should update last active time', () => {
      store.dispatch(initializeUser({ name: 'Test User' }))
      const initialLastActive = store.getState().user.currentUser?.lastActiveAt
      
      // Wait a bit to ensure time difference
      setTimeout(() => {
        store.dispatch(updateLastActive())
        
        const state = store.getState().user
        expect(state.currentUser?.lastActiveAt).not.toBe(initialLastActive)
      }, 10)
    })
  })

  describe('actions without user', () => {
    it('should not update preferences without user', () => {
      store.dispatch(updateUserPreferences({ defaultFocusDuration: 45 }))
      
      const state = store.getState().user
      expect(state.currentUser).toBeNull()
    })

    it('should not update settings without user', () => {
      store.dispatch(updateUserSettings({ theme: 'dark' }))
      
      const state = store.getState().user
      expect(state.currentUser).toBeNull()
    })

    it('should not add category without user', () => {
      store.dispatch(addPreferredCategory('새 카테고리'))
      
      const state = store.getState().user
      expect(state.currentUser).toBeNull()
    })
  })
})