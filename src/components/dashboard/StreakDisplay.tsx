import React from 'react'
import Card from '../ui/Card'
import { motion } from 'framer-motion'

interface StreakDisplayProps {
  currentStreak: number
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({
  currentStreak
}) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">연속 달성</h3>
        <div className="text-2xl">🔥</div>
      </div>
      
      <div className="text-center">
        <motion.div
          className="text-3xl font-bold text-orange-600 mb-2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          {currentStreak}일
        </motion.div>
        
        <p className="text-sm text-gray-600">
          {currentStreak === 0 && '오늘부터 시작해보세요!'}
          {currentStreak > 0 && currentStreak < 3 && '좋은 시작이에요!'}
          {currentStreak >= 3 && currentStreak < 7 && '훌륭한 습관이에요!'}
          {currentStreak >= 7 && '정말 대단해요! 🎉'}
        </p>
      </div>
    </Card>
  )
}

export default StreakDisplay