import { useState, useCallback, useEffect } from 'react'
import { 
  reportGenerationService, 
  WeeklyReport, 
  MonthlyReport,
  Achievement,
  ImprovementArea,
  Goal
} from '../services/reportGenerationService'

// 리포트 관리를 위한 커스텀 훅
export const useReports = () => {
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null)
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportHistory, setReportHistory] = useState<{
    weekly: WeeklyReport[]
    monthly: MonthlyReport[]
  }>({
    weekly: [],
    monthly: []
  })

  // const analytics = useSelector((state: RootState) => state.analytics)

  // 주간 리포트 생성
  const generateWeeklyReport = useCallback(async (weekStart?: Date): Promise<WeeklyReport | null> => {
    setIsGenerating(true)
    setError(null)

    try {
      const report = await reportGenerationService.generateWeeklyReport(weekStart)
      setWeeklyReport(report)
      
      // 히스토리에 추가
      setReportHistory(prev => ({
        ...prev,
        weekly: [report, ...prev.weekly.slice(0, 9)] // 최대 10개 보관
      }))

      return report
    } catch (err) {
      console.error('주간 리포트 생성 실패:', err)
      setError('주간 리포트를 생성할 수 없습니다.')
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [])

  // 월간 리포트 생성
  const generateMonthlyReport = useCallback(async (month?: number, year?: number): Promise<MonthlyReport | null> => {
    setIsGenerating(true)
    setError(null)

    try {
      const report = await reportGenerationService.generateMonthlyReport(month, year)
      setMonthlyReport(report)
      
      // 히스토리에 추가
      setReportHistory(prev => ({
        ...prev,
        monthly: [report, ...prev.monthly.slice(0, 11)] // 최대 12개 보관
      }))

      return report
    } catch (err) {
      console.error('월간 리포트 생성 실패:', err)
      setError('월간 리포트를 생성할 수 없습니다.')
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [])

  // 현재 주 리포트 가져오기
  const getCurrentWeekReport = useCallback(async (): Promise<WeeklyReport | null> => {
    const now = new Date()
    const existingReport = reportHistory.weekly.find(report => {
      const reportWeek = report.weekStart.toDateString()
      const currentWeekStart = getWeekStart(now).toDateString()
      return reportWeek === currentWeekStart
    })

    if (existingReport) {
      setWeeklyReport(existingReport)
      return existingReport
    }

    return await generateWeeklyReport()
  }, [reportHistory.weekly, generateWeeklyReport])

  // 현재 월 리포트 가져오기
  const getCurrentMonthReport = useCallback(async (): Promise<MonthlyReport | null> => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const existingReport = reportHistory.monthly.find(report => 
      report.month === currentMonth && report.year === currentYear
    )

    if (existingReport) {
      setMonthlyReport(existingReport)
      return existingReport
    }

    return await generateMonthlyReport(currentMonth, currentYear)
  }, [reportHistory.monthly, generateMonthlyReport])

  // 특정 기간 리포트 조회
  const getReportForPeriod = useCallback((
    type: 'weekly' | 'monthly',
    date: Date
  ): WeeklyReport | MonthlyReport | null => {
    if (type === 'weekly') {
      const weekStart = getWeekStart(date)
      return reportHistory.weekly.find(report => 
        report.weekStart.toDateString() === weekStart.toDateString()
      ) || null
    } else {
      const month = date.getMonth()
      const year = date.getFullYear()
      return reportHistory.monthly.find(report => 
        report.month === month && report.year === year
      ) || null
    }
  }, [reportHistory])

  // 리포트 요약 정보 추출
  const getReportSummary = useCallback((report: WeeklyReport | MonthlyReport) => {
    return {
      completionRate: report.summary.completionRate,
      totalFocusTime: report.summary.totalFocusTime,
      tasksCompleted: report.summary.tasksCompleted,
      pomodorosCompleted: report.summary.pomodorosCompleted,
      averageEnergyLevel: report.summary.averageEnergyLevel,
      achievementCount: report.achievements.length,
      improvementCount: report.improvements.length,
      goalCount: 'nextWeekGoals' in report ? report.nextWeekGoals.length : report.nextMonthGoals.length,
      confidenceLevel: report.confidenceLevel
    }
  }, [])

  // 성취 분석
  const analyzeAchievements = useCallback((achievements: Achievement[]) => {
    const byType = achievements.reduce((acc, achievement) => {
      acc[achievement.type] = (acc[achievement.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const newAchievements = achievements.filter(a => a.isNew)
    const totalValue = achievements.reduce((sum, a) => sum + (a.value || 0), 0)

    return {
      total: achievements.length,
      byType,
      newCount: newAchievements.length,
      totalValue,
      mostCommonType: Object.entries(byType)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || null
    }
  }, [])

  // 개선 영역 우선순위 분석
  const analyzeImprovements = useCallback((improvements: ImprovementArea[]) => {
    const highPriority = improvements.filter(i => i.priority === 'high')
    const mediumPriority = improvements.filter(i => i.priority === 'medium')
    const lowPriority = improvements.filter(i => i.priority === 'low')

    const averageCurrentScore = improvements.length > 0
      ? improvements.reduce((sum, i) => sum + i.currentScore, 0) / improvements.length
      : 0

    const averageTargetScore = improvements.length > 0
      ? improvements.reduce((sum, i) => sum + i.targetScore, 0) / improvements.length
      : 0

    return {
      total: improvements.length,
      highPriority: highPriority.length,
      mediumPriority: mediumPriority.length,
      lowPriority: lowPriority.length,
      averageCurrentScore: Math.round(averageCurrentScore),
      averageTargetScore: Math.round(averageTargetScore),
      improvementGap: Math.round(averageTargetScore - averageCurrentScore),
      topImprovement: improvements[0] || null
    }
  }, [])

  // 목표 달성 가능성 분석
  const analyzeGoals = useCallback((goals: Goal[]) => {
    const achievableGoals = goals.filter(g => g.isAchievable)
    const challengingGoals = goals.filter(g => !g.isAchievable)

    const averageProgress = goals.length > 0
      ? goals.reduce((sum, g) => {
          const progress = g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0
          return sum + Math.min(100, progress)
        }, 0) / goals.length
      : 0

    return {
      total: goals.length,
      achievable: achievableGoals.length,
      challenging: challengingGoals.length,
      averageProgress: Math.round(averageProgress),
      byType: goals.reduce((acc, goal) => {
        acc[goal.type] = (acc[goal.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }, [])

  // 리포트 비교 (이전 기간과)
  const compareReports = useCallback((
    current: WeeklyReport | MonthlyReport,
    previous: WeeklyReport | MonthlyReport | null
  ) => {
    if (!previous) {
      return {
        completionRateChange: 0,
        focusTimeChange: 0,
        tasksCompletedChange: 0,
        energyLevelChange: 0,
        achievementChange: 0,
        hasImprovement: false
      }
    }

    const completionRateChange = current.summary.completionRate - previous.summary.completionRate
    const focusTimeChange = current.summary.totalFocusTime - previous.summary.totalFocusTime
    const tasksCompletedChange = current.summary.tasksCompleted - previous.summary.tasksCompleted
    const energyLevelChange = current.summary.averageEnergyLevel - previous.summary.averageEnergyLevel
    const achievementChange = current.achievements.length - previous.achievements.length

    const hasImprovement = completionRateChange > 0 || focusTimeChange > 0 || energyLevelChange > 0

    return {
      completionRateChange: Math.round(completionRateChange),
      focusTimeChange: Math.round(focusTimeChange),
      tasksCompletedChange,
      energyLevelChange: Math.round(energyLevelChange * 10) / 10,
      achievementChange,
      hasImprovement
    }
  }, [])

  // 리포트 내보내기
  const exportReport = useCallback((report: WeeklyReport | MonthlyReport, format: 'json' | 'text' = 'json') => {
    if (format === 'json') {
      const dataStr = JSON.stringify(report, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `report-${report.id}.json`
      link.click()
      
      URL.revokeObjectURL(url)
    } else {
      const textReport = generateTextReport(report)
      const dataBlob = new Blob([textReport], { type: 'text/plain' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `report-${report.id}.txt`
      link.click()
      
      URL.revokeObjectURL(url)
    }
  }, [])

  // 자동 리포트 생성 (주간)
  useEffect(() => {
    const checkAndGenerateWeeklyReport = async () => {
      const now = new Date()
      const dayOfWeek = now.getDay()
      
      // 일요일 저녁에 주간 리포트 자동 생성
      if (dayOfWeek === 0 && now.getHours() >= 20) {
        const currentWeekStart = getWeekStart(now)
        const existingReport = reportHistory.weekly.find(report => 
          report.weekStart.toDateString() === currentWeekStart.toDateString()
        )
        
        if (!existingReport) {
          await generateWeeklyReport()
        }
      }
    }

    checkAndGenerateWeeklyReport()
  }, [reportHistory.weekly, generateWeeklyReport])

  // 자동 리포트 생성 (월간)
  useEffect(() => {
    const checkAndGenerateMonthlyReport = async () => {
      const now = new Date()
      const isLastDayOfMonth = now.getDate() === new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      
      // 월말에 월간 리포트 자동 생성
      if (isLastDayOfMonth && now.getHours() >= 20) {
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        const existingReport = reportHistory.monthly.find(report => 
          report.month === currentMonth && report.year === currentYear
        )
        
        if (!existingReport) {
          await generateMonthlyReport()
        }
      }
    }

    checkAndGenerateMonthlyReport()
  }, [reportHistory.monthly, generateMonthlyReport])

  return {
    // 상태
    weeklyReport,
    monthlyReport,
    isGenerating,
    error,
    reportHistory,
    
    // 리포트 생성
    generateWeeklyReport,
    generateMonthlyReport,
    getCurrentWeekReport,
    getCurrentMonthReport,
    getReportForPeriod,
    
    // 분석 도구
    getReportSummary,
    analyzeAchievements,
    analyzeImprovements,
    analyzeGoals,
    compareReports,
    
    // 유틸리티
    exportReport
  }
}

// 유틸리티 함수들
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 월요일 기준
  const monday = new Date(d.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}

function generateTextReport(report: WeeklyReport | MonthlyReport): string {
  const isWeekly = 'weekStart' in report
  const period = isWeekly 
    ? `${report.weekStart.toLocaleDateString()} - ${report.weekEnd.toLocaleDateString()}`
    : `${report.year}년 ${report.month + 1}월`

  let text = `# ${isWeekly ? '주간' : '월간'} 리포트\n`
  text += `기간: ${period}\n`
  text += `생성일: ${report.generatedAt.toLocaleDateString()}\n\n`

  text += `## 요약\n`
  text += `- 완료율: ${report.summary.completionRate}%\n`
  text += `- 총 집중 시간: ${Math.round(report.summary.totalFocusTime / 60)}시간 ${report.summary.totalFocusTime % 60}분\n`
  text += `- 완료된 작업: ${report.summary.tasksCompleted}개\n`
  text += `- 완료된 포모도로: ${report.summary.pomodorosCompleted}개\n`
  text += `- 평균 에너지 레벨: ${report.summary.averageEnergyLevel}/5\n\n`

  if (report.achievements.length > 0) {
    text += `## 성취\n`
    report.achievements.forEach(achievement => {
      text += `- ${achievement.icon} ${achievement.title}: ${achievement.description}\n`
    })
    text += '\n'
  }

  if (report.improvements.length > 0) {
    text += `## 개선 영역\n`
    report.improvements.forEach(improvement => {
      text += `- ${improvement.title} (${improvement.currentScore}/100점)\n`
      text += `  ${improvement.description}\n`
    })
    text += '\n'
  }

  text += `## 동기부여 메시지\n`
  text += `${report.motivationalMessage}\n\n`

  text += `## 추천사항\n`
  report.insights.recommendations.forEach(rec => {
    text += `- ${rec}\n`
  })

  return text
}