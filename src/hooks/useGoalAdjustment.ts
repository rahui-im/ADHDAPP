import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { generateGoalAdjustment, acceptGoalAdjustment, declineGoalAdjustment } from '../store/taskSlice'
import { DailyStats, Task } from '../types'

export const useGoalAdjustment = () => {
  const dispatch = useDispatch()
  const { tasks, goalAdjustment, loading } = useSelector((state: RootState) => state.tasks)
  const { dailyStats } = useSelector((state: RootState) => state.analytics)
  
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 완료율 계산
  const calculateTodayStats = (): DailyStats => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt)
      taskDate.setHours(0, 0, 0, 0)
      return taskDate.getTime() === today.getTime()
    })
    
    const completedTasks = todayTasks.filter(task => task.status === 'completed')
    const totalFocusMinutes = completedTasks.reduce((sum, task) => sum + task.estimatedDuration, 0)
    
    return {
      date: today,
      tasksCompleted: completedTasks.length,
      tasksPlanned: todayTasks.length,
      focusMinutes: totalFocusMinutes,
      breakMinutes: 0, // 실제 구현에서는 타이머 데이터에서 가져와야 함
      pomodorosCompleted: Math.floor(totalFocusMinutes / 25),
      averageEnergyLevel: 3, // 실제 구현에서는 사용자 입력 데이터에서 가져와야 함
      distractions: []
    }
  }

  // 최근 통계 가져오기 (실제로는 analytics 서비스에서)
  const getRecentStats = (): DailyStats[] => {
    // 임시 데이터 - 실제로는 저장된 통계에서 가져와야 함
    const recentDays = 7
    const stats: DailyStats[] = []
    
    for (let i = 1; i <= recentDays; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      // 임시 완료율 데이터 (실제로는 저장된 데이터에서)
      const mockCompletionRate = 0.3 + Math.random() * 0.4 // 30-70%
      const mockPlannedTasks = 5 + Math.floor(Math.random() * 3) // 5-7개
      const mockCompletedTasks = Math.floor(mockPlannedTasks * mockCompletionRate)
      
      stats.push({
        date,
        tasksCompleted: mockCompletedTasks,
        tasksPlanned: mockPlannedTasks,
        focusMinutes: mockCompletedTasks * 25,
        breakMinutes: 0,
        pomodorosCompleted: mockCompletedTasks,
        averageEnergyLevel: 2 + Math.floor(Math.random() * 2),
        distractions: []
      })
    }
    
    return stats
  }

  // 하루 종료 시 완료율 체크 및 목표 조정 제안
  const checkAndSuggestAdjustment = () => {
    const todayStats = calculateTodayStats()
    const completionRate = todayStats.tasksCompleted / todayStats.tasksPlanned
    
    // 완료율이 50% 미만이고 계획된 작업이 있는 경우에만 조정 제안
    if (completionRate < 0.5 && todayStats.tasksPlanned > 0) {
      const tomorrowTasks = tasks.filter(t => t.status === 'pending')
      const recentStats = getRecentStats()
      
      if (tomorrowTasks.length > 0) {
        dispatch(generateGoalAdjustment({
          todayStats,
          tomorrowTasks,
          recentStats
        }) as any)
      }
    }
  }

  // 목표 조정 제안이 생성되면 모달 열기
  useEffect(() => {
    if (goalAdjustment && !isModalOpen) {
      setIsModalOpen(true)
    }
  }, [goalAdjustment, isModalOpen])

  // 목표 조정 수락
  const handleAcceptAdjustment = (suggestedTasks: Task[]) => {
    dispatch(acceptGoalAdjustment(suggestedTasks))
    setIsModalOpen(false)
  }

  // 목표 조정 거절
  const handleDeclineAdjustment = () => {
    dispatch(declineGoalAdjustment())
    setIsModalOpen(false)
  }

  // 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false)
    if (goalAdjustment) {
      dispatch(declineGoalAdjustment())
    }
  }

  // 수동으로 완료율 체크 트리거
  const triggerCompletionCheck = () => {
    checkAndSuggestAdjustment()
  }

  // 하루 종료 시간 체크 (예: 오후 10시)
  useEffect(() => {
    const checkEndOfDay = () => {
      const now = new Date()
      const endOfDayHour = 22 // 오후 10시
      
      if (now.getHours() === endOfDayHour && now.getMinutes() === 0) {
        checkAndSuggestAdjustment()
      }
    }

    // 매분마다 체크 (실제로는 더 효율적인 방법 사용 권장)
    const interval = setInterval(checkEndOfDay, 60000)
    
    return () => clearInterval(interval)
  }, [tasks])

  return {
    goalAdjustment,
    isModalOpen,
    loading,
    handleAcceptAdjustment,
    handleDeclineAdjustment,
    handleCloseModal,
    triggerCompletionCheck,
    todayStats: calculateTodayStats()
  }
}