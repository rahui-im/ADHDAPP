import { User, Task, Session, DailyStats, WeeklyInsight, TimerState } from '../types'
import { storageService } from './storageService'
import { indexedDBService } from './indexedDBService'

interface BackupData {
  version: string
  createdAt: string
  metadata: {
    userAgent: string
    timestamp: number
    dataTypes: string[]
    totalSize: number
  }
  data: {
    user?: User
    tasks?: Task[]
    sessions?: Session[]
    dailyStats?: DailyStats[]
    weeklyInsights?: WeeklyInsight[]
    timerState?: TimerState
    settings?: Record<string, any>
  }
}

interface BackupOptions {
  includeUser?: boolean
  includeTasks?: boolean
  includeSessions?: boolean
  includeStats?: boolean
  includeTimerState?: boolean
  includeSettings?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  compress?: boolean
}

interface RestoreOptions {
  overwriteExisting?: boolean
  validateData?: boolean
  skipDuplicates?: boolean
  restoreTimerState?: boolean
  createBackupBeforeRestore?: boolean
}

interface BackupMetadata {
  id: string
  name: string
  createdAt: Date
  size: number
  dataTypes: string[]
  isAutoBackup: boolean
}

export class DataBackupError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message)
    this.name = 'DataBackupError'
  }
}

export class DataBackupService {
  private static instance: DataBackupService
  private readonly BACKUP_VERSION = '1.0.0'
  private readonly MAX_AUTO_BACKUPS = 10
  private readonly AUTO_BACKUP_INTERVAL = 24 * 60 * 60 * 1000 // 24시간

  private constructor() {
    this.setupAutoBackup()
  }

  static getInstance(): DataBackupService {
    if (!DataBackupService.instance) {
      DataBackupService.instance = new DataBackupService()
    }
    return DataBackupService.instance
  }

