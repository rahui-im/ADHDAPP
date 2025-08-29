import { Session, DailyStats, Task, DistractionType } from '../types'
import { analyticsService } from './analyticsService'

// 패턴 분석 결과 타입
export interface ProductivityPattern {
  mostProductiveHours: number[]
  leastProductiveHours: number[]
  peakProductivityHour: number
  productivityScore: number // 0-100
}

export interface TaskTypePreference {
  category: string
  completionRate: number
  averageFocusTime: number
  preferenceScore: number // 0-100
  totalTasks: number
}

export interface FocusPattern {
  averageFocusTime: number // minutes
  optimalFocusDuration: number // minutes
  focusConsistency: number // 0-100 (일관성 점수)
  bestFocusTimes: number[] // 시간대
  focusTrend: 'improving' | 'declining' | 'stable'
}

export interface DistractionPattern {
  mostCommonDistractions: DistractionType[]
  distractionsByHour: Record<number, DistractionType[]>
  averageDistractionsPerSession: number
  distractionTrend: 'improving' | 'worsening' | 'stable'
  criticalDistractionHours: number[]
}

export interface EnergyPattern {
  averageEnergyLevel: number
  energyByHour: Record<number, number>
  peakEnergyHours: number[]
  lowEnergyHours: number[]
  energyConsistency: number // 0-100
  energyTrend: 'improving' | 'declining' | 'stable'
}

export interface WeeklyPattern {
  mostProductiveDays: string[]
  leastProductiveDays: string[]
  weeklyConsistency: number // 0-100
  weekendVsWeekdayRatio: number
}

export interface AnalysisInsights {
  productivity: ProductivityPattern
  taskPreferences: TaskTypePreference[]
  focus: FocusPattern
  distractions: DistractionPattern
  energy: EnergyPattern
  weekly: WeeklyPattern
  recommendations: string[]
  confidenceLevel: number // 0-100 (데이터 충분성 기반)
}

// 패턴 분석 서비스
export class PatternAnalysisService {
  private readonly MIN_SESSIONS_FOR_ANALYSIS = 10
  private readonly MIN_DAYS_FOR_WEEKLY_ANALYSIS = 7

  // 생산성 패턴 분석
  async analyzeProductivityPattern(sessions: Session[]): Promise<ProductivityPattern> {
    if (sessions.length < this.MIN_SESSIONS_FOR_ANALYSIS) {
      return this.getDefaultProductivityPattern()
    }

    const focusSessions = sessions.filter(s => s.type === 'focus' && s.completedAt)
    
    // 시간대별 생산성 계산
    const hourlyProductivity: Record<number, { totalTime: number; sessionCount: number; efficiency: number }> = {}
    
    focusSessions.forEach(session => {
      const hour = session.startedAt.getHours()
      if (!hourlyProductivity[hour]) {
        hourlyProductivity[hour] = { totalTime: 0, sessionCount: 0, efficiency: 0 }
      }
      
      const efficiency = session.actualDuration / session.plannedDuration
      hourlyProductivity[hour].totalTime += session.actualDuration
      hourlyProductivity[hour].sessionCount += 1
      hourlyProductivity[hour].efficiency += efficiency
    })

    // 시간대별 평균 효율성 계산
    const hourlyScores = Object.entries(hourlyProductivity).map(([hour, data]) => ({
      hour: parseInt(hour),
      avgEfficiency: data.efficiency / data.sessionCount,
      totalTime: data.totalTime,
      sessionCount: data.sessionCount,
      score: (data.efficiency / data.sessionCount) * Math.log(data.sessionCount + 1) // 세션 수도 고려
    }))

    // 정렬 및 상위/하위 시간대 추출
    const sortedByScore = hourlyScores.sort((a, b) => b.score - a.score)
    const mostProductiveHours = sortedByScore.slice(0, 3).map(h => h.hour)
    const leastProductiveHours = sortedByScore.slice(-2).map(h => h.hour)
    const peakProductivityHour = sortedByScore[0]?.hour || 14

    // 전체 생산성 점수 계산
    const totalEfficiency = focusSessions.reduce((sum, s) => sum + (s.actualDuration / s.plannedDuration), 0)
    const avgEfficiency = totalEfficiency / focusSessions.length
    const productivityScore = Math.min(100, Math.round(avgEfficiency * 100))

    return {
      mostProductiveHours,
      leastProductiveHours,
      peakProductivityHour,
      productivityScore
    }
  }

