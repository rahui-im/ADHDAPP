import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { DataBackupService } from '../dataBackupService'
import { User, Task, Session, DailyStats } from '../../types'

// Mock dependencies
vi.mock('../storageService', () => ({
  storageService: {
    user: {
      loadUser: vi.fn(),
      saveUser: vi.fn(),
    },
    tasks: {
      loadTasks: vi.fn(),
      saveTasks: vi.fn(),
      saveTask: vi.fn(),
    },
    timer: {
      loadTimerState: vi.fn(),
      saveTimerState: vi.fn(),
    },
  },
}))

vi.mock('../indexedDBService', () => ({
  indexedDBService: {
    sessions: {
      getAllSessions: vi.fn(),
      getSessionsByDateRange: vi.fn(),
      saveSession: vi.fn(),
      getSession: vi.fn(),
    },
    stats: {
      getAllDailyStats: vi.fn(),
      getAllWeeklyInsights: vi.fn(),
      getStatsInRange: vi.fn(),
      saveDailyStats: vi.fn(),
      getDailyStats: vi.fn(),
      saveWeeklyInsight: vi.fn(),
      getWeeklyInsight: vi.fn(),
    },
  },
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// Mock BroadcastChannel
global.BroadcastChannel = vi.fn().mockImplementation(() => ({
  postMessage: vi.fn(),
  close: vi.fn(),
  onmessage: null,
}))

// Mock Date.now
const mockNow = 1640995200000 // 2022-01-01 00:00:00
vi.spyOn(Date, 'now').mockReturnValue(mockNow)

describe('DataBackupService', () => {
  let service: DataBackupService
  let mockUser: User
  let mockTasks: Task[]
  let mockSessions: Session[]
  let mockDailyStats: DailyStats[]

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    sessionStorageMock.getItem.mockReturnValue(null)

    service = DataBackupService.getInstance()

    // Mock data
    mockUser = {
      id: 'user-1',
      name: 'Test User',
      preferences: {
        defaultFocusDuration: 25,
        defaultBreakDuration: 5,
        preferredTaskCategories: ['work'],
        energyTrackingEnabled: true,
        notificationsEnabled: true,
      },
      settings: {
        theme: 'light',
        language: 'ko',
        timezone: 'Asia/Seoul',
        focusMode: {
          hideNotifications: true,
          blockDistractions: false,
          showBreathingReminders: true,
          inactivityThreshold: 15,
        },
        timer: {
          focusDurations: [15, 25, 45],
          shortBreakDurations: [5, 10, 15],
          longBreakDuration: 25,
          cyclesBeforeLongBreak: 3,
        },
      },
      createdAt: new Date(),
      lastActiveAt: new Date(),
    }

    mockTasks = [
      {
        id: 'task-1',
        title: 'Test Task',
        description: 'Test Description',
        estimatedDuration: 30,
        subtasks: [],
        priority: 'medium',
        category: 'work',
        isFlexible: true,
        status: 'pending',
        createdAt: new Date(),
      },
    ]

    mockSessions = [
      {
        id: 'session-1',
        taskId: 'task-1',
        type: 'focus',
        plannedDuration: 25,
        actualDuration: 25,
        startedAt: new Date(),
        completedAt: new Date(),
        wasInterrupted: false,
        interruptionReasons: [],
        energyBefore: 3,
        energyAfter: 4,
      },
    ]

    mockDailyStats = [
      {
        date: new Date(),
        tasksCompleted: 3,
        tasksPlanned: 5,
        focusMinutes: 75,
        breakMinutes: 15,
        pomodorosCompleted: 3,
        averageEnergyLevel: 3.5,
        distractions: [],
      },
    ]
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createBackup', () => {
    it('should create a complete backup with all data types', async () => {
      // Setup mocks
      const { storageService } = await import('../storageService')
      const { indexedDBService } = await import('../indexedDBService')

      vi.mocked(storageService.user.loadUser).mockReturnValue(mockUser)
      vi.mocked(storageService.tasks.loadTasks).mockReturnValue(mockTasks)
      vi.mocked(indexedDBService.sessions.getAllSessions).mockResolvedValue(mockSessions)
      vi.mocked(indexedDBService.stats.getAllDailyStats).mockResolvedValue(mockDailyStats)
      vi.mocked(indexedDBService.stats.getAllWeeklyInsights).mockResolvedValue([])

      const backup = await service.createBackup()

      expect(backup.version).toBe('1.0.0')
      expect(backup.data.user).toEqual(mockUser)
      expect(backup.data.tasks).toEqual(mockTasks)
      expect(backup.data.sessions).toEqual(mockSessions)
      expect(backup.data.dailyStats).toEqual(mockDailyStats)
      expect(backup.metadata.dataTypes).toContain('user')
      expect(backup.metadata.dataTypes).toContain('tasks')
      expect(backup.metadata.dataTypes).toContain('sessions')
      expect(backup.metadata.dataTypes).toContain('dailyStats')
    })

    it('should create selective backup based on options', async () => {
      const { storageService } = await import('../storageService')
      vi.mocked(storageService.user.loadUser).mockReturnValue(mockUser)

      const backup = await service.createBackup({
        includeUser: true,
        includeTasks: false,
        includeSessions: false,
        includeStats: false,
      })

      expect(backup.data.user).toEqual(mockUser)
      expect(backup.data.tasks).toBeUndefined()
      expect(backup.data.sessions).toBeUndefined()
      expect(backup.data.dailyStats).toBeUndefined()
      expect(backup.metadata.dataTypes).toEqual(['user'])
    })

    it('should filter data by date range', async () => {
      const { storageService } = await import('../storageService')
      const { indexedDBService } = await import('../indexedDBService')

      const startDate = new Date('2022-01-01')
      const endDate = new Date('2022-01-31')
      const filteredSessions = [mockSessions[0]]

      vi.mocked(storageService.tasks.loadTasks).mockReturnValue(mockTasks)
      vi.mocked(indexedDBService.sessions.getSessionsByDateRange)
        .mockResolvedValue(filteredSessions)

      const backup = await service.createBackup({
        includeUser: false,
        includeTasks: true,
        includeSessions: true,
        dateRange: { start: startDate, end: endDate },
      })

      expect(indexedDBService.sessions.getSessionsByDateRange)
        .toHaveBeenCalledWith(startDate, endDate)
      expect(backup.data.sessions).toEqual(filteredSessions)
    })
  })

  describe('exportBackup', () => {
    it('should export backup as JSON string', async () => {
      const { storageService } = await import('../storageService')
      vi.mocked(storageService.user.loadUser).mockReturnValue(mockUser)

      const jsonString = await service.exportBackup({
        includeUser: true,
        includeTasks: false,
        includeSessions: false,
        includeStats: false,
      })

      const parsed = JSON.parse(jsonString)
      expect(parsed.version).toBe('1.0.0')
      expect(parsed.data.user).toEqual(mockUser)
    })
  })

  describe('restoreBackup', () => {
    it('should restore backup data successfully', async () => {
      const { storageService } = await import('../storageService')
      const { indexedDBService } = await import('../indexedDBService')

      const backupData = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        metadata: {
          userAgent: 'test',
          timestamp: Date.now(),
          dataTypes: ['user', 'tasks'],
          totalSize: 1000,
        },
        data: {
          user: mockUser,
          tasks: mockTasks,
        },
      }

      vi.mocked(storageService.user.loadUser).mockReturnValue(null)
      vi.mocked(storageService.tasks.loadTasks).mockReturnValue([])

      const result = await service.restoreBackup(backupData)

      expect(result.restored.user).toBe(true)
      expect(result.restored.tasks).toBe(1)
      expect(storageService.user.saveUser).toHaveBeenCalledWith(mockUser)
      expect(storageService.tasks.saveTask).toHaveBeenCalledWith(mockTasks[0])
    })

    it('should skip duplicates when option is enabled', async () => {
      const { storageService } = await import('../storageService')

      const backupData = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        metadata: {
          userAgent: 'test',
          timestamp: Date.now(),
          dataTypes: ['tasks'],
          totalSize: 1000,
        },
        data: {
          tasks: mockTasks,
        },
      }

      // Mock existing tasks
      vi.mocked(storageService.tasks.loadTasks).mockReturnValue(mockTasks)

      const result = await service.restoreBackup(backupData, {
        skipDuplicates: true,
      })

      expect(result.restored.tasks).toBe(0)
      expect(result.skipped).toBe(1)
    })

    it('should handle restore errors gracefully', async () => {
      const { storageService } = await import('../storageService')

      const backupData = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        metadata: {
          userAgent: 'test',
          timestamp: Date.now(),
          dataTypes: ['user'],
          totalSize: 1000,
        },
        data: {
          user: mockUser,
        },
      }

      // Mock error
      vi.mocked(storageService.user.saveUser).mockImplementation(() => {
        throw new Error('Storage error')
      })

      const result = await service.restoreBackup(backupData)

      expect(result.restored.user).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('사용자 데이터 복원 실패')
    })
  })

  describe('createAutoBackup', () => {
    it('should create auto backup and save metadata', async () => {
      const { storageService } = await import('../storageService')
      vi.mocked(storageService.user.loadUser).mockReturnValue(mockUser)

      localStorageMock.getItem.mockReturnValue('[]') // Empty backup list

      const metadata = await service.createAutoBackup('test')

      expect(metadata.isAutoBackup).toBe(true)
      expect(metadata.name).toContain('자동 백업')
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        expect.stringMatching(/^backup-/),
        expect.any(String)
      )
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'backup-metadata-list',
        expect.any(String)
      )
    })
  })

  describe('getBackupList', () => {
    it('should return empty array when no backups exist', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const backupList = service.getBackupList()

      expect(backupList).toEqual([])
    })

    it('should return parsed backup list', () => {
      const mockMetadata = [
        {
          id: 'backup-1',
          name: 'Test Backup',
          createdAt: new Date().toISOString(),
          size: 1000,
          dataTypes: ['user'],
          isAutoBackup: false,
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockMetadata))

      const backupList = service.getBackupList()

      expect(backupList).toHaveLength(1)
      expect(backupList[0].id).toBe('backup-1')
      expect(backupList[0].createdAt).toBeInstanceOf(Date)
    })
  })

  describe('deleteBackup', () => {
    it('should delete backup and update metadata', () => {
      const mockMetadata = [
        {
          id: 'backup-1',
          name: 'Test Backup',
          createdAt: new Date(),
          size: 1000,
          dataTypes: ['user'],
          isAutoBackup: false,
        },
        {
          id: 'backup-2',
          name: 'Another Backup',
          createdAt: new Date(),
          size: 2000,
          dataTypes: ['tasks'],
          isAutoBackup: false,
        },
      ]

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockMetadata))

      const success = service.deleteBackup('backup-1')

      expect(success).toBe(true)
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('backup-backup-1')
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'backup-metadata-list',
        expect.stringContaining('backup-2')
      )
    })
  })

  describe('handleStorageFailure', () => {
    it('should attempt to recover data from multiple sources', async () => {
      // Mock Redux store
      const mockReduxState = {
        tasks: { tasks: mockTasks },
        user: { currentUser: mockUser },
      }
      ;(window as any).__REDUX_STORE__ = {
        getState: () => mockReduxState,
      }

      // Mock session storage data
      sessionStorageMock.length = 1
      sessionStorageMock.key.mockReturnValue('adhd-timer-test')
      sessionStorageMock.getItem.mockReturnValue(JSON.stringify({ test: 'data' }))

      const result = await service.handleStorageFailure()

      expect(result.recovered).toBe(true)
      expect(result.fallbackData).toHaveProperty('tasks', mockTasks)
      expect(result.fallbackData).toHaveProperty('user', mockUser)
    })

    it('should handle recovery failure gracefully', async () => {
      // Mock error in memory data collection
      ;(window as any).__REDUX_STORE__ = {
        getState: () => {
          throw new Error('Redux error')
        },
      }

      const result = await service.handleStorageFailure()

      expect(result.recovered).toBe(false)
      expect(result.errors).toHaveLength(0) // Should not throw, just return empty data
    })
  })

  describe('validation', () => {
    it('should validate backup data structure', async () => {
      const validBackup = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        metadata: {
          userAgent: 'test',
          timestamp: Date.now(),
          dataTypes: ['user'],
          totalSize: 1000,
        },
        data: {
          user: mockUser,
        },
      }

      const result = await service.restoreBackup(validBackup, {
        validateData: true,
      })

      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid backup data', async () => {
      const invalidBackup = {
        version: '1.0.0',
        // Missing required fields
      }

      await expect(
        service.restoreBackup(invalidBackup as any, { validateData: true })
      ).rejects.toThrow('유효하지 않은 백업 데이터')
    })
  })
})