import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface OnboardingStep {
  id: string
  title: string
  description: string
  target?: string // CSS selector for highlighting
  completed: boolean
}

export interface OnboardingState {
  isFirstVisit: boolean
  isOnboardingActive: boolean
  currentStep: number
  completedSteps: string[]
  skipped: boolean
  completedAt?: string
  showKeyboardShortcuts: boolean
  preferences: {
    skipAnimation: boolean
    reducedMotion: boolean
  }
}

const initialState: OnboardingState = {
  isFirstVisit: true,
  isOnboardingActive: false,
  currentStep: 0,
  completedSteps: [],
  skipped: false,
  showKeyboardShortcuts: false,
  preferences: {
    skipAnimation: false,
    reducedMotion: false,
  },
}

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    startOnboarding: (state) => {
      state.isOnboardingActive = true
      state.currentStep = 0
      state.skipped = false
    },
    
    nextStep: (state) => {
      state.currentStep += 1
    },
    
    previousStep: (state) => {
      if (state.currentStep > 0) {
        state.currentStep -= 1
      }
    },
    
    goToStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload
    },
    
    completeStep: (state, action: PayloadAction<string>) => {
      if (!state.completedSteps.includes(action.payload)) {
        state.completedSteps.push(action.payload)
      }
    },
    
    skipOnboarding: (state) => {
      state.isOnboardingActive = false
      state.skipped = true
      state.isFirstVisit = false
    },
    
    completeOnboarding: (state) => {
      state.isOnboardingActive = false
      state.isFirstVisit = false
      state.completedAt = new Date().toISOString()
    },
    
    resetOnboarding: (state) => {
      state.isOnboardingActive = false
      state.currentStep = 0
      state.completedSteps = []
      state.skipped = false
      state.completedAt = undefined
    },
    
    toggleKeyboardShortcuts: (state) => {
      state.showKeyboardShortcuts = !state.showKeyboardShortcuts
    },
    
    setKeyboardShortcutsVisible: (state, action: PayloadAction<boolean>) => {
      state.showKeyboardShortcuts = action.payload
    },
    
    updatePreferences: (state, action: PayloadAction<Partial<OnboardingState['preferences']>>) => {
      state.preferences = {
        ...state.preferences,
        ...action.payload,
      }
    },
    
    setFirstVisit: (state, action: PayloadAction<boolean>) => {
      state.isFirstVisit = action.payload
    },
  },
})

export const {
  startOnboarding,
  nextStep,
  previousStep,
  goToStep,
  completeStep,
  skipOnboarding,
  completeOnboarding,
  resetOnboarding,
  toggleKeyboardShortcuts,
  setKeyboardShortcutsVisible,
  updatePreferences,
  setFirstVisit,
} = onboardingSlice.actions

export default onboardingSlice.reducer

// Selectors
export const selectIsFirstVisit = (state: { onboarding: OnboardingState }) => 
  state.onboarding.isFirstVisit

export const selectIsOnboardingActive = (state: { onboarding: OnboardingState }) => 
  state.onboarding.isOnboardingActive

export const selectCurrentStep = (state: { onboarding: OnboardingState }) => 
  state.onboarding.currentStep

export const selectCompletedSteps = (state: { onboarding: OnboardingState }) => 
  state.onboarding.completedSteps

export const selectShowKeyboardShortcuts = (state: { onboarding: OnboardingState }) => 
  state.onboarding.showKeyboardShortcuts

export const selectOnboardingPreferences = (state: { onboarding: OnboardingState }) => 
  state.onboarding.preferences