  // 작업 유형 선호도 분석
  async analyzeTaskTypePreferences(tasks: Task[], sessions: Session[]): Promise<TaskTypePreference[]> {
    if (tasks.length === 0) return []

    // 카테고리별 통계 수집
    const categoryStats: Record<string, {
      totalTasks: number
      completedTasks: number
      totalFocusTime: number
      sessionCount: number
    }> = {}

    tasks.forEach(task => {
      if (!categoryStats[task.category]) {
        categoryStats[task.category] = {
          totalTasks: 0,
          completedTasks: 0,
          totalFocusTime: 0,
          sessionCount: 0
        }
      }

      categoryStats[task.category].totalTasks += 1
      if (task.status === 'completed') {
        categoryStats[task.category].completedTasks += 1
      }

      // 해당 작업의 세션들 찾기
      const taskSessions = sessions.filter(s => s.taskId === task.id && s.type === 'focus' && s.completedAt)
      categoryStats[task.category].totalFocusTime += taskSessions.reduce((sum, s) => sum + s.actualDuration, 0)
      categoryStats[task.category].sessionCount += taskSessions.length
    })

    // 선호도 점수 계산
    const preferences: TaskTypePreference[] = Object.entries(categoryStats).map(([category, stats]) => {
      const completionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0
      const averageFocusTime = stats.sessionCount > 0 ? stats.totalFocusTime / stats.sessionCount : 0
      
      // 선호도 점수: 완료율 + 평균 집중 시간 + 작업 수 (가중치 적용)
      const preferenceScore = Math.min(100, Math.round(
        completionRate * 0.5 + 
        Math.min(100, averageFocusTime * 2) * 0.3 + 
        Math.min(100, stats.totalTasks * 10) * 0.2
      ))

      return {
        category,
        completionRate: Math.round(completionRate),
        averageFocusTime: Math.round(averageFocusTime),
        preferenceScore,
        totalTasks: stats.totalTasks
      }
    })

    return preferences.sort((a, b) => b.preferenceScore - a.preferenceScore)
  }

  // 집중력 패턴 분석
  async analyzeFocusPattern(sessions: Session[]): Promise<FocusPattern> {
    const focusSessions = sessions.filter(s => s.type === 'focus' && s.completedAt)
    
    if (focusSessions.length < this.MIN_SESSIONS_FOR_ANALYSIS) {
      return this.getDefaultFocusPattern()
    }

    // 평균 집중 시간
    const totalFocusTime = focusSessions.reduce((sum, s) => sum + s.actualDuration, 0)
    const averageFocusTime = Math.round(totalFocusTime / focusSessions.length)

    // 최적 집중 시간 계산 (효율성이 가장 높은 시간대)
    const durationEfficiency: Record<number, number[]> = {}
    focusSessions.forEach(session => {
      const duration = Math.round(session.actualDuration / 5) * 5 // 5분 단위로 반올림
      const efficiency = session.actualDuration / session.plannedDuration
      
      if (!durationEfficiency[duration]) {
        durationEfficiency[duration] = []
      }
      durationEfficiency[duration].push(efficiency)
    })

    const optimalDuration = Object.entries(durationEfficiency)
      .map(([duration, efficiencies]) => ({
        duration: parseInt(duration),
        avgEfficiency: efficiencies.reduce((sum, eff) => sum + eff, 0) / efficiencies.length,
        count: efficiencies.length
      }))
      .filter(d => d.count >= 3) // 최소 3회 이상
      .sort((a, b) => b.avgEfficiency - a.avgEfficiency)[0]?.duration || averageFocusTime

    // 집중 일관성 계산 (표준편차 기반)
    const focusTimes = focusSessions.map(s => s.actualDuration)
    const variance = focusTimes.reduce((sum, time) => sum + Math.pow(time - averageFocusTime, 2), 0) / focusTimes.length
    const standardDeviation = Math.sqrt(variance)
    const focusConsistency = Math.max(0, Math.round(100 - (standardDeviation / averageFocusTime) * 100))

    // 최적 집중 시간대 분석
    const hourlyFocusQuality: Record<number, number[]> = {}
    focusSessions.forEach(session => {
      const hour = session.startedAt.getHours()
      const quality = (session.actualDuration / session.plannedDuration) * (session.energyAfter / 5)
      
      if (!hourlyFocusQuality[hour]) {
        hourlyFocusQuality[hour] = []
      }
      hourlyFocusQuality[hour].push(quality)
    })

    const bestFocusTimes = Object.entries(hourlyFocusQuality)
      .map(([hour, qualities]) => ({
        hour: parseInt(hour),
        avgQuality: qualities.reduce((sum, q) => sum + q, 0) / qualities.length,
        count: qualities.length
      }))
      .filter(h => h.count >= 2)
      .sort((a, b) => b.avgQuality - a.avgQuality)
      .slice(0, 3)
      .map(h => h.hour)

    // 집중력 트렌드 분석
    const focusTrend = this.calculateTrend(focusSessions.map(s => s.actualDuration))

    return {
      averageFocusTime,
      optimalFocusDuration: optimalDuration,
      focusConsistency,
      bestFocusTimes,
      focusTrend
    }
  }

