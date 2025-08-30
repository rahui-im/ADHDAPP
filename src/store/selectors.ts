import { createSelector } from '@reduxjs/toolkit'
import { RootState } from './store'
import { AnalyticsData } from '../types'

// Task 셀렉터들
export const selectAllTasks = (state: RootState) => state.tasks.tasks
export const selectCurrentTask = (state: RootState) => state.tasks.currentTask
export const selectTasksLoading = (state: RootState) => state.tasks.loading
export const selectTasksError = (state: RootState) => state.tasks.error

// 오늘의 작업들
export const selectTodayTasks = createSelector(
    [selectAllTasks],
    (tasks) => {
        const today = new Date().toDateString()
        return tasks.filter(task =>
            task.createdAt.toDateString() === today ||
            task.status === 'in-progress'
        )
    }
)

// 완료된 작업들
export const selectCompletedTasks = createSelector(
    [selectAllTasks],
    (tasks) => tasks.filter(task => task.status === 'completed')
)

// 진행 중인 작업들
export const selectInProgressTasks = createSelector(
    [selectAllTasks],
    (tasks) => tasks.filter(task => task.status === 'in-progress')
)

// 우선순위별 작업들
export const selectTasksByPriority = createSelector(
    [selectAllTasks],
    (tasks) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return [...tasks].sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
    }
)

// Timer 셀렉터들
export const selectTimerState = (state: RootState) => state.timer
export const selectTimerSettings = (state: RootState) => state.timer.settings
export const selectIsTimerRunning = (state: RootState) => state.timer.isRunning
export const selectTimerMode = (state: RootState) => state.timer.mode
export const selectTimerRemaining = (state: RootState) => state.timer.remaining
export const selectCurrentCycle = (state: RootState) => state.timer.currentCycle
export const selectTotalCycles = (state: RootState) => state.timer.totalCycles

// 타이머 진행률 (0-100)
export const selectTimerProgress = createSelector(
    [(state: RootState) => state.timer.duration, (state: RootState) => state.timer.remaining],
    (duration, remaining) => {
        if (duration === 0) return 0
        return Math.round(((duration - remaining) / duration) * 100)
    }
)

// 포맷된 시간 (MM:SS)
export const selectFormattedTime = createSelector(
    [selectTimerRemaining],
    (remaining) => {
        const minutes = Math.floor(remaining / 60)
        const seconds = remaining % 60
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
)

// User 셀렉터들
export const selectCurrentUser = (state: RootState) => state.user.currentUser
export const selectUserPreferences = (state: RootState) => state.user.currentUser?.preferences
export const selectUserSettings = (state: RootState) => state.user.currentUser?.settings
export const selectEnergyLevel = (state: RootState) => state.user.energyLevel
export const selectFocusMode = (state: RootState) => state.user.focusMode
export const selectIsAuthenticated = (state: RootState) => state.user.isAuthenticated

// 사용자 테마
export const selectTheme = createSelector(
    [selectUserSettings],
    (settings) => settings?.theme || 'light'
)

// 알림 설정
export const selectNotificationsEnabled = createSelector(
    [selectUserPreferences],
    (preferences) => preferences?.notificationsEnabled ?? true
)

// Analytics 셀렉터들
export const selectAllSessions = (state: RootState) => state.analytics.sessions
export const selectDailyStats = (state: RootState) => state.analytics.dailyStats
export const selectWeeklyInsights = (state: RootState) => state.analytics.weeklyInsights
export const selectCurrentStreak = (state: RootState) => state.analytics.currentStreak
export const selectLongestStreak = (state: RootState) => state.analytics.longestStreak
export const selectTotalFocusTime = (state: RootState) => state.analytics.totalFocusTime

// 오늘의 통계
export const selectTodayStats = createSelector(
    [selectDailyStats],
    (dailyStats) => {
        const today = new Date().toDateString()
        return dailyStats.find(stat => stat.date.toDateString() === today)
    }
)

// 오늘 완료된 포모도로 수
export const selectTodayPomodoros = createSelector(
    [selectTodayStats],
    (todayStats) => todayStats?.pomodorosCompleted || 0
)

// 이번 주 완료율
export const selectWeekCompletionRate = createSelector(
    [selectWeeklyInsights],
    (insights) => {
        const thisWeek = new Date()
        thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay()) // 주의 시작일

        const thisWeekInsight = insights.find(insight =>
            insight.weekStart.toDateString() === thisWeek.toDateString()
        )

        return thisWeekInsight?.completionRate || 0
    }
)

// 분석 데이터 (특정 기간)
export const selectAnalyticsData = createSelector(
    [selectDailyStats, selectAllSessions, selectCurrentStreak, selectLongestStreak],
    (dailyStats, sessions, currentStreak, longestStreak): AnalyticsData => {
        // 최근 7일 데이터
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const recentStats = dailyStats.filter(stat => stat.date >= sevenDaysAgo)
        const recentSessions = sessions.filter(session => session.startedAt >= sevenDaysAgo)

        // 완료율 계산
        const totalPlanned = recentStats.reduce((sum, stat) => sum + stat.tasksPlanned, 0)
        const totalCompleted = recentStats.reduce((sum, stat) => sum + stat.tasksCompleted, 0)
        const completionRate = totalPlanned > 0 ? (totalCompleted / totalPlanned) * 100 : 0

        // 평균 집중 시간
        const focusSessions = recentSessions.filter(s => s.type === 'focus' && s.completedAt)
        const averageFocusTime = focusSessions.length > 0
            ? focusSessions.reduce((sum, s) => sum + s.actualDuration, 0) / focusSessions.length
            : 0

        // 생산적인 시간대 (임시 데이터)
        const productiveHours = [9, 10, 14, 15, 16]

        // 선호하는 작업 유형 (임시 데이터)
        const preferredTaskTypes = ['업무', '학습', '개인']

        // 개선 영역
        const improvementAreas: string[] = []
        if (completionRate < 50) improvementAreas.push('목표 설정')
        if (averageFocusTime < 20) improvementAreas.push('집중력 향상')
        if (currentStreak < 3) improvementAreas.push('일관성 유지')

        return {
            completionRate,
            averageFocusTime,
            productiveHours,
            preferredTaskTypes,
            streakData: {
                current: currentStreak,
                longest: longestStreak,
                weeklyGoal: 5,
            },
            improvementAreas,
        }
    }
)

// 에너지 레벨에 따른 추천 작업들
export const selectRecommendedTasks = createSelector(
    [selectAllTasks, selectEnergyLevel],
    (tasks, energyLevel) => {
        const pendingTasks = tasks.filter(task => task.status === 'pending')

        switch (energyLevel) {
            case 'high':
                return pendingTasks.filter(task => task.priority === 'high' || task.estimatedDuration > 45)
            case 'medium':
                return pendingTasks.filter(task => task.priority === 'medium' && task.estimatedDuration <= 45)
            case 'low':
                return pendingTasks.filter(task =>
                    task.priority === 'low' &&
                    task.estimatedDuration <= 25 &&
                    task.category !== '업무'
                )
            default:
                return pendingTasks
        }
    }
)