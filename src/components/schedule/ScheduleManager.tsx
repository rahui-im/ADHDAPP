import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import { 
  generateDailySchedule, 
  postponeTaskWithAdjustment,
  reorderTasksByEnergy 
} from '../../store/taskSlice'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useGoalAdjustment } from '../../hooks/useGoalAdjustment'
import { GoalAdjustmentModal } from './GoalAdjustmentModal'

interface ScheduleManagerProps {
  energyLevel: 'low' | 'medium' | 'high'
  onEnergyChange: (level: 'low' | 'medium' | 'high') => void
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  energyLevel,
  onEnergyChange
}) => {
  const dispatch = useDispatch()
  const { tasks, dailySchedule, loading } = useSelector((state: RootState) => state.tasks)
  
  // 목표 조정 기능
  const {
    goalAdjustment,
    isModalOpen,
    handleAcceptAdjustment,
    handleDeclineAdjustment,
    handleCloseModal,
    triggerCompletionCheck,
    todayStats
  } = useGoalAdjustment()
  
  const pendingTasks = tasks.filter(t => t.status === 'pending')
  const fixedTasks = pendingTasks.filter(t => !t.isFlexible)
  const flexibleTasks = pendingTasks.filter(t => t.isFlexible)

  // 일일 스케줄 생성
  const handleGenerateSchedule = () => {
    dispatch(generateDailySchedule({
      tasks: pendingTasks,
      energyLevel,
      date: new Date()
    }) as any)
  }

  // 작업 연기
  const handlePostponeTask = (taskId: string) => {
    dispatch(postponeTaskWithAdjustment({
      taskId,
      tasks: pendingTasks
    }) as any)
  }

  // 에너지 레벨에 따른 재정렬
  const handleReorderByEnergy = () => {
    dispatch(reorderTasksByEnergy(energyLevel))
  }

  // 에너지 레벨 변경 시 자동 재정렬
  useEffect(() => {
    if (flexibleTasks.length > 0) {
      handleReorderByEnergy()
    }
  }, [energyLevel])

  return (
    <div className="space-y-6">
      {/* 목표 조정 모달 */}
      {goalAdjustment && (
        <GoalAdjustmentModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          adjustment={goalAdjustment}
          onAccept={handleAcceptAdjustment}
          onDecline={handleDeclineAdjustment}
        />
      )}
      {/* 에너지 레벨 선택 */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">현재 에너지 레벨</h3>
        <div className="flex gap-2">
          {(['low', 'medium', 'high'] as const).map((level) => (
            <Button
              key={level}
              variant={energyLevel === level ? 'primary' : 'secondary'}
              onClick={() => onEnergyChange(level)}
              className="flex-1"
            >
              {level === 'low' && '낮음 🔋'}
              {level === 'medium' && '보통 🔋🔋'}
              {level === 'high' && '높음 🔋🔋🔋'}
            </Button>
          ))}
        </div>
        
        {/* 오늘의 완료율 표시 */}
        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
          <div className="flex justify-between items-center">
            <span>오늘의 완료율:</span>
            <div className="flex items-center gap-2">
              <span className={`font-medium ${
                todayStats.tasksPlanned === 0 ? 'text-gray-500' :
                (todayStats.tasksCompleted / todayStats.tasksPlanned) >= 0.7 ? 'text-green-600' :
                (todayStats.tasksCompleted / todayStats.tasksPlanned) >= 0.5 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {todayStats.tasksPlanned === 0 ? '계획된 작업 없음' : 
                 `${Math.round((todayStats.tasksCompleted / todayStats.tasksPlanned) * 100)}%`}
              </span>
              <span className="text-gray-500">
                ({todayStats.tasksCompleted}/{todayStats.tasksPlanned})
              </span>
            </div>
          </div>
          {todayStats.tasksPlanned > 0 && (todayStats.tasksCompleted / todayStats.tasksPlanned) < 0.5 && (
            <Button
              size="sm"
              variant="secondary"
              onClick={triggerCompletionCheck}
              className="mt-2 text-xs"
            >
              목표 조정 제안 받기
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {energyLevel === 'low' && '짧고 쉬운 작업이나 창의적인 작업을 추천합니다'}
          {energyLevel === 'medium' && '균형잡힌 작업 배치를 추천합니다'}
          {energyLevel === 'high' && '복잡하고 중요한 작업을 추천합니다'}
        </p>
      </Card>

      {/* 스케줄 관리 */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">일정 관리</h3>
          <div className="flex gap-2">
            <Button
              onClick={handleReorderByEnergy}
              variant="secondary"
              disabled={loading}
            >
              에너지별 재정렬
            </Button>
            <Button
              onClick={handleGenerateSchedule}
              variant="primary"
              disabled={loading}
            >
              오늘 일정 생성
            </Button>
          </div>
        </div>

        {/* 작업 유형별 표시 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">
              고정 일정 ({fixedTasks.length}개)
            </h4>
            <div className="space-y-2">
              {fixedTasks.slice(0, 3).map(task => (
                <div key={task.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <div>
                    <span className="text-sm font-medium">{task.title}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {task.estimatedDuration}분
                    </span>
                  </div>
                  <span className="text-xs px-2 py-1 bg-blue-200 rounded">
                    고정
                  </span>
                </div>
              ))}
              {fixedTasks.length > 3 && (
                <p className="text-xs text-gray-500">
                  +{fixedTasks.length - 3}개 더
                </p>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">
              유연 일정 ({flexibleTasks.length}개)
            </h4>
            <div className="space-y-2">
              {flexibleTasks.slice(0, 3).map(task => (
                <div key={task.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <div>
                    <span className="text-sm font-medium">{task.title}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {task.estimatedDuration}분
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs px-2 py-1 bg-green-200 rounded">
                      유연
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handlePostponeTask(task.id)}
                      className="text-xs px-2 py-1"
                    >
                      연기
                    </Button>
                  </div>
                </div>
              ))}
              {flexibleTasks.length > 3 && (
                <p className="text-xs text-gray-500">
                  +{flexibleTasks.length - 3}개 더
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 일일 스케줄 표시 */}
        {dailySchedule && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-700 mb-2">
              오늘의 스케줄 ({dailySchedule.tasks.length}개 작업)
            </h4>
            <div className="text-sm text-gray-600 mb-3">
              예상 소요 시간: {Math.floor(dailySchedule.totalEstimatedTime / 60)}시간 {dailySchedule.totalEstimatedTime % 60}분
            </div>
            <div className="space-y-2">
              {dailySchedule.tasks.map((task, index) => (
                <div key={task.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                  <span className="text-xs font-mono w-6 text-center">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <span className="text-sm font-medium">{task.title}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {task.estimatedDuration}분
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        task.priority === 'high' ? 'bg-red-200 text-red-800' :
                        task.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-gray-200 text-gray-800'
                      }`}>
                        {task.priority === 'high' ? '높음' : 
                         task.priority === 'medium' ? '보통' : '낮음'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        task.isFlexible ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'
                      }`}>
                        {task.isFlexible ? '유연' : '고정'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 조정 사항 표시 */}
            {dailySchedule.adjustments.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 rounded">
                <h5 className="text-sm font-medium text-yellow-800 mb-2">
                  스케줄 조정 사항
                </h5>
                <div className="space-y-1">
                  {dailySchedule.adjustments.map((adjustment, index) => (
                    <div key={index} className="text-xs text-yellow-700">
                      • {adjustment.reason === 'postponed' ? '연기로 인한' : 
                         adjustment.reason === 'energy_mismatch' ? '에너지 레벨 불일치로 인한' :
                         adjustment.reason === 'time_constraint' ? '시간 제약으로 인한' : '사용자 요청으로 인한'} 
                      우선순위 조정
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}