import { useState, useCallback } from 'react'
import { useAppSelector, useAppDispatch } from '../store/store'
import { selectCurrentUser, selectFocusMode } from '../store/selectors'
import { MindfulnessActivity } from '../components/focus/MindfulnessActivities'

interface MindfulnessSession {
  activityId: string
  activityType: MindfulnessActivity['type']
  startTime: Date
  duration: number // seconds actually completed
  completed: boolean
}

interface UseMindfulnessReturn {
  isVisible: boolean
  showMindfulness: () => void
  hideMindfulness: () => void
  completeMindfulnessActivity: (activityId: string, duration: number) => void
  shouldSuggestMindfulness: boolean
  lastMindfulnessTime: Date | null
}

export const useMindfulness = (): UseMindfulnessReturn => {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectCurrentUser)
  const focusMode = useAppSelector(selectFocusMode)
  
  const [isVisible, setIsVisible] = useState(false)
  const [sessions, setSessions] = useState<MindfulnessSession[]>([])
  const [lastMindfulnessTime, setLastMindfulnessTime] = useState<Date | null>(null)

  // 마인드풀니스 활동 표시
  const showMindfulness = useCallback(() => {
    setIsVisible(true)
  }, [])

  // 마인드풀니스 활동 숨김
  const hideMindfulness = useCallback(() => {
    setIsVisible(false)
  }, [])

  // 마인드풀니스 활동 완료 처리
  const completeMindfulnessActivity = useCallback((activityId: string, duration: number) => {
    const now = new Date()
    
    // 세션 기록
    const session: MindfulnessSession = {
      activityId,
      activityType: getActivityType(activityId),
      startTime: new Date(now.getTime() - duration * 1000),
      duration,
      completed: true,
    }

    setSessions(prev => [...prev, session])
    setLastMindfulnessTime(now)
    setIsVisible(false)

    // 분석 데이터에 저장 (추후 구현)
    console.log('Mindfulness session completed:', session)

    // 로컬 스토리지에 저장
    try {
      const savedSessions = JSON.parse(localStorage.getItem('mindfulness_sessions') || '[]')
      savedSessions.push({
        ...session,
        startTime: session.startTime.toISOString(),
      })
      localStorage.setItem('mindfulness_sessions', JSON.stringify(savedSessions))
    } catch (error) {
      console.error('Failed to save mindfulness session:', error)
    }
  }, [])

  // 마인드풀니스 제안 여부 결정
  const shouldSuggestMindfulness = (() => {
    if (!focusMode || !user?.settings.focusMode.showBreathingReminders) {
      return false
    }

    // 마지막 마인드풀니스 활동 이후 30분이 지났는지 확인
    if (lastMindfulnessTime) {
      const timeSinceLastActivity = (new Date().getTime() - lastMindfulnessTime.getTime()) / (1000 * 60)
      return timeSinceLastActivity >= 30
    }

    // 첫 번째 세션이거나 오늘 아직 마인드풀니스를 하지 않았다면 제안
    const today = new Date().toDateString()
    const todaySessions = sessions.filter(session => 
      session.startTime.toDateString() === today && session.completed
    )
    
    return todaySessions.length === 0
  })()

  return {
    isVisible,
    showMindfulness,
    hideMindfulness,
    completeMindfulnessActivity,
    shouldSuggestMindfulness,
    lastMindfulnessTime,
  }
}

// 활동 ID로부터 타입 추출
function getActivityType(activityId: string): MindfulnessActivity['type'] {
  if (activityId.includes('breathing')) return 'breathing'
  if (activityId.includes('stretch')) return 'stretching'
  if (activityId.includes('meditation')) return 'meditation'
  if (activityId.includes('grounding') || activityId.includes('senses')) return 'grounding'
  return 'breathing' // 기본값
}

export default useMindfulness