  // 주의산만 패턴 분석
  async analyzeDistractionPattern(sessions: Session[]): Promise<DistractionPattern> {
    const allDistractions = sessions.flatMap(s => s.interruptionReasons)
    
    if (allDistractions.length === 0) {
      return this.getDefaultDistractionPattern()
    }

    // 가장 흔한 주의산만 유형
    const distractionCounts: Record<DistractionType, number> = {
      website: 0,
      notification: 0,
      inactivity: 0,
      manual: 0
    }

    allDistractions.forEach(distraction => {
      distractionCounts[distraction]++
    })

    const mostCommonDistractions = Object.entries(distractionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type as DistractionType)

    // 시간대별 주의산만 분석
    const distractionsByHour: Record<number, DistractionType[]> = {}
    sessions.forEach(session => {
      const hour = session.startedAt.getHours()
      if (session.interruptionReasons.length > 0) {
        if (!distractionsByHour[hour]) {
          distractionsByHour[hour] = []
        }
        distractionsByHour[hour].push(...session.interruptionReasons)
      }
    })

    // 주의산만이 많은 시간대
    const criticalDistractionHours = Object.entries(distractionsByHour)
      .map(([hour, distractions]) => ({
        hour: parseInt(hour),
        count: distractions.length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 2)
      .map(h => h.hour)

    // 평균 주의산만 횟수
    const sessionsWithDistractions = sessions.filter(s => s.interruptionReasons.length > 0)
    const averageDistractionsPerSession = sessionsWithDistractions.length > 0
      ? allDistractions.length / sessionsWithDistractions.length
      : 0

    // 주의산만 트렌드
    const recentSessions = sessions.slice(-Math.floor(sessions.length / 2))
    const olderSessions = sessions.slice(0, Math.floor(sessions.length / 2))
    
    const recentDistractionRate = recentSessions.length > 0
      ? recentSessions.reduce((sum, s) => sum + s.interruptionReasons.length, 0) / recentSessions.length
      : 0
    const olderDistractionRate = olderSessions.length > 0
      ? olderSessions.reduce((sum, s) => sum + s.interruptionReasons.length, 0) / olderSessions.length
      : 0

    let distractionTrend: 'improving' | 'worsening' | 'stable' = 'stable'
    if (recentDistractionRate < olderDistractionRate * 0.8) {
      distractionTrend = 'improving'
    } else if (recentDistractionRate > olderDistractionRate * 1.2) {
      distractionTrend = 'worsening'
    }

    return {
      mostCommonDistractions,
      distractionsByHour,
      averageDistractionsPerSession: Math.round(averageDistractionsPerSession * 10) / 10,
      distractionTrend,
      criticalDistractionHours
    }
  }

  // 에너지 패턴 분석
  async analyzeEnergyPattern(sessions: Session[]): Promise<EnergyPattern> {
    const focusSessions = sessions.filter(s => s.type === 'focus')
    
    if (focusSessions.length < this.MIN_SESSIONS_FOR_ANALYSIS) {
      return this.getDefaultEnergyPattern()
    }

    // 평균 에너지 레벨
    const totalEnergyBefore = focusSessions.reduce((sum, s) => sum + s.energyBefore, 0)
    const totalEnergyAfter = focusSessions.reduce((sum, s) => sum + s.energyAfter, 0)
    const averageEnergyLevel = (totalEnergyBefore + totalEnergyAfter) / (focusSessions.length * 2)

    // 시간대별 에너지 레벨
    const energyByHour: Record<number, number[]> = {}
    focusSessions.forEach(session => {
      const hour = session.startedAt.getHours()
      const avgEnergy = (session.energyBefore + session.energyAfter) / 2
      
      if (!energyByHour[hour]) {
        energyByHour[hour] = []
      }
      energyByHour[hour].push(avgEnergy)
    })

    // 시간대별 평균 에너지 계산
    const hourlyAverages = Object.entries(energyByHour).reduce((acc, [hour, energies]) => {
      acc[parseInt(hour)] = energies.reduce((sum, e) => sum + e, 0) / energies.length
      return acc
    }, {} as Record<number, number>)

    // 높은/낮은 에너지 시간대
    const sortedHours = Object.entries(hourlyAverages)
      .sort(([, a], [, b]) => b - a)
    
    const peakEnergyHours = sortedHours.slice(0, 3).map(([hour]) => parseInt(hour))
    const lowEnergyHours = sortedHours.slice(-2).map(([hour]) => parseInt(hour))

    // 에너지 일관성 (변동성 기반)
    const energyLevels = focusSessions.map(s => (s.energyBefore + s.energyAfter) / 2)
    const energyVariance = energyLevels.reduce((sum, level) => sum + Math.pow(level - averageEnergyLevel, 2), 0) / energyLevels.length
    const energyConsistency = Math.max(0, Math.round(100 - (Math.sqrt(energyVariance) / averageEnergyLevel) * 50))

    // 에너지 트렌드
    const energyTrend = this.calculateTrend(energyLevels)

    return {
      averageEnergyLevel: Math.round(averageEnergyLevel * 10) / 10,
      energyByHour: hourlyAverages,
      peakEnergyHours,
      lowEnergyHours,
      energyConsistency,
      energyTrend
    }
  }

  // 주간 패턴 분석
  async analyzeWeeklyPattern(dailyStats: DailyStats[]): Promise<WeeklyPattern> {
    if (dailyStats.length < this.MIN_DAYS_FOR_WEEKLY_ANALYSIS) {
      return this.getDefaultWeeklyPattern()
    }

    // 요일별 생산성 계산
    const dayProductivity: Record<string, number[]> = {}
    dailyStats.forEach(stat => {
      const dayName = stat.date.toLocaleDateString('ko-KR', { weekday: 'long' })
      const productivity = stat.tasksPlanned > 0 ? (stat.tasksCompleted / stat.tasksPlanned) * 100 : 0
      
      if (!dayProductivity[dayName]) {
        dayProductivity[dayName] = []
      }
      dayProductivity[dayName].push(productivity)
    })

    // 요일별 평균 생산성
    const dayAverages = Object.entries(dayProductivity).map(([day, productivities]) => ({
      day,
      avgProductivity: productivities.reduce((sum, p) => sum + p, 0) / productivities.length,
      count: productivities.length
    }))

    const sortedDays = dayAverages.sort((a, b) => b.avgProductivity - a.avgProductivity)
    const mostProductiveDays = sortedDays.slice(0, 2).map(d => d.day)
    const leastProductiveDays = sortedDays.slice(-2).map(d => d.day)

    // 주간 일관성 (요일별 생산성 변동성)
    const productivityValues = dayAverages.map(d => d.avgProductivity)
    const avgProductivity = productivityValues.reduce((sum, p) => sum + p, 0) / productivityValues.length
    const productivityVariance = productivityValues.reduce((sum, p) => sum + Math.pow(p - avgProductivity, 2), 0) / productivityValues.length
    const weeklyConsistency = Math.max(0, Math.round(100 - (Math.sqrt(productivityVariance) / avgProductivity) * 100))

    // 주말 vs 평일 비율
    const weekdayStats = dailyStats.filter(stat => {
      const day = stat.date.getDay()
      return day >= 1 && day <= 5 // 월-금
    })
    const weekendStats = dailyStats.filter(stat => {
      const day = stat.date.getDay()
      return day === 0 || day === 6 // 토-일
    })

    const weekdayAvg = weekdayStats.length > 0
      ? weekdayStats.reduce((sum, stat) => sum + stat.focusMinutes, 0) / weekdayStats.length
      : 0
    const weekendAvg = weekendStats.length > 0
      ? weekendStats.reduce((sum, stat) => sum + stat.focusMinutes, 0) / weekendStats.length
      : 0

    const weekendVsWeekdayRatio = weekdayAvg > 0 ? Math.round((weekendAvg / weekdayAvg) * 100) / 100 : 0

    return {
      mostProductiveDays,
      leastProductiveDays,
      weeklyConsistency,
      weekendVsWeekdayRatio
    }
  }

  // 종합 분석 및 추천사항 생성
  async generateComprehensiveAnalysis(
    sessions: Session[],
    dailyStats: DailyStats[],
    tasks: Task[]
  ): Promise<AnalysisInsights> {
    // 각 패턴 분석 실행
    const [productivity, taskPreferences, focus, distractions, energy, weekly] = await Promise.all([
      this.analyzeProductivityPattern(sessions),
      this.analyzeTaskTypePreferences(tasks, sessions),
      this.analyzeFocusPattern(sessions),
      this.analyzeDistractionPattern(sessions),
      this.analyzeEnergyPattern(sessions),
      this.analyzeWeeklyPattern(dailyStats)
    ])

    // 신뢰도 계산 (데이터 충분성 기반)
    const confidenceLevel = this.calculateConfidenceLevel(sessions, dailyStats, tasks)

    // 개인화된 추천사항 생성
    const recommendations = this.generateRecommendations({
      productivity,
      taskPreferences,
      focus,
      distractions,
      energy,
      weekly,
      confidenceLevel
    })

    return {
      productivity,
      taskPreferences,
      focus,
      distractions,
      energy,
      weekly,
      recommendations,
      confidenceLevel
    }
  }

  // 추천사항 생성
  private generateRecommendations(insights: Omit<AnalysisInsights, 'recommendations'>): string[] {
    const recommendations: string[] = []

    // 생산성 기반 추천
    if (insights.productivity.productivityScore < 60) {
      recommendations.push(`가장 생산적인 시간대인 ${insights.productivity.peakProductivityHour}시경에 중요한 작업을 배치해보세요.`)
    }

    // 집중력 기반 추천
    if (insights.focus.averageFocusTime < 20) {
      recommendations.push('집중 시간이 짧아요. 15분부터 시작해서 점진적으로 늘려보세요.')
    } else if (insights.focus.averageFocusTime > 45) {
      recommendations.push('긴 집중 시간을 잘 유지하고 있어요! 휴식도 충분히 취하세요.')
    }

    if (insights.focus.optimalFocusDuration !== insights.focus.averageFocusTime) {
      recommendations.push(`${insights.focus.optimalFocusDuration}분 집중 시간이 가장 효율적인 것 같아요.`)
    }

    // 주의산만 기반 추천
    if (insights.distractions.averageDistractionsPerSession > 2) {
      const mainDistraction = insights.distractions.mostCommonDistractions[0]
      switch (mainDistraction) {
        case 'website':
          recommendations.push('웹사이트 차단 도구를 사용하거나 집중 모드를 활용해보세요.')
          break
        case 'notification':
          recommendations.push('집중 시간 동안 알림을 끄거나 방해 금지 모드를 사용해보세요.')
          break
        case 'inactivity':
          recommendations.push('더 짧은 집중 시간으로 시작하거나 활동적인 휴식을 취해보세요.')
          break
      }
    }

    if (insights.distractions.distractionTrend === 'worsening') {
      recommendations.push('최근 주의산만이 증가하고 있어요. 환경을 점검해보세요.')
    }

    // 에너지 기반 추천
    if (insights.energy.peakEnergyHours.length > 0) {
      const peakHour = insights.energy.peakEnergyHours[0]
      recommendations.push(`${peakHour}시경이 에너지가 가장 높아요. 이 시간에 어려운 작업을 해보세요.`)
    }

    if (insights.energy.averageEnergyLevel < 3) {
      recommendations.push('전반적인 에너지 레벨이 낮아요. 충분한 휴식과 수면을 취하세요.')
    }

    // 작업 유형 기반 추천
    if (insights.taskPreferences.length > 0) {
      const bestCategory = insights.taskPreferences[0]
      if (bestCategory.completionRate > 80) {
        recommendations.push(`${bestCategory.category} 작업을 잘 완료하고 있어요! 이런 유형의 작업을 더 늘려보세요.`)
      }
    }

    // 주간 패턴 기반 추천
    if (insights.weekly.mostProductiveDays.length > 0) {
      recommendations.push(`${insights.weekly.mostProductiveDays[0]}에 가장 생산적이에요. 중요한 작업을 이 날에 계획해보세요.`)
    }

    if (insights.weekly.weeklyConsistency < 50) {
      recommendations.push('주간 일관성을 높이기 위해 매일 작은 목표라도 설정해보세요.')
    }

    // 신뢰도가 낮으면 데이터 수집 권장
    if (insights.confidenceLevel < 60) {
      recommendations.push('더 정확한 분석을 위해 꾸준히 데이터를 수집해보세요.')
    }

    // 최대 5개 추천사항 반환
    return recommendations.slice(0, 5)
  }

  // 신뢰도 계산
  private calculateConfidenceLevel(sessions: Session[], dailyStats: DailyStats[], tasks: Task[]): number {
    let confidence = 0

    // 세션 데이터 충분성 (40점)
    const sessionScore = Math.min(40, (sessions.length / 50) * 40)
    confidence += sessionScore

    // 일일 통계 충분성 (30점)
    const statsScore = Math.min(30, (dailyStats.length / 30) * 30)
    confidence += statsScore

    // 작업 데이터 충분성 (20점)
    const taskScore = Math.min(20, (tasks.length / 20) * 20)
    confidence += taskScore

    // 데이터 다양성 (10점)
    const uniqueHours = new Set(sessions.map(s => s.startedAt.getHours())).size
    const diversityScore = Math.min(10, (uniqueHours / 12) * 10)
    confidence += diversityScore

    return Math.round(confidence)
  }

  // 트렌드 계산 유틸리티
  private calculateTrend(values: number[]): 'improving' | 'declining' | 'stable' {
    if (values.length < 4) return 'stable'

    const midPoint = Math.floor(values.length / 2)
    const recentValues = values.slice(midPoint)
    const olderValues = values.slice(0, midPoint)

    const recentAvg = recentValues.reduce((sum, v) => sum + v, 0) / recentValues.length
    const olderAvg = olderValues.reduce((sum, v) => sum + v, 0) / olderValues.length

    const changeRatio = recentAvg / olderAvg

    if (changeRatio > 1.1) return 'improving'
    if (changeRatio < 0.9) return 'declining'
    return 'stable'
  }

  // 기본값 반환 메서드들
  private getDefaultProductivityPattern(): ProductivityPattern {
    return {
      mostProductiveHours: [10, 14, 16],
      leastProductiveHours: [13, 17],
      peakProductivityHour: 14,
      productivityScore: 50
    }
  }

  private getDefaultFocusPattern(): FocusPattern {
    return {
      averageFocusTime: 25,
      optimalFocusDuration: 25,
      focusConsistency: 50,
      bestFocusTimes: [10, 14, 16],
      focusTrend: 'stable'
    }
  }

  private getDefaultDistractionPattern(): DistractionPattern {
    return {
      mostCommonDistractions: [],
      distractionsByHour: {},
      averageDistractionsPerSession: 0,
      distractionTrend: 'stable',
      criticalDistractionHours: []
    }
  }

  private getDefaultEnergyPattern(): EnergyPattern {
    return {
      averageEnergyLevel: 3,
      energyByHour: {},
      peakEnergyHours: [10, 14],
      lowEnergyHours: [13, 17],
      energyConsistency: 50,
      energyTrend: 'stable'
    }
  }

  private getDefaultWeeklyPattern(): WeeklyPattern {
    return {
      mostProductiveDays: ['화요일'],
      leastProductiveDays: ['월요일'],
      weeklyConsistency: 50,
      weekendVsWeekdayRatio: 0.7
    }
  }
}

// 싱글톤 인스턴스
export const patternAnalysisService = new PatternAnalysisService()