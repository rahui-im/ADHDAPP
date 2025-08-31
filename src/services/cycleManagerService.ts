import { TimerState, TimerSettings, Session } from '../types'

export interface CycleData {
  currentCycle: number
  totalCycles: number
  cyclesUntilLongBreak: number
  isLongBreakTime: boolean
  nextMode: 'focus' | 'short-break' | 'long-break'
  completedSessions: Session[]
}

export class CycleManagerService {
  private static instance: CycleManagerService

  private constructor() {}

  static getInstance(): CycleManagerService {
    if (!CycleManagerService.instance) {
      CycleManagerService.instance = new CycleManagerService()
    }
    return CycleManagerService.instance
  }

  /**
   * 다음 모드 결정 (포모도로 완료 후)
   */
  determineNextMode(
    currentMode: TimerState['mode'],
    totalCycles: number,
    settings: TimerSettings
  ): {
    nextMode: TimerState['mode']
    isLongBreakTime: boolean
    cyclesUntilLongBreak: number
  } {
    if (currentMode === 'focus') {
      // 집중 시간 완료 후
      const completedCycles = totalCycles + 1
      const isLongBreakTime = completedCycles % settings.cyclesBeforeLongBreak === 0
      
      return {
        nextMode: isLongBreakTime ? 'long-break' : 'short-break',
        isLongBreakTime,
        cyclesUntilLongBreak: isLongBreakTime 
          ? settings.cyclesBeforeLongBreak 
          : settings.cyclesBeforeLongBreak - (completedCycles % settings.cyclesBeforeLongBreak)
      }
    } else {
      // 휴식 시간 완료 후 -> 항상 집중 시간
      return {
        nextMode: 'focus',
        isLongBreakTime: false,
        cyclesUntilLongBreak: settings.cyclesBeforeLongBreak - (totalCycles % settings.cyclesBeforeLongBreak)
      }
    }
  }

  /**
   * 사이클 데이터 계산
   */
  calculateCycleData(
    currentCycle: number,
    totalCycles: number,
    settings: TimerSettings,
    completedSessions: Session[] = []
  ): CycleData {
    const cyclesUntilLongBreak = settings.cyclesBeforeLongBreak - (totalCycles % settings.cyclesBeforeLongBreak)
    const isLongBreakTime = cyclesUntilLongBreak === 0

    return {
      currentCycle,
      totalCycles,
      cyclesUntilLongBreak: isLongBreakTime ? settings.cyclesBeforeLongBreak : cyclesUntilLongBreak,
      isLongBreakTime,
      nextMode: isLongBreakTime ? 'long-break' : 'short-break',
      completedSessions
    }
  }

  /**
   * 긴 휴식 제안 메시지 생성
   */
  generateLongBreakSuggestion(totalCycles: number, settings: TimerSettings): {
    title: string
    message: string
    suggestions: string[]
  } {
    const completedSets = Math.floor(totalCycles / settings.cyclesBeforeLongBreak)
    
    return {
      title: `🎉 ${settings.cyclesBeforeLongBreak}회 포모도로 완료!`,
      message: `정말 훌륭해요! ${completedSets}세트를 완료했습니다. 이제 긴 휴식을 취할 시간이에요.`,
      suggestions: [
        '산책하기 또는 가벼운 운동',
        '좋아하는 음악 듣기',
        '간단한 스트레칭',
        '명상이나 깊은 호흡',
        '건강한 간식 먹기',
        '창밖 풍경 보기',
      ]
    }
  }

  /**
   * 사이클 진행률 계산 (0-100%)
   */
  calculateCycleProgress(totalCycles: number, settings: TimerSettings): number {
    const currentSetProgress = (totalCycles % settings.cyclesBeforeLongBreak) / settings.cyclesBeforeLongBreak
    return Math.round(currentSetProgress * 100)
  }

  /**
   * 오늘의 포모도로 통계 계산
   */
  calculateDailyStats(sessions: Session[]): {
    totalFocusTime: number // minutes
    totalBreakTime: number // minutes
    completedPomodoros: number
    averageSessionLength: number // minutes
    interruptionRate: number // percentage
  } {
    const today = new Date().toDateString()
    const todaySessions = sessions.filter(session => 
      session.startedAt.toDateString() === today
    )

    const focusSessions = todaySessions.filter(s => s.type === 'focus')
    const breakSessions = todaySessions.filter(s => s.type === 'break')

    const totalFocusTime = focusSessions.reduce((sum, s) => sum + s.actualDuration, 0)
    const totalBreakTime = breakSessions.reduce((sum, s) => sum + s.actualDuration, 0)
    const completedPomodoros = focusSessions.filter(s => s.completedAt).length
    const interruptedSessions = todaySessions.filter(s => s.wasInterrupted).length
    
    return {
      totalFocusTime,
      totalBreakTime,
      completedPomodoros,
      averageSessionLength: todaySessions.length > 0 
        ? Math.round((totalFocusTime + totalBreakTime) / todaySessions.length)
        : 0,
      interruptionRate: todaySessions.length > 0 
        ? Math.round((interruptedSessions / todaySessions.length) * 100)
        : 0
    }
  }

