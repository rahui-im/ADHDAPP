import React from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useAppSelector } from '../../store/store'
import { selectAllTasks, selectEnergyLevel } from '../../store/selectors'
import { TaskRecommendationService } from '../../services/taskRecommendationService'

const TaskRecommendations: React.FC = () => {
  const tasks = useAppSelector(selectAllTasks)
  const energyLevel = useAppSelector(selectEnergyLevel)
  
  const currentHour = new Date().getHours()
  const recommendations = TaskRecommendationService.getComprehensiveRecommendations(
    tasks,
    energyLevel,
    currentHour
  )

  const topRecommendations = recommendations.slice(0, 3)

  if (topRecommendations.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          추천 작업
        </h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🎯</div>
          <div className="text-gray-600">
            추천할 작업이 없습니다.
            <br />
            새로운 작업을 추가해보세요!
          </div>
        </div>
      </Card>
    )
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'bg-green-100 text-green-800 border-green-200'
    if (priority >= 6) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (priority >= 4) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return '강력 추천'
    if (priority >= 6) return '추천'
    if (priority >= 4) return '적합'
    return '보통'
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          추천 작업
        </h3>
        <div className="text-sm text-gray-500">
          에너지: {energyLevel === 'high' ? '높음' : energyLevel === 'medium' ? '보통' : '낮음'}
        </div>
      </div>

      <div className="space-y-4">
        {topRecommendations.map((rec, index) => (
          <div
            key={rec.task.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-lg font-medium text-gray-900">
                    {rec.task.title}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(rec.priority)}`}>
                    {getPriorityLabel(rec.priority)}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  {rec.reason}
                </div>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>⏱️ {rec.task.estimatedDuration}분</span>
                  <span>📋 {rec.task.category}</span>
                  <span className={`px-2 py-1 rounded ${
                    rec.task.priority === 'high' ? 'bg-red-100 text-red-700' :
                    rec.task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {rec.task.priority === 'high' ? '높음' : 
                     rec.task.priority === 'medium' ? '보통' : '낮음'}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2 ml-4">
                <Button
                  variant="primary"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  시작하기
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  자세히
                </Button>
              </div>
            </div>
            
            {/* 하위 작업 미리보기 */}
            {rec.task.subtasks.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500 mb-1">
                  하위 작업 ({rec.task.subtasks.length}개)
                </div>
                <div className="flex flex-wrap gap-1">
                  {rec.task.subtasks.slice(0, 3).map((subtask) => (
                    <span
                      key={subtask.id}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {subtask.title}
                    </span>
                  ))}
                  {rec.task.subtasks.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      +{rec.task.subtasks.length - 3}개 더
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {recommendations.length > 3 && (
        <div className="mt-4 text-center">
          <Button variant="outline" size="sm">
            더 많은 추천 보기 ({recommendations.length - 3}개 더)
          </Button>
        </div>
      )}
    </Card>
  )
}

export default TaskRecommendations