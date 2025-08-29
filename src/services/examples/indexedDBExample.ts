// IndexedDB 서비스 사용 예제
import { indexedDBManager } from '../indexedDBService'
import { Session, DailyStats } from '../../types'

// 예제: 세션 데이터 저장 및 조회
export async function sessionExample() {
  try {
    // 새 세션 생성
    const session: Session = {
      id: `session-${Date.now()}`,
      taskId: 'task-123',
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

    // 세션 저장
    await indexedDBManager.sessions.saveSession(session)
    console.log('세션 저장 완료:', session.id)

    // 세션 조회
    const retrievedSession = await indexedDBManager.sessions.getSession(session.id)
    console.log('조회된 세션:', retrievedSession)

    // 작업별 세션 조회
    const taskSessions = await indexedDBManager.sessions.getSessionsByTask('task-123')
    console.log('작업별 세션:', taskSessions.length, '개')

    return session
  } catch (error) {
    console.error('세션 예제 실행 실패:', error)
    throw error
  }
}

// 예제: 통계 데이터 저장 및 조회
export async function statsExample() {
  try {
    // 일일 통계 생성
    const dailyStats: DailyStats = {
      date: new Date(),
      tasksCompleted: 5,
      tasksPlanned: 7,
      focusMinutes: 125,
      breakMinutes: 35,
      pomodorosCompleted: 5,
      averageEnergyLevel: 3.6,
      distractions: ['notification', 'website']
    }

    // 통계 저장
    await indexedDBManager.stats.saveDailyStats(dailyStats)
    console.log('일일 통계 저장 완료')

    // 통계 조회
    const retrievedStats = await indexedDBManager.stats.getDailyStats(new Date())
    console.log('조회된 통계:', retrievedStats)

    // 범위별 통계 조회
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7) // 7일 전
    const weeklyStats = await indexedDBManager.stats.getStatsInRange(startDate, new Date())
    console.log('주간 통계:', weeklyStats.length, '일')

    return dailyStats
  } catch (error) {
    console.error('통계 예제 실행 실패:', error)
    throw error
  }
}

// 예제: 캐시 사용
export async function cacheExample() {
  try {
    const analyticsData = {
      completionRate: 85,
      averageFocusTime: 22,
      productiveHours: [9, 10, 14, 15, 16],
      preferredTaskTypes: ['coding', 'writing'],
      improvementAreas: ['break_management', 'distraction_control']
    }

    // 캐시 저장 (1시간 유효)
    await indexedDBManager.cache.setCache('weekly_analytics', analyticsData, 60 * 60 * 1000)
    console.log('분석 데이터 캐시 저장 완료')

    // 캐시 조회
    const cachedData = await indexedDBManager.cache.getCache('weekly_analytics')
    console.log('캐시된 분석 데이터:', cachedData)

    // 캐시 통계
    const cacheStats = await indexedDBManager.cache.getCacheStats()
    console.log('캐시 통계:', cacheStats)

    return analyticsData
  } catch (error) {
    console.error('캐시 예제 실행 실패:', error)
    throw error
  }
}

// 예제: 데이터 정리 및 관리
export async function cleanupExample() {
  try {
    // 데이터베이스 상태 확인
    const status = await indexedDBManager.getStatus()
    console.log('데이터베이스 상태:', status)

    // 데이터 정리 실행
    const cleanupResult = await indexedDBManager.cleanup({
      sessionRetentionDays: 30,
      statsRetentionDays: 90,
      enableCompression: true,
      forceCleanup: false
    })
    console.log('정리 결과:', cleanupResult)

    // 성능 메트릭 확인
    const performance = await indexedDBManager.getPerformanceMetrics()
    console.log('성능 메트릭:', performance)

    // 데이터 무결성 검사
    const integrity = await indexedDBManager.validateDataIntegrity()
    console.log('데이터 무결성:', integrity)

    return cleanupResult
  } catch (error) {
    console.error('정리 예제 실행 실패:', error)
    throw error
  }
}

// 예제: 데이터 내보내기/가져오기
export async function exportImportExample() {
  try {
    // 데이터 내보내기
    const exportResult = await indexedDBManager.exportData({
      includeSessions: true,
      includeStats: true,
      includeCache: false,
      compress: true
    })
    console.log('데이터 내보내기 완료:', exportResult.size, 'bytes')

    // 데이터 가져오기 (예제용으로 같은 데이터를 다시 가져오기)
    const importResult = await indexedDBManager.importData(exportResult.data, {
      overwrite: false,
      validateData: true,
      skipDuplicates: true
    })
    console.log('데이터 가져오기 완료:', importResult)

    return { exportResult, importResult }
  } catch (error) {
    console.error('내보내기/가져오기 예제 실행 실패:', error)
    throw error
  }
}

// 모든 예제 실행
export async function runAllExamples() {
  console.log('=== IndexedDB 서비스 예제 시작 ===')
  
  try {
    await sessionExample()
    console.log('✅ 세션 예제 완료\n')

    await statsExample()
    console.log('✅ 통계 예제 완료\n')

    await cacheExample()
    console.log('✅ 캐시 예제 완료\n')

    await cleanupExample()
    console.log('✅ 정리 예제 완료\n')

    await exportImportExample()
    console.log('✅ 내보내기/가져오기 예제 완료\n')

    console.log('=== 모든 예제 완료 ===')
  } catch (error) {
    console.error('예제 실행 중 오류:', error)
  }
}