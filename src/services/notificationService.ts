import { TimerState } from '../types'

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
}

export interface NotificationPermissionResult {
  granted: boolean
  error?: string
}

class NotificationService {
  private isSupported: boolean
  private permission: NotificationPermission = 'default'

  constructor() {
    this.isSupported = 'Notification' in window
    if (this.isSupported) {
      this.permission = Notification.permission
    }
  }

  /**
   * 브라우저 알림 권한 요청
   */
  async requestPermission(): Promise<NotificationPermissionResult> {
    if (!this.isSupported) {
      return {
        granted: false,
        error: '이 브라우저는 알림을 지원하지 않습니다.'
      }
    }

    try {
      const permission = await Notification.requestPermission()
      this.permission = permission
      
      return {
        granted: permission === 'granted',
        error: permission === 'denied' ? '알림 권한이 거부되었습니다.' : undefined
      }
    } catch (error) {
      return {
        granted: false,
        error: '알림 권한 요청 중 오류가 발생했습니다.'
      }
    }
  }

  /**
   * 알림 권한 상태 확인
   */
  hasPermission(): boolean {
    return this.isSupported && this.permission === 'granted'
  }

  /**
   * 브라우저 알림 표시
   */
  private async showNotification(options: NotificationOptions): Promise<void> {
    if (!this.hasPermission()) {
      console.warn('알림 권한이 없습니다.')
      return
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false
      })

      // 알림 클릭 시 창 포커스
      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      // 자동 닫기 (requireInteraction이 false인 경우)
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close()
        }, 5000)
      }
    } catch (error) {
      console.error('알림 표시 중 오류:', error)
    }
  }

  /**
   * 포모도로 완료 알림
   */
  async notifyPomodoroComplete(timerState: TimerState, taskTitle?: string): Promise<void> {
    const isBreakTime = timerState.mode === 'focus'
    const cycleInfo = `${timerState.currentCycle}/${timerState.totalCycles}`
    
    let title: string
    let body: string

    if (isBreakTime) {
      title = '🍅 포모도로 완료!'
      body = taskTitle 
        ? `"${taskTitle}" 작업을 완료했습니다. 잠시 휴식을 취하세요. (${cycleInfo})`
        : `집중 시간이 끝났습니다. 잠시 휴식을 취하세요. (${cycleInfo})`
    } else {
      title = '⏰ 휴식 시간 완료!'
      body = '휴식이 끝났습니다. 다음 작업을 시작할 준비가 되었나요?'
    }

    await this.showNotification({
      title,
      body,
      tag: 'pomodoro-complete',
      requireInteraction: true,
      icon: '/icons/pomodoro-complete.png'
    })
  }

  /**
   * 휴식 시간 종료 알림
   */
  async notifyBreakComplete(isLongBreak: boolean = false): Promise<void> {
    const title = isLongBreak ? '🌟 긴 휴식 완료!' : '⏰ 휴식 시간 완료!'
    const body = isLongBreak 
      ? '긴 휴식이 끝났습니다. 새로운 포모도로 사이클을 시작해보세요!'
      : '짧은 휴식이 끝났습니다. 다음 집중 시간을 시작할 준비가 되었나요?'

    await this.showNotification({
      title,
      body,
      tag: 'break-complete',
      requireInteraction: true,
      icon: '/icons/break-complete.png'
    })
  }

  /**
   * 긴 휴식 제안 알림
   */
  async notifyLongBreakSuggestion(completedCycles: number): Promise<void> {
    await this.showNotification({
      title: '🎉 훌륭해요!',
      body: `${completedCycles}회 포모도로를 완료했습니다! 긴 휴식(20-30분)을 권장합니다.`,
      tag: 'long-break-suggestion',
      requireInteraction: true,
      icon: '/icons/achievement.png'
    })
  }

  /**
   * 작업 완료 축하 알림
   */
  async notifyTaskComplete(taskTitle: string, completedSubtasks: number): Promise<void> {
    await this.showNotification({
      title: '✅ 작업 완료!',
      body: `"${taskTitle}" 작업을 완료했습니다! ${completedSubtasks}개의 하위 작업을 모두 마쳤어요.`,
      tag: 'task-complete',
      requireInteraction: false,
      icon: '/icons/task-complete.png'
    })
  }

  /**
   * 집중력 회복 알림 (비활성 상태 감지 시)
   */
  async notifyFocusReminder(inactiveMinutes: number): Promise<void> {
    await this.showNotification({
      title: '💭 잠깐, 집중해볼까요?',
      body: `${inactiveMinutes}분 동안 활동이 없었습니다. 현재 작업으로 돌아가시겠어요?`,
      tag: 'focus-reminder',
      requireInteraction: true,
      silent: true, // 부드러운 알림
      icon: '/icons/focus-reminder.png'
    })
  }

  /**
   * 일일 목표 달성 알림
   */
  async notifyDailyGoalAchieved(completedTasks: number, totalTasks: number): Promise<void> {
    await this.showNotification({
      title: '🎯 오늘의 목표 달성!',
      body: `오늘 계획한 ${totalTasks}개 작업 중 ${completedTasks}개를 완료했습니다. 정말 잘하셨어요!`,
      tag: 'daily-goal',
      requireInteraction: false,
      icon: '/icons/goal-achieved.png'
    })
  }

  /**
   * 연속 달성 기록 알림
   */
  async notifyStreakAchievement(streakDays: number): Promise<void> {
    const milestones = [3, 7, 14, 30, 60, 100]
    const isMilestone = milestones.includes(streakDays)
    
    if (isMilestone) {
      await this.showNotification({
        title: '🔥 연속 달성 기록!',
        body: `${streakDays}일 연속으로 목표를 달성했습니다! 정말 대단해요!`,
        tag: 'streak-milestone',
        requireInteraction: false,
        icon: '/icons/streak-achievement.png'
      })
    }
  }

  /**
   * 에너지 레벨 체크 알림
   */
  async notifyEnergyCheck(): Promise<void> {
    await this.showNotification({
      title: '⚡ 에너지 체크',
      body: '현재 에너지 레벨은 어떤가요? 적절한 작업을 추천해드릴게요.',
      tag: 'energy-check',
      requireInteraction: true,
      silent: true,
      icon: '/icons/energy-check.png'
    })
  }

  /**
   * 모든 알림 비활성화
   */
  clearAllNotifications(): void {
    // 태그별로 기존 알림 제거
    const tags = [
      'pomodoro-complete',
      'break-complete', 
      'long-break-suggestion',
      'task-complete',
      'focus-reminder',
      'daily-goal',
      'streak-milestone',
      'energy-check'
    ]

    // 브라우저에서 지원하는 경우 태그별 알림 제거
    if ('getNotifications' in navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          if (registration.getNotifications) {
            tags.forEach(tag => {
              registration.getNotifications({ tag }).then(notifications => {
                notifications.forEach(notification => notification.close())
              })
            })
          }
        })
      })
    }
  }

  /**
   * 알림 설정 상태 확인
   */
  getNotificationStatus(): {
    supported: boolean
    permission: NotificationPermission
    enabled: boolean
  } {
    return {
      supported: this.isSupported,
      permission: this.permission,
      enabled: this.hasPermission()
    }
  }
}

// 싱글톤 인스턴스 생성
export const notificationService = new NotificationService()