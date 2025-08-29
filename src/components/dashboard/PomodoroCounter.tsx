import React from 'react'
import { Card } from '../ui/Card'

interface PomodoroCounterProps {
  completedPomodoros: number
  totalFocusTime: number
}

const PomodoroCounter: React.FC<PomodoroCounterProps> = ({
  completedPomodoros,
  totalFocusTime
}) => {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}시간 ${mins}분`
    }
    return `${mins}분`
  }

  const getPomodoroIcon = (count: number) => {
    if (count >= 8) return '🔥'
    if (count >= 6) return '⭐'
    if (count >= 4) return '🎯'
    if (count >= 2) return '🍅'
    return '⏰'
  }

  const getMotivationMessage = (count: number) => {
    if (count >= 8) return "대단해요! 집중력 마스터 🔥"
    if (count >= 6) return "훌륭한 집중력이에요! ⭐"
    if (count >= 4) return "좋은 페이스네요! 🎯"
    if (count >= 2) return "좋은 시작이에요! 🍅"
    if (count >= 1) return "첫 포모도로 완료! 👏"
    return "첫 포모도로를 시작해보세요!"
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          포모도로
        </h3>
        <span className="text-2xl">
          {getPomodoroIcon(completedPomodoros)}
        </span>
      </div>
      
      <div className="space-y-3">
        {/* 완료된 포모도로 수 */}
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold text-gray-900">
            {completedPomodoros}
          </span>
          <span className="text-lg text-gray-500">
            개 완료
          </span>
        </div>
        
        {/* 총 집중 시간 */}
        <div className="text-sm font-medium text-red-600">
          총 {formatTime(totalFocusTime)} 집중
        </div>
        
        {/* 동기부여 메시지 */}
        <div className="text-xs text-gray-600">
          {getMotivationMessage(completedPomodoros)}
        </div>
        
        {/* 목표 대비 진행률 (하루 목표: 6개 포모도로) */}
        {completedPomodoros > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>일일 목표</span>
              <span>{completedPomodoros}/6</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((completedPomodoros / 6) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

export default PomodoroCounter