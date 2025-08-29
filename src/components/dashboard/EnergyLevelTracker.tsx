import React, { useState } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useAppDispatch } from '../../store/store'
import { setEnergyLevel } from '../../store/userSlice'

interface EnergyLevelTrackerProps {
  currentLevel: 'low' | 'medium' | 'high'
}

const EnergyLevelTracker: React.FC<EnergyLevelTrackerProps> = ({
  currentLevel
}) => {
  const dispatch = useAppDispatch()
  const [isEditing, setIsEditing] = useState(false)

  const energyLevels = [
    {
      level: 'low' as const,
      label: '낮음',
      icon: '😴',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      description: '피곤하고 집중하기 어려워요'
    },
    {
      level: 'medium' as const,
      label: '보통',
      icon: '😊',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: '적당한 에너지 상태예요'
    },
    {
      level: 'high' as const,
      label: '높음',
      icon: '🚀',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: '활기차고 집중력이 좋아요'
    }
  ]

  const currentEnergyInfo = energyLevels.find(e => e.level === currentLevel)!

  const handleEnergyChange = (newLevel: 'low' | 'medium' | 'high') => {
    dispatch(setEnergyLevel(newLevel))
    setIsEditing(false)
  }

  const getRecommendation = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high':
        return "어려운 작업이나 중요한 업무에 도전해보세요!"
      case 'medium':
        return "일반적인 작업들을 차근차근 진행해보세요."
      case 'low':
        return "간단한 작업이나 정리 업무부터 시작해보세요."
    }
  }

  return (
    <Card className={`p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          에너지 레벨
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          className="text-purple-600 hover:text-purple-700"
        >
          {isEditing ? '취소' : '변경'}
        </Button>
      </div>
      
      {!isEditing ? (
        <div className="space-y-3">
          {/* 현재 에너지 레벨 */}
          <div className="flex items-center space-x-3">
            <span className="text-3xl">
              {currentEnergyInfo.icon}
            </span>
            <div>
              <div className={`text-xl font-bold ${currentEnergyInfo.color}`}>
                {currentEnergyInfo.label}
              </div>
              <div className="text-xs text-gray-600">
                {currentEnergyInfo.description}
              </div>
            </div>
          </div>
          
          {/* 추천 메시지 */}
          <div className="mt-4 p-3 bg-purple-100 rounded-lg">
            <div className="text-sm text-purple-800 font-medium mb-1">
              💡 추천 활동
            </div>
            <div className="text-xs text-purple-700">
              {getRecommendation(currentLevel)}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-gray-600 mb-3">
            현재 에너지 상태를 선택해주세요:
          </div>
          
          {energyLevels.map((energy) => (
            <button
              key={energy.level}
              onClick={() => handleEnergyChange(energy.level)}
              className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                currentLevel === energy.level
                  ? `${energy.bgColor} border-current ${energy.color}`
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">
                  {energy.icon}
                </span>
                <div>
                  <div className={`font-medium ${
                    currentLevel === energy.level ? energy.color : 'text-gray-900'
                  }`}>
                    {energy.label}
                  </div>
                  <div className="text-xs text-gray-600">
                    {energy.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}

export default EnergyLevelTracker