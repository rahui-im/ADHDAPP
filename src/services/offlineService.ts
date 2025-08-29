/**
 * 오프라인 기능 지원 서비스
 * 오프라인 상태에서의 데이터 저장, 동기화, 캐싱 관리
 */

interface OfflineAction {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  entity: 'task' | 'session' | 'user_preferences'
  data: any
  timestamp: number
}

interface SyncStatus {
  lastSyncTime: number
  pendingActions: number
  isOnline: boolean
}

class OfflineService {
  private readonly SYNC_QUEUE_KEY = 'offline-sync-queue'
  private readonly LAST_SYNC_KEY = 'last-sync-time'
  private readonly OFFLINE_DATA_KEY = 'offline-data'
  
  private syncQueue: OfflineAction[] = []
  private isOnline = navigator.onLine

  constructor() {
    this.loadSyncQueue()
    this.setupNetworkListeners()
  }

  /**
   * 네트워크 상태 변경 리스너 설정
   */
  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.processSyncQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  /**
   * 동기화 큐 로드
   */
  private loadSyncQueue() {
    try {
      const stored = localStorage.getItem(this.SYNC_QUEUE_KEY)
      if (stored) {
        this.syncQueue = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error)
      this.syncQueue = []
    }
  }

  /**
   * 동기화 큐 저장
   */
  private saveSyncQueue() {
    try {
      localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue))
    } catch (error) {
      console.error('Failed to save sync queue:', error)
    }
  }

  /**
   * 오프라인 액션 추가
   */
  addOfflineAction(
    type: OfflineAction['type'],
    entity: OfflineAction['entity'],
    data: any
  ): string {
    const action: OfflineAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      entity,
      data,
      timestamp: Date.now()
    }

    this.syncQueue.push(action)
    this.saveSyncQueue()

    // 온라인 상태면 즉시 동기화 시도
    if (this.isOnline) {
      this.processSyncQueue()
    }

    return action.id
  }

  /**
   * 동기화 큐 처리
   */
  private async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return
    }

    console.log(`🔄 Processing ${this.syncQueue.length} offline actions...`)

    const processedActions: string[] = []

    for (const action of this.syncQueue) {
      try {
        await this.processAction(action)
        processedActions.push(action.id)
      } catch (error) {
        console.error(`Failed to process action ${action.id}:`, error)
        // 실패한 액션은 큐에 남겨둠
      }
    }

    // 성공적으로 처리된 액션들 제거
    this.syncQueue = this.syncQueue.filter(
      action => !processedActions.includes(action.id)
    )
    this.saveSyncQueue()

    if (processedActions.length > 0) {
      this.updateLastSyncTime()
      console.log(`✅ Successfully processed ${processedActions.length} actions`)
    }
  }

  /**
   * 개별 액션 처리
   */
  private async processAction(action: OfflineAction): Promise<void> {
    switch (action.entity) {
      case 'task':
        await this.processTaskAction(action)
        break
      case 'session':
        await this.processSessionAction(action)
        break
      case 'user_preferences':
        await this.processUserPreferencesAction(action)
        break
      default:
        throw new Error(`Unknown entity type: ${action.entity}`)
    }
  }

  /**
   * 작업 관련 액션 처리
   */
  private async processTaskAction(action: OfflineAction): Promise<void> {
    // 실제 구현에서는 API 호출 또는 서버 동기화
    // 여기서는 로컬 스토리지 업데이트로 시뮬레이션
    
    const tasks = this.getStoredData('tasks') || []
    
    switch (action.type) {
      case 'CREATE':
        tasks.push(action.data)
        break
      case 'UPDATE':
        const updateIndex = tasks.findIndex((t: any) => t.id === action.data.id)
        if (updateIndex !== -1) {
          tasks[updateIndex] = { ...tasks[updateIndex], ...action.data }
        }
        break
      case 'DELETE':
        const deleteIndex = tasks.findIndex((t: any) => t.id === action.data.id)
        if (deleteIndex !== -1) {
          tasks.splice(deleteIndex, 1)
        }
        break
    }
    
    this.storeData('tasks', tasks)
  }

  /**
   * 세션 관련 액션 처리
   */
  private async processSessionAction(action: OfflineAction): Promise<void> {
    const sessions = this.getStoredData('sessions') || []
    
    switch (action.type) {
      case 'CREATE':
        sessions.push(action.data)
        break
      case 'UPDATE':
        const updateIndex = sessions.findIndex((s: any) => s.id === action.data.id)
        if (updateIndex !== -1) {
          sessions[updateIndex] = { ...sessions[updateIndex], ...action.data }
        }
        break
    }
    
    this.storeData('sessions', sessions)
  }

  /**
   * 사용자 설정 관련 액션 처리
   */
  private async processUserPreferencesAction(action: OfflineAction): Promise<void> {
    const preferences = this.getStoredData('user_preferences') || {}
    
    switch (action.type) {
      case 'UPDATE':
        Object.assign(preferences, action.data)
        break
    }
    
    this.storeData('user_preferences', preferences)
  }

  /**
   * 데이터 저장
   */
  private storeData(key: string, data: any) {
    try {
      const offlineData = this.getStoredData() || {}
      offlineData[key] = data
      localStorage.setItem(this.OFFLINE_DATA_KEY, JSON.stringify(offlineData))
    } catch (error) {
      console.error(`Failed to store ${key}:`, error)
    }
  }

  /**
   * 저장된 데이터 조회
   */
  private getStoredData(key?: string): any {
    try {
      const stored = localStorage.getItem(this.OFFLINE_DATA_KEY)
      if (!stored) return null
      
      const data = JSON.parse(stored)
      return key ? data[key] : data
    } catch (error) {
      console.error('Failed to get stored data:', error)
      return null
    }
  }

  /**
   * 마지막 동기화 시간 업데이트
   */
  private updateLastSyncTime() {
    localStorage.setItem(this.LAST_SYNC_KEY, Date.now().toString())
  }

  /**
   * 동기화 상태 조회
   */
  getSyncStatus(): SyncStatus {
    const lastSyncTime = parseInt(localStorage.getItem(this.LAST_SYNC_KEY) || '0')
    
    return {
      lastSyncTime,
      pendingActions: this.syncQueue.length,
      isOnline: this.isOnline
    }
  }

  /**
   * 수동 동기화 실행
   */
  async forcSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline')
    }
    
    await this.processSyncQueue()
  }

  /**
   * 오프라인 데이터 정리
   */
  clearOfflineData(): void {
    localStorage.removeItem(this.SYNC_QUEUE_KEY)
    localStorage.removeItem(this.OFFLINE_DATA_KEY)
    localStorage.removeItem(this.LAST_SYNC_KEY)
    this.syncQueue = []
  }

  /**
   * 캐시된 데이터 조회 (오프라인 시 사용)
   */
  getCachedData(key: string): any {
    return this.getStoredData(key)
  }

  /**
   * 오프라인 상태 확인
   */
  isOffline(): boolean {
    return !this.isOnline
  }

  /**
   * 동기화 대기 중인 액션 수 조회
   */
  getPendingActionsCount(): number {
    return this.syncQueue.length
  }
}

// 싱글톤 인스턴스
export const offlineService = new OfflineService()

/**
 * 오프라인 상태를 관리하는 React Hook
 */
export const useOffline = () => {
  const [syncStatus, setSyncStatus] = React.useState<SyncStatus>(
    offlineService.getSyncStatus()
  )

  React.useEffect(() => {
    const updateSyncStatus = () => {
      setSyncStatus(offlineService.getSyncStatus())
    }

    // 네트워크 상태 변경 시 동기화 상태 업데이트
    window.addEventListener('online', updateSyncStatus)
    window.addEventListener('offline', updateSyncStatus)

    // 주기적으로 동기화 상태 확인
    const interval = setInterval(updateSyncStatus, 5000)

    return () => {
      window.removeEventListener('online', updateSyncStatus)
      window.removeEventListener('offline', updateSyncStatus)
      clearInterval(interval)
    }
  }, [])

  return {
    ...syncStatus,
    addOfflineAction: offlineService.addOfflineAction.bind(offlineService),
    forceSync: offlineService.forcSync.bind(offlineService),
    getCachedData: offlineService.getCachedData.bind(offlineService),
    clearOfflineData: offlineService.clearOfflineData.bind(offlineService)
  }
}