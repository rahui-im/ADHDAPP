import { DailyStats, WeeklyInsight, Task, Session } from '../types'
import { AnalysisInsights } from './patternAnalysisService'
import { analyticsService } from './analyticsService'
import { patternAnalysisService } from './patternAnalysisService'

// 리포트 타입 정의
export interface WeeklyReport {
  id: string
  weekStart: Date
  weekEnd: Date
  generatedAt: Date
  summary: {
    totalFocusTime: number
    tasksCompleted: number
    tasksPlanned: number
    completionRate: number
    pomodorosCompleted: number
    averageEnergyLevel: number
  }
  achievements: Achievement[]
  insights: AnalysisInsights
  improvements: ImprovementArea[]
  nextWeekGoals: Goal[]
  motivationalMessage: string
  confidenceLevel: number
}

export interface MonthlyReport {
  id: string
  month: number
  year: number
  generatedAt: Date
  summary: {
    totalFocusTime: number
    tasksCompleted: number
    tasksPlanned: number
    completionRate: number
    pomodorosCompleted: number
    averageEnergyLevel: number
    streakDays: number
    longestStreak: number
  }
  weeklyProgress: WeeklyProgress[]
  achievements: Achievement[]
  insights: AnalysisInsights
  improvements: ImprovementArea[]
  nextMonthGoals: Goal[]
  motivationalMessage: string
  confidenceLevel: number
}

export interface Achievement {
  id: string
  type: 'streak' | 'focus' | 'completion' | 'consistency' | 'improvement'
  title: string
  description: string
  icon: string
  earnedAt: Date
  value?: number
  isNew: boolean
}

export interface ImprovementArea {
  area: 'focus' | 'consistency' | 'energy' | 'distractions' | 'planning'
  title: string
  description: string
  currentScore: number // 0-100
  targetScore: number // 0-100
  suggestions: string[]
  priority: 'high' | 'medium' | 'low'
}

export interface Goal {
  id: string
  type: 'focus' | 'completion' | 'consistency' | 'energy' | 'custom'
  title: string
  description: string
  targetValue: number
  currentValue: number
  unit: string
  deadline: Date
  isAchievable: boolean
  suggestions: string[]
}

export interface WeeklyProgress {
  weekStart: Date
  focusTime: number
  completionRate: number
  pomodorosCompleted: number
  averageEnergyLevel: number
}

// 리포트 생성 서비스
export class ReportGenerationService {
  // 주간 리포트 생성
  async generateWeeklyReport(weekStart?: Date): Promise<WeeklyReport> {
    // 주 시작일 계산 (월요일 기준)
    const startDate = weekStart || this.getWeekStart(new Date())
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6)
    endDate.setHours(23, 59, 59, 999)

    // 데이터 수집
    const [sessions, dailyStats, tasks] = await Promise.all([
      analyticsService.getStatsForPeriod(startDate, endDate),
      analyticsService.getStatsForPeriod(startDate, endDate),
      this.getTasksForPeriod(startDate, endDate)
    ])

    const sessionData = await analyticsService.getRecentSessions(7)
    const weekSessions = sessionData.filter(s => 
      s.startedAt >= startDate && s.startedAt <= endDate
    )

    // 패턴 분석
    const insights = await patternAnalysisService.generateComprehensiveAnalysis(
      weekSessions,
      dailyStats,
      tasks
    )

    // 요약 통계 계산
    const summary = this.calculateWeeklySummary(dailyStats, weekSessions)

    // 성취 분석
    const achievements = this.analyzeWeeklyAchievements(summary, insights, weekSessions)

    // 개선 영역 식별
    const improvements = this.identifyImprovementAreas(insights, summary)

    // 다음 주 목표 생성
    const nextWeekGoals = this.generateNextWeekGoals(summary, insights, improvements)

    // 동기부여 메시지 생성
    const motivationalMessage = this.generateMotivationalMessage(summary, achievements, 'weekly')

