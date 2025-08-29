import { Session, DailyStats, WeeklyInsight } from '../types'

// 데이터 압축 유틸리티
class CompressionUtils {
  // 간단한 JSON 압축 (중복 키 제거 및 최적화)
  static compress(data: any): string {
    try {
      // 객체를 JSON 문자열로 변환 후 압축
      const jsonString = JSON.stringify(data)
      
      // 기본적인 압축: 공백 제거 및 키 최적화
      return jsonString
        .replace(/\s+/g, '') // 공백 제거
        .replace(/"([^"]+)":/g, (match, key) => {
          // 자주 사용되는 키들을 짧게 변환
          const keyMap: Record<string, string> = {
            'id': 'i',
            'taskId': 't',
            'startedAt': 's',
            'completedAt': 'c',
            'duration': 'd',
            'type': 'y',
            'wasInterrupted': 'w',
            'energyBefore': 'eb',
            'energyAfter': 'ea',
            'interruptionReasons': 'ir',
            'plannedDuration': 'pd',
            'actualDuration': 'ad'
          }
          return `"${keyMap[key] || key}":`
        })
    } catch (error) {
      console.warn('데이터 압축 실패, 원본 반환:', error)
      return JSON.stringify(data)
    }
  }

  // 압축 해제
  static decompress(compressedData: string): any {
    try {
      // 키 복원 맵
      const reverseKeyMap: Record<string, string> = {
        'i': 'id',
        't': 'taskId',
        's': 'startedAt',
        'c': 'completedAt',
        'd': 'duration',
        'y': 'type',
        'w': 'wasInterrupted',
        'eb': 'energyBefore',
        'ea': 'energyAfter',
        'ir': 'interruptionReasons',
        'pd': 'plannedDuration',
        'ad': 'actualDuration'
      }

      // 압축된 키를 원래 키로 복원
      const restored = compressedData.replace(/"([^"]+)":/g, (match, key) => {
        return `"${reverseKeyMap[key] || key}":`
      })

      return JSON.parse(restored)
    } catch (error) {
      console.warn('데이터 압축 해제 실패, JSON 파싱 시도:', error)
      return JSON.parse(compressedData)
    }
  }

  // 압축률 계산
  static getCompressionRatio(original: string, compressed: string): number {
    return Math.round((1 - compressed.length / original.length) * 100)
  }
}

// IndexedDB 설정
const DB_NAME = 'ADHDTimerDB'
const DB_VERSION = 1

// 객체 저장소 이름
const STORES = {
  SESSIONS: 'sessions',
  DAILY_STATS: 'dailyStats',
  WEEKLY_INSIGHTS: 'weeklyInsights',
  ANALYTICS_CACHE: 'analyticsCache',
} as const

// IndexedDB 오류 타입
export class IndexedDBError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message)
    this.name = 'IndexedDBError'
  }
}

// IndexedDB 래퍼 클래스
class IndexedDBService {
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  // 데이터베이스 초기화
  private async initDB(): Promise<void> {
    if (this.db) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        reject(new IndexedDBError('데이터베이스 열기 실패', request.error || undefined))
      }

      request.onsuccess = () => {
        this.db = request.result
        
        // 데이터베이스 오류 핸들러
        this.db.onerror = (event) => {
          console.error('IndexedDB 오류:', event)
        }
        
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Sessions 저장소
        if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
          const sessionStore = db.createObjectStore(STORES.SESSIONS, { keyPath: 'id' })
          sessionStore.createIndex('taskId', 'taskId', { unique: false })
          sessionStore.createIndex('startedAt', 'startedAt', { unique: false })
          sessionStore.createIndex('type', 'type', { unique: false })
        }

        // Daily Stats 저장소
        if (!db.objectStoreNames.contains(STORES.DAILY_STATS)) {
          const dailyStore = db.createObjectStore(STORES.DAILY_STATS, { keyPath: 'date' })
          dailyStore.createIndex('date', 'date', { unique: true })
        }

        // Weekly Insights 저장소
        if (!db.objectStoreNames.contains(STORES.WEEKLY_INSIGHTS)) {
          const weeklyStore = db.createObjectStore(STORES.WEEKLY_INSIGHTS, { keyPath: 'weekStart' })
          weeklyStore.createIndex('weekStart', 'weekStart', { unique: true })
        }

