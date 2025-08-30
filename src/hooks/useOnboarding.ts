import { useState, useEffect } from 'react'

interface OnboardingState {
  hasCompletedOnboarding: boolean
  showOnboarding: boolean
  currentStep: number
  skippedSteps: string[]
}

interface OnboardingHook {
  hasCompletedOnboarding: boolean
  showOnboarding: boolean
  startOnboarding: () => void
  completeOnboarding: () => void
  skipOnboarding: () => void
  resetOnboarding: () => void
  isFirstVisit: boolean
}

const ONBOARDING_STORAGE_KEY = 'adhd-timer-onboarding'
const FIRST_VISIT_KEY = 'adhd-timer-first-visit'

export const useOnboarding = (): OnboardingHook => {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    hasCompletedOnboarding: false,
    showOnboarding: false,
    currentStep: 0,
    skippedSteps: []
  })

  const [isFirstVisit, setIsFirstVisit] = useState(true)

  // 초기 상태 로드
  useEffect(() => {
    const loadOnboardingState = () => {
      try {
        // 온보딩 완료 여부 확인
        const completedOnboarding = localStorage.getItem(ONBOARDING_STORAGE_KEY)
        const hasCompleted = completedOnboarding === 'true'

        // 첫 방문 여부 확인
        const firstVisitFlag = localStorage.getItem(FIRST_VISIT_KEY)
        const isFirst = firstVisitFlag !== 'true'

        setOnboardingState(prev => ({
          ...prev,
          hasCompletedOnboarding: hasCompleted,
          showOnboarding: isFirst && !hasCompleted
        }))

        setIsFirstVisit(isFirst)

        // 첫 방문 플래그 설정
        if (isFirst) {
          localStorage.setItem(FIRST_VISIT_KEY, 'true')
        }
      } catch (error) {
        console.warn('온보딩 상태 로드 실패:', error)
      }
    }

    loadOnboardingState()
  }, [])

  const startOnboarding = () => {
    setOnboardingState(prev => ({
      ...prev,
      showOnboarding: true,
      currentStep: 0
    }))
  }

  const completeOnboarding = () => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
      localStorage.setItem('onboarding-completed-at', new Date().toISOString())
      
      setOnboardingState(prev => ({
        ...prev,
        hasCompletedOnboarding: true,
        showOnboarding: false
      }))

      // 완료 이벤트 추적 (분석용)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'onboarding_completed', {
          event_category: 'user_engagement',
          event_label: 'first_time_user'
        })
      }
    } catch (error) {
      console.warn('온보딩 완료 상태 저장 실패:', error)
    }
  }

  const skipOnboarding = () => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'skipped')
      localStorage.setItem('onboarding-skipped-at', new Date().toISOString())
      
      setOnboardingState(prev => ({
        ...prev,
        hasCompletedOnboarding: true, // 건너뛰기도 완료로 간주
        showOnboarding: false
      }))

      // 건너뛰기 이벤트 추적 (분석용)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'onboarding_skipped', {
          event_category: 'user_engagement',
          event_label: 'first_time_user'
        })
      }
    } catch (error) {
      console.warn('온보딩 건너뛰기 상태 저장 실패:', error)
    }
  }

  const resetOnboarding = () => {
    try {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY)
      localStorage.removeItem('onboarding-completed-at')
      localStorage.removeItem('onboarding-skipped-at')
      
      setOnboardingState({
        hasCompletedOnboarding: false,
        showOnboarding: true,
        currentStep: 0,
        skippedSteps: []
      })
    } catch (error) {
      console.warn('온보딩 상태 리셋 실패:', error)
    }
  }

  return {
    hasCompletedOnboarding: onboardingState.hasCompletedOnboarding,
    showOnboarding: onboardingState.showOnboarding,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    isFirstVisit
  }
}

// 온보딩 관련 유틸리티 함수들
export const onboardingUtils = {
  /**
   * 온보딩 완료 여부 확인
   */
  hasCompletedOnboarding(): boolean {
    try {
      return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  },

  /**
   * 온보딩 완료 날짜 가져오기
   */
  getCompletionDate(): Date | null {
    try {
      const dateString = localStorage.getItem('onboarding-completed-at')
      return dateString ? new Date(dateString) : null
    } catch {
      return null
    }
  },

  /**
   * 온보딩 건너뛰기 여부 확인
   */
  wasSkipped(): boolean {
    try {
      return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'skipped'
    } catch {
      return false
    }
  },

  /**
   * 특정 기능의 도움말 표시 여부 확인
   */
  shouldShowFeatureHelp(featureName: string): boolean {
    try {
      const helpShownKey = `help-shown-${featureName}`
      return localStorage.getItem(helpShownKey) !== 'true'
    } catch {
      return true
    }
  },

  /**
   * 특정 기능의 도움말 표시 완료 마킹
   */
  markFeatureHelpShown(featureName: string): void {
    try {
      const helpShownKey = `help-shown-${featureName}`
      localStorage.setItem(helpShownKey, 'true')
    } catch (error) {
      console.warn(`기능 도움말 상태 저장 실패 (${featureName}):`, error)
    }
  },

  /**
   * 사용자의 ADHD 관련 설정 추천
   */
  getRecommendedSettings(): {
    timerDuration: number
    breakDuration: number
    enableNotifications: boolean
    enableEnergyTracking: boolean
  } {
    return {
      timerDuration: 25, // 표준 포모도로
      breakDuration: 5,  // 짧은 휴식
      enableNotifications: true,
      enableEnergyTracking: true
    }
  },

  /**
   * 첫 작업 생성을 위한 템플릿 제공
   */
  getStarterTasks(): Array<{
    title: string
    description: string
    estimatedDuration: number
    category: string
    priority: 'low' | 'medium' | 'high'
  }> {
    return [
      {
        title: '이메일 확인하기',
        description: '받은 편지함 정리 및 중요한 메일 답장',
        estimatedDuration: 15,
        category: '업무',
        priority: 'medium'
      },
      {
        title: '오늘 할 일 계획 세우기',
        description: '우선순위를 정하고 현실적인 목표 설정',
        estimatedDuration: 10,
        category: '계획',
        priority: 'high'
      },
      {
        title: '책상 정리하기',
        description: '작업 공간을 깔끔하게 정리하여 집중력 향상',
        estimatedDuration: 20,
        category: '정리',
        priority: 'low'
      }
    ]
  }
}

export default useOnboarding