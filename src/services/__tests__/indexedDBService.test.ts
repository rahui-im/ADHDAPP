import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { IndexedDBManager, SessionService, StatsService, AnalyticsCacheService } from '../indexedDBService'
import { Session, DailyStats } from '../../types'

// IndexedDB 모킹
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn()
}

// 글로벌 IndexedDB 모킹
Object.defineProperty(global, 'indexedDB', {
  value: mockIndexedDB,
  writable: true
})

describe('IndexedDBService', () => {
  let manager: IndexedDBManager
  let mockDB: any
  let mockTransaction: any
  let mockStore: any

  beforeEach(() => {
    // Mock 객체들 설정
    mockStore = {
      put: vi.fn().mockImplementation(() => ({ onsuccess: null, onerror: null })),
      get: vi.fn().mockImplementation(() => ({ onsuccess: null, onerror: null, result: null })),
      getAll: vi.fn().mockImplementation(() => ({ onsuccess: null, onerror: null, result: [] })),
      delete: vi.fn().mockImplementation(() => ({ onsuccess: null, onerror: null })),
      clear: vi.fn().mockImplementation(() => ({ onsuccess: null, onerror: null })),
      createIndex: vi.fn(),
      index: vi.fn().mockReturnValue({
        getAll: vi.fn().mockImplementation(() => ({ onsuccess: null, onerror: null, result: [] }))
      })
    }

    mockTransaction = {
      objectStore: vi.fn().mockReturnValue(mockStore),
      onerror: null,
      onabort: null
    }

    mockDB = {
      transaction: vi.fn().mockReturnValue(mockTransaction),
      createObjectStore: vi.fn().mockReturnValue(mockStore),
      objectStoreNames: {
        contains: vi.fn().mockReturnValue(false)
      },
      close: vi.fn(),
      onerror: null
    }

    mockIndexedDB.open.mockImplementation(() => ({
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: mockDB
    }))

    manager = new IndexedDBManager()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('SessionService', () => {
    it('should save session data', async () => {
      const session: Session = {
        id: 'test-session-1',
        taskId: 'test-task-1',
        type: 'focus',
        plannedDuration: 25,
        actualDuration: 23,
        startedAt: new Date(),
        completedAt: new Date(),
        wasInterrupted: false,
        interruptionReasons: [],
        energyBefore: 4,
        energyAfter: 3
      }

      // Mock successful put operation
      const putRequest = { onsuccess: null, onerror: null }
      mockStore.put.mockReturnValue(putRequest)

      const savePromise = manager.sessions.saveSession(session)
      
      // Simulate successful save
      setTimeout(() => {
        if (putRequest.onsuccess) putRequest.onsuccess()
      }, 0)

      await expect(savePromise).resolves.toBeUndefined()
      expect(mockStore.put).toHaveBeenCalledWith(session)
    })

    it('should retrieve session data', async () => {
      const sessionId = 'test-session-1'
      const expectedSession: Session = {
        id: sessionId,
        taskId: 'test-task-1',
        type: 'focus',
        plannedDuration: 25,
        actualDuration: 23,
        startedAt: new Date(),
        completedAt: new Date(),
        wasInterrupted: false,
        interruptionReasons: [],
        energyBefore: 4,
        energyAfter: 3
      }

      // Mock successful get operation
      const getRequest = { onsuccess: null, onerror: null, result: expectedSession }
      mockStore.get.mockReturnValue(getRequest)

      const getPromise = manager.sessions.getSession(sessionId)
      
      // Simulate successful get
      setTimeout(() => {
        if (getRequest.onsuccess) getRequest.onsuccess()
      }, 0)

      const result = await getPromise
      expect(result).toEqual(expectedSession)
      expect(mockStore.get).toHaveBeenCalledWith(sessionId)
    })
  })

  describe('StatsService', () => {
    it('should save daily stats', async () => {
      const stats: DailyStats = {
        date: new Date('2024-01-01'),
        tasksCompleted: 5,
        tasksPlanned: 7,
        focusMinutes: 120,
        breakMinutes: 30,
        pomodorosCompleted: 4,
        averageEnergyLevel: 3.5,
        distractions: ['notification', 'website']
      }

      // Mock successful put operation
      const putRequest = { onsuccess: null, onerror: null }
      mockStore.put.mockReturnValue(putRequest)

      const savePromise = manager.stats.saveDailyStats(stats)
      
      // Simulate successful save
      setTimeout(() => {
        if (putRequest.onsuccess) putRequest.onsuccess()
      }, 0)

      await expect(savePromise).resolves.toBeUndefined()
      expect(mockStore.put).toHaveBeenCalled()
    })
  })

  describe('AnalyticsCacheService', () => {
    it('should cache and retrieve data', async () => {
      const cacheKey = 'test-analytics'
      const cacheData = { completionRate: 85, averageFocusTime: 22 }

      // Mock successful cache set
      const putRequest = { onsuccess: null, onerror: null }
      mockStore.put.mockReturnValue(putRequest)

      const setPromise = manager.cache.setCache(cacheKey, cacheData)
      
      setTimeout(() => {
        if (putRequest.onsuccess) putRequest.onsuccess()
      }, 0)

      await setPromise

      // Mock successful cache get
      const cacheItem = {
        key: cacheKey,
        data: JSON.stringify(cacheData),
        timestamp: Date.now(),
        duration: 60 * 60 * 1000,
        size: JSON.stringify(cacheData).length
      }
      
      const getRequest = { onsuccess: null, onerror: null, result: cacheItem }
      mockStore.get.mockReturnValue(getRequest)

      const getPromise = manager.cache.getCache(cacheKey)
      
      setTimeout(() => {
        if (getRequest.onsuccess) getRequest.onsuccess()
      }, 0)

      const result = await getPromise
      expect(result).toBeDefined()
    })

    it('should return null for expired cache', async () => {
      const cacheKey = 'expired-cache'
      
      // Mock expired cache item
      const expiredCacheItem = {
        key: cacheKey,
        data: JSON.stringify({ test: 'data' }),
        timestamp: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
        duration: 60 * 60 * 1000, // 1 hour duration
        size: 100
      }
      
      const getRequest = { onsuccess: null, onerror: null, result: expiredCacheItem }
      mockStore.get.mockReturnValue(getRequest)

      // Mock delete operation for expired cache
      const deleteRequest = { onsuccess: null, onerror: null }
      mockStore.delete.mockReturnValue(deleteRequest)

      const getPromise = manager.cache.getCache(cacheKey)
      
      setTimeout(() => {
        if (getRequest.onsuccess) getRequest.onsuccess()
        if (deleteRequest.onsuccess) deleteRequest.onsuccess()
      }, 0)

      const result = await getPromise
      expect(result).toBeNull()
      expect(mockStore.delete).toHaveBeenCalledWith(cacheKey)
    })
  })

  describe('Data Management', () => {
    it('should get database status', async () => {
      // Mock data for status check
      const mockSessions: Session[] = [
        {
          id: 'session-1',
          taskId: 'task-1',
          type: 'focus',
          plannedDuration: 25,
          actualDuration: 25,
          startedAt: new Date(),
          wasInterrupted: false,
          interruptionReasons: [],
          energyBefore: 4,
          energyAfter: 3
        }
      ]

      const mockStats: DailyStats[] = [
        {
          date: new Date(),
          tasksCompleted: 3,
          tasksPlanned: 5,
          focusMinutes: 75,
          breakMinutes: 15,
          pomodorosCompleted: 3,
          averageEnergyLevel: 3.5,
          distractions: []
        }
      ]

      // Mock getAllSessions
      const sessionsRequest = { onsuccess: null, onerror: null, result: mockSessions }
      mockStore.getAll.mockReturnValueOnce(sessionsRequest)

      // Mock getAllDailyStats  
      const statsRequest = { onsuccess: null, onerror: null, result: mockStats }
      mockStore.getAll.mockReturnValueOnce(statsRequest)

      // Mock cache getAll
      const cacheRequest = { onsuccess: null, onerror: null, result: [] }
      mockStore.getAll.mockReturnValueOnce(cacheRequest)

      // Mock cache stats
      const cacheStatsRequest = { onsuccess: null, onerror: null, result: [] }
      mockStore.getAll.mockReturnValueOnce(cacheStatsRequest)

      const statusPromise = manager.getStatus()
      
      // Simulate all successful operations
      setTimeout(() => {
        if (sessionsRequest.onsuccess) sessionsRequest.onsuccess()
        if (statsRequest.onsuccess) statsRequest.onsuccess()
        if (cacheRequest.onsuccess) cacheRequest.onsuccess()
        if (cacheStatsRequest.onsuccess) cacheStatsRequest.onsuccess()
      }, 0)

      const status = await statusPromise
      
      expect(status.available).toBe(true)
      expect(status.sessionCount).toBe(1)
      expect(status.statsCount).toBe(1)
      expect(status.cacheCount).toBe(0)
    })
  })
})