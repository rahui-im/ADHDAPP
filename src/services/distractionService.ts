import { DistractionType } from '../types'

export interface DistractionEvent {
  type: DistractionType
  timestamp: Date
  context?: {
    inactivityDuration?: number // minutes
    url?: string
    reason?: string
  }
}

export interface DistractionSettings {
  inactivityThreshold: number // minutes
  enableWebsiteBlocking: boolean
  enableNotificationBlocking: boolean
  enableGentleReminders: boolean
}

class DistractionService {
  private listeners: ((event: DistractionEvent) => void)[] = []
  private lastActivity: Date = new Date()
  private inactivityTimer: NodeJS.Timeout | null = null
  private settings: DistractionSettings = {
    inactivityThreshold: 15,
    enableWebsiteBlocking: false,
    enableNotificationBlocking: true,
    enableGentleReminders: true,
  }

  constructor() {
    this.initializeActivityTracking()
    this.initializeVisibilityTracking()
  }

  // 설정 업데이트
  updateSettings(newSettings: Partial<DistractionSettings>) {
    this.settings = { ...this.settings, ...newSettings }
    this.resetInactivityTimer()
  }

  // 이벤트 리스너 등록
  onDistraction(callback: (event: DistractionEvent) => void) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  // 주의산만 이벤트 발생
  private emitDistraction(event: DistractionEvent) {
    this.listeners.forEach(listener => listener(event))
  }

  // 활동 추적 초기화
  private initializeActivityTracking() {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    
    const handleActivity = () => {
      this.updateActivity()
    }

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // 초기 비활성 타이머 설정
    this.resetInactivityTimer()
  }

  // 페이지 가시성 추적 (탭 전환 감지)
  private initializeVisibilityTracking() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 페이지가 숨겨짐 (다른 탭으로 이동)
        this.emitDistraction({
          type: 'website',
          timestamp: new Date(),
          context: {
            reason: 'tab_switch'
          }
        })
      } else {
        // 페이지로 돌아옴
        this.updateActivity()
      }
    })
  }

  // 활동 업데이트
  private updateActivity() {
    this.lastActivity = new Date()
    this.resetInactivityTimer()
  }

  // 비활성 타이머 재설정
  private resetInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
    }

    this.inactivityTimer = setTimeout(() => {
      const inactivityDuration = (new Date().getTime() - this.lastActivity.getTime()) / (1000 * 60)
      
      if (inactivityDuration >= this.settings.inactivityThreshold) {
        this.emitDistraction({
          type: 'inactivity',
          timestamp: new Date(),
          context: {
            inactivityDuration: Math.round(inactivityDuration)
          }
        })
      }
    }, this.settings.inactivityThreshold * 60 * 1000) // 분을 밀리초로 변환
  }

  // 수동 주의산만 보고
  reportDistraction(type: DistractionType, context?: DistractionEvent['context']) {
    this.emitDistraction({
      type,
      timestamp: new Date(),
      context
    })
  }

  // 현재 비활성 시간 가져오기 (분 단위)
  getInactivityDuration(): number {
    return (new Date().getTime() - this.lastActivity.getTime()) / (1000 * 60)
  }

  // 마지막 활동 시간 가져오기
  getLastActivity(): Date {
    return this.lastActivity
  }

  // 서비스 정리
  destroy() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
    }
    this.listeners = []
  }
}

// 싱글톤 인스턴스
export const distractionService = new DistractionService()
export default distractionService