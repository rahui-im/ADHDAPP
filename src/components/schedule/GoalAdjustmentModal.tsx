import React from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { GoalAdjustment, Task } from '../../types'

interface GoalAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  adjustment: GoalAdjustment
  onAccept: (suggestedTasks: Task[]) => void
  onDecline: () => void
}

export const GoalAdjustmentModal: React.FC<GoalAdjustmentModalProps> = ({
  isOpen,
  onClose,
  adjustment,
  onAccept,
  onDecline
}) => {
  const getAdjustmentIcon = (type: GoalAdjustment['type']) => {
    switch (type) {
      case 'reduce_tasks': return '📉'
      case 'extend_deadline': return '⏰'
      case 'split_tasks': return '✂️'
      case 'lower_priority': return '🔄'
      default: return '💡'
    }
  }

  const getAdjustmentTitle = (type: GoalAdjustment['type']) => {
    switch (type) {
      case 'reduce_tasks': return '작업 수 줄이기'
      case 'extend_deadline': return '마감일 연장'
      case 'split_tasks': return '작업 분할'
      case 'lower_priority': return '우선순위 조정'
      default: return '목표 조정'
    }
  }

  const handleAccept = () => {
    onAccept(adjustment.suggestedTasks)
    onClose()
  }

  const handleDecline = () => {
    onDecline()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="목표 조정 제안">
      <div className="space-y-6">
        {/* 격려 메시지 */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💙</span>
            <div>
              <h3 className="font-medium text-blue-900 mb-2">
                {getAdjustmentIcon(adjustment.type)} {getAdjustmentTitle(adjustment.type)}
              </h3>
              <p className="text-blue-800 leading-relaxed">
                {adjustment.message}
              </p>
            </div>
          </div>
        </Card>

        {/* 조정 상세 정보 */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {adjustment.originalTaskCount}
              </div>
              <div className="text-sm text-gray-500">원래 작업 수</div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {adjustment.adjustedTaskCount}
              </div>
              <div className="text-sm text-gray-500">조정된 작업 수</div>
            </div>
          </Card>
        </div>

        {/* 조정 이유 */}
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
          <strong>조정 이유:</strong> {adjustment.reason}
        </div>

        {/* 제안된 작업 목록 */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3">
            내일 추천 작업 ({adjustment.suggestedTasks.length}개)
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {adjustment.suggestedTasks.map((task, index) => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                <span className="text-sm font-mono w-6 text-center text-gray-500">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{task.title}</div>
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
        </div>

        {/* 예상 소요 시간 */}
        <div className="text-sm text-gray-600 bg-green-50 p-3 rounded">
          <div className="flex justify-between items-center">
            <span>예상 총 소요 시간:</span>
            <span className="font-medium">
              {Math.floor(adjustment.suggestedTasks.reduce((sum, task) => sum + task.estimatedDuration, 0) / 60)}시간{' '}
              {adjustment.suggestedTasks.reduce((sum, task) => sum + task.estimatedDuration, 0) % 60}분
            </span>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="secondary"
            onClick={handleDecline}
            className="flex-1"
          >
            현재 계획 유지
          </Button>
          <Button
            variant="primary"
            onClick={handleAccept}
            className="flex-1"
          >
            제안 수락하기
          </Button>
        </div>

        {/* 추가 격려 메시지 */}
        <div className="text-xs text-gray-500 text-center italic">
          완벽하지 않아도 괜찮습니다. 작은 진전도 의미있는 성취예요! 🌟
        </div>
      </div>
    </Modal>
  )
}