import { configureStore } from '@reduxjs/toolkit'
import timerReducer, {
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  resetTimer,
  updateRemaining,
  completeTimer,
  setMode,
  setFocusDuration,
  setBreakDuration,
  updateTimerSettings,
  setCurrentTaskId,
  restoreTimerState,
  setInitialized,
} from '../timerSlice'
import { TimerSettings } from '../../types'

describe('timerSlice', () => {
  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    store = configureStore({
      reducer: {
        timer: timerReducer,
      },
    })
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().timer
      
      expect(state.mode).toBe('focus')
      expect(state.duration).toBe(25 * 60)
      expect(state.remaining).toBe(25 * 60)
      expect(state.isRunning).toBe(false)
      expect(state.isPaused).toBe(false)
      expect(state.currentCycle).toBe(1)
      expect(state.totalCycles).toBe(0)
      expect(state.currentTaskId).toBeUndefined()
      expect(state.isInitialized).toBe(false)
      expect(state.settings).toEqual({
        focusDurations: [15, 25, 45],
        shortBreakDurations: [5, 10, 15],
        longBreakDuration: 25,
        cyclesBeforeLongBreak: 3,
      })
    })
  })

  describe('timer controls', () => {
    it('should start timer', () => {
      const taskId = 'task-1'
      const duration = 30
      
      store.dispatch(startTimer({ taskId, duration }))
      
      const state = store.getState().timer
      expect(state.isRunning).toBe(true)
      expect(state.isPaused).toBe(false)
      expect(state.currentTaskId).toBe(taskId)
      expect(state.duration).toBe(duration * 60)
      expect(state.remaining).toBe(duration * 60)
      expect(state.lastStartTime).toBeDefined()
    })

    it('should not start timer if already running', () => {
      store.dispatch(startTimer({ taskId: 'task-1' }))
      const firstStartTime = store.getState().timer.lastStartTime
      
      // Try to start again
      store.dispatch(startTimer({ taskId: 'task-2' }))
      
      const state = store.getState().timer
      expect(state.currentTaskId).toBe('task-1') // Should not change
      expect(state.lastStartTime).toBe(firstStartTime)
    })

    it('should pause timer', () => {
      store.dispatch(startTimer({ taskId: 'task-1' }))
      store.dispatch(pauseTimer())
      
      const state = store.getState().timer
      expect(state.isRunning).toBe(false)
      expect(state.isPaused).toBe(true)
    })

    it('should not pause if not running', () => {
      store.dispatch(pauseTimer())
      
      const state = store.getState().timer
      expect(state.isPaused).toBe(false)
    })

    it('should resume timer', () => {
      store.dispatch(startTimer({ taskId: 'task-1' }))
      store.dispatch(pauseTimer())
      store.dispatch(resumeTimer())
      
      const state = store.getState().timer
      expect(state.isRunning).toBe(true)
      expect(state.isPaused).toBe(false)
      expect(state.lastStartTime).toBeDefined()
    })

    it('should not resume if not paused', () => {
      store.dispatch(resumeTimer())
      
      const state = store.getState().timer
      expect(state.isRunning).toBe(false)
    })

    it('should stop timer', () => {
      store.dispatch(startTimer({ taskId: 'task-1', duration: 30 }))
      store.dispatch(stopTimer())
      
      const state = store.getState().timer
      expect(state.isRunning).toBe(false)
      expect(state.isPaused).toBe(false)
      expect(state.remaining).toBe(state.duration)
      expect(state.lastStartTime).toBeUndefined()
    })

    it('should reset timer', () => {
      store.dispatch(startTimer({ taskId: 'task-1', duration: 30 }))
      store.dispatch(resetTimer())
      
      const state = store.getState().timer
      expect(state.isRunning).toBe(false)
      expect(state.isPaused).toBe(false)
      expect(state.remaining).toBe(state.duration)
      expect(state.currentCycle).toBe(1)
      expect(state.totalCycles).toBe(0)
      expect(state.currentTaskId).toBeUndefined()
      expect(state.lastStartTime).toBeUndefined()
    })
  })

  describe('timer updates', () => {
    it('should update remaining time', () => {
      store.dispatch(startTimer({ taskId: 'task-1' }))
      store.dispatch(updateRemaining(1200)) // 20 minutes
      
      const state = store.getState().timer
      expect(state.remaining).toBe(1200)
    })

    it('should not update remaining time if not running', () => {
      const initialRemaining = store.getState().timer.remaining
      store.dispatch(updateRemaining(1200))
      
      const state = store.getState().timer
      expect(state.remaining).toBe(initialRemaining)
    })

    it('should not update remaining time if paused', () => {
      store.dispatch(startTimer({ taskId: 'task-1' }))
      store.dispatch(pauseTimer())
      const pausedRemaining = store.getState().timer.remaining
      
      store.dispatch(updateRemaining(1200))
      
      const state = store.getState().timer
      expect(state.remaining).toBe(pausedRemaining)
    })

    it('should ensure remaining time is not negative', () => {
      store.dispatch(startTimer({ taskId: 'task-1' }))
      store.dispatch(updateRemaining(-100))
      
      const state = store.getState().timer
      expect(state.remaining).toBe(0)
    })
  })

  describe('timer completion', () => {
    it('should complete focus timer and switch to short break', () => {
      store.dispatch(setMode('focus'))
      store.dispatch(completeTimer())
      
      const state = store.getState().timer
      expect(state.isRunning).toBe(false)
      expect(state.isPaused).toBe(false)
      expect(state.remaining).toBe(0)
      expect(state.totalCycles).toBe(1)
      expect(state.mode).toBe('short-break')
      expect(state.duration).toBe(10 * 60) // Default short break
    })

    it('should complete focus timer and switch to long break after 3 cycles', () => {
      // Complete 3 focus sessions
      store.dispatch(setMode('focus'))
      store.dispatch(completeTimer()) // 1st cycle
      store.dispatch(setMode('focus'))
      store.dispatch(completeTimer()) // 2nd cycle
      store.dispatch(setMode('focus'))
      store.dispatch(completeTimer()) // 3rd cycle
      
      const state = store.getState().timer
      expect(state.mode).toBe('long-break')
      expect(state.duration).toBe(25 * 60) // Long break duration
      expect(state.totalCycles).toBe(3)
    })

    it('should complete break timer and switch to focus', () => {
      store.dispatch(setMode('short-break'))
      store.dispatch(completeTimer())
      
      const state = store.getState().timer
      expect(state.mode).toBe('focus')
      expect(state.duration).toBe(25 * 60) // Default focus duration
      expect(state.currentCycle).toBe(2) // Increment cycle after break
    })

    it('should reset cycle after long break', () => {
      // Set up long break scenario
      store.dispatch(setMode('long-break'))
      store.dispatch(completeTimer())
      
      const state = store.getState().timer
      expect(state.mode).toBe('focus')
      expect(state.currentCycle).toBe(1) // Reset to 1 after long break
    })
  })

  describe('mode and duration settings', () => {
    it('should set focus mode and duration', () => {
      store.dispatch(setMode('focus'))
      
      const state = store.getState().timer
      expect(state.mode).toBe('focus')
      expect(state.duration).toBe(25 * 60)
      expect(state.remaining).toBe(25 * 60)
    })

    it('should set short break mode and duration', () => {
      store.dispatch(setMode('short-break'))
      
      const state = store.getState().timer
      expect(state.mode).toBe('short-break')
      expect(state.duration).toBe(10 * 60)
      expect(state.remaining).toBe(10 * 60)
    })

    it('should set long break mode and duration', () => {
      store.dispatch(setMode('long-break'))
      
      const state = store.getState().timer
      expect(state.mode).toBe('long-break')
      expect(state.duration).toBe(25 * 60)
      expect(state.remaining).toBe(25 * 60)
    })

    it('should set focus duration', () => {
      store.dispatch(setMode('focus'))
      store.dispatch(setFocusDuration(45))
      
      const state = store.getState().timer
      expect(state.duration).toBe(45 * 60)
      expect(state.remaining).toBe(45 * 60)
    })

    it('should not change duration if not in focus mode', () => {
      store.dispatch(setMode('short-break'))
      const initialDuration = store.getState().timer.duration
      
      store.dispatch(setFocusDuration(45))
      
      const state = store.getState().timer
      expect(state.duration).toBe(initialDuration)
    })

    it('should set break duration', () => {
      store.dispatch(setMode('short-break'))
      store.dispatch(setBreakDuration(15))
      
      const state = store.getState().timer
      expect(state.duration).toBe(15 * 60)
      expect(state.remaining).toBe(15 * 60)
    })

    it('should not change duration if not in short break mode', () => {
      store.dispatch(setMode('focus'))
      const initialDuration = store.getState().timer.duration
      
      store.dispatch(setBreakDuration(15))
      
      const state = store.getState().timer
      expect(state.duration).toBe(initialDuration)
    })
  })

  describe('settings and state management', () => {
    it('should update timer settings', () => {
      const newSettings: Partial<TimerSettings> = {
        focusDurations: [20, 30, 50],
        longBreakDuration: 30,
      }
      
      store.dispatch(updateTimerSettings(newSettings))
      
      const state = store.getState().timer
      expect(state.settings.focusDurations).toEqual([20, 30, 50])
      expect(state.settings.longBreakDuration).toBe(30)
      expect(state.settings.shortBreakDurations).toEqual([5, 10, 15]) // Unchanged
    })

    it('should set current task ID', () => {
      const taskId = 'task-123'
      store.dispatch(setCurrentTaskId(taskId))
      
      const state = store.getState().timer
      expect(state.currentTaskId).toBe(taskId)
    })

    it('should clear current task ID', () => {
      store.dispatch(setCurrentTaskId('task-123'))
      store.dispatch(setCurrentTaskId(undefined))
      
      const state = store.getState().timer
      expect(state.currentTaskId).toBeUndefined()
    })

    it('should set initialized state', () => {
      store.dispatch(setInitialized(true))
      
      const state = store.getState().timer
      expect(state.isInitialized).toBe(true)
    })
  })

  describe('state restoration', () => {
    it('should restore timer state', () => {
      const restoredState = {
        mode: 'focus' as const,
        duration: 1800,
        remaining: 1200,
        isRunning: false,
        isPaused: true,
        currentCycle: 2,
        totalCycles: 1,
        currentTaskId: 'task-123',
      }
      
      store.dispatch(restoreTimerState(restoredState))
      
      const state = store.getState().timer
      expect(state.mode).toBe('focus')
      expect(state.duration).toBe(1800)
      expect(state.remaining).toBe(1200)
      expect(state.isPaused).toBe(true)
      expect(state.currentCycle).toBe(2)
      expect(state.currentTaskId).toBe('task-123')
      expect(state.isInitialized).toBe(true)
    })

    it('should restore running timer with elapsed time calculation', () => {
      const startTime = Date.now() - 5000 // 5 seconds ago
      const restoredState = {
        isRunning: true,
        remaining: 1200,
        lastStartTime: startTime,
      }
      
      store.dispatch(restoreTimerState(restoredState))
      
      const state = store.getState().timer
      expect(state.remaining).toBeLessThan(1200) // Should be reduced by elapsed time
      expect(state.remaining).toBeGreaterThan(1190) // But not too much
      expect(state.isRunning).toBe(true)
      expect(state.lastStartTime).toBeDefined()
    })

    it('should stop timer if remaining time is zero after restoration', () => {
      const startTime = Date.now() - 30000 // 30 seconds ago
      const restoredState = {
        isRunning: true,
        remaining: 20, // Less than elapsed time
        lastStartTime: startTime,
      }
      
      store.dispatch(restoreTimerState(restoredState))
      
      const state = store.getState().timer
      expect(state.remaining).toBe(0)
      expect(state.isRunning).toBe(false)
      expect(state.lastStartTime).toBeUndefined()
    })
  })
})