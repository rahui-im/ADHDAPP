import { useState, useCallback, useEffect } from 'react'
import { useAppSelector } from '../store/store'
import { 
  selectTodayPomodoros, 
  selectCurrentStreak, 
  selectCompletedTasks,
  selectTodayTasks 
} from '../store/selectors'
import { Achievement } from '../components/dashboard/AchievementFeedback'
import { AchievementService } from '../services/achievementService'

interface UseAchievementsReturn {
  currentAchievement: Achievement | null
  recentAchievements: Achievement[]
  totalPoints: number
  level: { level: number; title: string; nextLevelPoints: number }
  showAchievement: (achievement: Achievement) => void
  dismissAchievement: () => void
  triggerTaskCompletion: (taskTitle: string) => void
  triggerPomodoroCompletion: () => void
  triggerStreakMilestone: (days: number) => void
  triggerDailyGoal: (completionRate: number) => void
  triggerFocusTime: (minutes: number) => void
}

export const useAchievements = (): UseAchievementsReturn => {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null)
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([])
  const [totalPoints, setTotalPoints] = useState(0)

  // Redux 상태에서 현재 데이터 가져오기
  const todayPomodoros = useAppSelector(selectTodayPomodoros)
  const currentStreak = useAppSelector(selectCurrentStreak)
  const completedTasks = useAppSelector(selectCompletedTasks)
  const todayTasks = useAppSelector(selectTodayTasks)

  // 로컬 스토리지에서 성취 데이터 로드
  useEffect(() => {
    const savedAchievements = localStorage.getItem('achievements')
    const savedPoints = localStorage.getItem('totalPoints')
    
    if (savedAchievements) {
      try {
        const achievements = JSON.parse(savedAchievements).map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp)
        }))
        setRecentAchievements(achievements)
      } catch (error) {
        console.error('Failed to load achievements:', error)
      }
    }
    
    if (savedPoints) {
      setTotalPoints(parseInt(savedPoints, 10))
    }
  }, [])

  // 성취 데이터를 로컬 스토리지에 저장
  const saveAchievements = useCallback((achievements: Achievement[], points: number) => {
    localStorage.setItem('achievements', JSON.stringify(achievements))
    localStorage.setItem('totalPoints', points.toString())
  }, [])

  // 레벨 계산
  const level = AchievementService.calculateLevel(totalPoints)

  // 성취 표시
  const showAchievement = useCallback((achievement: Achievement) => {
    setCurrentAchievement(achievement)
    
    // 최근 성취 목록에 추가 (최대 50개 유지)
    setRecentAchievements(prev => {
      const updated = [achievement, ...prev].slice(0, 50)
      const newTotalPoints = totalPoints + achievement.points
      setTotalPoints(newTotalPoints)
      saveAchievements(updated, newTotalPoints)
      return updated
    })
  }, [totalPoints, saveAchievements])

  // 성취 닫기
  const dismissAchievement = useCallback(() => {
    setCurrentAchievement(null)
  }, [])

  // 작업 완료 트리거
  const triggerTaskCompletion = useCallback((taskTitle: string) => {
    const achievement = AchievementService.createTaskCompletionAchievement(taskTitle)
    
    // 첫 번째 작업인 경우 특별 성취
    if (completedTasks.length === 0) {
      const firstTaskAchievement = AchievementService.createSpecialAchievement('first_task')
      showAchievement(firstTaskAchievement)
      setTimeout(() => {
        showAchievement(achievement)
      }, 3000)
    } else {
      showAchievement(achievement)
    }
  }, [completedTasks.length, showAchievement])

  // 포모도로 완료 트리거
  const triggerPomodoroCompletion = useCallback(() => {
    const achievement = AchievementService.createPomodoroCompletionAchievement(todayPomodoros + 1)
    showAchievement(achievement)
  }, [todayPomodoros, showAchievement])

  // 연속 달성 마일스톤 트리거
  const triggerStreakMilestone = useCallback((days: number) => {
    const achievement = AchievementService.createStreakMilestoneAchievement(days)
    if (achievement) {
      showAchievement(achievement)
    }
  }, [showAchievement])

  // 일일 목표 달성 트리거
  const triggerDailyGoal = useCallback((completionRate: number) => {
    const achievement = AchievementService.createDailyGoalAchievement(completionRate)
    if (achievement) {
      showAchievement(achievement)
    }
  }, [showAchievement])

  // 집중 시간 목표 달성 트리거
  const triggerFocusTime = useCallback((minutes: number) => {
    const achievement = AchievementService.createFocusTimeAchievement(minutes)
    if (achievement) {
      showAchievement(achievement)
    }
  }, [showAchievement])

  // 자동 트리거 (일일 목표 체크)
  useEffect(() => {
    if (todayTasks.length > 0) {
      const completedCount = todayTasks.filter(task => task.status === 'completed').length
      const completionRate = Math.round((completedCount / todayTasks.length) * 100)
      
      // 하루 종료 시간 체크 (23시)
      const now = new Date()
      if (now.getHours() === 23 && completionRate >= 80) {
        // 이미 오늘 일일 목표 성취를 받았는지 체크
        const today = now.toDateString()
        const todayDailyGoalAchievement = recentAchievements.find(
          a => a.type === 'daily_goal' && a.timestamp.toDateString() === today
        )
        
        if (!todayDailyGoalAchievement) {
          triggerDailyGoal(completionRate)
        }
      }
    }
  }, [todayTasks, recentAchievements, triggerDailyGoal])

  // 자동 트리거 (집중 시간 체크)
  useEffect(() => {
    const focusMinutes = todayPomodoros * 25 // 포모도로당 25분 가정
    const milestones = [60, 120, 180, 240]
    
    for (const milestone of milestones) {
      if (focusMinutes >= milestone) {
        // 이미 해당 마일스톤 성취를 받았는지 체크
        const today = new Date().toDateString()
        const existingAchievement = recentAchievements.find(
          a => a.type === 'focus_time' && 
               a.timestamp.toDateString() === today &&
               a.description.includes(`${milestone / 60}시간`)
        )
        
        if (!existingAchievement) {
          triggerFocusTime(milestone)
          break // 하나씩만 트리거
        }
      }
    }
  }, [todayPomodoros, recentAchievements, triggerFocusTime])

  return {
    currentAchievement,
    recentAchievements,
    totalPoints,
    level,
    showAchievement,
    dismissAchievement,
    triggerTaskCompletion,
    triggerPomodoroCompletion,
    triggerStreakMilestone,
    triggerDailyGoal,
    triggerFocusTime
  }
}