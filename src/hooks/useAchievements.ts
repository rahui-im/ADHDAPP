import { useState, useEffect } from 'react'

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  points: number
  unlockedAt: Date
}

interface UseAchievementsReturn {
  currentAchievement: Achievement | null
  recentAchievements: Achievement[]
  totalPoints: number
  level: number
  dismissAchievement: () => void
}

export const useAchievements = (): UseAchievementsReturn => {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null)
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([])
  const [totalPoints, setTotalPoints] = useState(0)

  // 레벨 계산 (1000포인트당 1레벨)
  const level = Math.floor(totalPoints / 1000) + 1

  // 샘플 성취 데이터
  useEffect(() => {
    const sampleAchievements: Achievement[] = [
      {
        id: '1',
        title: '첫 포모도로',
        description: '첫 번째 포모도로를 완료했습니다!',
        icon: '🍅',
        points: 100,
        unlockedAt: new Date()
      },
      {
        id: '2',
        title: '연속 3일',
        description: '3일 연속으로 목표를 달성했습니다!',
        icon: '🔥',
        points: 300,
        unlockedAt: new Date()
      },
      {
        id: '3',
        title: '집중 마스터',
        description: '총 10시간 집중했습니다!',
        icon: '🎯',
        points: 500,
        unlockedAt: new Date()
      }
    ]

    setRecentAchievements(sampleAchievements)
    setTotalPoints(sampleAchievements.reduce((sum, achievement) => sum + achievement.points, 0))
  }, [])

  const dismissAchievement = () => {
    setCurrentAchievement(null)
  }

  return {
    currentAchievement,
    recentAchievements,
    totalPoints,
    level,
    dismissAchievement
  }
}