import { timerService, TimerService } from '../timerService'
import { TimerState, Session, DistractionType } from '../../types'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })

describe('TimerService', () => {
  let service: TimerService

  beforeEach(() => {
    service = TimerService.getInstance()
    service.stop() // Ensure clean state
    mockLocalStorage.getItem.mockClear()
    mockLocalStorage.setItem.mockClear()
    mockLocalStorage.removeItem.mockClear()
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    service.stop()
    jest.useRealTimers()
  })

  describe('singleton pattern', () => {
    it('should return same instance', () => {
      const instance1 = TimerService.getInstance()
      const instance2 = TimerService.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should return same instance as exported service', () => {
      expect(timerService).toBe(TimerService.getInstance())
    })
  })

  describe('timer controls', () => {
    it('should start timer', () => {
      const onTick = jest.fn()
      const onComplete = jest.fn()
      const duration = 60 // 1 minute

      service.start(duration, onTick, onComplete)

      expect(service.isRunning()).toBe(true)
      expect(onTick).toHaveBeenCalledWith(duration)
    })

    it('should call onTick every second', () => {
      const onTick = jest.fn()
      const onComplete = jest.fn()
      const duration = 5

      service.start(duration, onTick, onComplete)

      // Fast-forward 3 seconds
      jest.advanceTimersByTime(3000)

      expect(onTick).toHaveBeenCalledTimes(4) // Initial call + 3 ticks
      expect(onTick).toHaveBeenLastCalledWith(2) // 5 - 3 = 2
    })

    it('should call onComplete when timer reaches zero', () => {
      const onTick = jest.fn()
      const onComplete = jest.fn()
      const duration = 3

      service.start(duration, onTick, onComplete)

      // Fast-forward to completion
      jest.advanceTimersByTime(3000)

      expect(onComplete).toHaveBeenCalledTimes(1)
      expect(service.isRunning()).toBe(false)
    })

    it('should stop previous timer when starting new one', () => {
      const onTick1 = jest.fn()
      const onComplete1 = jest.fn()
      const onTick2 = jest.fn()
      const onComplete2 = jest.fn()

      service.start(60, onTick1, onComplete1)
      service.start(30, onTick2, onComplete2)

      jest.advanceTimersByTime(1000)

      // Only second timer should be active
      expect(onTick2).toHaveBeenCalled()
      expect(onTick1).toHaveBeenCalledTimes(1) // Only initial call
    })

    it('should pause timer', () => {
      const onTick = jest.fn()
      const onComplete = jest.fn()

      service.start(60, onTick, onComplete)
      service.pause()

      expect(service.isRunning()).toBe(false)

      // Timer should not tick after pause
      jest.advanceTimersByTime(2000)
      expect(onTick).toHaveBeenCalledTimes(1) // Only initial call
    })

    it('should resume timer', () => {
      const onTick = jest.fn()
      const onComplete = jest.fn()
      const remaining = 30

      service.resume(remaining, onTick, onComplete)

      expect(service.isRunning()).toBe(true)
      expect(onTick).toHaveBeenCalledWith(remaining)

      jest.advanceTimersByTime(1000)
      expect(onTick).toHaveBeenCalledWith(remaining - 1)
    })

    it('should not resume if already running', () => {
      const onTick1 = jest.fn()
      const onComplete1 = jest.fn()
      const onTick2 = jest.fn()
      const onComplete2 = jest.fn()

      service.start(60, onTick1, onComplete1)
      service.resume(30, onTick2, onComplete2)

      jest.advanceTimersByTime(1000)

      // Should still be running first timer
      expect(onTick1).toHaveBeenCalled()
      expect(onTick2).toHaveBeenCalledTimes(0)
    })

    it('should stop timer', () => {
      const onTick = jest.fn()
      const onComplete = jest.fn()

      service.start(60, onTick, onComplete)
      service.stop()

      expect(service.isRunning()).toBe(false)

      jest.advanceTimersByTime(2000)
      expect(onTick).toHaveBeenCalledTimes(1) // Only initial call
    })
  })

  describe('state persistence', () => {
    const mockTimerState: TimerState & { lastStartTime?: number } = {
      mode: 'focus',
      duration: 1500,
      remaining: 1200,
      isRunning: true,
      isPaused: false,
      currentCycle: 2,
      totalCycles: 1,
      currentTaskId: 'task-123',
      lastStartTime: Date.now() - 5000, // 5 seconds ago
    }

    it('should save timer state to localStorage', () => {
      service.saveTimerState(mockTimerState)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'timerState',
        expect.stringContaining('"mode":"focus"')
      )
    })

    it('should handle localStorage save errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full')
      })

      // Should not throw
      expect(() => service.saveTimerState(mockTimerState)).not.toThrow()
    })

    it('should restore timer state from localStorage', () => {
      const savedData = {
        ...mockTimerState,
        savedAt: Date.now() - 1000, // 1 second ago
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedData))

      const restored = service.restoreTimerState()

      expect(restored).toBeDefined()
      expect(restored?.mode).toBe('focus')
      expect(restored?.currentTaskId).toBe('task-123')
    })

    it('should return null if no saved state', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const restored = service.restoreTimerState()

      expect(restored).toBeNull()
    })

    it('should ignore old saved state', () => {
      const oldData = {
        ...mockTimerState,
        savedAt: Date.now() - 6 * 60 * 1000, // 6 minutes ago
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(oldData))

      const restored = service.restoreTimerState()

      expect(restored).toBeNull()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('timerState')
    })

    it('should handle localStorage restore errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const restored = service.restoreTimerState()

      expect(restored).toBeNull()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('timerState')
    })

    it('should clear saved state', () => {
      service.clearSavedState()

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('timerState')
    })
  })

  describe('utility functions', () => {
    it('should calculate elapsed time', () => {
      const startTime = Date.now() - 5000 // 5 seconds ago
      const elapsed = service.calculateElapsed(startTime)

      expect(elapsed).toBeCloseTo(5, 0) // Within 1 second tolerance
    })

    it('should format time correctly', () => {
      expect(service.formatTime(0)).toBe('00:00')
      expect(service.formatTime(59)).toBe('00:59')
      expect(service.formatTime(60)).toBe('01:00')
      expect(service.formatTime(125)).toBe('02:05')
      expect(service.formatTime(3661)).toBe('61:01')
    })

    it('should calculate progress correctly', () => {
      expect(service.calculateProgress(100, 75)).toBe(25)
      expect(service.calculateProgress(100, 0)).toBe(100)
      expect(service.calculateProgress(100, 100)).toBe(0)
      expect(service.calculateProgress(0, 0)).toBe(0)
      expect(service.calculateProgress(100, 150)).toBe(0) // Negative progress becomes 0
      expect(service.calculateProgress(100, -50)).toBe(100) // Over 100% becomes 100
    })
  })

  describe('session creation', () => {
    it('should create session with correct data', () => {
      const taskId = 'task-123'
      const type = 'focus'
      const plannedDuration = 25
      const actualDuration = 23
      const wasInterrupted = true
      const interruptionReasons: DistractionType[] = ['website', 'notification']

      const session = service.createSession(
        taskId,
        type,
        plannedDuration,
        actualDuration,
        wasInterrupted,
        interruptionReasons
      )

      expect(session.id).toBeDefined()
      expect(session.taskId).toBe(taskId)
      expect(session.type).toBe(type)
      expect(session.plannedDuration).toBe(plannedDuration)
      expect(session.actualDuration).toBe(actualDuration)
      expect(session.wasInterrupted).toBe(wasInterrupted)
      expect(session.interruptionReasons).toEqual(interruptionReasons)
      expect(session.startedAt).toBeInstanceOf(Date)
      expect(session.completedAt).toBeInstanceOf(Date)
      expect(session.energyBefore).toBe(3)
      expect(session.energyAfter).toBe(3)
    })

    it('should create session with default values', () => {
      const session = service.createSession('task-1', 'break', 10, 10)

      expect(session.wasInterrupted).toBe(false)
      expect(session.interruptionReasons).toEqual([])
      expect(session.energyBefore).toBe(3)
      expect(session.energyAfter).toBe(3)
    })

    it('should generate unique session IDs', () => {
      const session1 = service.createSession('task-1', 'focus', 25, 25)
      const session2 = service.createSession('task-2', 'focus', 25, 25)

      expect(session1.id).not.toBe(session2.id)
    })

    it('should calculate start time based on actual duration', () => {
      const actualDuration = 23 // minutes
      const beforeCreation = Date.now()
      
      const session = service.createSession('task-1', 'focus', 25, actualDuration)
      
      const afterCreation = Date.now()
      const expectedStartTime = afterCreation - (actualDuration * 60 * 1000)
      
      // Allow some tolerance for execution time
      expect(session.startedAt.getTime()).toBeGreaterThanOrEqual(beforeCreation - (actualDuration * 60 * 1000) - 100)
      expect(session.startedAt.getTime()).toBeLessThanOrEqual(expectedStartTime + 100)
    })
  })
})