        // Analytics Cache 저장소
        if (!db.objectStoreNames.contains(STORES.ANALYTICS_CACHE)) {
          const cacheStore = db.createObjectStore(STORES.ANALYTICS_CACHE, { keyPath: 'key' })
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  // 데이터베이스 준비 확인
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.initPromise) {
      this.initPromise = this.initDB()
    }
    
    await this.initPromise
    
    if (!this.db) {
      throw new IndexedDBError('데이터베이스가 초기화되지 않았습니다.')
    }
    
    return this.db
  }

  // 트랜잭션 헬퍼
  private async withTransaction<T>(
    storeNames: string | string[],
    mode: IDBTransactionMode,
    callback: (stores: IDBObjectStore | IDBObjectStore[]) => Promise<T> | T
  ): Promise<T> {
    const db = await this.ensureDB()
    const transaction = db.transaction(storeNames, mode)
    
    return new Promise((resolve, reject) => {
      transaction.onerror = () => {
        reject(new IndexedDBError('트랜잭션 실패', transaction.error || undefined))
      }
      
      transaction.onabort = () => {
        reject(new IndexedDBError('트랜잭션이 중단되었습니다.'))
      }
      
      try {
        const stores = Array.isArray(storeNames)
          ? storeNames.map(name => transaction.objectStore(name))
          : transaction.objectStore(storeNames)
        
        const result = callback(stores)
        
        if (result instanceof Promise) {
          result.then(resolve).catch(reject)
        } else {
          resolve(result)
        }
      } catch (error) {
        reject(new IndexedDBError('트랜잭션 콜백 실행 실패', error as Error))
      }
    })
  }

  // 데이터 추가/업데이트
  async put<T>(storeName: string, data: T): Promise<void> {
    await this.withTransaction(storeName, 'readwrite', (store) => {
      return new Promise<void>((resolve, reject) => {
        const request = (store as IDBObjectStore).put(data)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(new IndexedDBError('데이터 저장 실패', request.error || undefined))
      })
    })
  }

  // 데이터 조회
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
    return this.withTransaction(storeName, 'readonly', (store) => {
      return new Promise<T | null>((resolve, reject) => {
        const request = (store as IDBObjectStore).get(key)
        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(new IndexedDBError('데이터 조회 실패', request.error || undefined))
      })
    })
  }

  // 모든 데이터 조회
  async getAll<T>(storeName: string): Promise<T[]> {
    return this.withTransaction(storeName, 'readonly', (store) => {
      return new Promise<T[]>((resolve, reject) => {
        const request = (store as IDBObjectStore).getAll()
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(new IndexedDBError('전체 데이터 조회 실패', request.error || undefined))
      })
    })
  }

  // 인덱스로 데이터 조회
  async getByIndex<T>(storeName: string, indexName: string, key: IDBValidKey): Promise<T[]> {
    return this.withTransaction(storeName, 'readonly', (store) => {
      return new Promise<T[]>((resolve, reject) => {
        const index = (store as IDBObjectStore).index(indexName)
        const request = index.getAll(key)
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(new IndexedDBError('인덱스 조회 실패', request.error || undefined))
      })
    })
  }

  // 범위 조회
  async getByRange<T>(
    storeName: string,
    indexName: string,
    range: IDBKeyRange
  ): Promise<T[]> {
    return this.withTransaction(storeName, 'readonly', (store) => {
      return new Promise<T[]>((resolve, reject) => {
        const index = (store as IDBObjectStore).index(indexName)
        const request = index.getAll(range)
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(new IndexedDBError('범위 조회 실패', request.error || undefined))
      })
    })
  }

  // 데이터 삭제
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    await this.withTransaction(storeName, 'readwrite', (store) => {
      return new Promise<void>((resolve, reject) => {
        const request = (store as IDBObjectStore).delete(key)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(new IndexedDBError('데이터 삭제 실패', request.error || undefined))
      })
    })
  }

  // 저장소 비우기
  async clear(storeName: string): Promise<void> {
    await this.withTransaction(storeName, 'readwrite', (store) => {
      return new Promise<void>((resolve, reject) => {
        const request = (store as IDBObjectStore).clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(new IndexedDBError('저장소 비우기 실패', request.error || undefined))
      })
    })
  }

  // 데이터베이스 닫기
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
      this.initPromise = null
    }
  }

  // 데이터베이스 삭제
  async deleteDatabase(): Promise<void> {
    this.close()
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new IndexedDBError('데이터베이스 삭제 실패', request.error || undefined))
    })
  }
}

// 특화된 서비스들
export class SessionService {
  private db = new IndexedDBService()

