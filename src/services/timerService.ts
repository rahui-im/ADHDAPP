import { TimerState, Session, DistractionType } from '../types'

export class TimerService {
  private static instance: TimerService
  private intervalId: NodeJS.Timeout | null = null
  private onTickCallback: ((remaining: number) => void) | null = null
  private onCompleteCallback: (() => void) | null = null
  private startTime: number | null = null

  private constructor() {}

  static getInstance(): TimerService {
    if (!TimerService.instance) {
      TimerService.instance = new TimerService()
    }
    return TimerService.instance
  }

  /**
   * 타이머 시작
   */
  start(
    duration: number, // seconds
    onTick: (remaining: number) => void,
    onComplete: () => void
  ): void {
    if (this.intervalId) {
      this.stop()
    }

    this.onTickCallback = onTick
    this.onCompleteCallback = onComplete
    this.startTime = Date.now()

    let remaining = duration

    this.intervalId = setInterval(() => {
      remaining -= 1

      if (remaining <= 0) {
        this.complete()
      } else {
        this.onTickCallback?.(remaining)
      }
    }, 1000)

    // 즉시 첫 번째 틱 실행
    this.onTickCallback(remaining)
  }

  /**
   * 타이머 일시정지
   */
  pause(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * 타이머 재시작
   */
  resume(
    remaining: number,
    onTick: (remaining: number) => void,
    onComplete: () => void
  ): void {
    if (this.intervalId) {
      return // 이미 실행 중
    }

    this.onTickCallback = onTick
    this.onCompleteCallback = onComplete
    this.startTime = Date.now()

    let currentRemaining = remaining

    this.intervalId = setInterval(() => {
      currentRemaining -= 1

      if (currentRemaining <= 0) {
        this.complete()
      } else {
        this.onTickCallback?.(currentRemaining)
      }
    }, 1000)

    // 즉시 첫 번째 틱 실행
    this.onTickCallback(currentRemaining)
  }

  /**
   * 타이머 정지
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.onTickCallback = null
    this.onCompleteCallback = null
    this.startTime = null
  }

  /**
   * 타이머 완료 처리
   */
  private complete(): void {
    this.stop()
    this.onCompleteCallback?.()
  }

  /**
   * 타이머 실행 중인지 확인
   */
  isRunning(): boolean {
    return this.intervalId !== null
  }

  /**
   * 경과 시간 계산 (페이지 새로고침 등에서 복구용)
   */
  calculateElapsed(startTime: number): number {
    return Math.floor((Date.now() - startTime) / 1000)
  }

  /**
   * 타이머 상태를 로컬 스토리지에 저장
   */
  saveTimerState(state: TimerState & { lastStartTime?: number }): void {
    try {
      const timerData = {
        ...state,
        savedAt: Date.now(),
      }
      localStorage.setItem('timerState', JSON.stringify(timerData))
    } catch (error) {
      console.warn('Failed to save timer state:', error)
    }
  }

  /**
   * 로컬 스토리지에서 타이머 상태 복구
   */
  restoreTimerState(): (TimerState & { lastStartTime?: number }) | null {
    try {
      const saved = localStorage.getItem('timerState')
      if (!saved) return null

      const timerData = JSON.parse(saved)
      
      // 5분 이상 지난 데이터는 무시 (너무 오래된 상태)
      if (Date.now() - timerData.savedAt > 5 * 60 * 1000) {
        localStorage.removeItem('timerState')
        return null
      }

      return timerData
    } catch (error) {
      console.warn('Failed to restore timer state:', error)
      localStorage.removeItem('timerState')
      return null
    }
  }

  /**
   * 저장된 타이머 상태 삭제
   */
  clearSavedState(): void {
    localStorage.removeItem('timerState')
  }

  /**
   * 세션 데이터 생성
   */
  createSession(
    taskId: string,
    type: 'focus' | 'break',
    plannedDuration: number, // minutes
    actualDuration: number, // minutes
    wasInterrupted: boolean = false,
    interruptionReasons: DistractionType[] = []
  ): Session {
    return {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      type,
      plannedDuration,
      actualDuration,
      startedAt: new Date(Date.now() - actualDuration * 60 * 1000),
      completedAt: new Date(),
      wasInterrupted,
      interruptionReasons,
      energyBefore: 3, // 기본값, 실제로는 사용자 입력
      energyAfter: 3, // 기본값, 실제로는 사용자 입력
    }
  }

  /**
   * 시간 포맷팅 (MM:SS)
   */
  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  /**
   * 진행률 계산 (0-100)
   */
  calculateProgress(duration: number, remaining: number): number {
    if (duration <= 0) return 0
    return Math.max(0, Math.min(100, ((duration - remaining) / duration) * 100))
  }
}

export const timerService = TimerService.getInstance()