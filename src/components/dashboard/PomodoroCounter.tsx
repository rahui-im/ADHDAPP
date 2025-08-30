import React from 'react'
import Card from '../ui/Card'
import { motion } from 'framer-motion'

interface PomodoroCounterProps {
  completedPomodoros: number
  totalFocusTime: number
}

const PomodoroCounter: React.FC<PomodoroCounterProps> = ({
  completedPomodoros,
  totalFocusTime
}) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">포모도로</h3>
        <div className="text-2xl">🍅</div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">완료</span>
          <span className="text-lg font-bold text-red-600">
            {completedPomodoros}개
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">집중 시간</span>
          <span className="text-lg font-bold text-purple-600">
            {Math.floor(totalFocusTime / 60)}h {totalFocusTime % 60}m
          </span>
        </div>
      </div>
      
      <motion.div 
        className="mt-4 flex space-x-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {Array.from({ length: Math.min(completedPomodoros, 8) }).map((_, index) => (
          <motion.div
            key={index}
            className="w-3 h-3 bg-red-500 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          />
        ))}
        {completedPomodoros > 8 && (
          <span className="text-sm text-gray-500 ml-2">+{completedPomodoros - 8}</span>
        )}
      </motion.div>
    </Card>
  )
}

export default PomodoroCounter