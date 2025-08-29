import React from 'react'
import { Card } from '../ui/Card'

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
  const getStatusColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-blue-600'
    if (rate >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusIcon = (rate: number) => {
    if (rate >= 80) return '🎉'
    if (rate >= 60) return '👍'
    if (rate >= 40) return '⚡'
    return '💪'
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          오늘의 작업
        </h3>
        <span className="text-2xl">
          {getStatusIcon(completionRate)}
        </span>
      </div>
      
      <div className="space-y-3">
        {/* 완료/전체 작업 수 */}
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold text-gray-900">
            {completedTasks}
          </span>
          <span className="text-lg text-gray-500">
            / {totalTasks}
          </span>
        </div>
        
        {/* 완료율 */}
        <div className={`text-sm font-medium ${getStatusColor(completionRate)}`}>
          {completionRate}% 완료
        </div>
        
        {/* 상태 메시지 */}
        <div className="text-xs text-gray-600">
          {totalTasks === 0 ? (
            "오늘의 첫 작업을 추가해보세요!"
          ) : completionRate >= 80 ? (
            "훌륭해요! 거의 다 끝났네요 🎯"
          ) : completionRate >= 60 ? (
            "좋은 진전이에요! 계속 화이팅 💪"
          ) : completionRate >= 40 ? (
            "절반 정도 왔어요. 조금만 더!"
          ) : (
            "천천히 시작해봐요. 괜찮아요 😊"
          )}
        </div>
      </div>
    </Card>
  )
}

export default TodayTasksSummary