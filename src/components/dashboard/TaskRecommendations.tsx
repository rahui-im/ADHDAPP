import React from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { motion } from 'framer-motion'

interface TaskRecommendation {
  id: string
  title: string
  reason: string
  estimatedTime: number
  priority: 'low' | 'medium' | 'high'
}

const TaskRecommendations: React.FC = () => {
  // 샘플 추천 작업들
  const recommendations: TaskRecommendation[] = [
    {
      id: '1',
      title: '이메일 확인하기',
      reason: '에너지가 낮을 때 적합한 작업',
      estimatedTime: 15,
      priority: 'low'
    },
    {
      id: '2',
      title: '프로젝트 계획 수립',
      reason: '집중력이 필요한 중요한 작업',
      estimatedTime: 45,
      priority: 'high'
    },
    {
      id: '3',
      title: '독서하기',
      reason: '창의적 사고에 도움되는 활동',
      estimatedTime: 30,
      priority: 'medium'
    }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'danger'
      case 'medium': return 'warning'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '높음'
      case 'medium': return '보통'
      case 'low': return '낮음'
      default: return '보통'
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">추천 작업</h3>
        <div className="text-2xl">💡</div>
      </div>
      
      <div className="space-y-3">
        {recommendations.map((task, index) => (
          <motion.div
            key={task.id}
            className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900 flex-1">
                {task.title}
              </h4>
              <Badge 
                variant={getPriorityColor(task.priority) as any}
                size="sm"
              >
                {getPriorityLabel(task.priority)}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              {task.reason}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                예상 시간: {task.estimatedTime}분
              </span>
              
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  console.log('작업 시작:', task.title)
                  alert(`"${task.title}" 작업을 시작합니다!`)
                }}
              >
                시작하기
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
      
      {recommendations.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-gray-600">
            현재 추천할 작업이 없습니다.
          </p>
        </div>
      )}
    </Card>
  )
}

export default TaskRecommendations