  /**
   * 주간 사이클 패턴 분석
   */
  analyzeWeeklyPattern(sessions: Session[]): {
    bestDayOfWeek: string
    bestTimeOfDay: number // hour (0-23)
    averageSessionsPerDay: number
    consistencyScore: number // 0-100
  } {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentSessions = sessions.filter(session => 
      session.startedAt >= oneWeekAgo
    )

    if (recentSessions.length === 0) {
      return {
        bestDayOfWeek: '데이터 없음',
        bestTimeOfDay: 9,
        averageSessionsPerDay: 0,
        consistencyScore: 0
      }
    }

    // 요일별 세션 수 계산
    const dayCount: { [key: string]: number } = {}
    const hourCount: { [key: number]: number } = {}
    const dailyCount: { [key: string]: number } = {}

    recentSessions.forEach(session => {
      const dayOfWeek = session.startedAt.toLocaleDateString('ko-KR', { weekday: 'long' })
      const hour = session.startedAt.getHours()
      const dateKey = session.startedAt.toDateString()

      dayCount[dayOfWeek] = (dayCount[dayOfWeek] || 0) + 1
      hourCount[hour] = (hourCount[hour] || 0) + 1
      dailyCount[dateKey] = (dailyCount[dateKey] || 0) + 1
    })

    // 가장 활발한 요일
    const bestDayOfWeek = Object.entries(dayCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '데이터 없음'

    // 가장 활발한 시간대
    const bestTimeOfDay = Object.entries(hourCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '9'

    // 일평균 세션 수
    const averageSessionsPerDay = recentSessions.length / 7

    // 일관성 점수 (매일 세션이 있으면 100점)
    const daysWithSessions = Object.keys(dailyCount).length
    const consistencyScore = Math.round((daysWithSessions / 7) * 100)

    return {
      bestDayOfWeek,
      bestTimeOfDay: parseInt(bestTimeOfDay),
      averageSessionsPerDay: Math.round(averageSessionsPerDay * 10) / 10,
      consistencyScore
    }
  }

  /**
   * 개인화된 사이클 추천
   */
  getPersonalizedRecommendations(
    sessions: Session[],
    settings: TimerSettings
  ): {
    recommendedCycleLength: number
    recommendedLongBreakDuration: number
    suggestions: string[]
  } {
    const recentSessions = sessions.slice(-20) // 최근 20개 세션
    const focusSessions = recentSessions.filter(s => s.type === 'focus')
    
    if (focusSessions.length === 0) {
      return {
        recommendedCycleLength: settings.cyclesBeforeLongBreak,
        recommendedLongBreakDuration: settings.longBreakDuration,
        suggestions: ['더 많은 데이터가 필요합니다']
      }
    }

    const averageCompletionRate = focusSessions.filter(s => !s.wasInterrupted).length / focusSessions.length
    const averageEnergyAfter = focusSessions.reduce((sum, s) => sum + s.energyAfter, 0) / focusSessions.length

    const suggestions: string[] = []
    let recommendedCycleLength = settings.cyclesBeforeLongBreak
    let recommendedLongBreakDuration = settings.longBreakDuration

    if (averageCompletionRate < 0.7) {
      recommendedCycleLength = Math.max(2, settings.cyclesBeforeLongBreak - 1) as 3
      suggestions.push('더 자주 긴 휴식을 취해보세요')
    }

    if (averageEnergyAfter < 3) {
      recommendedLongBreakDuration = Math.min(45, settings.longBreakDuration + 5) as 25
      suggestions.push('긴 휴식 시간을 늘려보세요')
    }

    if (averageCompletionRate > 0.9 && averageEnergyAfter > 3.5) {
      recommendedCycleLength = Math.min(6, settings.cyclesBeforeLongBreak + 1) as 3
      suggestions.push('더 긴 사이클에 도전해보세요')
    }

    return {
      recommendedCycleLength,
      recommendedLongBreakDuration,
      suggestions: suggestions.length > 0 ? suggestions : ['현재 설정이 잘 맞는 것 같아요!']
    }
  }
}

export const cycleManagerService = CycleManagerService.getInstance()