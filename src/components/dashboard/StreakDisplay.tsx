import React from 'react'
import { Card } from '../ui/Card'

interface StreakDisplayProps {
  currentStreak: number
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({
  currentStreak
}) => {
  const getStreakIcon = (streak: number) => {
    if (streak >= 30) return '👑'
    if (streak >= 21) return '🏆'
    if (streak >= 14) return '🔥'
    if (streak >= 7) return '⚡'
    if (streak >= 3) return '🌟'
    if (streak >= 1) return '✨'
    return '🎯'
  }

  const getStreakLevel = (streak: number) => {
    if (streak >= 30) return { level: '전설', color: 'text-purple-600' }
    if (streak >= 21) return { level: '마스터', color: 'text-yellow-600' }
    if (streak >= 14) return { level: '고수', color: 'text-red-600' }
    if (streak >= 7) return { level: '숙련자', color: 'text-blue-600' }
    if (streak >= 3) return { level: '초보자', color: 'text-green-600' }
    if (streak >= 1) return { level: '시작', color: 'text-gray-600' }
    return { level: '준비', color: 'text-gray-500' }
  }

  const getMotivationMessage = (streak: number) => {
    if (streak >= 30) return "당신은 진정한 챔피언입니다! 👑"
    if (streak >= 21) return "3주 연속! 정말 대단해요! 🏆"
    if (streak >= 14) return "2주 연속! 불타는 의지네요! 🔥"
    if (streak >= 7) return "일주일 연속! 훌륭해요! ⚡"
    if (streak >= 3) return "3일 연속! 좋은 습관이에요! 🌟"
    if (streak >= 1) return "좋은 시작이에요! 계속해봐요! ✨"
    return "오늘부터 연속 기록을 시작해보세요!"
  }

  const streakInfo = getStreakLevel(currentStreak)

  // 다음 레벨까지 남은 일수 계산
  const getNextMilestone = (streak: number) => {
    if (streak < 3) return 3
    if (streak < 7) return 7
    if (streak < 14) return 14
    if (streak < 21) return 21
    if (streak < 30) return 30
    return null
  }

  const nextMilestone = getNextMilestone(currentStreak)
  const daysToNext = nextMilestone ? nextMilestone - currentStreak : 0

  return (
    <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          연속 달성
        </h3>
        <span className="text-2xl">
          {getStreakIcon(currentStreak)}
        </span>
      </div>
      
      <div className="space-y-3">
        {/* 현재 연속 일수 */}
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold text-gray-900">
            {currentStreak}
          </span>
          <span className="text-lg text-gray-500">
            일 연속
          </span>
        </div>
        
        {/* 레벨 표시 */}
        <div className={`text-sm font-medium ${streakInfo.color}`}>
          {streakInfo.level} 레벨
        </div>
        
        {/* 동기부여 메시지 */}
        <div className="text-xs text-gray-600">
          {getMotivationMessage(currentStreak)}
        </div>
        
        {/* 다음 목표까지 진행률 */}
        {nextMilestone && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>다음 목표</span>
              <span>{daysToNext}일 남음</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(currentStreak / nextMilestone) * 100}%` 
                }}
              />
            </div>
          </div>
        )}
        
        {/* 주간 목표 (7일) */}
        {currentStreak < 7 && (
          <div className="mt-2 p-2 bg-green-100 rounded-lg">
            <div className="text-xs text-green-700 font-medium">
              주간 목표: {currentStreak}/7일
            </div>
            <div className="w-full bg-green-200 rounded-full h-1 mt-1">
              <div 
                className="bg-green-600 h-1 rounded-full"
                style={{ width: `${(currentStreak / 7) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

export default StreakDisplay