  /**
   * 데이터 백업 생성
   */
  async createBackup(options: BackupOptions = {}): Promise<BackupData> {
    const {
      includeUser = true,
      includeTasks = true,
      includeSessions = true,
      includeStats = true,
      includeTimerState = false, // 보안상 기본적으로 제외
      includeSettings = true,
      dateRange,
      compress = true,
    } = options

    try {
      const backupData: BackupData = {
        version: this.BACKUP_VERSION,
        createdAt: new Date().toISOString(),
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          dataTypes: [],
          totalSize: 0,
        },
        data: {},
      }

      // 사용자 데이터
      if (includeUser) {
        const user = storageService.user.loadUser()
        if (user) {
          backupData.data.user = user
          backupData.metadata.dataTypes.push('user')
        }
      }

      // 작업 데이터
      if (includeTasks) {
        const tasks = storageService.tasks.loadTasks()
        if (tasks.length > 0) {
          let filteredTasks = tasks
          
          if (dateRange) {
            filteredTasks = tasks.filter(task => {
              const taskDate = task.createdAt
              return taskDate >= dateRange.start && taskDate <= dateRange.end
            })
          }
          
          backupData.data.tasks = filteredTasks
          backupData.metadata.dataTypes.push('tasks')
        }
      }

      // 세션 데이터
      if (includeSessions) {
        try {
          let sessions: Session[] = []
          
          if (dateRange) {
            sessions = await indexedDBService.sessions.getSessionsByDateRange(
              dateRange.start,
              dateRange.end
            )
          } else {
            sessions = await indexedDBService.sessions.getAllSessions()
          }
          
          if (sessions.length > 0) {
            backupData.data.sessions = sessions
            backupData.metadata.dataTypes.push('sessions')
          }
        } catch (error) {
          console.warn('세션 데이터 백업 실패:', error)
        }
      }

      // 통계 데이터
      if (includeStats) {
        try {
          let dailyStats: DailyStats[] = []
          let weeklyInsights: WeeklyInsight[] = []
          
          if (dateRange) {
            dailyStats = await indexedDBService.stats.getStatsInRange(
              dateRange.start,
              dateRange.end
            )
          } else {
            dailyStats = await indexedDBService.stats.getAllDailyStats()
            weeklyInsights = await indexedDBService.stats.getAllWeeklyInsights()
          }
          
          if (dailyStats.length > 0) {
            backupData.data.dailyStats = dailyStats
            backupData.metadata.dataTypes.push('dailyStats')
          }
          
          if (weeklyInsights.length > 0) {
            backupData.data.weeklyInsights = weeklyInsights
            backupData.metadata.dataTypes.push('weeklyInsights')
          }
        } catch (error) {
          console.warn('통계 데이터 백업 실패:', error)
        }
      }

      // 타이머 상태 (선택적)
      if (includeTimerState) {
        const timerState = storageService.timer.loadTimerState()
        if (timerState) {
          backupData.data.timerState = timerState
          backupData.metadata.dataTypes.push('timerState')
        }
      }

      // 설정 데이터
      if (includeSettings) {
        const settings = this.collectSettings()
        if (Object.keys(settings).length > 0) {
          backupData.data.settings = settings
          backupData.metadata.dataTypes.push('settings')
        }
      }

      // 메타데이터 완성
      const dataString = JSON.stringify(backupData.data)
      backupData.metadata.totalSize = dataString.length

      return backupData
    } catch (error) {
      throw new DataBackupError('백업 생성 실패', error as Error)
    }
  }

  /**
   * 백업 데이터를 JSON 문자열로 내보내기
   */
  async exportBackup(options: BackupOptions = {}): Promise<string> {
    const backupData = await this.createBackup(options)
    return JSON.stringify(backupData, null, 2)
  }

  /**
   * 백업 데이터를 파일로 다운로드
   */
  async downloadBackup(filename?: string, options: BackupOptions = {}): Promise<void> {
    try {
      const backupJson = await this.exportBackup(options)
      const blob = new Blob([backupJson], { type: 'application/json' })
      
      const defaultFilename = `adhd-timer-backup-${new Date().toISOString().split('T')[0]}.json`
      const finalFilename = filename || defaultFilename
      
      // 다운로드 링크 생성
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = finalFilename
      
      // 다운로드 실행
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // 메모리 정리
      URL.revokeObjectURL(url)
    } catch (error) {
      throw new DataBackupError('백업 다운로드 실패', error as Error)
    }
  }

  /**
   * 백업 데이터 복원
   */
  async restoreBackup(backupData: BackupData | string, options: RestoreOptions = {}): Promise<{
    restored: {
      user: boolean
      tasks: number
      sessions: number
      dailyStats: number
      weeklyInsights: number
      settings: number
    }
    skipped: number
    errors: string[]
  }> {
    const {
      overwriteExisting = false,
      validateData = true,
      skipDuplicates = true,
      restoreTimerState = false,
      createBackupBeforeRestore = true,
    } = options

    const result = {
      restored: {
        user: false,
        tasks: 0,
        sessions: 0,
        dailyStats: 0,
        weeklyInsights: 0,
        settings: 0,
      },
      skipped: 0,
      errors: [] as string[],
    }

    try {
      // 문자열인 경우 파싱
      let parsedData: BackupData
      if (typeof backupData === 'string') {
        parsedData = JSON.parse(backupData)
      } else {
        parsedData = backupData
      }

      // 데이터 유효성 검사
      if (validateData && !this.validateBackupData(parsedData)) {
        throw new DataBackupError('유효하지 않은 백업 데이터')
      }

      // 복원 전 백업 생성
      if (createBackupBeforeRestore) {
        try {
          await this.createAutoBackup('before-restore')
        } catch (error) {
          console.warn('복원 전 백업 생성 실패:', error)
        }
      }

      const { data } = parsedData

      // 사용자 데이터 복원
      if (data.user) {
        try {
          const existingUser = storageService.user.loadUser()
          if (!existingUser || overwriteExisting) {
            storageService.user.saveUser(data.user)
            result.restored.user = true
          } else {
            result.skipped++
          }
        } catch (error) {
          result.errors.push(`사용자 데이터 복원 실패: ${error}`)
        }
      }

      // 작업 데이터 복원
      if (data.tasks) {
        try {
          const existingTasks = storageService.tasks.loadTasks()
          const existingTaskIds = new Set(existingTasks.map(t => t.id))
          
          for (const task of data.tasks) {
            if (skipDuplicates && existingTaskIds.has(task.id)) {
              result.skipped++
              continue
            }
            
            storageService.tasks.saveTask(task)
            result.restored.tasks++
          }
        } catch (error) {
          result.errors.push(`작업 데이터 복원 실패: ${error}`)
        }
      }

      // 세션 데이터 복원
      if (data.sessions) {
        try {
          for (const session of data.sessions) {
            if (skipDuplicates) {
              const existing = await indexedDBService.sessions.getSession(session.id)
              if (existing) {
                result.skipped++
                continue
              }
            }
            
            await indexedDBService.sessions.saveSession(session)
            result.restored.sessions++
          }
        } catch (error) {
          result.errors.push(`세션 데이터 복원 실패: ${error}`)
        }
      }

      // 통계 데이터 복원
      if (data.dailyStats) {
        try {
          for (const stat of data.dailyStats) {
            if (skipDuplicates) {
              const existing = await indexedDBService.stats.getDailyStats(stat.date)
              if (existing) {
                result.skipped++
                continue
              }
            }
            
            await indexedDBService.stats.saveDailyStats(stat)
            result.restored.dailyStats++
          }
        } catch (error) {
          result.errors.push(`일일 통계 복원 실패: ${error}`)
        }
      }

      if (data.weeklyInsights) {
        try {
          for (const insight of data.weeklyInsights) {
            if (skipDuplicates) {
              const existing = await indexedDBService.stats.getWeeklyInsight(insight.weekStart)
              if (existing) {
                result.skipped++
                continue
              }
            }
            
            await indexedDBService.stats.saveWeeklyInsight(insight)
            result.restored.weeklyInsights++
          }
        } catch (error) {
          result.errors.push(`주간 인사이트 복원 실패: ${error}`)
        }
      }

      // 설정 데이터 복원
      if (data.settings) {
        try {
          result.restored.settings = this.restoreSettings(data.settings, overwriteExisting)
        } catch (error) {
          result.errors.push(`설정 데이터 복원 실패: ${error}`)
        }
      }

      // 타이머 상태 복원 (선택적)
      if (restoreTimerState && data.timerState) {
        try {
          storageService.timer.saveTimerState(data.timerState)
        } catch (error) {
          result.errors.push(`타이머 상태 복원 실패: ${error}`)
        }
      }

      return result
    } catch (error) {
      throw new DataBackupError('백업 복원 실패', error as Error)
    }
  }

  /**
   * 파일에서 백업 복원
   */
  async restoreFromFile(file: File, options: RestoreOptions = {}): Promise<{
    restored: {
      user: boolean
      tasks: number
      sessions: number
      dailyStats: number
      weeklyInsights: number
      settings: number
    }
    skipped: number
    errors: string[]
  }> {
    try {
      const fileContent = await this.readFileAsText(file)
      return await this.restoreBackup(fileContent, options)
    } catch (error) {
      throw new DataBackupError('파일에서 백업 복원 실패', error as Error)
    }
  }

  /**
   * 자동 백업 생성
   */
  async createAutoBackup(suffix?: string): Promise<BackupMetadata> {
    try {
      const backupData = await this.createBackup({
        includeTimerState: false, // 자동 백업에서는 타이머 상태 제외
      })

      const backupId = `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const backupName = `자동 백업${suffix ? ` (${suffix})` : ''} - ${new Date().toLocaleString()}`
      
      // 로컬 스토리지에 백업 저장
      const backupKey = `backup-${backupId}`
      localStorage.setItem(backupKey, JSON.stringify(backupData))

      // 백업 메타데이터 저장
      const metadata: BackupMetadata = {
        id: backupId,
        name: backupName,
        createdAt: new Date(),
        size: JSON.stringify(backupData).length,
        dataTypes: backupData.metadata.dataTypes,
        isAutoBackup: true,
      }

      this.saveBackupMetadata(metadata)
      
      // 오래된 자동 백업 정리
      await this.cleanupOldAutoBackups()

      return metadata
    } catch (error) {
      throw new DataBackupError('자동 백업 생성 실패', error as Error)
    }
  }

  /**
   * 저장된 백업 목록 조회
   */
  getBackupList(): BackupMetadata[] {
    try {
      const metadataList = localStorage.getItem('backup-metadata-list')
      if (!metadataList) return []

      const list = JSON.parse(metadataList) as BackupMetadata[]
      return list.map(item => ({
        ...item,
        createdAt: new Date(item.createdAt),
      }))
    } catch (error) {
      console.warn('백업 목록 조회 실패:', error)
      return []
    }
  }

  /**
   * 저장된 백업 삭제
   */
  deleteBackup(backupId: string): boolean {
    try {
      const backupKey = `backup-${backupId}`
      localStorage.removeItem(backupKey)

      // 메타데이터에서도 제거
      const metadataList = this.getBackupList()
      const updatedList = metadataList.filter(item => item.id !== backupId)
      localStorage.setItem('backup-metadata-list', JSON.stringify(updatedList))

      return true
    } catch (error) {
      console.warn('백업 삭제 실패:', error)
      return false
    }
  }

  /**
   * 저장된 백업 불러오기
   */
  getStoredBackup(backupId: string): BackupData | null {
    try {
      const backupKey = `backup-${backupId}`
      const backupData = localStorage.getItem(backupKey)
      
      if (!backupData) return null
      
      return JSON.parse(backupData)
    } catch (error) {
      console.warn('저장된 백업 불러오기 실패:', error)
      return null
    }
  }

  /**
   * 스토리지 오류 시 폴백 메커니즘
   */
  async handleStorageFailure(): Promise<{
    recovered: boolean
    fallbackData: any
    errors: string[]
  }> {
    const result = {
      recovered: false,
      fallbackData: null,
      errors: [] as string[],
    }

    try {
      // 1. 메모리에서 현재 상태 수집
      const memoryData = this.collectMemoryData()
      
      // 2. 세션 스토리지에서 임시 데이터 확인
      const sessionData = this.collectSessionData()
      
      // 3. 다른 탭에서 데이터 복구 시도
      const crossTabData = await this.attemptCrossTabRecovery()
      
      // 4. 최신 자동 백업 확인
      const latestBackup = this.getLatestAutoBackup()
      
      // 5. 데이터 우선순위에 따라 복구
      const fallbackData = {
        ...latestBackup?.data,
        ...crossTabData,
        ...sessionData,
        ...memoryData,
      }

      if (Object.keys(fallbackData).length > 0) {
        result.recovered = true
        result.fallbackData = fallbackData
        
        // 복구된 데이터를 임시 저장
        try {
          sessionStorage.setItem('emergency-recovery', JSON.stringify(fallbackData))
        } catch (error) {
          result.errors.push('임시 저장 실패')
        }
      }

      return result
    } catch (error) {
      result.errors.push(`폴백 복구 실패: ${error}`)
      return result
    }
  }

  /**
   * 백업 데이터 유효성 검사
   */
  private validateBackupData(data: BackupData): boolean {
    try {
      // 기본 구조 확인
      if (!data || typeof data !== 'object') return false
      if (!data.version || !data.createdAt || !data.metadata || !data.data) return false
      
      // 버전 호환성 확인
      const [majorVersion] = data.version.split('.')
      const [currentMajorVersion] = this.BACKUP_VERSION.split('.')
      if (majorVersion !== currentMajorVersion) {
        console.warn('백업 버전 불일치:', data.version, 'vs', this.BACKUP_VERSION)
      }
      
      // 데이터 타입 확인
      if (data.data.user && typeof data.data.user !== 'object') return false
      if (data.data.tasks && !Array.isArray(data.data.tasks)) return false
      if (data.data.sessions && !Array.isArray(data.data.sessions)) return false
      
      return true
    } catch (error) {
      console.warn('백업 데이터 유효성 검사 실패:', error)
      return false
    }
  }

  /**
   * 설정 데이터 수집
   */
  private collectSettings(): Record<string, any> {
    const settings: Record<string, any> = {}
    
    try {
      // 사용자 설정
      const energyLevel = storageService.user.loadEnergyLevel()
      if (energyLevel) settings.energyLevel = energyLevel
      
      const focusMode = storageService.user.loadFocusMode()
      if (focusMode) settings.focusMode = focusMode
      
      // 기타 앱 설정들
      const appSettings = localStorage.getItem('adhd-timer-settings')
      if (appSettings) {
        settings.appSettings = JSON.parse(appSettings)
      }
      
      return settings
    } catch (error) {
      console.warn('설정 데이터 수집 실패:', error)
      return {}
    }
  }

  /**
   * 설정 데이터 복원
   */
  private restoreSettings(settings: Record<string, any>, overwrite: boolean): number {
    let restored = 0
    
    try {
      if (settings.energyLevel) {
        const existing = storageService.user.loadEnergyLevel()
        if (!existing || overwrite) {
          storageService.user.saveEnergyLevel(settings.energyLevel.level)
          restored++
        }
      }
      
      if (settings.focusMode) {
        const existing = storageService.user.loadFocusMode()
        if (!existing || overwrite) {
          storageService.user.saveFocusMode(settings.focusMode.isActive)
          restored++
        }
      }
      
      if (settings.appSettings) {
        const existing = localStorage.getItem('adhd-timer-settings')
        if (!existing || overwrite) {
          localStorage.setItem('adhd-timer-settings', JSON.stringify(settings.appSettings))
          restored++
        }
      }
      
      return restored
    } catch (error) {
      console.warn('설정 복원 실패:', error)
      return restored
    }
  }

  /**
   * 파일을 텍스트로 읽기
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('파일 읽기 실패'))
      reader.readAsText(file)
    })
  }

  /**
   * 백업 메타데이터 저장
   */
  private saveBackupMetadata(metadata: BackupMetadata): void {
    try {
      const existingList = this.getBackupList()
      const updatedList = [...existingList, metadata]
      localStorage.setItem('backup-metadata-list', JSON.stringify(updatedList))
    } catch (error) {
      console.warn('백업 메타데이터 저장 실패:', error)
    }
  }

  /**
   * 오래된 자동 백업 정리
   */
  private async cleanupOldAutoBackups(): Promise<void> {
    try {
      const backupList = this.getBackupList()
      const autoBackups = backupList
        .filter(backup => backup.isAutoBackup)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      
      // 최대 개수를 초과하는 백업 삭제
      const backupsToDelete = autoBackups.slice(this.MAX_AUTO_BACKUPS)
      
      for (const backup of backupsToDelete) {
        this.deleteBackup(backup.id)
      }
    } catch (error) {
      console.warn('오래된 백업 정리 실패:', error)
    }
  }

  /**
   * 자동 백업 설정
   */
  private setupAutoBackup(): void {
    // 마지막 자동 백업 시간 확인
    const lastAutoBackup = localStorage.getItem('last-auto-backup')
    const lastBackupTime = lastAutoBackup ? parseInt(lastAutoBackup) : 0
    
    // 자동 백업이 필요한지 확인
    if (Date.now() - lastBackupTime > this.AUTO_BACKUP_INTERVAL) {
      // 페이지 로드 후 잠시 대기하여 자동 백업 실행
      setTimeout(() => {
        this.createAutoBackup('scheduled')
          .then(() => {
            localStorage.setItem('last-auto-backup', Date.now().toString())
          })
          .catch(error => {
            console.warn('자동 백업 실패:', error)
          })
      }, 5000) // 5초 후 실행
    }
  }

  /**
   * 메모리에서 현재 데이터 수집
   */
  private collectMemoryData(): any {
    try {
      // Redux 스토어에서 현재 상태 가져오기
      const store = (window as any).__REDUX_STORE__
      if (store && store.getState) {
        const state = store.getState()
        return {
          tasks: state.tasks?.tasks || [],
          user: state.user?.currentUser || null,
          timer: state.timer || null,
        }
      }
      return {}
    } catch (error) {
      console.warn('메모리 데이터 수집 실패:', error)
      return {}
    }
  }

  /**
   * 세션 스토리지에서 데이터 수집
   */
  private collectSessionData(): any {
    try {
      const sessionData: any = {}
      
      // 세션 스토리지의 모든 키 확인
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && key.startsWith('adhd-timer-')) {
          const value = sessionStorage.getItem(key)
          if (value) {
            sessionData[key] = JSON.parse(value)
          }
        }
      }
      
      return sessionData
    } catch (error) {
      console.warn('세션 데이터 수집 실패:', error)
      return {}
    }
  }

  /**
   * 다른 탭에서 데이터 복구 시도
   */
  private async attemptCrossTabRecovery(): Promise<any> {
    return new Promise((resolve) => {
      try {
        // BroadcastChannel을 사용하여 다른 탭과 통신
        const channel = new BroadcastChannel('adhd-timer-recovery')
        
        const timeout = setTimeout(() => {
          channel.close()
          resolve({})
        }, 3000) // 3초 타임아웃
        
        channel.onmessage = (event) => {
          if (event.data.type === 'recovery-response') {
            clearTimeout(timeout)
            channel.close()
            resolve(event.data.data || {})
          }
        }
        
        // 다른 탭에 데이터 요청
        channel.postMessage({ type: 'recovery-request' })
        
      } catch (error) {
        console.warn('크로스 탭 복구 실패:', error)
        resolve({})
      }
    })
  }

  /**
   * 최신 자동 백업 가져오기
   */
  private getLatestAutoBackup(): BackupMetadata | null {
    try {
      const backupList = this.getBackupList()
      const autoBackups = backupList
        .filter(backup => backup.isAutoBackup)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      
      return autoBackups[0] || null
    } catch (error) {
      console.warn('최신 자동 백업 조회 실패:', error)
      return null
    }
  }
}

export const dataBackupService = DataBackupService.getInstance()