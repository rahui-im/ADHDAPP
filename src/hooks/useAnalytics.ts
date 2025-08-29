import { useEffect, useCallback, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { analyticsService } from '../services/analyticsService'
import { DistractionType, Session, DailyStats, WeeklyInsight } from '../types'
import { setLoading, setError } from '../store/analyticsSlice'

// 분석 데이터 수집을 위한 커스텀 훅
export const useAnalytics = () => {
  const dispatch = useDispatch()
  const analytics = useSelector((state: RootState) => state.analytics)
  const [serviceStatus, setServiceStatus] = useState({
    available: false,
    sessionCount: 0,
    statsCount: 0,
    lastUpdate: null as Date | null,
  })

  // 서비스 상태 확인
  const checkServiceStatus = useCallback(async () => {
    try {
      const status = await analyticsService.getServiceStatus()
      setServiceStatus(status)
    } catch (error) {
      console.error('분석 서비스 상태 확인 실패:', error)
      setServiceStatus({
        available: false,
        sessionCount: 0,
        statsCount: 0,
        lastUpdate: null,
      })
    }
  }, [])

  // 세션 시작
  const startSession = useCallback(async (
    taskId: string,
    type: 'focus' | 'break',
    plannedDuration: number,
    energyBefore: number
  ): Promise<string | null> => {
    try {
      dispatch(setLoading(true))
      dispatch(setError(null))
      
      const sessionId = await analyticsService.startSession(taskId, type, plannedDuration, energyBefore)
      await checkServiceStatus()
      
      return sessionId
    } catch (error) {
      console.error('세션 시작 실패:', error)
      dispatch(setError('세션을 시작할 수 없습니다.'))
      return null
    } finally {
      dispatch(setLoading(false))
    }
  }, [dispatch, checkServiceStatus])

  // 세션 완료
  const completeSession = useCallback(async (
    sessionId: string,
    energyAfter: number,
    wasInterrupted: boolean = false,
    interruptionReasons: DistractionType[] = []
  ): Promise<void> => {
    try {
      dispatch(setLoading(true))
      dispatch(setError(null))
      
      await analyticsService.completeSession(sessionId, energyAfter, wasInterrupted, interruptionReasons)
      await checkServiceStatus()
    } catch (error) {
      console.error('세션 완료 기록 실패:', error)
      dispatch(setError('세션 완료를 기록할 수 없습니다.'))
    } finally {
      dispatch(setLoading(false))
    }
  }, [dispatch, checkServiceStatus])

  // 세션 중단 기록
  const recordDistraction = useCallback(async (
    sessionId: string,
    distractionType: DistractionType
  ): Promise<void> => {
    try {
      await analyticsService.interruptSession(sessionId, distractionType)
    } catch (error) {
      console.error('주의산만 기록 실패:', error)
    }
  }, [])

  // 일일 통계 업데이트
  const updateDailyStats = useCallback(async (date: Date = new Date()): Promise<DailyStats | null> => {
    try {
      dispatch(setLoading(true))
      dispatch(setError(null))
      
      const stats = await analyticsService.updateDailyStatsForDate(date)
      await checkServiceStatus()
      
      return stats
    } catch (error) {
      console.error('일일 통계 업데이트 실패:', error)
      dispatch(setError('통계를 업데이트할 수 없습니다.'))
      return null
    } finally {
      dispatch(setLoading(false))
    }
  }, [dispatch, checkServiceStatus])

  // 주간 인사이트 생성
  const generateWeeklyInsight = useCallback(async (weekStart?: Date): Promise<WeeklyInsight | null> => {
    try {
      dispatch(setLoading(true))
      dispatch(setError(null))
      
      // 주 시작일 계산 (월요일 기준)
      const startDate = weekStart || (() => {
        const now = new Date()
        const dayOfWeek = now.getDay()
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // 일요일(0)이면 -6, 아니면 1-dayOfWeek
        const monday = new Date(now)
        monday.setDate(now.getDate() + mondayOffset)
        monday.setHours(0, 0, 0, 0)
        return monday
      })()
      
      const insight = await analyticsService.generateWeeklyInsight(startDate)
      return insight
    } catch (error) {
      console.error('주간 인사이트 생성 실패:', error)
      dispatch(setError('인사이트를 생성할 수 없습니다.'))
      return null
    } finally {
      dispatch(setLoading(false))
    }
  }, [dispatch])

  // 특정 기간 통계 조회
  const getStatsForPeriod = useCallback(async (
    startDate: Date,
    endDate: Date
  ): Promise<DailyStats[]> => {
    try {
      return await analyticsService.getStatsForPeriod(startDate, endDate)
    } catch (error) {
      console.error('기간별 통계 조회 실패:', error)
      return []
    }
  }, [])

  // 작업별 세션 조회
  const getTaskSessions = useCallback(async (taskId: string): Promise<Session[]> => {
    try {
      return await analyticsService.getTaskSessions(taskId)
    } catch (error) {
      console.error('작업 세션 조회 실패:', error)
      return []
    }
  }, [])

  // 최근 세션 조회
  const getRecentSessions = useCallback(async (days: number = 7): Promise<Session[]> => {
    try {
      return await analyticsService.getRecentSessions(days)
    } catch (error) {
      console.error('최근 세션 조회 실패:', error)
      return []
    }
  }, [])

  // 데이터 정리
  const cleanupOldData = useCallback(async (retentionDays: number = 30): Promise<void> => {
    try {
      dispatch(setLoading(true))
      await analyticsService.cleanupOldData(retentionDays)
      await checkServiceStatus()
    } catch (error) {
      console.error('데이터 정리 실패:', error)
      dispatch(setError('데이터 정리 중 오류가 발생했습니다.'))
    } finally {
      dispatch(setLoading(false))
    }
  }, [dispatch, checkServiceStatus])

  // 컴포넌트 마운트 시 서비스 상태 확인
  useEffect(() => {
    checkServiceStatus()
  }, [checkServiceStatus])

  // 자동 일일 통계 업데이트 (하루에 한 번)
  useEffect(() => {
    const updateDailyStatsIfNeeded = async () => {
      const today = new Date()
      const todayStr = today.toDateString()
      
      // 오늘 통계가 이미 업데이트되었는지 확인
      const existingStats = analytics.dailyStats.find(stat => 
        stat.date.toDateString() === todayStr
      )
      
      // 통계가 없거나 마지막 업데이트가 1시간 이상 전이면 업데이트
      if (!existingStats || Date.now() - existingStats.date.getTime() > 60 * 60 * 1000) {
        await updateDailyStats(today)
      }
    }

    updateDailyStatsIfNeeded()
    
    // 1시간마다 자동 업데이트
    const interval = setInterval(updateDailyStatsIfNeeded, 60 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [analytics.dailyStats, updateDailyStats])

  return {
    // 상태
    analytics,
    serviceStatus,
    isLoading: analytics.loading,
    error: analytics.error,
    
    // 액션
    startSession,
    completeSession,
    recordDistraction,
    updateDailyStats,
    generateWeeklyInsight,
    getStatsForPeriod,
    getTaskSessions,
    getRecentSessions,
    cleanupOldData,
    checkServiceStatus,
  }
}

// 분석 데이터 계산을 위한 유틸리티 훅
export const useAnalyticsCalculations = () => {
  const analytics = useSelector((state: RootState) => state.analytics)

  // 완료율 계산
  const calculateCompletionRate = useCallback((stats: DailyStats[]): number => {
    if (stats.length === 0) return 0
    
    const totalPlanned = stats.reduce((sum, stat) => sum + stat.tasksPlanned, 0)
    const totalCompleted = stats.reduce((sum, stat) => sum + stat.tasksCompleted, 0)
    
    return totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0
  }, [])

  // 평균 집중 시간 계산
  const calculateAverageFocusTime = useCallback((stats: DailyStats[]): number => {
    if (stats.length === 0) return 0
    
    const totalFocusTime = stats.reduce((sum, stat) => sum + stat.focusMinutes, 0)
    return Math.round(totalFocusTime / stats.length)
  }, [])

  // 가장 생산적인 요일 계산
  const calculateMostProductiveDay = useCallback((stats: DailyStats[]): string => {
    if (stats.length === 0) return '데이터 없음'
    
    const dayStats: Record<string, number> = {}
    
    stats.forEach(stat => {
      const dayName = stat.date.toLocaleDateString('ko-KR', { weekday: 'long' })
      dayStats[dayName] = (dayStats[dayName] || 0) + stat.focusMinutes
    })
    
    const mostProductiveDay = Object.entries(dayStats)
      .reduce((max, [day, minutes]) => 
        minutes > max.minutes ? { day, minutes } : max,
        { day: '데이터 없음', minutes: 0 }
      ).day
    
    return mostProductiveDay
  }, [])

  // 주의산만 패턴 분석
  const analyzeDistractionPatterns = useCallback((stats: DailyStats[]): {
    mostCommonDistraction: DistractionType | null
    averageDistractions: number
    distractionTrend: 'improving' | 'worsening' | 'stable'
  } => {
    if (stats.length === 0) {
      return {
        mostCommonDistraction: null,
        averageDistractions: 0,
        distractionTrend: 'stable'
      }
    }

    // 가장 흔한 주의산만 유형
    const distractionCounts: Record<DistractionType, number> = {
      website: 0,
      notification: 0,
      inactivity: 0,
      manual: 0
    }

    stats.forEach(stat => {
      stat.distractions.forEach(distraction => {
        distractionCounts[distraction]++
      })
    })

    const mostCommonDistraction = Object.entries(distractionCounts)
      .reduce((max, [type, count]) => 
        count > max.count ? { type: type as DistractionType, count } : max,
        { type: null as DistractionType | null, count: 0 }
      ).type

    // 평균 주의산만 횟수
    const totalDistractions = stats.reduce((sum, stat) => sum + stat.distractions.length, 0)
    const averageDistractions = Math.round(totalDistractions / stats.length)

    // 주의산만 트렌드 (최근 절반 vs 이전 절반 비교)
    const midPoint = Math.floor(stats.length / 2)
    const recentStats = stats.slice(midPoint)
    const olderStats = stats.slice(0, midPoint)

    const recentAvg = recentStats.length > 0 
      ? recentStats.reduce((sum, stat) => sum + stat.distractions.length, 0) / recentStats.length
      : 0
    const olderAvg = olderStats.length > 0
      ? olderStats.reduce((sum, stat) => sum + stat.distractions.length, 0) / olderStats.length
      : 0

    let distractionTrend: 'improving' | 'worsening' | 'stable' = 'stable'
    if (recentAvg < olderAvg * 0.8) {
      distractionTrend = 'improving'
    } else if (recentAvg > olderAvg * 1.2) {
      distractionTrend = 'worsening'
    }

    return {
      mostCommonDistraction,
      averageDistractions,
      distractionTrend
    }
  }, [])

  // 에너지 레벨 패턴 분석
  const analyzeEnergyPatterns = useCallback((stats: DailyStats[]): {
    averageEnergyLevel: number
    energyTrend: 'improving' | 'declining' | 'stable'
    bestEnergyDays: string[]
  } => {
    if (stats.length === 0) {
      return {
        averageEnergyLevel: 3,
        energyTrend: 'stable',
        bestEnergyDays: []
      }
    }

    // 평균 에너지 레벨
    const averageEnergyLevel = stats.reduce((sum, stat) => sum + stat.averageEnergyLevel, 0) / stats.length

    // 에너지 트렌드
    const midPoint = Math.floor(stats.length / 2)
    const recentStats = stats.slice(midPoint)
    const olderStats = stats.slice(0, midPoint)

    const recentAvgEnergy = recentStats.length > 0
      ? recentStats.reduce((sum, stat) => sum + stat.averageEnergyLevel, 0) / recentStats.length
      : 3
    const olderAvgEnergy = olderStats.length > 0
      ? olderStats.reduce((sum, stat) => sum + stat.averageEnergyLevel, 0) / olderStats.length
      : 3

    let energyTrend: 'improving' | 'declining' | 'stable' = 'stable'
    if (recentAvgEnergy > olderAvgEnergy + 0.3) {
      energyTrend = 'improving'
    } else if (recentAvgEnergy < olderAvgEnergy - 0.3) {
      energyTrend = 'declining'
    }

    // 에너지가 높은 요일들
    const dayEnergyMap: Record<string, number[]> = {}
    stats.forEach(stat => {
      const dayName = stat.date.toLocaleDateString('ko-KR', { weekday: 'long' })
      if (!dayEnergyMap[dayName]) dayEnergyMap[dayName] = []
      dayEnergyMap[dayName].push(stat.averageEnergyLevel)
    })

    const bestEnergyDays = Object.entries(dayEnergyMap)
      .map(([day, energyLevels]) => ({
        day,
        avgEnergy: energyLevels.reduce((sum, level) => sum + level, 0) / energyLevels.length
      }))
      .filter(({ avgEnergy }) => avgEnergy > averageEnergyLevel)
      .sort((a, b) => b.avgEnergy - a.avgEnergy)
      .slice(0, 3)
      .map(({ day }) => day)

    return {
      averageEnergyLevel: Math.round(averageEnergyLevel * 10) / 10,
      energyTrend,
      bestEnergyDays
    }
  }, [])

  return {
    calculateCompletionRate,
    calculateAverageFocusTime,
    calculateMostProductiveDay,
    analyzeDistractionPatterns,
    analyzeEnergyPatterns,
  }
}