    const report: WeeklyReport = {
      id: crypto.randomUUID(),
      weekStart: startDate,
      weekEnd: endDate,
      generatedAt: new Date(),
      summary,
      achievements,
      insights,
      improvements,
      nextWeekGoals,
      motivationalMessage,
      confidenceLevel: insights.confidenceLevel
    }

    return report
  }

  // 월간 리포트 생성
  async generateMonthlyReport(month?: number, year?: number): Promise<MonthlyReport> {
    const now = new Date()
    const targetMonth = month ?? now.getMonth()
    const targetYear = year ?? now.getFullYear()

    // 월 시작일과 종료일 계산
    const startDate = new Date(targetYear, targetMonth, 1)
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999)

    // 데이터 수집
    const [sessions, dailyStats, tasks] = await Promise.all([
      analyticsService.getStatsForPeriod(startDate, endDate),
      analyticsService.getStatsForPeriod(startDate, endDate),
      this.getTasksForPeriod(startDate, endDate)
    ])

    const sessionData = await analyticsService.getStatsForPeriod(startDate, endDate)
    const monthSessions = sessionData.filter(s => 
      s.startedAt >= startDate && s.startedAt <= endDate
    )

    // 패턴 분석
    const insights = await patternAnalysisService.generateComprehensiveAnalysis(
      monthSessions,
      dailyStats,
      tasks
    )

    // 요약 통계 계산
    const summary = this.calculateMonthlySummary(dailyStats, monthSessions)

    // 주간 진행률 계산
    const weeklyProgress = this.calculateWeeklyProgress(dailyStats)

    // 성취 분석
    const achievements = this.analyzeMonthlyAchievements(summary, insights, weeklyProgress)

    // 개선 영역 식별
    const improvements = this.identifyImprovementAreas(insights, summary)

    // 다음 달 목표 생성
    const nextMonthGoals = this.generateNextMonthGoals(summary, insights, improvements)

    // 동기부여 메시지 생성
    const motivationalMessage = this.generateMotivationalMessage(summary, achievements, 'monthly')

    const report: MonthlyReport = {
      id: crypto.randomUUID(),
      month: targetMonth,
      year: targetYear,
      generatedAt: new Date(),
      summary,
      weeklyProgress,
      achievements,
      insights,
      improvements,
      nextMonthGoals,
      motivationalMessage,
      confidenceLevel: insights.confidenceLevel
    }

    return report
  }

  // 주간 요약 계산
  private calculateWeeklySummary(dailyStats: DailyStats[], sessions: Session[]) {
    const focusSessions = sessions.filter(s => s.type === 'focus' && s.completedAt)
    
    return {
      totalFocusTime: dailyStats.reduce((sum, stat) => sum + stat.focusMinutes, 0),
      tasksCompleted: dailyStats.reduce((sum, stat) => sum + stat.tasksCompleted, 0),
      tasksPlanned: dailyStats.reduce((sum, stat) => sum + stat.tasksPlanned, 0),
      completionRate: this.calculateCompletionRate(dailyStats),
      pomodorosCompleted: dailyStats.reduce((sum, stat) => sum + stat.pomodorosCompleted, 0),
      averageEnergyLevel: this.calculateAverageEnergyLevel(dailyStats)
    }
  }

  // 월간 요약 계산
  private calculateMonthlySummary(dailyStats: DailyStats[], sessions: Session[]) {
    const weeklySummary = this.calculateWeeklySummary(dailyStats, sessions)
    
    // 연속 달성 일수 계산
    const streakDays = this.calculateCurrentStreak(dailyStats)
    const longestStreak = this.calculateLongestStreak(dailyStats)

    return {
      ...weeklySummary,
      streakDays,
      longestStreak
    }
  }

  // 주간 성취 분석
  private analyzeWeeklyAchievements(
    summary: any, 
    insights: AnalysisInsights, 
    sessions: Session[]
  ): Achievement[] {
    const achievements: Achievement[] = []

    // 완료율 기반 성취
    if (summary.completionRate >= 90) {
      achievements.push({
        id: crypto.randomUUID(),
        type: 'completion',
        title: '완벽주의자',
        description: '이번 주 90% 이상의 작업을 완료했습니다!',
        icon: '🎯',
        earnedAt: new Date(),
        value: summary.completionRate,
        isNew: true
      })
    } else if (summary.completionRate >= 70) {
      achievements.push({
        id: crypto.randomUUID(),
        type: 'completion',
        title: '목표 달성자',
        description: '이번 주 목표를 성공적으로 달성했습니다!',
        icon: '✅',
        earnedAt: new Date(),
        value: summary.completionRate,
        isNew: true
      })
    }

    // 집중 시간 기반 성취
    if (summary.totalFocusTime >= 300) { // 5시간 이상
      achievements.push({
        id: crypto.randomUUID(),
        type: 'focus',
        title: '집중력 마스터',
        description: `이번 주 ${Math.round(summary.totalFocusTime / 60)}시간 이상 집중했습니다!`,
        icon: '🧠',
        earnedAt: new Date(),
        value: summary.totalFocusTime,
        isNew: true
      })
    } else if (summary.totalFocusTime >= 120) { // 2시간 이상
      achievements.push({
        id: crypto.randomUUID(),
        type: 'focus',
        title: '꾸준한 집중',
        description: '이번 주 꾸준히 집중 시간을 유지했습니다!',
        icon: '⏰',
        earnedAt: new Date(),
        value: summary.totalFocusTime,
        isNew: true
      })
    }

    // 일관성 기반 성취
    if (insights.weekly.weeklyConsistency >= 80) {
      achievements.push({
        id: crypto.randomUUID(),
        type: 'consistency',
        title: '일관성의 왕',
        description: '매일 꾸준히 작업을 진행했습니다!',
        icon: '📈',
        earnedAt: new Date(),
        value: insights.weekly.weeklyConsistency,
        isNew: true
      })
    }

    // 개선 기반 성취
    if (insights.focus.focusTrend === 'improving') {
      achievements.push({
        id: crypto.randomUUID(),
        type: 'improvement',
        title: '성장하는 집중력',
        description: '집중력이 지속적으로 향상되고 있습니다!',
        icon: '📊',
        earnedAt: new Date(),
        isNew: true
      })
    }

    if (insights.distractions.distractionTrend === 'improving') {
      achievements.push({
        id: crypto.randomUUID(),
        type: 'improvement',
        title: '주의산만 극복',
        description: '주의산만이 줄어들고 있습니다!',
        icon: '🎯',
        earnedAt: new Date(),
        isNew: true
      })
    }

    return achievements
  }

  // 월간 성취 분석
  private analyzeMonthlyAchievements(
    summary: any,
    insights: AnalysisInsights,
    weeklyProgress: WeeklyProgress[]
  ): Achievement[] {
    const achievements = this.analyzeWeeklyAchievements(summary, insights, [])

    // 연속 달성 기반 성취
    if (summary.streakDays >= 7) {
      achievements.push({
        id: crypto.randomUUID(),
        type: 'streak',
        title: '일주일 연속 달성',
        description: `${summary.streakDays}일 연속으로 목표를 달성했습니다!`,
        icon: '🔥',
        earnedAt: new Date(),
        value: summary.streakDays,
        isNew: true
      })
    }

    if (summary.longestStreak >= 14) {
      achievements.push({
        id: crypto.randomUUID(),
        type: 'streak',
        title: '2주 연속 달성',
        description: `최장 ${summary.longestStreak}일 연속 달성 기록을 세웠습니다!`,
        icon: '🏆',
        earnedAt: new Date(),
        value: summary.longestStreak,
        isNew: true
      })
    }

    // 월간 총 집중 시간 기반 성취
    if (summary.totalFocusTime >= 1200) { // 20시간 이상
      achievements.push({
        id: crypto.randomUUID(),
        type: 'focus',
        title: '월간 집중력 챔피언',
        description: `이번 달 총 ${Math.round(summary.totalFocusTime / 60)}시간 집중했습니다!`,
        icon: '👑',
        earnedAt: new Date(),
        value: summary.totalFocusTime,
        isNew: true
      })
    }

    return achievements
  }

  // 개선 영역 식별
  private identifyImprovementAreas(insights: AnalysisInsights, summary: any): ImprovementArea[] {
    const improvements: ImprovementArea[] = []

    // 집중력 개선
    if (insights.focus.averageFocusTime < 20) {
      improvements.push({
        area: 'focus',
        title: '집중 시간 늘리기',
        description: '평균 집중 시간이 짧습니다. 점진적으로 늘려보세요.',
        currentScore: Math.round((insights.focus.averageFocusTime / 45) * 100),
        targetScore: 70,
        suggestions: [
          '15분부터 시작해서 점진적으로 늘려보세요',
          '집중 환경을 개선해보세요',
          '휴식 시간을 충분히 가져보세요'
        ],
        priority: 'high'
      })
    }

    // 일관성 개선
    if (insights.weekly.weeklyConsistency < 60) {
      improvements.push({
        area: 'consistency',
        title: '일관성 향상',
        description: '매일 꾸준히 작업하는 습관을 만들어보세요.',
        currentScore: insights.weekly.weeklyConsistency,
        targetScore: 80,
        suggestions: [
          '매일 작은 목표라도 설정해보세요',
          '같은 시간에 작업하는 루틴을 만들어보세요',
          '완료하지 못한 날도 자책하지 마세요'
        ],
        priority: 'high'
      })
    }

    // 완료율 개선
    if (summary.completionRate < 50) {
      improvements.push({
        area: 'planning',
        title: '현실적인 계획 세우기',
        description: '목표를 더 현실적으로 설정해보세요.',
        currentScore: summary.completionRate,
        targetScore: 70,
        suggestions: [
          '작업을 더 작은 단위로 나누어보세요',
          '하루 목표를 줄여보세요',
          '예상 시간을 여유있게 설정해보세요'
        ],
        priority: 'high'
      })
    }

    // 주의산만 개선
    if (insights.distractions.averageDistractionsPerSession > 2) {
      improvements.push({
        area: 'distractions',
        title: '주의산만 줄이기',
        description: '집중을 방해하는 요소들을 제거해보세요.',
        currentScore: Math.max(0, 100 - (insights.distractions.averageDistractionsPerSession * 20)),
        targetScore: 80,
        suggestions: [
          '집중 모드를 더 자주 사용해보세요',
          '알림을 끄거나 방해 금지 모드를 사용해보세요',
          '작업 환경을 정리해보세요'
        ],
        priority: 'medium'
      })
    }

    // 에너지 관리 개선
    if (insights.energy.averageEnergyLevel < 3) {
      improvements.push({
        area: 'energy',
        title: '에너지 관리',
        description: '전반적인 에너지 레벨을 높여보세요.',
        currentScore: Math.round((insights.energy.averageEnergyLevel / 5) * 100),
        targetScore: 70,
        suggestions: [
          '충분한 수면을 취하세요',
          '규칙적인 운동을 해보세요',
          '에너지가 높은 시간대에 중요한 작업을 하세요'
        ],
        priority: 'medium'
      })
    }

    return improvements.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  // 다음 주 목표 생성
  private generateNextWeekGoals(
    summary: any,
    insights: AnalysisInsights,
    improvements: ImprovementArea[]
  ): Goal[] {
    const goals: Goal[] = []

    // 완료율 목표
    const targetCompletionRate = Math.min(100, summary.completionRate + 10)
    goals.push({
      id: crypto.randomUUID(),
      type: 'completion',
      title: '작업 완료율 향상',
      description: `이번 주보다 ${targetCompletionRate - summary.completionRate}% 더 높은 완료율 달성`,
      targetValue: targetCompletionRate,
      currentValue: summary.completionRate,
      unit: '%',
      deadline: this.getNextWeekEnd(),
      isAchievable: targetCompletionRate - summary.completionRate <= 20,
      suggestions: [
        '작업을 더 작은 단위로 나누어보세요',
        '현실적인 목표를 설정하세요'
      ]
    })

    // 집중 시간 목표
    const targetFocusTime = Math.min(300, summary.totalFocusTime + 30) // 최대 5시간
    goals.push({
      id: crypto.randomUUID(),
      type: 'focus',
      title: '주간 집중 시간 늘리기',
      description: `이번 주보다 ${targetFocusTime - summary.totalFocusTime}분 더 집중하기`,
      targetValue: targetFocusTime,
      currentValue: summary.totalFocusTime,
      unit: '분',
      deadline: this.getNextWeekEnd(),
      isAchievable: targetFocusTime - summary.totalFocusTime <= 60,
      suggestions: [
        '매일 조금씩 집중 시간을 늘려보세요',
        '집중 환경을 개선해보세요'
      ]
    })

    // 개선 영역 기반 목표
    if (improvements.length > 0) {
      const topImprovement = improvements[0]
      goals.push({
        id: crypto.randomUUID(),
        type: topImprovement.area,
        title: topImprovement.title,
        description: `${topImprovement.area} 점수를 ${topImprovement.targetScore}점까지 올리기`,
        targetValue: topImprovement.targetScore,
        currentValue: topImprovement.currentScore,
        unit: '점',
        deadline: this.getNextWeekEnd(),
        isAchievable: topImprovement.targetScore - topImprovement.currentScore <= 30,
        suggestions: topImprovement.suggestions.slice(0, 2)
      })
    }

    return goals.slice(0, 3) // 최대 3개 목표
  }

  // 다음 달 목표 생성
  private generateNextMonthGoals(
    summary: any,
    insights: AnalysisInsights,
    improvements: ImprovementArea[]
  ): Goal[] {
    const weeklyGoals = this.generateNextWeekGoals(summary, insights, improvements)
    
    // 월간 목표로 확장
    const monthlyGoals = weeklyGoals.map(goal => ({
      ...goal,
      id: crypto.randomUUID(),
      targetValue: goal.targetValue * 4, // 4주 기준
      deadline: this.getNextMonthEnd(),
      description: goal.description.replace('이번 주', '이번 달').replace('주간', '월간')
    }))

    // 연속 달성 목표 추가
    monthlyGoals.push({
      id: crypto.randomUUID(),
      type: 'consistency',
      title: '연속 달성 기록 세우기',
      description: '7일 연속 목표 달성하기',
      targetValue: 7,
      currentValue: summary.streakDays || 0,
      unit: '일',
      deadline: this.getNextMonthEnd(),
      isAchievable: true,
      suggestions: [
        '매일 작은 목표라도 설정하세요',
        '완료하지 못한 날도 포기하지 마세요'
      ]
    })

    return monthlyGoals.slice(0, 4) // 최대 4개 목표
  }

  // 동기부여 메시지 생성
  private generateMotivationalMessage(
    summary: any,
    achievements: Achievement[],
    period: 'weekly' | 'monthly'
  ): string {
    const messages = {
      high: [
        '정말 훌륭한 성과를 보여주고 있어요! 이 패턴을 계속 유지해보세요.',
        '놀라운 집중력과 일관성을 보여주고 있습니다. 자신감을 가지세요!',
        '목표를 성공적으로 달성하고 있어요. 이런 자신을 자랑스러워하세요!'
      ],
      medium: [
        '꾸준히 발전하고 있어요! 작은 개선들이 모여 큰 변화를 만들고 있습니다.',
        '좋은 방향으로 나아가고 있어요. 조금만 더 노력하면 목표에 도달할 수 있습니다.',
        '진전을 보이고 있어요! 완벽하지 않아도 괜찮습니다. 계속 전진하세요.'
      ],
      low: [
        '시작이 반이에요! 작은 성취도 소중합니다. 자신을 격려해주세요.',
        '어려운 시기일 수 있지만, 포기하지 마세요. 내일은 새로운 기회입니다.',
        '완벽하지 않아도 괜찮아요. ADHD와 함께 살아가는 것 자체가 용기입니다.'
      ]
    }

    let level: 'high' | 'medium' | 'low' = 'medium'
    
    if (summary.completionRate >= 70 && achievements.length >= 2) {
      level = 'high'
    } else if (summary.completionRate < 40 || achievements.length === 0) {
      level = 'low'
    }

    const messageList = messages[level]
    const randomMessage = messageList[Math.floor(Math.random() * messageList.length)]

    // 개인화된 요소 추가
    let personalizedMessage = randomMessage

    if (achievements.length > 0) {
      const achievement = achievements[0]
      personalizedMessage += ` 특히 "${achievement.title}" 성취가 인상적이에요!`
    }

    if (period === 'weekly' && summary.totalFocusTime > 0) {
      personalizedMessage += ` 이번 주 총 ${Math.round(summary.totalFocusTime / 60)}시간을 집중했다는 것을 기억하세요.`
    }

    return personalizedMessage
  }

  // 유틸리티 메서드들
  private getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 월요일 기준
    const monday = new Date(d.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    return monday
  }

  private getNextWeekEnd(): Date {
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    return this.getWeekStart(nextWeek)
  }

  private getNextMonthEnd(): Date {
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 0)
  }

  private async getTasksForPeriod(startDate: Date, endDate: Date): Promise<Task[]> {
    // Redux store에서 작업 데이터를 가져오는 로직
    // 실제 구현에서는 store에서 데이터를 가져와야 함
    return []
  }

  private calculateCompletionRate(dailyStats: DailyStats[]): number {
    const totalPlanned = dailyStats.reduce((sum, stat) => sum + stat.tasksPlanned, 0)
    const totalCompleted = dailyStats.reduce((sum, stat) => sum + stat.tasksCompleted, 0)
    return totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0
  }

  private calculateAverageEnergyLevel(dailyStats: DailyStats[]): number {
    if (dailyStats.length === 0) return 3
    const totalEnergy = dailyStats.reduce((sum, stat) => sum + stat.averageEnergyLevel, 0)
    return Math.round((totalEnergy / dailyStats.length) * 10) / 10
  }

  private calculateCurrentStreak(dailyStats: DailyStats[]): number {
    let streak = 0
    const sortedStats = dailyStats.sort((a, b) => b.date.getTime() - a.date.getTime())
    
    for (const stat of sortedStats) {
      const completionRate = stat.tasksPlanned > 0 ? (stat.tasksCompleted / stat.tasksPlanned) * 100 : 0
      if (completionRate >= 70) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }

  private calculateLongestStreak(dailyStats: DailyStats[]): number {
    let longestStreak = 0
    let currentStreak = 0
    
    const sortedStats = dailyStats.sort((a, b) => a.date.getTime() - b.date.getTime())
    
    for (const stat of sortedStats) {
      const completionRate = stat.tasksPlanned > 0 ? (stat.tasksCompleted / stat.tasksPlanned) * 100 : 0
      if (completionRate >= 70) {
        currentStreak++
        longestStreak = Math.max(longestStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    }
    
    return longestStreak
  }

  private calculateWeeklyProgress(dailyStats: DailyStats[]): WeeklyProgress[] {
    const weeklyData: Record<string, DailyStats[]> = {}
    
    dailyStats.forEach(stat => {
      const weekStart = this.getWeekStart(stat.date).toISOString()
      if (!weeklyData[weekStart]) {
        weeklyData[weekStart] = []
      }
      weeklyData[weekStart].push(stat)
    })

    return Object.entries(weeklyData).map(([weekStartStr, stats]) => ({
      weekStart: new Date(weekStartStr),
      focusTime: stats.reduce((sum, stat) => sum + stat.focusMinutes, 0),
      completionRate: this.calculateCompletionRate(stats),
      pomodorosCompleted: stats.reduce((sum, stat) => sum + stat.pomodorosCompleted, 0),
      averageEnergyLevel: this.calculateAverageEnergyLevel(stats)
    }))
  }
}

// 싱글톤 인스턴스
export const reportGenerationService = new ReportGenerationService()