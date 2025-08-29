import { User, UserPreferences, UserSettings, TimerSettings } from '../types'

export class UserPreferencesService {
  private static readonly STORAGE_KEY = 'adhd_timer_user_preferences'
  private static readonly TIMER_DEFAULTS_KEY = 'adhd_timer_defaults'

  /**
   * 사용자 기본 타이머 설정 저장
   */
  static saveTimerDefaults(focusDuration: number, breakDuration: number): void {
    try {
      const defaults = {
        defaultFocusDuration: focusDuration,
        defaultBreakDuration: breakDuration,
        savedAt: Date.now(),
      }
      localStorage.setItem(this.TIMER_DEFAULTS_KEY, JSON.stringify(defaults))
    } catch (error) {
      console.warn('Failed to save timer defaults:', error)
    }
  }

  /**
   * 사용자 기본 타이머 설정 로드
   */
  static loadTimerDefaults(): { defaultFocusDuration: number; defaultBreakDuration: number } | null {
    try {
      const saved = localStorage.getItem(this.TIMER_DEFAULTS_KEY)
      if (!saved) return null

      const defaults = JSON.parse(saved)
      return {
        defaultFocusDuration: defaults.defaultFocusDuration || 25,
        defaultBreakDuration: defaults.defaultBreakDuration || 10,
      }
    } catch (error) {
      console.warn('Failed to load timer defaults:', error)
      return null
    }
  }

  /**
   * 전체 사용자 설정 저장
   */
  static saveUserPreferences(user: User): void {
    try {
      const userData = {
        ...user,
        savedAt: Date.now(),
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData))
    } catch (error) {
      console.warn('Failed to save user preferences:', error)
    }
  }

  /**
   * 전체 사용자 설정 로드
   */
  static loadUserPreferences(): User | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY)
      if (!saved) return null

      const userData = JSON.parse(saved)
      
      // 데이터 유효성 검사
      if (!userData.id || !userData.name) {
        return null
      }

      // Date 객체 복원
      userData.createdAt = new Date(userData.createdAt)
      userData.lastActiveAt = new Date(userData.lastActiveAt)

      return userData
    } catch (error) {
      console.warn('Failed to load user preferences:', error)
      return null
    }
  }

  /**
   * ADHD 맞춤형 추천 설정 생성
   */
  static getADHDRecommendedSettings(energyLevel: 'low' | 'medium' | 'high'): Partial<TimerSettings> {
    switch (energyLevel) {
      case 'low':
        return {
          focusDurations: [15, 25, 45],
          shortBreakDurations: [10, 15, 20], // 더 긴 휴식
          longBreakDuration: 30,
          cyclesBeforeLongBreak: 2, // 더 자주 긴 휴식
        }
      case 'high':
        return {
          focusDurations: [25, 45, 60],
          shortBreakDurations: [5, 10, 15],
          longBreakDuration: 20,
          cyclesBeforeLongBreak: 4, // 더 적은 긴 휴식
        }
      default: // medium
        return {
          focusDurations: [15, 25, 45],
          shortBreakDurations: [5, 10, 15],
          longBreakDuration: 25,
          cyclesBeforeLongBreak: 3,
        }
    }
  }

  /**
   * 사용 패턴 기반 설정 추천
   */
  static getPersonalizedRecommendations(
    completionRates: { [duration: number]: number },
    preferredTimes: number[]
  ): {
    recommendedFocusDuration: 15 | 25 | 45
    recommendedBreakDuration: 5 | 10 | 15
    suggestions: string[]
  } {
    const suggestions: string[] = []
    
    // 완료율이 가장 높은 집중 시간 찾기
    let bestFocusDuration: 15 | 25 | 45 = 25
    let bestCompletionRate = 0
    
    Object.entries(completionRates).forEach(([duration, rate]) => {
      const durationNum = Number(duration) as 15 | 25 | 45
      if (rate > bestCompletionRate && [15, 25, 45].includes(durationNum)) {
        bestCompletionRate = rate
        bestFocusDuration = durationNum
      }
    })

    // 추천 휴식 시간 (집중 시간의 1/3 ~ 1/2)
    let recommendedBreakDuration: 5 | 10 | 15 = 10
    if (bestFocusDuration <= 15) {
      recommendedBreakDuration = 5
    } else if (bestFocusDuration >= 45) {
      recommendedBreakDuration = 15
    }

    // 개인화된 제안 생성
    if (bestCompletionRate < 0.6) {
      suggestions.push('더 짧은 집중 시간으로 시작해보세요')
    }
    
    if (bestFocusDuration === 15) {
      suggestions.push('15분 집중에 익숙해지면 25분으로 늘려보세요')
    }
    
    if (preferredTimes.length > 0) {
      const avgTime = preferredTimes.reduce((a, b) => a + b, 0) / preferredTimes.length
      if (avgTime < 10) {
        suggestions.push('오전 시간대에 더 집중이 잘 되는 것 같아요')
      } else if (avgTime > 18) {
        suggestions.push('저녁 시간대 집중이 좋네요')
      }
    }

    return {
      recommendedFocusDuration: bestFocusDuration,
      recommendedBreakDuration,
      suggestions,
    }
  }

  /**
   * 설정 초기화
   */
  static resetToDefaults(): void {
    localStorage.removeItem(this.STORAGE_KEY)
    localStorage.removeItem(this.TIMER_DEFAULTS_KEY)
  }

  /**
   * 설정 내보내기 (JSON)
   */
  static exportSettings(): string | null {
    const user = this.loadUserPreferences()
    if (!user) return null

    return JSON.stringify({
      preferences: user.preferences,
      settings: user.settings,
      exportedAt: new Date().toISOString(),
    }, null, 2)
  }

  /**
   * 설정 가져오기 (JSON)
   */
  static importSettings(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      
      if (!data.preferences || !data.settings) {
        throw new Error('Invalid settings format')
      }

      const currentUser = this.loadUserPreferences()
      if (!currentUser) {
        throw new Error('No current user found')
      }

      const updatedUser: User = {
        ...currentUser,
        preferences: { ...currentUser.preferences, ...data.preferences },
        settings: { ...currentUser.settings, ...data.settings },
        lastActiveAt: new Date(),
      }

      this.saveUserPreferences(updatedUser)
      return true
    } catch (error) {
      console.error('Failed to import settings:', error)
      return false
    }
  }
}

export const userPreferencesService = UserPreferencesService