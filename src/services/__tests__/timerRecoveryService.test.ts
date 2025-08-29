import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TimerRecoveryService } from '../timerRecoveryService'
import { TimerState } from '../../types'

// Mock localStorage and sessionStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// Mock document.hidden
Object.defineProperty(document, 'hidden', {
  writable: true,
  value: false,
})

// Mock Date.now
const mockNow = 1640995200000 // 2022-01-01 00:00:00
vi.spyOn(Date, 'now').mockReturnValue(mockNow)

describe('TimerRecoveryService', () => {
  let service: TimerRecoveryService
  let mockTimerState: TimerState

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    sessionStorageMock.getItem.mockReturnValue(null)

    // Create fresh instance
    service = TimerRecoveryService.getInstance()

    // Mock timer state
    mockTimerState = {
      mode: 'focus',
      duration: 1500, // 25 minutes in seconds
      remaining: 1200, // 20 minutes remaining
      isRunning: true,
      isPaused: false,
      currentCycle: 1,
      totalCycles: 0,
      currentTaskId: 'task-123',
    }
  })

  afterEach(() => {
    service.cleanup()
    vi.restoreAllMocks()
  })

  describe('saveTimerState', () => {
    it('should save timer state to both localStorage and sessionStorage', () => {
      const stateWithStartTime = {
        ...mockTimerState,
        lastStartTime: mockNow - 300000, // 5 minutes ago
      }

      service.saveTimerState(stateWithStartTime)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'timerRecoveryData',
        expect.stringContaining('"mode":"focus"')
      )

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        expect.stringMatching(/timerRecoveryData_tab_/),
        expect.stringContaining('"mode":"focus"')
      )
    })

    it('should handle storage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      service.saveTimerState(mockTimerState)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save timer recovery data:',
        expect.any(Error)
      )
    })
  })

  describe('restoreTimerState', () => {
    it('should restore from sessionStorage first', () => {
      const savedState = {
        ...mockTimerState,
        savedAt: mockNow - 60000, // 1 minute ago
        tabId: 'tab-123',
        wasVisible: true,
      }

      sessionStorageMock.getItem.mockReturnValue(JSON.stringify(savedState))

      const result = service.restoreTimerState()

      expect(result).toBeDefined()
      expect(result?.mode).toBe('focus')
      expect(result?.remaining).toBe(1200)
    })

    it('should fallback to localStorage if sessionStorage is empty', () => {
      const savedState = {
        ...mockTimerState,
        savedAt: mockNow - 120000, // 2 minutes ago
        tabId: 'tab-123',
        wasVisible: true,
      }

      sessionStorageMock.getItem.mockReturnValue(null)
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState))

      const result = service.restoreTimerState()

      expect(result).toBeDefined()
      expect(result?.mode).toBe('focus')
    })

    it('should calculate elapsed time for running timer', () => {
      const startTime = mockNow - 300000 // 5 minutes ago
      const savedState = {
        ...mockTimerState,
        lastStartTime: startTime,
        savedAt: mockNow - 60000, // 1 minute ago
        tabId: 'tab-123',
        wasVisible: true,
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState))

      const result = service.restoreTimerState()

      expect(result).toBeDefined()
      // Should subtract elapsed time (5 minutes = 300 seconds)
      expect(result?.remaining).toBe(1200 - 300) // 900 seconds
    })

    it('should handle timer completion during background', () => {
      const startTime = mockNow - 1800000 // 30 minutes ago (more than duration)
      const savedState = {
        ...mockTimerState,
        lastStartTime: startTime,
        savedAt: mockNow - 60000,
        tabId: 'tab-123',
        wasVisible: true,
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState))

      const result = service.restoreTimerState()

      expect(result).toBeDefined()
      expect(result?.remaining).toBe(0)
      expect(result?.isRunning).toBe(false)
    })

    it('should ignore expired data', () => {
      const expiredState = {
        ...mockTimerState,
        savedAt: mockNow - 600000, // 10 minutes ago (expired)
        tabId: 'tab-123',
        wasVisible: true,
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredState))

      const result = service.restoreTimerState()

      expect(result).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('timerRecoveryData')
    })

    it('should handle corrupted data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const result = service.restoreTimerState()

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to restore timer state:',
        expect.any(Error)
      )
    })
  })

  describe('validateBackgroundTimer', () => {
    it('should validate timer accuracy within tolerance', () => {
      const expectedRemaining = 1200
      const actualElapsed = 300

      const isValid = service.validateBackgroundTimer(expectedRemaining, actualElapsed)

      expect(isValid).toBe(true)
    })

    it('should reject timer with excessive drift', () => {
      const expectedRemaining = 1200
      const actualElapsed = 305 // 5 seconds more than tolerance

      const isValid = service.validateBackgroundTimer(expectedRemaining, actualElapsed)

      expect(isValid).toBe(false)
    })
  })

  describe('recovery stats', () => {
    it('should track recovery statistics', () => {
      // Initial stats should be empty
      const initialStats = service.getRecoveryStats()
      expect(initialStats.recoveryCount).toBe(0)
      expect(initialStats.failureCount).toBe(0)

      // Update with success
      service.updateRecoveryStats(true)
      const successStats = service.getRecoveryStats()
      expect(successStats.recoveryCount).toBe(1)
      expect(successStats.lastRecoveryTime).toBe(mockNow)

      // Update with failure
      service.updateRecoveryStats(false)
      const failureStats = service.getRecoveryStats()
      expect(failureStats.failureCount).toBe(1)
    })

    it('should handle stats storage errors', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      const stats = service.getRecoveryStats()

      expect(stats).toEqual({
        lastRecoveryTime: null,
        recoveryCount: 0,
        failureCount: 0,
      })
    })
  })

  describe('clearAllSavedStates', () => {
    it('should clear both localStorage and sessionStorage', () => {
      service.clearAllSavedStates()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('timerRecoveryData')
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(
        expect.stringMatching(/timerRecoveryData_tab_/)
      )
    })
  })

  describe('event handling', () => {
    it('should handle visibility change events', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

      // Service should add event listener on creation
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      )

      // Cleanup should remove event listener
      service.cleanup()
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      )
    })

    it('should handle beforeunload events', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      // Service should add event listener on creation
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      )

      // Cleanup should remove event listener
      service.cleanup()
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      )
    })
  })
})