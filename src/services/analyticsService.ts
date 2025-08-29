import { Session, DailyStats, WeeklyInsight, Task, DistractionType } from '../types'
import { IndexedDBManager } from './indexedDBService'
import { store } from '../store'
import { addSession, updateDailyStats, generateWeeklyInsight, updateStreak } from '../store/analyticsSlice'

// 분석 서비스 클래스
export class AnalyticsService {
  private dbManager: IndexedDBManager
  private sessionStartTimes: Map<string, Date> = new Map()

  constructor() {
    this.dbManager = new IndexedDBManager()
  }

  // 세션 시작 기록
  async startSession(taskId: string, type: 'focus' | 'break', plannedDuration: number, energyBefore: number): Promise<string> {
    const sessionId = crypto.randomUUID()
    const startTime = new Date()
    
    // 메모리에 시작 시간 저장 (정확한 시간 추적을 위해)
    this.sessionStartTimes.set(sessionId, startTime)
    
    const session: Omit<Session, 'id'> = {
      taskId,
      type,
      plannedDuration,
      actualDuration: 0,
      startedAt: startTime,
      wasInterrupted: false,
      interruptionReasons: [],
      energyBefore,
      energyAfter: energyBefore, // 초기값
    }
    
    // Redux 스토어에 추가
    store.dispatch(addSession(session))
    
    return sessionId
  }

  // 세션 완료 기록
  async completeSession(
    sessionId: string, 
    energyAfter: number, 
    wasInterrupted: boolean = false,
    interruptionReasons: DistractionType[] = []
  ): Promise<void> {
    const startTime = this.sessionStartTimes.get(sessionId)
    if (!startTime) {
      console.warn(`세션 시작 시간을 찾을 수 없습니다: ${sessionId}`)
      return
    }

    const endTime = new Date()
    const actualDuration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) // 분 단위

    // 세션 업데이트
    const state = store.getState()
    const session = state.analytics.sessions.find(s => s.id === sessionId)
    
