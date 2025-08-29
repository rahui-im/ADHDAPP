import { configureStore } from '@reduxjs/toolkit'
import analyticsReducer, {
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
} from '../analyticsSlice'
import { Session, DailyStats, WeeklyInsight, DistractionType } from '../../types'

describe('analyticsSlice', () => {
  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    store = configureStore({
      reducer: {
        analytics: analyticsReducer,
      },
    })
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().analytics
      
      expect(state.sessions).toEqual([])
      expect(state.dailyStats).toEqual([])
      expect(state.weeklyInsights).toEqual([])
      expect(state.currentStreak).toBe(0)
      expect(state.longestStreak).toBe(0)
      expect(state.totalFocusTime).toBe(0)
      expect(state.totalCompletedTasks).toBe(0)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('session management', () => {
    const mockSessionData: Omit<Session, 'id'> = {
      taskId: 'task-1',
      type: 'focus',
      plannedDuration: 25,
      actualDuration: 23,
      startedAt: new Date('2024-01-01T10:00:00'),
      completedAt: new Date('2024-01-01T10:23:00'),
      wasInterrupted: false,
      interruptionReasons: [],
      energyBefore: 4,
      energyAfter: 3,
    }

    it('should add session', () => {
      store.dispatch(addSession(mockSessionData))
      
      const state = store.getState().analytics
      expect(state.sessions).toHaveLength(1)
      expect(state.sessions[0]).toMatchObject(mockSessionData)
      expect(state.sessions[0].id).toBeDefined()
      expect(state.totalFocusTime).toBe(23) // Focus session adds to total
    })

    it('should not add to total focus time for break sessions', () => {
      const breakSession: Omit<Session, 'id'> = {
        ...mockSessionData,
        type: 'break',
        actualDuration: 10,
      }
      
      store.dispatch(addSession(breakSession))
      
      const state = store.getState().analytics
      expect(state.totalFocusTime).toBe(0)
    })

    it('should not add to total focus time for incomplete sessions', () => {
      const incompleteSession: Omit<Session, 'id'> = {
        ...mockSessionData,
        completedAt: undefined,
      }
      
      store.dispatch(addSession(incompleteSession))
      
      const state = store.getState().analytics
      expect(state.totalFocusTime).toBe(0)
    })

    it('should update session', () => {
      store.dispatch(addSession(mockSessionData))
      const sessionId = store.getState().analytics.sessions[0].id
      
      const updates: Partial<Session> = {
        actualDuration: 25,
        wasInterrupted: true,
        interruptionReasons: ['notification'],
      }
      
      store.dispatch(updateSession({ id: sessionId, updates }))
      
      const state = store.getState().analytics
      const updatedSession = state.sessions[0]
      expect(updatedSession.actualDuration).toBe(25)
      expect(updatedSession.wasInterrupted).toBe(true)
      expect(updatedSession.interruptionReasons).toEqual(['notification'])
    })

    it('should not update non-existent session', () => {
      const updates: Partial<Session> = { actualDuration: 30 }
      store.dispatch(updateSession({ id: 'non-existent', updates }))
      
      const state = store.getState().analytics
      expect(state.sessions).toHaveLength(0)
    })

    it('should record distraction', () => {
      store.dispatch(addSession(mockSessionData))
      const sessionId = store.getState().analytics.sessions[0].id
      
      store.dispatch(recordDistraction({ sessionId, type: 'website' }))
      
      const state = store.getState().analytics
      const session = state.sessions[0]
      expect(session.interruptionReasons).toContain('website')
      expect(session.wasInterrupted).toBe(true)
    })

    it('should add multiple distractions to same session', () => {
      store.dispatch(addSession(mockSessionData))
      const sessionId = store.getState().analytics.sessions[0].id
      
      store.dispatch(recordDistraction({ sessionId, type: 'website' }))
      store.dispatch(recordDistraction({ sessionId, type: 'notification' }))
      
      const state = store.getState().analytics
      const session = state.sessions[0]
      expect(session.interruptionReasons).toEqual(['website', 'notification'])
    })
  })

  describe('daily statistics', () => {
    const mockDailyStats: DailyStats = {
      date: new Date('2024-01-01'),
      tasksCompleted: 5,
      tasksPlanned: 8,
      focusMinutes: 120,
      breakMinutes: 30,
      pomodorosCompleted: 5,
      averageEnergyLevel: 3.5,
      distractions: ['website', 'notification'],
    }

    it('should update daily stats', () => {
      const date = new Date('2024-01-01')
      store.dispatch(updateDailyStats(date))
      
      // This action triggers calculation based on sessions
      // Since we have no sessions, it should still create an entry
      const state = store.getState().analytics
      expect(state.dailyStats).toHaveLength(1)
      expect(state.dailyStats[0].date.toDateString()).toBe(date.toDateString())
    })

    it('should update existing daily stats', () => {
      const date = new Date('2024-01-01')
      
      // Add some sessions for the date
      const session1: Omit<Session, 'id'> = {
        taskId: 'task-1',
        type: 'focus',
        plannedDuration: 25,
        actualDuration: 25,
        startedAt: new Date('2024-01-01T10:00:00'),
        completedAt: new Date('2024-01-01T10:25:00'),
        wasInterrupted: false,
        interruptionReasons: [],
        energyBefore: 4,
        energyAfter: 3,
      }
      
      store.dispatch(addSession(session1))
      store.dispatch(updateDailyStats(date))
      
      const state = store.getState().analytics
      expect(state.dailyStats).toHaveLength(1)
      expect(state.dailyStats[0].pomodorosCompleted).toBe(1)
    })
  })

  describe('streak management', () => {
    it('should update streak on completion', () => {
      const date = new Date('2024-01-01')
      store.dispatch(updateStreak({ completed: true, date }))
      
      const state = store.getState().analytics
      expect(state.currentStreak).toBe(1)
      expect(state.longestStreak).toBe(1)
    })

    it('should update longest streak', () => {
      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-01-02')
      const date3 = new Date('2024-01-03')
      
      store.dispatch(updateStreak({ completed: true, date: date1 }))
      store.dispatch(updateStreak({ completed: true, date: date2 }))
      store.dispatch(updateStreak({ completed: true, date: date3 }))
      
      const state = store.getState().analytics
      expect(state.currentStreak).toBe(3)
      expect(state.longestStreak).toBe(3)
    })

    it('should reset current streak on failure', () => {
      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-01-02')
      const date3 = new Date('2024-01-03')
      
      store.dispatch(updateStreak({ completed: true, date: date1 }))
      store.dispatch(updateStreak({ completed: true, date: date2 }))
      store.dispatch(updateStreak({ completed: false, date: date3 }))
      
      const state = store.getState().analytics
      expect(state.currentStreak).toBe(0)
      expect(state.longestStreak).toBe(2) // Should keep the longest
    })
  })

  describe('weekly insights', () => {
    it('should generate weekly insight', () => {
      const weekStart = new Date('2024-01-01') // Monday
      store.dispatch(generateWeeklyInsight(weekStart))
      
      const state = store.getState().analytics
      expect(state.weeklyInsights).toHaveLength(1)
      expect(state.weeklyInsights[0].weekStart.toDateString()).toBe(weekStart.toDateString())
    })

    it('should update existing weekly insight', () => {
      const weekStart = new Date('2024-01-01')
      
      store.dispatch(generateWeeklyInsight(weekStart))
      store.dispatch(generateWeeklyInsight(weekStart)) // Same week
      
      const state = store.getState().analytics
      expect(state.weeklyInsights).toHaveLength(1) // Should not duplicate
    })
  })

  describe('analytics calculations', () => {
    it('should calculate analytics data for different time ranges', () => {
      // This action doesn't modify state directly but triggers calculations
      store.dispatch(calculateAnalyticsData({ timeRange: 'week' }))
      store.dispatch(calculateAnalyticsData({ timeRange: 'month' }))
      store.dispatch(calculateAnalyticsData({ timeRange: 'quarter' }))
      
      // Should not throw errors
      const state = store.getState().analytics
      expect(state.error).toBeNull()
    })

    it('should increment completed tasks', () => {
      store.dispatch(incrementCompletedTasks())
      store.dispatch(incrementCompletedTasks())
      
      const state = store.getState().analytics
      expect(state.totalCompletedTasks).toBe(2)
    })
  })

  describe('data management', () => {
    beforeEach(() => {
      // Add some test data
      const session: Omit<Session, 'id'> = {
        taskId: 'task-1',
        type: 'focus',
        plannedDuration: 25,
        actualDuration: 25,
        startedAt: new Date('2024-01-01T10:00:00'),
        completedAt: new Date('2024-01-01T10:25:00'),
        wasInterrupted: false,
        interruptionReasons: [],
        energyBefore: 4,
        energyAfter: 3,
      }
      
      store.dispatch(addSession(session))
      store.dispatch(updateDailyStats(new Date('2024-01-01')))
      store.dispatch(generateWeeklyInsight(new Date('2024-01-01')))
      store.dispatch(incrementCompletedTasks())
    })

    it('should clear all analytics data', () => {
      store.dispatch(clearAnalytics())
      
      const state = store.getState().analytics
      expect(state.sessions).toEqual([])
      expect(state.dailyStats).toEqual([])
      expect(state.weeklyInsights).toEqual([])
      expect(state.currentStreak).toBe(0)
      expect(state.longestStreak).toBe(0)
      expect(state.totalFocusTime).toBe(0)
      expect(state.totalCompletedTasks).toBe(0)
    })

    it('should cleanup old data', () => {
      // Add old session (more than 30 days ago)
      const oldSession: Omit<Session, 'id'> = {
        taskId: 'task-old',
        type: 'focus',
        plannedDuration: 25,
        actualDuration: 25,
        startedAt: new Date('2023-11-01T10:00:00'), // Old date
        completedAt: new Date('2023-11-01T10:25:00'),
        wasInterrupted: false,
        interruptionReasons: [],
        energyBefore: 4,
        energyAfter: 3,
      }
      
      store.dispatch(addSession(oldSession))
      
      // Should have 2 sessions before cleanup
      expect(store.getState().analytics.sessions).toHaveLength(2)
      
      store.dispatch(cleanupOldData())
      
      const state = store.getState().analytics
      // Should remove old sessions (older than 30 days)
      expect(state.sessions.length).toBeLessThan(2)
    })
  })

  describe('loading and error states', () => {
    it('should set loading state', () => {
      store.dispatch(setLoading(true))
      
      const state = store.getState().analytics
      expect(state.loading).toBe(true)
    })

    it('should set error state', () => {
      const errorMessage = 'Analytics error'
      store.dispatch(setError(errorMessage))
      
      const state = store.getState().analytics
      expect(state.error).toBe(errorMessage)
    })

    it('should clear error state', () => {
      store.dispatch(setError('Error'))
      store.dispatch(setError(null))
      
      const state = store.getState().analytics
      expect(state.error).toBeNull()
    })
  })
})