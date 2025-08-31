import { useState, useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store/store'
import { patternAnalysisService, AnalysisInsights } from '../services/patternAnalysisService'
import { analyticsService } from '../services/analyticsService'

// 패턴 분석을 위한 커스텀 훅
export const usePatternAnalysis = () => {
  const [insights, setInsights] = useState<AnalysisInsights | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastAnalysisDate, setLastAnalysisDate] = useState<Date | null>(null)

  const analytics = useSelector((state: RootState) => state.analytics)
  const tasks = useSelector((state: RootState) => state.tasks.tasks)

  // 종합 분석 실행
  const runComprehensiveAnalysis = useCallback(async (forceRefresh: boolean = false) => {
    // 캐시된 결과가 있고 강제 새로고침이 아니면 스킵
    if (insights && lastAnalysisDate && !forceRefresh) {
      const hoursSinceLastAnalysis = (Date.now() - lastAnalysisDate.getTime()) / (1000 * 60 * 60)
      if (hoursSinceLastAnalysis < 6) { // 6시간 이내면 캐시 사용
        return insights
      }
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      // 최근 30일 데이터 조회
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const [sessions, dailyStats] = await Promise.all([
        analyticsService.getRecentSessions(30),
        analyticsService.getStatsForPeriod(thirtyDaysAgo, new Date())
      ])

      // 종합 분석 실행
      const analysisResult = await patternAnalysisService.generateComprehensiveAnalysis(
        sessions,
        dailyStats,
        tasks
      )

      setInsights(analysisResult)
      setLastAnalysisDate(new Date())
      
      return analysisResult
    } catch (err) {
      console.error('패턴 분석 실패:', err)
      setError('패턴 분석 중 오류가 발생했습니다.')
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }, [insights, lastAnalysisDate, tasks])

  // 생산성 패턴만 분석
  const analyzeProductivityPattern = useCallback(async (days: number = 14) => {
    try {
      const sessions = await analyticsService.getRecentSessions(days)
      return await patternAnalysisService.analyzeProductivityPattern(sessions)
    } catch (err) {
      console.error('생산성 패턴 분석 실패:', err)
      return null
    }
  }, [])

  // 집중력 패턴 분석
  const analyzeFocusPattern = useCallback(async (days: number = 14) => {
    try {
      const sessions = await analyticsService.getRecentSessions(days)
      return await patternAnalysisService.analyzeFocusPattern(sessions)
    } catch (err) {
      console.error('집중력 패턴 분석 실패:', err)
      return null
    }
  }, [])

  // 작업 유형 선호도 분석
  const analyzeTaskPreferences = useCallback(async () => {
    try {
      const sessions = await analyticsService.getRecentSessions(30)
      return await patternAnalysisService.analyzeTaskTypePreferences(tasks, sessions)
    } catch (err) {
      console.error('작업 선호도 분석 실패:', err)
      return null
    }
  }, [tasks])

  // 주의산만 패턴 분석
  const analyzeDistractionPattern = useCallback(async (days: number = 14) => {
    try {
      const sessions = await analyticsService.getRecentSessions(days)
      return await patternAnalysisService.analyzeDistractionPattern(sessions)
    } catch (err) {
      console.error('주의산만 패턴 분석 실패:', err)
      return null
    }
  }, [])

  // 에너지 패턴 분석
  const analyzeEnergyPattern = useCallback(async (days: number = 14) => {
    try {
      const sessions = await analyticsService.getRecentSessions(days)
      return await patternAnalysisService.analyzeEnergyPattern(sessions)
    } catch (err) {
      console.error('에너지 패턴 분석 실패:', err)
      return null
    }
  }, [])

  // 주간 패턴 분석
  const analyzeWeeklyPattern = useCallback(async (weeks: number = 4) => {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - (weeks * 7))
      
      const dailyStats = await analyticsService.getStatsForPeriod(startDate, new Date())
      return await patternAnalysisService.analyzeWeeklyPattern(dailyStats)
    } catch (err) {
      console.error('주간 패턴 분석 실패:', err)
      return null
    }
  }, [])

  // 특정 작업의 패턴 분석
  const analyzeTaskPattern = useCallback(async (taskId: string) => {
    try {
      const sessions = await analyticsService.getTaskSessions(taskId)
      const task = tasks.find(t => t.id === taskId)
      
      if (!task) return null

      const [productivity, focus, distractions, energy] = await Promise.all([
        patternAnalysisService.analyzeProductivityPattern(sessions),
        patternAnalysisService.analyzeFocusPattern(sessions),
        patternAnalysisService.analyzeDistractionPattern(sessions),
        patternAnalysisService.analyzeEnergyPattern(sessions)
      ])

      return {
        task,
        sessions,
        patterns: {
          productivity,
          focus,
          distractions,
          energy
        }
      }
    } catch (err) {
      console.error('작업 패턴 분석 실패:', err)
      return null
    }
  }, [tasks])

  // 최적 작업 시간 추천
  const getOptimalWorkTimes = useCallback(() => {
    if (!insights) return []

    const recommendations = []

    // 생산성이 높은 시간대
    if (insights.productivity.mostProductiveHours.length > 0) {
      recommendations.push({
        type: 'productivity',
        hours: insights.productivity.mostProductiveHours,
        reason: '가장 생산적인 시간대',
        priority: 'high'
      })
    }

    // 집중력이 좋은 시간대
    if (insights.focus.bestFocusTimes.length > 0) {
      recommendations.push({
        type: 'focus',
        hours: insights.focus.bestFocusTimes,
        reason: '집중력이 가장 좋은 시간대',
        priority: 'high'
      })
    }

    // 에너지가 높은 시간대
    if (insights.energy.peakEnergyHours.length > 0) {
      recommendations.push({
        type: 'energy',
        hours: insights.energy.peakEnergyHours,
        reason: '에너지 레벨이 높은 시간대',
        priority: 'medium'
      })
    }

    return recommendations
  }, [insights])

  // 주의산만 위험 시간대
  const getDistractionRiskTimes = useCallback(() => {
    if (!insights) return []

    return insights.distractions.criticalDistractionHours.map(hour => ({
      hour,
      risk: 'high',
      commonDistractions: insights.distractions.mostCommonDistractions,
      suggestion: '이 시간대에는 집중 모드를 활용하거나 환경을 정리하세요.'
    }))
  }, [insights])

  // 개인화된 작업 추천
  const getPersonalizedTaskRecommendations = useCallback(() => {
    if (!insights) return []

    const recommendations = []
    const currentHour = new Date().getHours()

    // 현재 시간대 기반 추천
    if (insights.productivity.mostProductiveHours.includes(currentHour)) {
      recommendations.push({
        type: 'timing',
        message: '지금이 가장 생산적인 시간대예요! 중요한 작업을 시작해보세요.',
        priority: 'high'
      })
    }

    if (insights.energy.peakEnergyHours.includes(currentHour)) {
      recommendations.push({
        type: 'energy',
        message: '에너지가 높은 시간대예요. 어려운 작업에 도전해보세요.',
        priority: 'medium'
      })
    }

    if (insights.distractions.criticalDistractionHours.includes(currentHour)) {
      recommendations.push({
        type: 'caution',
        message: '주의산만이 많은 시간대예요. 집중 모드를 켜거나 환경을 정리하세요.',
        priority: 'high'
      })
    }

    // 선호 작업 유형 기반 추천
    if (insights.taskPreferences.length > 0) {
      const bestCategory = insights.taskPreferences[0]
      recommendations.push({
        type: 'category',
        message: `${bestCategory.category} 작업을 잘 완료하고 있어요. 이런 유형의 작업을 더 계획해보세요.`,
        priority: 'low'
      })
    }

    return recommendations.sort((a, b) => {
      const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }, [insights])

  // 자동 분석 (데이터 변경 시)
  useEffect(() => {
    // 세션이나 작업 데이터가 변경되면 자동으로 분석 실행
    if (analytics.sessions.length > 0 || tasks.length > 0) {
      const shouldAnalyze = !lastAnalysisDate || 
        (Date.now() - lastAnalysisDate.getTime()) > 24 * 60 * 60 * 1000 // 24시간 경과

      if (shouldAnalyze) {
        runComprehensiveAnalysis()
      }
    }
  }, [analytics.sessions.length, tasks.length, lastAnalysisDate, runComprehensiveAnalysis])

  return {
    // 상태
    insights,
    isAnalyzing,
    error,
    lastAnalysisDate,
    
    // 종합 분석
    runComprehensiveAnalysis,
    
    // 개별 패턴 분석
    analyzeProductivityPattern,
    analyzeFocusPattern,
    analyzeTaskPreferences,
    analyzeDistractionPattern,
    analyzeEnergyPattern,
    analyzeWeeklyPattern,
    analyzeTaskPattern,
    
    // 추천 및 인사이트
    getOptimalWorkTimes,
    getDistractionRiskTimes,
    getPersonalizedTaskRecommendations,
  }
}

// 패턴 분석 결과를 시각화하기 위한 유틸리티 훅
export const usePatternVisualization = () => {
  const { insights } = usePatternAnalysis()

  // 시간대별 생산성 차트 데이터
  const getProductivityChartData = useCallback(() => {
    if (!insights) return []

    const hours = Array.from({ length: 24 }, (_, i) => i)
    return hours.map(hour => ({
      hour,
      productivity: insights.productivity.mostProductiveHours.includes(hour) ? 100 : 
                   insights.productivity.leastProductiveHours.includes(hour) ? 20 : 60,
      isOptimal: insights.productivity.mostProductiveHours.includes(hour),
      isPoor: insights.productivity.leastProductiveHours.includes(hour)
    }))
  }, [insights])

  // 작업 유형별 선호도 차트 데이터
  const getTaskPreferenceChartData = useCallback(() => {
    if (!insights) return []

    return insights.taskPreferences.map(pref => ({
      category: pref.category,
      completionRate: pref.completionRate,
      averageFocusTime: pref.averageFocusTime,
      preferenceScore: pref.preferenceScore,
      totalTasks: pref.totalTasks
    }))
  }, [insights])

  // 주의산만 패턴 차트 데이터
  const getDistractionChartData = useCallback(() => {
    if (!insights) return []

    return insights.distractions.mostCommonDistractions.map(distraction => ({
      type: distraction,
      label: {
        website: '웹사이트',
        notification: '알림',
        inactivity: '비활성',
        manual: '수동'
      }[distraction],
      count: Object.values(insights.distractions.distractionsByHour)
        .flat()
        .filter(d => d === distraction).length
    }))
  }, [insights])

  // 에너지 레벨 차트 데이터
  const getEnergyChartData = useCallback(() => {
    if (!insights) return []

    return Object.entries(insights.energy.energyByHour).map(([hour, energy]) => ({
      hour: parseInt(hour),
      energy: Math.round(energy * 10) / 10,
      isPeak: insights.energy.peakEnergyHours.includes(parseInt(hour)),
      isLow: insights.energy.lowEnergyHours.includes(parseInt(hour))
    }))
  }, [insights])

  return {
    getProductivityChartData,
    getTaskPreferenceChartData,
    getDistractionChartData,
    getEnergyChartData
  }
}