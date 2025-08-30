import React from 'react'
import Card from '../ui/Card'
import { motion } from 'framer-motion'

interface TodayTasksSummaryProps {
  totalTasks: number
  completedTasks: number
  completionRate: number
}

const TodayTasksSummary: React.FC<TodayTasksSummaryProps> = ({
  totalTasks,
  completedTasks,
  completionRate
}) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">오늘의 작업</h3>
        <div className="text-2xl">✅</div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">완료</span>
          <span className="text-lg font-bold text-green-600">
            {completedTasks}/{totalTasks}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">완료율</span>
          <span className="text-lg font-bold text-blue-600">
            {completionRate}%
          </span>
        </div>
      </div>
      
      <motion.div 
        className="mt-4 bg-gray-200 rounded-full h-2"
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="bg-green-500 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${completionRate}%` }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </motion.div>
    </Card>
  )
}

export default TodayTasksSummary