  async saveSession(session: Session): Promise<void> {
    await this.db.put(STORES.SESSIONS, session)
  }

  async getSession(id: string): Promise<Session | null> {
    return this.db.get<Session>(STORES.SESSIONS, id)
  }

  async getAllSessions(): Promise<Session[]> {
    return this.db.getAll<Session>(STORES.SESSIONS)
  }

  async getSessionsByTask(taskId: string): Promise<Session[]> {
    return this.db.getByIndex<Session>(STORES.SESSIONS, 'taskId', taskId)
  }

  async getSessionsByDateRange(startDate: Date, endDate: Date): Promise<Session[]> {
    const range = IDBKeyRange.bound(startDate, endDate)
    return this.db.getByRange<Session>(STORES.SESSIONS, 'startedAt', range)
  }

  async getRecentSessions(days: number = 7): Promise<Session[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    return this.getSessionsByDateRange(startDate, new Date())
  }

  async deleteSession(id: string): Promise<void> {
    await this.db.delete(STORES.SESSIONS, id)
  }

  async clearOldSessions(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    
    const oldSessions = await this.getSessionsByDateRange(new Date(0), cutoffDate)
    
    for (const session of oldSessions) {
      await this.deleteSession(session.id)
    }
  }
}

export class StatsService {
  private db = new IndexedDBService()

  async saveDailyStats(stats: DailyStats): Promise<void> {
    // Date를 키로 사용하기 위해 문자열로 변환
    const statsWithStringKey = {
      ...stats,
      date: stats.date.toISOString().split('T')[0], // YYYY-MM-DD 형식
    }
    await this.db.put(STORES.DAILY_STATS, statsWithStringKey)
  }

  async getDailyStats(date: Date): Promise<DailyStats | null> {
    const dateKey = date.toISOString().split('T')[0]
    const result = await this.db.get<DailyStats & { date: string }>(STORES.DAILY_STATS, dateKey)
    
    if (result) {
      return {
        ...result,
        date: new Date(result.date),
      }
    }
    
    return null
  }

  async getAllDailyStats(): Promise<DailyStats[]> {
    const results = await this.db.getAll<DailyStats & { date: string }>(STORES.DAILY_STATS)
    return results.map(result => ({
      ...result,
      date: new Date(result.date),
    }))
  }

  async getStatsInRange(startDate: Date, endDate: Date): Promise<DailyStats[]> {
    const allStats = await this.getAllDailyStats()
    return allStats.filter(stats => 
      stats.date >= startDate && stats.date <= endDate
    )
  }

  async saveWeeklyInsight(insight: WeeklyInsight): Promise<void> {
    const insightWithStringKey = {
      ...insight,
      weekStart: insight.weekStart.toISOString().split('T')[0],
    }
    await this.db.put(STORES.WEEKLY_INSIGHTS, insightWithStringKey)
  }

  async getWeeklyInsight(weekStart: Date): Promise<WeeklyInsight | null> {
    const weekKey = weekStart.toISOString().split('T')[0]
    const result = await this.db.get<WeeklyInsight & { weekStart: string }>(STORES.WEEKLY_INSIGHTS, weekKey)
    
    if (result) {
      return {
        ...result,
        weekStart: new Date(result.weekStart),
      }
    }
    
    return null
  }

  async getAllWeeklyInsights(): Promise<WeeklyInsight[]> {
    const results = await this.db.getAll<WeeklyInsight & { weekStart: string }>(STORES.WEEKLY_INSIGHTS)
    return results.map(result => ({
      ...result,
      weekStart: new Date(result.weekStart),
    }))
  }
}

export class AnalyticsCacheService {
  private db = new IndexedDBService()
  private readonly CACHE_DURATION = 60 * 60 * 1000 // 1시간
  private readonly MAX_CACHE_SIZE = 100 // 최대 캐시 항목 수

  async setCache<T>(key: string, data: T, customDuration?: number): Promise<void> {
    const cacheItem = {
      key,
      data: CompressionUtils.compress(data), // 캐시 데이터 압축
      timestamp: Date.now(),
      duration: customDuration || this.CACHE_DURATION,
      size: JSON.stringify(data).length
    }
    
    await this.db.put(STORES.ANALYTICS_CACHE, cacheItem)
    
    // 캐시 크기 관리
    await this.manageCacheSize()
  }

