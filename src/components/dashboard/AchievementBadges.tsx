import React from 'react'
import { Card } from '../ui/Card'
import { Achievement } from './AchievementFeedback'

interface AchievementBadgesProps {
  recentAchievements: Achievement[]
  totalPoints: number
  level: { level: number; title: string; nextLevelPoints: number }
}

const AchievementBadges: React.FC<AchievementBadgesProps> = ({
  recentAchievements,
  totalPoints,
  level
}) => {
  const getTypeIcon = (type: Achievement['type']) => {
    switch (type) {
      case 'task_completed': return '✅'
      case 'pomodoro_completed': return '🍅'
      case 'streak_milestone': return '🔥'
      case 'daily_goal': return '🎯'
      case 'focus_time': return '⏰'
      default: return '🌟'
    }
  }

  const getTypeColor = (type: Achievement['type']) => {
    switch (type) {
      case 'task_completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'pomodoro_completed': return 'bg-red-100 text-red-800 border-red-200'
      case 'streak_milestone': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'daily_goal': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'focus_time': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getLevelColor = (levelNum: number) => {
    if (levelNum >= 8) return 'from-purple-400 to-purple-600'
    if (levelNum >= 6) return 'from-yellow-400 to-yellow-600'
    if (levelNum >= 4) return 'from-blue-400 to-blue-600'
    if (levelNum >= 2) return 'from-green-400 to-green-600'
    return 'from-gray-400 to-gray-600'
  }

  const getLevelIcon = (levelNum: number) => {
    if (levelNum >= 8) return '👑'
    if (levelNum >= 6) return '🏆'
    if (levelNum >= 4) return '⭐'
    if (levelNum >= 2) return '🌟'
    return '🌱'
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        성취 및 레벨
      </h3>

      {/* 현재 레벨 */}
      <div className={`bg-gradient-to-r ${getLevelColor(level.level)} rounded-lg p-4 mb-6 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{getLevelIcon(level.level)}</span>
            <div>
              <div className="text-xl font-bold">
                레벨 {level.level}
              </div>
              <div className="text-sm opacity-90">
                {level.title}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">
              {totalPoints.toLocaleString()}
            </div>
            <div className="text-xs opacity-90">
              포인트
            </div>
          </div>
        </div>
        
        {/* 다음 레벨까지 진행률 */}
        {level.nextLevelPoints !== Infinity && (
          <div className="mt-3">
            <div className="flex justify-between text-sm opacity-90 mb-1">
              <span>다음 레벨까지</span>
              <span>{level.nextLevelPoints.toLocaleString()} 포인트 남음</span>
            </div>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.max(10, 100 - (level.nextLevelPoints / (level.nextLevelPoints + 100)) * 100)}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 최근 성취들 */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">
          최근 성취 ({recentAchievements.length}개)
        </h4>
        
        {recentAchievements.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-sm">
              첫 번째 성취를 달성해보세요!
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="text-2xl">
                  {achievement.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {achievement.title}
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {achievement.description}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(achievement.type)}`}>
                      {getTypeIcon(achievement.type)} {achievement.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      +{achievement.points}p
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {achievement.timestamp.toLocaleDateString('ko-KR', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 성취 통계 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {recentAchievements.filter(a => a.type === 'task_completed').length}
            </div>
            <div className="text-xs text-gray-600">
              완료한 작업
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {recentAchievements.filter(a => a.type === 'pomodoro_completed').length}
            </div>
            <div className="text-xs text-gray-600">
              포모도로
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default AchievementBadges