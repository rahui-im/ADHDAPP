import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreateTaskRequest, Subtask } from '../../types'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { PlusIcon, TrashIcon } from '../ui/Icons'

interface TaskSplitModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (taskData: CreateTaskRequest, subtasks: Subtask[]) => void
  taskData: CreateTaskRequest
}

const TaskSplitModal: React.FC<TaskSplitModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  taskData,
}) => {
  const [subtasks, setSubtasks] = useState<Subtask[]>([])

  // 초기 자동 분할
  useEffect(() => {
    if (isOpen && taskData) {
      generateAutoSplit()
    }
  }, [isOpen, taskData])

  const generateAutoSplit = () => {
    const duration = taskData.estimatedDuration
    const subtaskCount = Math.ceil(duration / 20) // 20분 단위로 분할
    const baseDuration = Math.floor(duration / subtaskCount)
    const remainder = duration % subtaskCount

    const newSubtasks: Subtask[] = []
    
    for (let i = 0; i < subtaskCount; i++) {
      // 나머지를 첫 번째 subtask들에 분배
      const subtaskDuration = baseDuration + (i < remainder ? 1 : 0)
      
      const subtask: Subtask = {
        id: crypto.randomUUID(),
        title: `${taskData.title} - 단계 ${i + 1}`,
        duration: Math.min(subtaskDuration, 25), // 최대 25분
        isCompleted: false,
      }
      newSubtasks.push(subtask)
    }
    
    setSubtasks(newSubtasks)
  }

  const addSubtask = () => {
    const newSubtask: Subtask = {
      id: crypto.randomUUID(),
      title: `${taskData.title} - 단계 ${subtasks.length + 1}`,
      duration: 20,
      isCompleted: false,
    }
    setSubtasks([...subtasks, newSubtask])
  }

  const removeSubtask = (index: number) => {
    const newSubtasks = subtasks.filter((_, i) => i !== index)
    setSubtasks(newSubtasks)
  }

  const updateSubtask = (index: number, field: keyof Subtask, value: any) => {
    const newSubtasks = [...subtasks]
    newSubtasks[index] = { ...newSubtasks[index], [field]: value }
    setSubtasks(newSubtasks)
  }

  const handleConfirm = () => {
    if (subtasks.length === 0) {
      alert('최소 하나의 하위 작업이 필요합니다.')
      return
    }

    const totalDuration = subtasks.reduce((sum, st) => sum + st.duration, 0)
    const updatedTaskData = {
      ...taskData,
      estimatedDuration: totalDuration,
    }

    onConfirm(updatedTaskData, subtasks)
  }

  const getTotalDuration = () => {
    return subtasks.reduce((sum, st) => sum + st.duration, 0)
  }

  const getRecommendation = () => {
    const totalDuration = getTotalDuration()
    const avgDuration = totalDuration / subtasks.length
    
    if (avgDuration > 25) {
      return { type: 'warning', message: '일부 단계가 25분을 초과합니다. 더 작게 나누는 것을 권장합니다.' }
    } else if (avgDuration < 10) {
      return { type: 'info', message: '단계들이 너무 짧습니다. 몇 개를 합치는 것을 고려해보세요.' }
    } else {
      return { type: 'success', message: 'ADHD에 적합한 크기로 잘 나누어졌습니다!' }
    }
  }

  const recommendation = getRecommendation()

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="작업 분할하기"
      size="lg"
    >
      <div className="space-y-6">
        {/* 설명 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">
            🧠 ADHD 친화적 작업 분할
          </h3>
          <p className="text-sm text-blue-800">
            큰 작업을 작은 단위로 나누면 집중력을 유지하고 성취감을 느낄 수 있습니다. 
            각 단계는 15-25분 정도가 적당합니다.
          </p>
        </div>

        {/* 원본 작업 정보 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">원본 작업</h4>
          <div className="text-sm text-gray-600">
            <p><strong>제목:</strong> {taskData.title}</p>
            <p><strong>예상 시간:</strong> {taskData.estimatedDuration}분</p>
            <p><strong>우선순위:</strong> {
              taskData.priority === 'high' ? '높음' : 
              taskData.priority === 'medium' ? '보통' : '낮음'
            }</p>
          </div>
        </div>

        {/* 하위 작업 목록 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">하위 작업들</h4>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                총 시간: {getTotalDuration()}분
              </span>
              <Button
                onClick={addSubtask}
                variant="secondary"
                size="sm"
                className="flex items-center space-x-1"
              >
                <PlusIcon className="w-4 h-4" />
                <span>추가</span>
              </Button>
            </div>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {subtasks.map((subtask, index) => (
              <motion.div
                key={subtask.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-1 space-y-3">
                    {/* 제목 */}
                    <div>
                      <input
                        type="text"
                        value={subtask.title}
                        onChange={(e) => updateSubtask(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        placeholder="단계 제목"
                      />
                    </div>

                    {/* 시간 */}
                    <div className="flex items-center space-x-3">
                      <label className="text-sm text-gray-600 min-w-0">시간:</label>
                      <input
                        type="number"
                        value={subtask.duration}
                        onChange={(e) => updateSubtask(index, 'duration', parseInt(e.target.value) || 0)}
                        min="5"
                        max="45"
                        step="5"
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <span className="text-sm text-gray-500">분</span>
                      
                      {/* 시간 제안 버튼들 */}
                      <div className="flex space-x-1">
                        {[15, 20, 25].map((duration) => (
                          <button
                            key={duration}
                            type="button"
                            onClick={() => updateSubtask(index, 'duration', duration)}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${
                              subtask.duration === duration
                                ? 'bg-primary-100 border-primary-500 text-primary-700'
                                : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {duration}분
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => removeSubtask(index)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    disabled={subtasks.length <= 1}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* 시간 경고 */}
                {subtask.duration > 25 && (
                  <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    ⚠️ 25분을 초과합니다. 더 작게 나누는 것을 권장합니다.
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {subtasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>하위 작업이 없습니다.</p>
              <Button
                onClick={addSubtask}
                variant="primary"
                size="sm"
                className="mt-2"
              >
                첫 번째 단계 추가
              </Button>
            </div>
          )}
        </div>

        {/* 추천 메시지 */}
        {subtasks.length > 0 && (
          <div className={`p-3 rounded-lg border ${
            recommendation.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800'
              : recommendation.type === 'warning'
              ? 'bg-orange-50 border-orange-200 text-orange-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <p className="text-sm">{recommendation.message}</p>
          </div>
        )}

        {/* 자동 분할 버튼 */}
        <div className="flex justify-center">
          <Button
            onClick={generateAutoSplit}
            variant="secondary"
            size="sm"
            className="flex items-center space-x-2"
          >
            <span>🤖</span>
            <span>자동으로 다시 분할</span>
          </Button>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex space-x-3 pt-4 border-t">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
          >
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            variant="primary"
            className="flex-1"
            disabled={subtasks.length === 0}
          >
            작업 생성하기
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default TaskSplitModal