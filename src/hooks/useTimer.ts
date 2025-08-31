import { useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store/store'
import {
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
  restoreTimerState,
  setInitialized,
} from '../store/timerSlice'
import { timerService } from '../services/timerService'
import { timerRecoveryService } from '../services/timerRecoveryService'
import { useNotifications } from './useNotifications'
import { TimerState } from '../types'

export const useTimer = () => {
  const dispatch = useDispatch()
  const timerState = useSelector((state: RootState) => state.timer)
  const { 
    notifyPomodoroComplete, 
    notifyBreakComplete, 
    notifyLongBreakSuggestion 
  } = useNotifications()

  // 타이머 초기화 (페이지 로드 시 상태 복구)
  useEffect(() => {
    if (!timerState.isInitialized) {
      const savedState = timerRecoveryService.restoreTimerState()
      if (savedState) {
        dispatch(restoreTimerState(savedState))
        timerRecoveryService.updateRecoveryStats(true)
      } else {
        dispatch(setInitialized(true))
      }
    }
  }, [dispatch, timerState.isInitialized])

  // 타이머 상태 저장 (상태 변경 시)
  useEffect(() => {
    if (timerState.isInitialized) {
      timerRecoveryService.saveTimerState({
        ...timerState,
        lastStartTime: timerState.isRunning ? Date.now() : undefined,
      })
    }
  }, [timerState])

  // 타이머 실행 관리
  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused) {
      const handleTick = (remaining: number) => {
        dispatch(updateRemaining(remaining))
      }

      const handleComplete = async () => {
        dispatch(completeTimer())
        
        // 완료 시 알림 처리
        if (timerState.mode === 'focus') {
          await notifyPomodoroComplete()
          
          // 긴 휴식 제안 확인
          if (timerState.currentCycle >= 3) {
            await notifyLongBreakSuggestion()
          }
        } else {
          const isLongBreak = timerState.mode === 'long-break'
          await notifyBreakComplete(isLongBreak)
        }
      }

      if (timerState.isPaused) {
        // 재시작
        timerService.resume(timerState.remaining, handleTick, handleComplete)
      } else {
        // 새로 시작
        timerService.start(timerState.remaining, handleTick, handleComplete)
      }
    } else {
      timerService.pause()
    }

    return () => {
      if (!timerState.isRunning) {
        timerService.stop()
      }
    }
  }, [dispatch, timerState.isRunning, timerState.isPaused])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      timerService.stop()
      timerRecoveryService.cleanup()
    }
  }, [])

  // 타이머 시작
  const start = useCallback((taskId?: string, duration?: number) => {
    dispatch(startTimer({ taskId, duration }))
  }, [dispatch])

  // 타이머 일시정지
  const pause = useCallback(() => {
    dispatch(pauseTimer())
  }, [dispatch])

  // 타이머 재시작
  const resume = useCallback(() => {
    dispatch(resumeTimer())
  }, [dispatch])

  // 타이머 정지
  const stop = useCallback(() => {
    dispatch(stopTimer())
    timerService.stop()
  }, [dispatch])

  // 타이머 리셋
  const reset = useCallback(() => {
    dispatch(resetTimer())
    timerService.stop()
    timerRecoveryService.clearAllSavedStates()
  }, [dispatch])

  // 모드 변경
  const changeMode = useCallback((mode: TimerState['mode']) => {
    dispatch(setMode(mode))
  }, [dispatch])

  // 집중 시간 설정
  const setFocusTime = useCallback((duration: 15 | 25 | 45) => {
    dispatch(setFocusDuration(duration))
  }, [dispatch])

  // 휴식 시간 설정
  const setBreakTime = useCallback((duration: 5 | 10 | 15) => {
    dispatch(setBreakDuration(duration))
  }, [dispatch])

  // 유틸리티 함수들
  const formatTime = useCallback((seconds: number) => {
    return timerService.formatTime(seconds)
  }, [])

  const getProgress = useCallback(() => {
    return timerService.calculateProgress(timerState.duration, timerState.remaining)
  }, [timerState.duration, timerState.remaining])

  const getTimeRemaining = useCallback(() => {
    return formatTime(timerState.remaining)
  }, [timerState.remaining, formatTime])

  const isActive = timerState.isRunning || timerState.isPaused

  return {
    // 상태
    ...timerState,
    isActive,
    
    // 액션
    start,
    pause,
    resume,
    stop,
    reset,
    changeMode,
    setFocusTime,
    setBreakTime,
    
    // 유틸리티
    formatTime,
    getProgress,
    getTimeRemaining,
  }
}