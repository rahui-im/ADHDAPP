import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Session, DailyStats, WeeklyInsight, AnalyticsData, DistractionType } from '../types'

interface AnalyticsState {
  sessions: Session[]
  dailyStats: DailyStats[]
  weeklyInsights: WeeklyInsight[]
  currentStreak: number
  longestStreak: number
  totalFocusTime: number // minutes
  totalCompletedTasks: number
  loading: boolean
  error: string | null
}

const initialState: AnalyticsState = {
  sessions: [],
  dailyStats: [],
  weeklyInsights: [],
  currentStreak: 0,
  longestStreak: 0,
  totalFocusTime: 0,
  totalCompletedTasks: 0,
  loading: false,
  error: null,
}

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    // 세션 기록 추가
    addSession: (state, action: PayloadAction<Omit<Session, 'id'>>) => {
      const session: Session = {
        id: crypto.randomUUID(),
        ...action.payload,
      }
      
      state.sessions.push(session)
      
      // 집중 세션인 경우 총 집중 시간 업데이트
      if (session.type === 'focus' && session.completedAt) {
        state.totalFocusTime += session.actualDuration
      }
    },

    // 세션 업데이트
    updateSession: (state, action: PayloadAction<{ id: string; updates: Partial<Session> }>) => {
      const { id, updates } = action.payload
      const sessionIndex = state.sessions.findIndex(s => s.id === id)
      
      if (sessionIndex !== -1) {
        state.sessions[sessionIndex] = { ...state.sessions[sessionIndex], ...updates }
      }
    },

    // 일일 통계 계산 및 업데이트
    updateDailyStats: (state, action: PayloadAction<Date>) => {
      const date = action.payload
      const dateStr = date.toDateString()
      
      // 해당 날짜의 세션들 필터링
      const todaySessions = state.sessions.filter(session => 
        session.startedAt.toDateString() === dateStr
      )
      
      const focusSessions = todaySessions.filter(s => s.type === 'focus')
      const completedFocusSessions = focusSessions.filter(s => s.completedAt)
      
      const dailyStat: DailyStats = {
        date,
        tasksCompleted: 0, // 별도로 계산 필요
        tasksPlanned: 0, // 별도로 계산 필요
        focusMinutes: completedFocusSessions.reduce((sum, s) => sum + s.actualDuration, 0),
        breakMinutes: todaySessions
          .filter(s => s.type === 'break' && s.completedAt)
          .reduce((sum, s) => sum + s.actualDuration, 0),
        pomodorosCompleted: completedFocusSessions.length,
        averageEnergyLevel: focusSessions.length > 0 
          ? focusSessions.reduce((sum, s) => sum + s.energyBefore, 0) / focusSessions.length
          : 3,
        distractions: todaySessions.flatMap(s => s.interruptionReasons),
      }
      
      // 기존 통계 업데이트 또는 새로 추가
      const existingIndex = state.dailyStats.findIndex(stat => 
        stat.date.toDateString() === dateStr
      )
      
      if (existingIndex !== -1) {
        state.dailyStats[existingIndex] = dailyStat
      } else {
        state.dailyStats.push(dailyStat)
      }
    },

    // 연속 달성 일수 업데이트
    updateStreak: (state, action: PayloadAction<{ completed: boolean; date: Date }>) => {
      const { completed, date } = action.payload
      
      if (completed) {
        state.currentStreak += 1
        if (state.currentStreak > state.longestStreak) {
          state.longestStreak = state.currentStreak
        }
      } else {
        state.currentStreak = 0
      }
    },

    // 주간 인사이트 생성
    generateWeeklyInsight: (state, action: PayloadAction<Date>) => {
      const weekStart = action.payload
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      // 해당 주의 일일 통계들
      const weekStats = state.dailyStats.filter(stat => 
        stat.date >= weekStart && stat.date <= weekEnd
      )
      
      if (weekStats.length === 0) return
      
      // 완료율 계산
      const totalPlanned = weekStats.reduce((sum, stat) => sum + stat.tasksPlanned, 0)
      const totalCompleted = weekStats.reduce((sum, stat) => sum + stat.tasksCompleted, 0)
      const completionRate = totalPlanned > 0 ? (totalCompleted / totalPlanned) * 100 : 0
      
      // 가장 생산적인 날 찾기
      const mostProductiveDay = weekStats.reduce((max, stat) => 
        stat.focusMinutes > max.focusMinutes ? stat : max
      ).date.toLocaleDateString('ko-KR', { weekday: 'long' })
      
      // 가장 생산적인 시간대 (임시로 오후 2시로 설정)
      const mostProductiveHour = 14
      
      // 개선 제안 생성
      const improvementSuggestions: string[] = []
      
      if (completionRate < 50) {
        improvementSuggestions.push('목표를 더 현실적으로 설정해보세요')
      }
      
      const avgDistractions = weekStats.reduce((sum, stat) => sum + stat.distractions.length, 0) / weekStats.length
      if (avgDistractions > 3) {
        improvementSuggestions.push('집중 모드를 더 자주 활용해보세요')
      }
      
      const avgFocusTime = weekStats.reduce((sum, stat) => sum + stat.focusMinutes, 0) / weekStats.length
      if (avgFocusTime < 60) {
        improvementSuggestions.push('하루 최소 1시간 집중 시간을 목표로 해보세요')
      }
      
      const weeklyInsight: WeeklyInsight = {
        weekStart,
        completionRate,
        mostProductiveDay,
        mostProductiveHour,
        improvementSuggestions,
        goalAchievement: completionRate >= 70,
      }
      
      // 기존 인사이트 업데이트 또는 새로 추가
      const existingIndex = state.weeklyInsights.findIndex(insight => 
        insight.weekStart.toDateString() === weekStart.toDateString()
      )
      
      if (existingIndex !== -1) {
        state.weeklyInsights[existingIndex] = weeklyInsight
      } else {
        state.weeklyInsights.push(weeklyInsight)
      }
    },

    // 분석 데이터 조회를 위한 계산
    calculateAnalyticsData: (state, action: PayloadAction<{ timeRange: 'week' | 'month' | 'quarter' }>) => {
      const { timeRange } = action.payload
      const now = new Date()
      let startDate = new Date()
      
      // 시간 범위에 따른 시작 날짜 설정
      switch (timeRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3)
          break
      }
      
      // 해당 기간의 통계들
      const periodStats = state.dailyStats.filter(stat => stat.date >= startDate)
      
      if (periodStats.length === 0) return
      
      // 분석 데이터 계산은 별도 셀렉터에서 처리
    },

    // 완료된 작업 수 업데이트
    incrementCompletedTasks: (state) => {
      state.totalCompletedTasks += 1
    },

    // 주의산만 기록
    recordDistraction: (state, action: PayloadAction<{ sessionId: string; type: DistractionType }>) => {
      const { sessionId, type } = action.payload
      const session = state.sessions.find(s => s.id === sessionId)
      
      if (session) {
        session.interruptionReasons.push(type)
        session.wasInterrupted = true
      }
    },

    // 로딩 상태 설정
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },

    // 오류 설정
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    // 분석 데이터 초기화
    clearAnalytics: (state) => {
      state.sessions = []
      state.dailyStats = []
      state.weeklyInsights = []
      state.currentStreak = 0
      state.longestStreak = 0
      state.totalFocusTime = 0
      state.totalCompletedTasks = 0
    },

    // 오래된 데이터 정리 (30일 이상)
    cleanupOldData: (state) => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      state.sessions = state.sessions.filter(session => session.startedAt >= thirtyDaysAgo)
      state.dailyStats = state.dailyStats.filter(stat => stat.date >= thirtyDaysAgo)
      state.weeklyInsights = state.weeklyInsights.filter(insight => insight.weekStart >= thirtyDaysAgo)
    },
  },
})

export const {
  addSession,
  updateSession,
  updateDailyStats,
  updateStreak,
  generateWeeklyInsight,
  calculateAnalyticsData,
  incrementCompletedTasks,
  recordDistraction,
  setLoading,
  setError,
  clearAnalytics,
  cleanupOldData,
} = analyticsSlice.actions

export default analyticsSlice.reducer