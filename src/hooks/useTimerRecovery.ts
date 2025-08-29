import { useEffect, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { timerRecoveryService } from '../services/timerRecoveryService'
import { restoreTimerState } from '../store/timerSlice'
import { TimerState } from '../types'

export const useTimerRecovery = () => {
  const dispatch = useDispatch()

  /**
   * 타이머 상태 복구 시도
   */
  const attemptRecovery = useCallback(async (): Promise<boolean> => {
    try {
      const recoveredState = timerRecoveryService.restoreTimerState()
      
      if (recoveredState) {
        dispatch(restoreTimerState(recoveredState))
        timerRecoveryService.updateRecoveryStats(true)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Timer recovery failed:', error)
      timerRecoveryService.updateRecoveryStats(false)
      return false
    }
  }, [dispatch])

  /**
   * 타이머 상태 저장
   */
  const saveState = useCallback((state: TimerState & { lastStartTime?: number }) => {
    timerRecoveryService.saveTimerState(state)
  }, [])

  /**
   * 저장된 상태 삭제
   */
  const clearSavedState = useCallback(() => {
    timerRecoveryService.clearAllSavedStates()
  }, [])

  /**
   * 복구 통계 가져오기
   */
  const getRecoveryStats = useCallback(() => {
    return timerRecoveryService.getRecoveryStats()
  }, [])

  /**
   * 백그라운드 타이머 검증
   */
  const validateBackgroundTimer = useCallback((expectedRemaining: number, actualElapsed: number) => {
    return timerRecoveryService.validateBackgroundTimer(expectedRemaining, actualElapsed)
  }, [])

  /**
   * 페이지 가시성 상태 확인
   */
  const isPageVisible = useCallback(() => {
    return !document.hidden
  }, [])

  /**
   * 페이지 가시성 변경 이벤트 리스너
   */
  const onVisibilityChange = useCallback((callback: (isVisible: boolean) => void) => {
    const handler = () => {
      callback(!document.hidden)
    }

    document.addEventListener('visibilitychange', handler)
    
    return () => {
      document.removeEventListener('visibilitychange', handler)
    }
  }, [])

  /**
   * 페이지 언로드 전 경고 설정
   */
  const setUnloadWarning = useCallback((enabled: boolean, message?: string) => {
    const handler = (event: BeforeUnloadEvent) => {
      if (enabled) {
        const warningMessage = message || '타이머가 실행 중입니다. 페이지를 떠나시겠습니까?'
        event.returnValue = warningMessage
        return warningMessage
      }
    }

    if (enabled) {
      window.addEventListener('beforeunload', handler)
    } else {
      window.removeEventListener('beforeunload', handler)
    }

    return () => {
      window.removeEventListener('beforeunload', handler)
    }
  }, [])

  /**
   * 타이머 복구 상태 확인
   */
  const checkRecoveryHealth = useCallback(() => {
    const stats = getRecoveryStats()
    const totalAttempts = stats.recoveryCount + stats.failureCount
    const successRate = totalAttempts > 0 ? (stats.recoveryCount / totalAttempts) * 100 : 100

    return {
      isHealthy: successRate >= 80, // 80% 이상 성공률
      successRate,
      totalAttempts,
      lastRecoveryTime: stats.lastRecoveryTime,
    }
  }, [getRecoveryStats])

  /**
   * 자동 복구 설정
   */
  useEffect(() => {
    // 페이지 로드 시 자동 복구 시도
    const timer = setTimeout(() => {
      attemptRecovery()
    }, 100)

    return () => {
      clearTimeout(timer)
    }
  }, [attemptRecovery])

  /**
   * 정리 작업
   */
  useEffect(() => {
    return () => {
      timerRecoveryService.cleanup()
    }
  }, [])

  return {
    // 복구 관련
    attemptRecovery,
    saveState,
    clearSavedState,
    getRecoveryStats,
    checkRecoveryHealth,
    
    // 백그라운드 처리
    validateBackgroundTimer,
    isPageVisible,
    onVisibilityChange,
    setUnloadWarning,
  }
}

/**
 * 타이머 복구 상태를 모니터링하는 훅
 */
export const useTimerRecoveryMonitor = () => {
  const { getRecoveryStats, checkRecoveryHealth } = useTimerRecovery()

  useEffect(() => {
    // 주기적으로 복구 상태 확인 (5분마다)
    const interval = setInterval(() => {
      const health = checkRecoveryHealth()
      
      if (!health.isHealthy) {
        console.warn('Timer recovery health is poor:', health)
        
        // 필요시 사용자에게 알림 또는 자동 복구 시도
        // 이 부분은 실제 요구사항에 따라 구현
      }
    }, 5 * 60 * 1000)

    return () => {
      clearInterval(interval)
    }
  }, [checkRecoveryHealth])

  return {
    getRecoveryStats,
    checkRecoveryHealth,
  }
}