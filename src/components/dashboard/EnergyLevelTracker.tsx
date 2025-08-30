import React from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { motion } from 'framer-motion'

interface EnergyLevelTrackerProps {
  currentLevel: 'low' | 'medium' | 'high'
}

const EnergyLevelTracker: React.FC<EnergyLevelTrackerProps> = ({
  currentLevel
}) => {
  const levelConfig = {
    low: { emoji: '😴', label: '낮음', color: 'text-blue-500', bg: 'bg-blue-100' },
    medium: { emoji: '😐', label: '보통', color: 'text-yellow-500', bg: 'bg-yellow-100' },
    high: { emoji: '😄', label: '높음', color: 'text-green-500', bg: 'bg-green-100' }
  }

  const config = levelConfig[currentLevel]

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">에너지 레벨</h3>
        <div className="text-2xl">⚡</div>
      </div>
      
      <div className="text-center">
        <motion.div
          className={`text-4xl mb-2 ${config.bg} rounded-full w-16 h-16 flex items-center justify-center mx-auto`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          {config.emoji}
        </motion.div>
        
        <div className={`text-lg font-bold ${config.color} mb-2`}>
          {config.label}
        </div>
        
        <p className="text-sm text-gray-600">
          {currentLevel === 'low' && '간단한 작업부터 시작해보세요'}
          {currentLevel === 'medium' && '적당한 난이도의 작업이 좋겠어요'}
          {currentLevel === 'high' && '도전적인 작업도 할 수 있어요!'}
        </p>
      </div>
      
      <Button 
        variant="secondary" 
        size="sm" 
        className="w-full mt-4"
        onClick={() => {
          console.log('에너지 레벨 변경')
          alert('에너지 레벨을 변경합니다!')
        }}
      >
        변경하기
      </Button>
    </Card>
  )
}

export default EnergyLevelTracker