    if (session) {
      const updatedSession: Session = {
        ...session,
        actualDuration,
        completedAt: endTime,
        energyAfter,
        wasInterrupted,
        interruptionReasons,
      }

      // IndexedDB에 저장
      await this.dbManager.sessions.saveSession(updatedSession)
      
      // 메모리에서 시작 시간 제거
      this.sessionStartTimes.delete(sessionId)
      
      // 일일 통계 업데이트
      await this.updateDailyStatsForDate(endTime)
    }
  }

  // 세션 중단 기록
  async interruptSession(sessionId: string, distractionType: DistractionType): Promise<void> {
    const state = store.getState()
    const session = state.analytics.sessions.find(s => s.id === sessionId)
    
    if (session) {
      const updatedReasons = [...session.interruptionReasons, distractionType]
      
      const updatedSession: Session = {
        ...session,
        wasInterrupted: true,
        interruptionReasons: updatedReasons,
      }

      // IndexedDB에 업데이트
      await this.dbManager.sessions.saveSession(updatedSession)
    }
  }

  // 일일 통계 계산 및 저장
  async updateDailyStatsForDate(date: Date): Promise<DailyStats> {
    const dateStr = date.toDateString()
    
    // 해당 날짜의 모든 세션 조회
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    
    const daySessions = await this.dbManager.sessions.getSessionsByDateRange(startOfDay, endOfDay)
    
    // 해당 날짜의 작업 정보 (Redux에서 조회)
    const state = store.getState()
    const todayTasks = state.tasks.tasks.filter(task => {
      const taskDate = task.scheduledFor || task.createdAt
      return taskDate.toDateString() === dateStr
    })
    
    const completedTasks = todayTasks.filter(task => 
      task.status === 'completed' && 
      task.completedAt?.toDateString() === dateStr
    )

    // 집중 세션과 휴식 세션 분리
    const focusSessions = daySessions.filter(s => s.type === 'focus' && s.completedAt)
    const breakSessions = daySessions.filter(s => s.type === 'break' && s.completedAt)
    
    // 통계 계산
    const dailyStats: DailyStats = {
      date,
      tasksCompleted: completedTasks.length,
      tasksPlanned: todayTasks.length,
      focusMinutes: focusSessions.reduce((sum, s) => sum + s.actualDuration, 0),
      breakMinutes: breakSessions.reduce((sum, s) => sum + s.actualDuration, 0),
      pomodorosCompleted: focusSessions.length,
      averageEnergyLevel: focusSessions.length > 0 
        ? focusSessions.reduce((sum, s) => sum + (s.energyBefore + s.energyAfter) / 2, 0) / focusSessions.length
        : 3,
      distractions: daySessions.flatMap(s => s.interruptionReasons),
    }

    // IndexedDB에 저장
    await this.dbManager.stats.saveDailyStats(dailyStats)
    
    // Redux 스토어 업데이트
    store.dispatch(updateDailyStats(date))
    
    // 연속 달성 일수 업데이트
    const completionRate = dailyStats.tasksPlanned > 0 
      ? (dailyStats.tasksCompleted / dailyStats.tasksPlanned) * 100 
      : 0
    const goalAchieved = completionRate >= 70 // 70% 이상 완료 시 목표 달성
    
    store.dispatch(updateStreak({ completed: goalAchieved, date }))
    
    return dailyStats
  }

  // 주간 인사이트 생성
  async generateWeeklyInsight(weekStart: Date): Promise<WeeklyInsight> {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    
    // 해당 주의 일일 통계들 조회
    const weekStats = await this.dbManager.stats.getStatsInRange(weekStart, weekEnd)
    
    if (weekStats.length === 0) {
      // 기본 인사이트 반환
      const defaultInsight: WeeklyInsight = {
        weekStart,
        completionRate: 0,
        mostProductiveDay: '데이터 없음',
        mostProductiveHour: 14,
        improvementSuggestions: ['더 많은 데이터가 필요합니다'],
        goalAchievement: false,
      }
      
      await this.dbManager.stats.saveWeeklyInsight(defaultInsight)
      return defaultInsight
    }

    // 완료율 계산
    const totalPlanned = weekStats.reduce((sum, stat) => sum + stat.tasksPlanned, 0)
    const totalCompleted = weekStats.reduce((sum, stat) => sum + stat.tasksCompleted, 0)
    const completionRate = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0
    
    // 가장 생산적인 날 찾기
    const mostProductiveDay = weekStats.reduce((max, stat) => 
      stat.focusMinutes > max.focusMinutes ? stat : max,
      weekStats[0]
    ).date.toLocaleDateString('ko-KR', { weekday: 'long' })
    
    // 가장 생산적인 시간대 분석 (세션 데이터 기반)
    const mostProductiveHour = await this.calculateMostProductiveHour(weekStart, weekEnd)
    
    // 개선 제안 생성
    const improvementSuggestions = this.generateImprovementSuggestions(weekStats, completionRate)
    
    const weeklyInsight: WeeklyInsight = {
      weekStart,
      completionRate,
      mostProductiveDay,
      mostProductiveHour,
      improvementSuggestions,
      goalAchievement: completionRate >= 70,
    }

    // 저장
    await this.dbManager.stats.saveWeeklyInsight(weeklyInsight)
    store.dispatch(generateWeeklyInsight(weekStart))
    
    return weeklyInsight
  }

  // 가장 생산적인 시간대 계산
  private async calculateMostProductiveHour(startDate: Date, endDate: Date): Promise<number> {
    const sessions = await this.dbManager.sessions.getSessionsByDateRange(startDate, endDate)
    const focusSessions = sessions.filter(s => s.type === 'focus' && s.completedAt)
    
    if (focusSessions.length === 0) return 14 // 기본값: 오후 2시
    
    // 시간대별 집중 시간 합계
    const hourlyFocus: Record<number, number> = {}
    
    focusSessions.forEach(session => {
      const hour = session.startedAt.getHours()
      hourlyFocus[hour] = (hourlyFocus[hour] || 0) + session.actualDuration
    })
    
    // 가장 많은 집중 시간을 가진 시간대 찾기
    const mostProductiveHour = Object.entries(hourlyFocus)
      .reduce((max, [hour, minutes]) => 
        minutes > max.minutes ? { hour: parseInt(hour), minutes } : max,
        { hour: 14, minutes: 0 }
      ).hour
    
    return mostProductiveHour
  }

  // 개선 제안 생성
  private generateImprovementSuggestions(weekStats: DailyStats[], completionRate: number): string[] {
    const suggestions: string[] = []
    
    // 완료율 기반 제안
    if (completionRate < 30) {
      suggestions.push('목표를 더 현실적으로 설정해보세요. 작은 성공부터 시작하는 것이 중요합니다.')
    } else if (completionRate < 50) {
      suggestions.push('작업을 더 작은 단위로 나누어 보세요. 15-25분 단위가 ADHD에게 적합합니다.')
    } else if (completionRate < 70) {
      suggestions.push('좋은 진전이에요! 집중 모드를 더 자주 활용해보세요.')
    }
    
    // 주의산만 분석
    const avgDistractions = weekStats.reduce((sum, stat) => sum + stat.distractions.length, 0) / weekStats.length
    if (avgDistractions > 5) {
      suggestions.push('주의산만이 많이 발생하고 있어요. 집중 환경을 개선해보세요.')
    } else if (avgDistractions > 3) {
      suggestions.push('호흡 운동이나 짧은 스트레칭을 통해 집중력을 회복해보세요.')
    }
    
    // 집중 시간 분석
    const avgFocusTime = weekStats.reduce((sum, stat) => sum + stat.focusMinutes, 0) / weekStats.length
    if (avgFocusTime < 30) {
      suggestions.push('하루 최소 30분 집중 시간을 목표로 해보세요.')
    } else if (avgFocusTime < 60) {
      suggestions.push('집중 시간이 늘어나고 있어요! 1시간을 목표로 도전해보세요.')
    } else if (avgFocusTime >= 120) {
      suggestions.push('훌륭한 집중력이에요! 휴식도 충분히 취하는 것을 잊지 마세요.')
    }
    
    // 에너지 레벨 분석
    const avgEnergyLevel = weekStats.reduce((sum, stat) => sum + stat.averageEnergyLevel, 0) / weekStats.length
    if (avgEnergyLevel < 2.5) {
      suggestions.push('에너지 레벨이 낮아 보여요. 충분한 휴식과 수면을 취하세요.')
    } else if (avgEnergyLevel > 4) {
      suggestions.push('높은 에너지를 잘 활용하고 있어요! 이 패턴을 유지해보세요.')
    }
    
    // 일관성 분석
    const activeDays = weekStats.filter(stat => stat.focusMinutes > 0).length
    if (activeDays < 3) {
      suggestions.push('일주일에 최소 3일은 집중 시간을 가져보세요.')
    } else if (activeDays >= 5) {
      suggestions.push('꾸준한 활동이 인상적이에요! 이 습관을 계속 유지하세요.')
    }
    
    // 기본 제안이 없으면 격려 메시지
    if (suggestions.length === 0) {
      suggestions.push('좋은 패턴을 유지하고 있어요! 계속해서 자신만의 리듬을 찾아가세요.')
    }
    
    return suggestions.slice(0, 3) // 최대 3개 제안
  }

  // 특정 기간의 통계 조회
  async getStatsForPeriod(startDate: Date, endDate: Date): Promise<DailyStats[]> {
    return this.dbManager.stats.getStatsInRange(startDate, endDate)
  }

  // 특정 작업의 세션 기록 조회
  async getTaskSessions(taskId: string): Promise<Session[]> {
    return this.dbManager.sessions.getSessionsByTask(taskId)
  }

  // 최근 세션 조회
  async getRecentSessions(days: number = 7): Promise<Session[]> {
    return this.dbManager.sessions.getRecentSessions(days)
  }

  // 데이터 정리
  async cleanupOldData(retentionDays: number = 30): Promise<void> {
    await this.dbManager.cleanup({
      sessionRetentionDays: retentionDays,
      statsRetentionDays: retentionDays * 3, // 통계는 더 오래 보관
      enableCompression: true,
    })
  }

  // 분석 서비스 상태 확인
  async getServiceStatus(): Promise<{
    available: boolean
    sessionCount: number
    statsCount: number
    lastUpdate: Date | null
  }> {
    try {
      const status = await this.dbManager.getStatus()
      const recentSessions = await this.getRecentSessions(1)
      const lastUpdate = recentSessions.length > 0 
        ? recentSessions[recentSessions.length - 1].startedAt 
        : null

      return {
        available: status.available,
        sessionCount: status.sessionCount,
        statsCount: status.statsCount,
        lastUpdate,
      }
    } catch (error) {
      console.error('분석 서비스 상태 확인 실패:', error)
      return {
        available: false,
        sessionCount: 0,
        statsCount: 0,
        lastUpdate: null,
      }
    }
  }
}

// 싱글톤 인스턴스
export const analyticsService = new AnalyticsService()