  async getCache<T>(key: string): Promise<T | null> {
    const cacheItem = await this.db.get<{
      key: string
      data: string
      timestamp: number
      duration: number
      size: number
    }>(STORES.ANALYTICS_CACHE, key)
    
    if (!cacheItem) return null
    
    // 캐시 만료 확인
    if (Date.now() - cacheItem.timestamp > cacheItem.duration) {
      await this.db.delete(STORES.ANALYTICS_CACHE, key)
      return null
    }
    
    try {
      // 압축된 데이터 해제
      return CompressionUtils.decompress(cacheItem.data)
    } catch (error) {
      console.warn(`캐시 데이터 해제 실패 (${key}):`, error)
      await this.db.delete(STORES.ANALYTICS_CACHE, key)
      return null
    }
  }

  async clearExpiredCache(): Promise<number> {
    const allCache = await this.db.getAll<{
      key: string
      data: string
      timestamp: number
      duration: number
      size: number
    }>(STORES.ANALYTICS_CACHE)
    
    const expiredItems = allCache.filter(item => 
      Date.now() - item.timestamp > item.duration
    )
    
    for (const item of expiredItems) {
      await this.db.delete(STORES.ANALYTICS_CACHE, item.key)
    }
    
    return expiredItems.length
  }

  // 캐시 크기 관리
  private async manageCacheSize(): Promise<void> {
    const allCache = await this.db.getAll<{
      key: string
      data: string
      timestamp: number
      duration: number
      size: number
    }>(STORES.ANALYTICS_CACHE)
    
    if (allCache.length <= this.MAX_CACHE_SIZE) return
    
    // 오래된 캐시부터 제거
    const sortedCache = allCache.sort((a, b) => a.timestamp - b.timestamp)
    const itemsToRemove = sortedCache.slice(0, allCache.length - this.MAX_CACHE_SIZE)
    
    for (const item of itemsToRemove) {
      await this.db.delete(STORES.ANALYTICS_CACHE, item.key)
    }
  }

  // 캐시 통계
  async getCacheStats(): Promise<{
    totalItems: number
    totalSize: number
    oldestItem: Date | null
    newestItem: Date | null
    hitRate: number
  }> {
    const allCache = await this.db.getAll<{
      key: string
      data: string
      timestamp: number
      duration: number
      size: number
    }>(STORES.ANALYTICS_CACHE)
    
    if (allCache.length === 0) {
      return {
        totalItems: 0,
        totalSize: 0,
        oldestItem: null,
        newestItem: null,
        hitRate: 0
      }
    }
    
    const totalSize = allCache.reduce((sum, item) => sum + item.size, 0)
    const timestamps = allCache.map(item => item.timestamp)
    const oldestItem = new Date(Math.min(...timestamps))
    const newestItem = new Date(Math.max(...timestamps))
    
    // 간단한 히트율 계산 (유효한 캐시 비율)
    const validCache = allCache.filter(item => 
      Date.now() - item.timestamp <= item.duration
    )
    const hitRate = Math.round((validCache.length / allCache.length) * 100)
    
    return {
      totalItems: allCache.length,
      totalSize,
      oldestItem,
      newestItem,
      hitRate
    }
  }

  // 특정 패턴의 캐시 삭제
  async clearCacheByPattern(pattern: string): Promise<number> {
    const allCache = await this.db.getAll<{
      key: string
      data: string
      timestamp: number
      duration: number
      size: number
    }>(STORES.ANALYTICS_CACHE)
    
    const regex = new RegExp(pattern)
    const matchingItems = allCache.filter(item => regex.test(item.key))
    
    for (const item of matchingItems) {
      await this.db.delete(STORES.ANALYTICS_CACHE, item.key)
    }
    
    return matchingItems.length
  }
}

// 통합 IndexedDB 서비스
export class IndexedDBManager {
  sessions = new SessionService()
  stats = new StatsService()
  cache = new AnalyticsCacheService()
  private db = new IndexedDBService()
  private compressionUtils = CompressionUtils

