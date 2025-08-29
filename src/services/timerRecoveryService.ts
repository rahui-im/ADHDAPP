import { TimerState } from '../types'
import { timerService } from './timerService'

interface TimerRecoveryData extends TimerState {
  lastStartTime?: number
  savedAt: number
  tabId: string
  wasVisible: boolean
}

export class TimerRecoveryService {
  private static instance: TimerRecoveryService
  private tabId: string
  private visibilityChangeHandler: (() => void) | null = null
  private beforeUnloadHandler: ((event: BeforeUnloadEvent) => void) | null = null
  private storageKey = 'timerRecoveryData'

  private constructor() {
    this.tabId = this.generateTabId()
    this.setupEventListeners()
  }

  static getInstance(): TimerRecoveryService {
    if (!TimerRecoveryService.instance) {
      TimerRecoveryService.instance = new TimerRecoveryService()
    }
    return TimerRecoveryService.instance
  }

  /**
   * 고유한 탭 ID 생성
   */
  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    // 페이지 가시성 변경 감지 (탭 전환)
    this.visibilityChangeHandler = () => {
      this.handleVisibilityChange()
    }
    document.addEventListener('visibilitychange', this.visibilityChangeHandler)

    // 페이지 언로드 전 상태 저장
    this.beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      this.handleBeforeUnload(event)
    }
    window.addEventListener('beforeunload', this.beforeUnloadHandler)

    // 페이지 로드 시 복구 시도
    this.attemptRecovery()
  }

  /**
   * 이벤트 리스너 정리
   */
  cleanup(): void {
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler)
      this.visibilityChangeHandler = null
    }

    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler)
      this.beforeUnloadHandler = null
    }
  }

  /**
   * 타이머 상태 저장 (향상된 버전)
   */
  saveTimerState(state: TimerState & { lastStartTime?: number }): void {
    try {
      const recoveryData: TimerRecoveryData = {
        ...state,
        savedAt: Date.now(),
        tabId: this.tabId,
        wasVisible: !document.hidden,
      }

      // 로컬 스토리지에 저장
      localStorage.setItem(this.storageKey, JSON.stringify(recoveryData))

      // 세션 스토리지에도 백업 저장 (탭별 격리)
      sessionStorage.setItem(`${this.storageKey}_${this.tabId}`, JSON.stringify(recoveryData))
    } catch (error) {
      console.warn('Failed to save timer recovery data:', error)
    }
  }

  /**
   * 타이머 상태 복구
   */
  restoreTimerState(): (TimerState & { lastStartTime?: number }) | null {
    try {
      // 먼저 세션 스토리지에서 시도 (현재 탭 전용)
      const sessionData = this.tryRestoreFromSession()
      if (sessionData) {
        return this.processRecoveryData(sessionData)
      }

      // 로컬 스토리지에서 시도
      const localData = this.tryRestoreFromLocal()
      if (localData) {
        return this.processRecoveryData(localData)
      }

      return null
    } catch (error) {
      console.warn('Failed to restore timer state:', error)
      this.clearAllSavedStates()
      return null
    }
  }

  /**
   * 세션 스토리지에서 복구 시도
   */
  private tryRestoreFromSession(): TimerRecoveryData | null {
    const sessionKey = `${this.storageKey}_${this.tabId}`
    const saved = sessionStorage.getItem(sessionKey)
    
    if (!saved) return null

    const data = JSON.parse(saved) as TimerRecoveryData
    
    // 5분 이상 지난 데이터는 무시
    if (Date.now() - data.savedAt > 5 * 60 * 1000) {
      sessionStorage.removeItem(sessionKey)
      return null
    }

    return data
  }

  /**
   * 로컬 스토리지에서 복구 시도
   */
  private tryRestoreFromLocal(): TimerRecoveryData | null {
    const saved = localStorage.getItem(this.storageKey)
    
    if (!saved) return null

    const data = JSON.parse(saved) as TimerRecoveryData
    
    // 10분 이상 지난 데이터는 무시
    if (Date.now() - data.savedAt > 10 * 60 * 1000) {
      localStorage.removeItem(this.storageKey)
      return null
    }

    return data
  }

  /**
   * 복구 데이터 처리
   */
  private processRecoveryData(data: TimerRecoveryData): TimerState & { lastStartTime?: number } {
    const now = Date.now()
    const elapsed = Math.floor((now - data.savedAt) / 1000)

    // 타이머가 실행 중이었다면 경과 시간 계산
    if (data.isRunning && data.lastStartTime) {
      const totalElapsed = Math.floor((now - data.lastStartTime) / 1000)
      const newRemaining = Math.max(0, data.remaining - totalElapsed)

      return {
        ...data,
        remaining: newRemaining,
        isRunning: newRemaining > 0,
        isPaused: newRemaining > 0 ? data.isPaused : false,
        lastStartTime: newRemaining > 0 ? data.lastStartTime : undefined,
      }
    }

    // 일시정지 상태였다면 그대로 복구
    if (data.isPaused) {
      return {
        ...data,
        isRunning: false,
        isPaused: true,
      }
    }

    return data
  }

  /**
   * 페이지 가시성 변경 처리 (탭 전환)
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      // 탭이 숨겨짐 - 백그라운드 모드
      this.handleTabHidden()
    } else {
      // 탭이 다시 보임 - 포그라운드 모드
      this.handleTabVisible()
    }
  }

  /**
   * 탭이 숨겨질 때 처리
   */
  private handleTabHidden(): void {
    // 현재 상태를 저장하여 백그라운드에서도 타이머 추적 가능
    const currentState = this.getCurrentTimerState()
    if (currentState) {
      this.saveTimerState({
        ...currentState,
        lastStartTime: currentState.isRunning ? Date.now() : undefined,
      })
    }
  }

  /**
   * 탭이 다시 보일 때 처리
   */
  private handleTabVisible(): void {
    // 백그라운드에서 경과된 시간을 고려하여 상태 업데이트
    const recoveredState = this.restoreTimerState()
    if (recoveredState && recoveredState.isRunning) {
      // 타이머가 백그라운드에서 계속 실행되었다면 Redux 상태 동기화
      this.syncWithReduxState(recoveredState)
    }
  }

  /**
   * 페이지 언로드 전 처리
   */
  private handleBeforeUnload(event: BeforeUnloadEvent): void {
    const currentState = this.getCurrentTimerState()
    if (currentState && currentState.isRunning) {
      // 타이머 실행 중이면 상태 저장
      this.saveTimerState({
        ...currentState,
        lastStartTime: Date.now(),
      })

      // 사용자에게 경고 표시 (선택사항)
      const message = '타이머가 실행 중입니다. 페이지를 떠나시겠습니까?'
      event.returnValue = message
      return message
    }
  }

  /**
   * 복구 시도 (페이지 로드 시)
   */
  private attemptRecovery(): void {
    // 페이지 로드 후 잠시 대기하여 Redux 스토어가 초기화되도록 함
    setTimeout(() => {
      const recoveredState = this.restoreTimerState()
      if (recoveredState) {
        this.syncWithReduxState(recoveredState)
      }
    }, 100)
  }

  /**
   * 현재 타이머 상태 가져오기 (Redux에서)
   */
  private getCurrentTimerState(): (TimerState & { lastStartTime?: number }) | null {
    try {
      // Redux 스토어에서 현재 상태 가져오기
      const store = (window as any).__REDUX_STORE__
      if (store && store.getState) {
        const state = store.getState().timer
        return state || null
      }
      return null
    } catch (error) {
      console.warn('Failed to get current timer state:', error)
      return null
    }
  }

  /**
   * Redux 상태와 동기화
   */
  private syncWithReduxState(recoveredState: TimerState & { lastStartTime?: number }): void {
    try {
      // Redux 액션 디스패치를 통한 상태 동기화
      const store = (window as any).__REDUX_STORE__
      if (store && store.dispatch) {
        store.dispatch({
          type: 'timer/restoreTimerState',
          payload: recoveredState,
        })
      }
    } catch (error) {
      console.warn('Failed to sync with Redux state:', error)
    }
  }

  /**
   * 모든 저장된 상태 삭제
   */
  clearAllSavedStates(): void {
    try {
      localStorage.removeItem(this.storageKey)
      sessionStorage.removeItem(`${this.storageKey}_${this.tabId}`)
    } catch (error) {
      console.warn('Failed to clear saved states:', error)
    }
  }

  /**
   * 백그라운드 타이머 정확도 검증
   */
  validateBackgroundTimer(expectedRemaining: number, actualElapsed: number): boolean {
    const tolerance = 2 // 2초 허용 오차
    const calculatedRemaining = expectedRemaining - actualElapsed
    
    return Math.abs(calculatedRemaining - expectedRemaining) <= tolerance
  }

  /**
   * 타이머 복구 통계
   */
  getRecoveryStats(): {
    lastRecoveryTime: number | null
    recoveryCount: number
    failureCount: number
  } {
    try {
      const stats = localStorage.getItem('timerRecoveryStats')
      return stats ? JSON.parse(stats) : {
        lastRecoveryTime: null,
        recoveryCount: 0,
        failureCount: 0,
      }
    } catch (error) {
      return {
        lastRecoveryTime: null,
        recoveryCount: 0,
        failureCount: 0,
      }
    }
  }

  /**
   * 복구 통계 업데이트
   */
  updateRecoveryStats(success: boolean): void {
    try {
      const stats = this.getRecoveryStats()
      
      if (success) {
        stats.recoveryCount++
        stats.lastRecoveryTime = Date.now()
      } else {
        stats.failureCount++
      }

      localStorage.setItem('timerRecoveryStats', JSON.stringify(stats))
    } catch (error) {
      console.warn('Failed to update recovery stats:', error)
    }
  }
}

export const timerRecoveryService = TimerRecoveryService.getInstance()