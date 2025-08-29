import { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { notificationService, NotificationPermissionResult } from '../services/notificationService'
import { TimerState } from '../types'

export interface NotificationState {
  supported: boolean
  permission: NotificationPermission
  enabled: boolean
  requesting: boolean
}

export const useNotifications = () => {
  const [notificationState, setNotificationState] = useState<NotificationState>({
    supported: false,
    permission: 'default',
    enabled: false,
    requesting: false
  })

  const userPreferences = useSelector((state: RootState) => state.user.preferences)
  const timerState = useSelector((state: RootState) => state.timer)
  const currentTask = useSelector((state: RootState) => 
    state.tasks.tasks.find(task => task.id === state.timer.currentTaskId)
  )

  // 알림 상태 업데이트
  const updateNotificationState = useCallback(() => {
    const status = notificationService.getNotificationStatus()
    setNotificationState(prev => ({
      ...prev,
      supported: status.supported,
      permission: status.permission,
      enabled: status.enabled && userPreferences.notificationsEnabled
    }))
  }, [userPreferences.notificationsEnabled])

  // 알림 권한 요청
  const requestPermission = useCallback(async (): Promise<NotificationPermissionResult> => {
    setNotificationState(prev => ({ ...prev, requesting: true }))
    
    try {
      const result = await notificationService.requestPermission()
      updateNotificationState()
      return result
    } finally {
      setNotificationState(prev => ({ ...prev, requesting: false }))
    }
  }, [updateNotificationState])

  // 포모도로 완료 알림
  const notifyPomodoroComplete = useCallback(async () => {
    if (!notificationState.enabled) return
    
    await notificationService.notifyPomodoroComplete(
      timerState,
      currentTask?.title
    )
  }, [notificationState.enabled, timerState, currentTask])

  // 휴식 시간 완료 알림
  const notifyBreakComplete = useCallback(async (isLongBreak: boolean = false) => {
    if (!notificationState.enabled) return
    
    await notificationService.notifyBreakComplete(isLongBreak)
  }, [notificationState.enabled])

  // 긴 휴식 제안 알림
  const notifyLongBreakSuggestion = useCallback(async () => {
    if (!notificationState.enabled) return
    
    await notificationService.notifyLongBreakSuggestion(timerState.currentCycle)
  }, [notificationState.enabled, timerState.currentCycle])

  // 작업 완료 알림
  const notifyTaskComplete = useCallback(async (taskTitle: string, subtaskCount: number) => {
    if (!notificationState.enabled) return
    
    await notificationService.notifyTaskComplete(taskTitle, subtaskCount)
  }, [notificationState.enabled])

  // 집중력 회복 알림
  const notifyFocusReminder = useCallback(async (inactiveMinutes: number) => {
    if (!notificationState.enabled) return
    
    await notificationService.notifyFocusReminder(inactiveMinutes)
  }, [notificationState.enabled])

  // 일일 목표 달성 알림
  const notifyDailyGoalAchieved = useCallback(async (completed: number, total: number) => {
    if (!notificationState.enabled) return
    
    await notificationService.notifyDailyGoalAchieved(completed, total)
  }, [notificationState.enabled])

  // 연속 달성 기록 알림
  const notifyStreakAchievement = useCallback(async (streakDays: number) => {
    if (!notificationState.enabled) return
    
    await notificationService.notifyStreakAchievement(streakDays)
  }, [notificationState.enabled])

  // 에너지 레벨 체크 알림
  const notifyEnergyCheck = useCallback(async () => {
    if (!notificationState.enabled) return
    
    await notificationService.notifyEnergyCheck()
  }, [notificationState.enabled])

  // 모든 알림 제거
  const clearAllNotifications = useCallback(() => {
    notificationService.clearAllNotifications()
  }, [])

  // 컴포넌트 마운트 시 알림 상태 초기화
  useEffect(() => {
    updateNotificationState()
  }, [updateNotificationState])

  // 사용자 설정 변경 시 알림 상태 업데이트
  useEffect(() => {
    updateNotificationState()
  }, [userPreferences.notificationsEnabled, updateNotificationState])

  // 페이지 언로드 시 알림 정리
  useEffect(() => {
    const handleBeforeUnload = () => {
      clearAllNotifications()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      clearAllNotifications()
    }
  }, [clearAllNotifications])

  return {
    notificationState,
    requestPermission,
    notifyPomodoroComplete,
    notifyBreakComplete,
    notifyLongBreakSuggestion,
    notifyTaskComplete,
    notifyFocusReminder,
    notifyDailyGoalAchieved,
    notifyStreakAchievement,
    notifyEnergyCheck,
    clearAllNotifications
  }
}