  // 고급 데이터 압축 및 정리
  async cleanup(options: {
    sessionRetentionDays?: number
    statsRetentionDays?: number
    enableCompression?: boolean
    forceCleanup?: boolean
  } = {}): Promise<{
    sessionsRemoved: number
    statsCompressed: number
    cacheCleared: number
    spaceSaved: number
  }> {
    const {
      sessionRetentionDays = 30,
      statsRetentionDays = 90,
      enableCompression = true,
      forceCleanup = false
    } = options

    let sessionsRemoved = 0
    let statsCompressed = 0
    let cacheCleared = 0
    let spaceSaved = 0

    try {
      // 1. 오래된 세션 데이터 정리
      const oldSessions = await this.getOldSessions(sessionRetentionDays)
      sessionsRemoved = oldSessions.length
      
      for (const session of oldSessions) {
        await this.sessions.deleteSession(session.id)
      }

      // 2. 통계 데이터 압축
      if (enableCompression) {
        const compressionResult = await this.compressOldStats(statsRetentionDays)
        statsCompressed = compressionResult.compressed
        spaceSaved += compressionResult.spaceSaved
      }

      // 3. 만료된 캐시 정리
      const expiredCacheCount = await this.cache.clearExpiredCache()
      cacheCleared = expiredCacheCount

      // 4. 중복 데이터 제거
      if (forceCleanup) {
        await this.removeDuplicateData()
      }

      // 5. 데이터베이스 최적화
      await this.optimizeDatabase()

      console.log(`IndexedDB 정리 완료: 세션 ${sessionsRemoved}개 제거, 통계 ${statsCompressed}개 압축, 캐시 ${cacheCleared}개 정리`)
      
      return {
        sessionsRemoved,
        statsCompressed,
        cacheCleared,
        spaceSaved
      }
    } catch (error) {
      console.error('IndexedDB 정리 실패:', error)
      throw new IndexedDBError('데이터 정리 중 오류 발생', error as Error)
    }
  }

  // 오래된 세션 조회
  private async getOldSessions(retentionDays: number): Promise<Session[]> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
    
