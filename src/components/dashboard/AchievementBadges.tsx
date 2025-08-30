import React from 'react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import { motion } from 'framer-motion'

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt: Date
}

interface AchievementBadgesProps {
  recentAchievements: Achievement[]
  totalPoints: number
  level: number
}

const AchievementBadges: React.FC<AchievementBadgesProps> = ({
  recentAchievements,
  totalPoints,
  level
}) => {
  // 샘플 성취 데이터
  const sampleAchievements: Achievement[] = [
    {
      id: '1',
      title: '첫 포모도로',
      description: '첫 번째 포모도로를 완료했습니다!',
      icon: '🍅',
      unlockedAt: new Date()
    },
    {
      id: '2',
      title: '연속 3일',
      description: '3일 연속으로 목표를 달성했습니다!',
      icon: '🔥',
      unlockedAt: new Date()
    },
    {
      id: '3',
      title: '집중 마스터',
      description: '총 10시간 집중했습니다!',
      icon: '🎯',
      unlockedAt: new Date()
    }
  ]

  const achievements = recentAchievements.length > 0 ? recentAchievements : sampleAchievements

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">성취 & 레벨</h3>
        <div className="text-2xl">🏆</div>
      </div>
      
      {/* 레벨 정보 */}
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">현재 레벨</span>
          <span className="text-lg font-bold text-purple-600">Lv.{level}</span>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">포인트</span>
          <span className="text-sm font-bold text-blue-600">{totalPoints}P</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(totalPoints % 1000) / 10}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        
        <div className="text-xs text-gray-500 mt-1 text-center">
          다음 레벨까지 {1000 - (totalPoints % 1000)}P
        </div>
      </div>
      
      {/* 최근 성취 */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">최근 성취</h4>
        
        {achievements.slice(0, 3).map((achievement, index) => (
          <motion.div
            key={achievement.id}
            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="text-2xl">{achievement.icon}</div>
            
            <div className="flex-1 min-w-0">
              <h5 className="font-medium text-gray-900 truncate">
                {achievement.title}
              </h5>
              <p className="text-sm text-gray-600 truncate">
                {achievement.description}
              </p>
            </div>
            
            <Badge variant="success" size="sm">
              NEW
            </Badge>
          </motion.div>
        ))}
      </div>
      
      {achievements.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-gray-600">
            첫 번째 성취를 달성해보세요!
          </p>
        </div>
      )}
    </Card>
  )
}

export default AchievementBadges