    const allSessions = await this.sessions.getAllSessions()
    return allSessions.filter(session => session.startedAt < cutoffDate)
  }

  // 통계 데이터 압축
  private async compressOldStats(retentionDays: number): Promise<{
    compressed: number
    spaceSaved: number
  }> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
    
    const allStats = await this.stats.getAllDailyStats()
    const oldStats = allStats.filter(stat => stat.date < cutoffDate)
    
    let compressed = 0
    let spaceSaved = 0

    for (const stat of oldStats) {
      try {
        const originalSize = JSON.stringify(stat).length
        const compressedData = this.compressionUtils.compress(stat)
        const compressedSize = compressedData.length

        // 압축된 데이터를 특별한 형태로 저장
        const compressedStat = {
          ...stat,
          _compressed: true,
          _data: compressedData
        }

        await this.stats.saveDailyStats(compressedStat as any)
        
        compressed++
        spaceSaved += originalSize - compressedSize
      } catch (error) {
        console.warn(`통계 데이터 압축 실패 (${stat.date}):`, error)
      }
    }

    return { compressed, spaceSaved }
  }

  // 중복 데이터 제거
  private async removeDuplicateData(): Promise<void> {
    // 중복 세션 제거
    const sessions = await this.sessions.getAllSessions()
    const uniqueSessions = new Map<string, Session>()
    
    for (const session of sessions) {
      const key = `${session.taskId}-${session.startedAt.getTime()}`
      if (!uniqueSessions.has(key) || session.completedAt) {
        uniqueSessions.set(key, session)
      }
    }

    // 중복된 세션 삭제
    const duplicates = sessions.filter(session => {
      const key = `${session.taskId}-${session.startedAt.getTime()}`
      return uniqueSessions.get(key)?.id !== session.id
    })

    for (const duplicate of duplicates) {
      await this.sessions.deleteSession(duplicate.id)
    }
  }

  // 데이터베이스 최적화
  private async optimizeDatabase(): Promise<void> {
    // 빈 레코드 정리 및 인덱스 최적화
    try {
      // 각 저장소의 빈 레코드 확인 및 정리
      const stores = [STORES.SESSIONS, STORES.DAILY_STATS, STORES.WEEKLY_INSIGHTS, STORES.ANALYTICS_CACHE]
      
      for (const storeName of stores) {
        const allData = await this.db.getAll(storeName)
        const validData = allData.filter(item => item && Object.keys(item).length > 0)
        
        if (validData.length < allData.length) {
          await this.db.clear(storeName)
          for (const item of validData) {
            await this.db.put(storeName, item)
          }
        }
      }
    } catch (error) {
      console.warn('데이터베이스 최적화 중 오류:', error)
    }
  }

  // 데이터베이스 상태 확인
  async getStatus(): Promise<{
    available: boolean
    sessionCount: number
    statsCount: number
    cacheCount: number
    totalSize: number
    compressionRatio: number
    lastCleanup: Date | null
  }> {
    try {
      const [sessions, stats, cache, cacheStats] = await Promise.all([
        this.sessions.getAllSessions(),
        this.stats.getAllDailyStats(),
        this.db.getAll(STORES.ANALYTICS_CACHE),
        this.cache.getCacheStats()
      ])
      
      // 전체 데이터 크기 계산
      const totalSize = [
        JSON.stringify(sessions).length,
        JSON.stringify(stats).length,
        cacheStats.totalSize
      ].reduce((sum, size) => sum + size, 0)
      
      // 압축률 계산 (압축된 데이터가 있는 경우)
      const compressedStats = stats.filter((stat: any) => stat._compressed)
      const compressionRatio = compressedStats.length > 0 
        ? Math.round((compressedStats.length / stats.length) * 100)
        : 0
      
      // 마지막 정리 시간 (캐시에서 확인)
      const lastCleanupCache = await this.cache.getCache<string>('last_cleanup')
      const lastCleanup = lastCleanupCache ? new Date(lastCleanupCache) : null
      
      return {
        available: true,
        sessionCount: sessions.length,
        statsCount: stats.length,
        cacheCount: cache.length,
        totalSize,
        compressionRatio,
        lastCleanup
      }
    } catch (error) {
      console.error('IndexedDB 상태 확인 실패:', error)
      return {
        available: false,
        sessionCount: 0,
        statsCount: 0,
        cacheCount: 0,
        totalSize: 0,
        compressionRatio: 0,
        lastCleanup: null
      }
    }
  }

  // 데이터 내보내기
  async exportData(options: {
    includeSessions?: boolean
    includeStats?: boolean
    includeCache?: boolean
    dateRange?: { start: Date; end: Date }
    compress?: boolean
  } = {}): Promise<{
    data: any
    size: number
    exportedAt: Date
  }> {
    const {
      includeSessions = true,
      includeStats = true,
      includeCache = false,
      dateRange,
      compress = true
    } = options

    try {
      const exportData: any = {
        version: '1.0',
        exportedAt: new Date(),
        metadata: await this.getStatus()
      }

      if (includeSessions) {
        let sessions = await this.sessions.getAllSessions()
        
        if (dateRange) {
          sessions = sessions.filter(session => 
            session.startedAt >= dateRange.start && session.startedAt <= dateRange.end
          )
        }
        
        exportData.sessions = sessions
      }

      if (includeStats) {
        let stats = await this.stats.getAllDailyStats()
        
        if (dateRange) {
          stats = stats.filter(stat => 
            stat.date >= dateRange.start && stat.date <= dateRange.end
          )
        }
        
        exportData.stats = stats
      }

      if (includeCache) {
        const cache = await this.db.getAll(STORES.ANALYTICS_CACHE)
        exportData.cache = cache
      }

      const finalData = compress ? CompressionUtils.compress(exportData) : exportData
      const size = JSON.stringify(finalData).length

      return {
        data: finalData,
        size,
        exportedAt: new Date()
      }
    } catch (error) {
      throw new IndexedDBError('데이터 내보내기 실패', error as Error)
    }
  }

  // 데이터 가져오기
  async importData(importData: any, options: {
    overwrite?: boolean
    validateData?: boolean
    skipDuplicates?: boolean
  } = {}): Promise<{
    imported: {
      sessions: number
      stats: number
      cache: number
    }
    skipped: number
    errors: string[]
  }> {
    const {
      overwrite = false,
      validateData = true,
      skipDuplicates = true
    } = options

    const result = {
      imported: { sessions: 0, stats: 0, cache: 0 },
      skipped: 0,
      errors: [] as string[]
    }

    try {
      // 압축된 데이터인지 확인하고 해제
      let data = importData
      if (typeof importData === 'string') {
        try {
          data = CompressionUtils.decompress(importData)
        } catch {
          data = JSON.parse(importData)
        }
      }

      // 데이터 유효성 검사
      if (validateData && !this.validateImportData(data)) {
        throw new IndexedDBError('유효하지 않은 가져오기 데이터')
      }

      // 기존 데이터 백업 (덮어쓰기 모드인 경우)
      if (overwrite) {
        await this.cache.setCache('backup_before_import', await this.exportData(), 24 * 60 * 60 * 1000) // 24시간
      }

      // 세션 데이터 가져오기
      if (data.sessions) {
        for (const session of data.sessions) {
          try {
            if (skipDuplicates) {
              const existing = await this.sessions.getSession(session.id)
              if (existing) {
                result.skipped++
                continue
              }
            }
            
            await this.sessions.saveSession(session)
            result.imported.sessions++
          } catch (error) {
            result.errors.push(`세션 가져오기 실패 (${session.id}): ${error}`)
          }
        }
      }

      // 통계 데이터 가져오기
      if (data.stats) {
        for (const stat of data.stats) {
          try {
            if (skipDuplicates) {
              const existing = await this.stats.getDailyStats(new Date(stat.date))
              if (existing) {
                result.skipped++
                continue
              }
            }
            
            await this.stats.saveDailyStats(stat)
            result.imported.stats++
          } catch (error) {
            result.errors.push(`통계 가져오기 실패 (${stat.date}): ${error}`)
          }
        }
      }

      // 캐시 데이터 가져오기
      if (data.cache) {
        for (const cacheItem of data.cache) {
          try {
            await this.db.put(STORES.ANALYTICS_CACHE, cacheItem)
            result.imported.cache++
          } catch (error) {
            result.errors.push(`캐시 가져오기 실패 (${cacheItem.key}): ${error}`)
          }
        }
      }

      return result
    } catch (error) {
      throw new IndexedDBError('데이터 가져오기 실패', error as Error)
    }
  }

  // 가져오기 데이터 유효성 검사
  private validateImportData(data: any): boolean {
    try {
      // 기본 구조 확인
      if (!data || typeof data !== 'object') return false
      
      // 버전 확인
      if (data.version && typeof data.version !== 'string') return false
      
      // 세션 데이터 검사
      if (data.sessions) {
        if (!Array.isArray(data.sessions)) return false
        for (const session of data.sessions) {
          if (!session.id || !session.taskId || !session.startedAt) return false
        }
      }
      
      // 통계 데이터 검사
      if (data.stats) {
        if (!Array.isArray(data.stats)) return false
        for (const stat of data.stats) {
          if (!stat.date || typeof stat.tasksCompleted !== 'number') return false
        }
      }
      
      return true
    } catch {
      return false
    }
  }

  // 자동 정리 스케줄링
  async scheduleAutoCleanup(intervalHours: number = 24): Promise<void> {
    // 마지막 정리 시간 확인
    const lastCleanup = await this.cache.getCache<string>('last_cleanup')
    const lastCleanupTime = lastCleanup ? new Date(lastCleanup).getTime() : 0
    const now = Date.now()
    const intervalMs = intervalHours * 60 * 60 * 1000

    if (now - lastCleanupTime >= intervalMs) {
      try {
        await this.cleanup({
          sessionRetentionDays: 30,
          statsRetentionDays: 90,
          enableCompression: true,
          forceCleanup: false
        })
        
        // 정리 시간 기록
        await this.cache.setCache('last_cleanup', new Date().toISOString(), 7 * 24 * 60 * 60 * 1000) // 7일간 보관
        
        console.log('자동 정리 완료')
      } catch (error) {
        console.error('자동 정리 실패:', error)
      }
    }
  }

  // 성능 모니터링
  async getPerformanceMetrics(): Promise<{
    averageQueryTime: number
    slowQueries: Array<{ operation: string; duration: number; timestamp: Date }>
    errorRate: number
    storageUsage: {
      used: number
      available: number
      percentage: number
    }
  }> {
    try {
      // 성능 메트릭 캐시에서 조회
      const metrics = await this.cache.getCache<any>('performance_metrics') || {
        queryTimes: [],
        errors: [],
        slowQueries: []
      }

      const averageQueryTime = metrics.queryTimes.length > 0
        ? metrics.queryTimes.reduce((sum: number, time: number) => sum + time, 0) / metrics.queryTimes.length
        : 0

      const errorRate = metrics.errors.length > 0
        ? (metrics.errors.length / (metrics.queryTimes.length + metrics.errors.length)) * 100
        : 0

      // 저장소 사용량 추정
      const status = await this.getStatus()
      const estimatedUsage = status.totalSize
      const availableStorage = 50 * 1024 * 1024 // 50MB 추정
      const usagePercentage = Math.round((estimatedUsage / availableStorage) * 100)

      return {
        averageQueryTime: Math.round(averageQueryTime),
        slowQueries: metrics.slowQueries || [],
        errorRate: Math.round(errorRate),
        storageUsage: {
          used: estimatedUsage,
          available: availableStorage,
          percentage: usagePercentage
        }
      }
    } catch (error) {
      console.error('성능 메트릭 조회 실패:', error)
      return {
        averageQueryTime: 0,
        slowQueries: [],
        errorRate: 0,
        storageUsage: { used: 0, available: 0, percentage: 0 }
      }
    }
  }

  // 성능 메트릭 기록
  async recordPerformanceMetric(operation: string, duration: number, success: boolean): Promise<void> {
    try {
      const metrics = await this.cache.getCache<any>('performance_metrics') || {
        queryTimes: [],
        errors: [],
        slowQueries: []
      }

      if (success) {
        metrics.queryTimes.push(duration)
        
        // 느린 쿼리 기록 (500ms 이상)
        if (duration > 500) {
          metrics.slowQueries.push({
            operation,
            duration,
            timestamp: new Date()
          })
          
          // 최대 10개까지만 보관
          if (metrics.slowQueries.length > 10) {
            metrics.slowQueries = metrics.slowQueries.slice(-10)
          }
        }
      } else {
        metrics.errors.push({
          operation,
          timestamp: new Date()
        })
      }

      // 최대 100개 기록까지만 보관
      if (metrics.queryTimes.length > 100) {
        metrics.queryTimes = metrics.queryTimes.slice(-100)
      }
      if (metrics.errors.length > 50) {
        metrics.errors = metrics.errors.slice(-50)
      }

      await this.cache.setCache('performance_metrics', metrics, 24 * 60 * 60 * 1000) // 24시간
    } catch (error) {
      console.warn('성능 메트릭 기록 실패:', error)
    }
  }

  // 데이터 무결성 검사
  async validateDataIntegrity(): Promise<{
    isValid: boolean
    issues: string[]
    recommendations: string[]
  }> {
    const issues: string[] = []
    const recommendations: string[] = []

    try {
      // 세션 데이터 검사
      const sessions = await this.sessions.getAllSessions()
      const invalidSessions = sessions.filter(session => 
        !session.id || !session.taskId || !session.startedAt
      )
      
      if (invalidSessions.length > 0) {
        issues.push(`${invalidSessions.length}개의 유효하지 않은 세션 발견`)
        recommendations.push('유효하지 않은 세션 데이터를 정리하세요')
      }

      // 통계 데이터 검사
      const stats = await this.stats.getAllDailyStats()
      const invalidStats = stats.filter(stat => 
        !stat.date || typeof stat.tasksCompleted !== 'number'
      )
      
      if (invalidStats.length > 0) {
        issues.push(`${invalidStats.length}개의 유효하지 않은 통계 발견`)
        recommendations.push('유효하지 않은 통계 데이터를 정리하세요')
      }

      // 중복 데이터 검사
      const sessionIds = sessions.map(s => s.id)
      const duplicateSessionIds = sessionIds.filter((id, index) => sessionIds.indexOf(id) !== index)
      
      if (duplicateSessionIds.length > 0) {
        issues.push(`${duplicateSessionIds.length}개의 중복 세션 발견`)
        recommendations.push('중복 데이터 정리를 실행하세요')
      }

      // 저장소 사용량 검사
      const performance = await this.getPerformanceMetrics()
      if (performance.storageUsage.percentage > 80) {
        issues.push('저장소 사용량이 80%를 초과했습니다')
        recommendations.push('오래된 데이터를 정리하거나 압축을 활성화하세요')
      }

      return {
        isValid: issues.length === 0,
        issues,
        recommendations
      }
    } catch (error) {
      return {
        isValid: false,
        issues: ['데이터 무결성 검사 중 오류 발생'],
        recommendations: ['데이터베이스 상태를 확인하고 필요시 재구축하세요']
      }
    }
  }

  // 전체 데이터 삭제
  async clearAllData(): Promise<void> {
    await this.db.deleteDatabase()
  }

  // 연결 종료
  close(): void {
    this.db.close()
  }
}

// 싱글톤 인스턴스
export const indexedDBManager = new IndexedDBManager()
export const indexedDBService = indexedDBManager

// 자동 정리 초기화 (앱 시작 시)
if (typeof window !== 'undefined') {
  // 브라우저 환경에서만 실행
  indexedDBManager.scheduleAutoCleanup(24).catch(error => {
    console.warn('자동 정리 초기화 실패:', error)
  })
  
  // 페이지 언로드 시 연결 정리
  window.addEventListener('beforeunload', () => {
    indexedDBManager.close()
  })
}