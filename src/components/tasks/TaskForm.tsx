import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppSelector } from '../../store/store'
import { selectUserPreferences } from '../../store/selectors'
import { CreateTaskRequest, Task, Subtask } from '../../types'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import TaskSplitModal from './TaskSplitModal'

interface TaskFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (task: CreateTaskRequest, subtasks?: Subtask[]) => void
  editingTask?: Task | null
  isLoading?: boolean
}

const TaskForm: React.FC<TaskFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingTask,
  isLoading = false,
}) => {
  const userPreferences = useAppSelector(selectUserPreferences)
  
  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    estimatedDuration: 25,
    priority: 'medium',
    category: '업무',
    isFlexible: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSplitModal, setShowSplitModal] = useState(false)
  const [pendingTaskData, setPendingTaskData] = useState<CreateTaskRequest | null>(null)

  // 편집 모드일 때 폼 데이터 초기화
  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title,
        description: editingTask.description || '',
        estimatedDuration: editingTask.estimatedDuration,
        priority: editingTask.priority,
        category: editingTask.category,
        isFlexible: editingTask.isFlexible,
      })
    } else {
      // 새 작업일 때 기본값으로 리셋
      setFormData({
        title: '',
        description: '',
        estimatedDuration: 25,
        priority: 'medium',
        category: userPreferences?.preferredTaskCategories[0] || '업무',
        isFlexible: true,
      })
    }
    setErrors({})
  }, [editingTask, userPreferences])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = '작업 제목을 입력해주세요'
    }

    if (formData.estimatedDuration < 5) {
      newErrors.estimatedDuration = '최소 5분 이상이어야 합니다'
    }

    if (formData.estimatedDuration > 480) {
      newErrors.estimatedDuration = '최대 8시간(480분)까지 가능합니다'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    
    if (validateForm()) {
      console.log('Form validation passed')
      // 편집 모드이거나 작업이 25분 이하면 바로 제출
      if (editingTask || formData.estimatedDuration <= 25) {
        console.log('Submitting task directly')
        onSubmit(formData)
      } else {
        // 새 작업이고 25분 초과면 분할 모달 표시
        console.log('Showing split modal')
        setPendingTaskData(formData)
        setShowSplitModal(true)
      }
    } else {
      console.log('Form validation failed:', errors)
    }
  }

  const handleSplitConfirm = (taskData: CreateTaskRequest, subtasks: Subtask[]) => {
    onSubmit(taskData, subtasks)
    setShowSplitModal(false)
    setPendingTaskData(null)
  }

  const handleSplitCancel = () => {
    setShowSplitModal(false)
    setPendingTaskData(null)
  }

  const handleInputChange = (field: keyof CreateTaskRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // 실시간 에러 제거
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      })
    }
  }

  const priorityOptions = [
    { value: 'low', label: '낮음', color: 'text-gray-600', description: '여유가 있을 때' },
    { value: 'medium', label: '보통', color: 'text-yellow-600', description: '일반적인 작업' },
    { value: 'high', label: '높음', color: 'text-red-600', description: '중요하고 급한 작업' },
  ] as const

  const categoryOptions = userPreferences?.preferredTaskCategories || ['업무', '개인', '학습', '운동']

  const getDurationSuggestion = (duration: number): string => {
    if (duration <= 25) return '집중하기 좋은 시간입니다'
    if (duration <= 45) return '중간 휴식을 권장합니다'
    if (duration <= 90) return '여러 단계로 나누어집니다'
    return '긴 작업입니다. 자동으로 분할됩니다'
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingTask ? '작업 수정' : '새 작업 만들기'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 작업 제목 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            작업 제목 *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="예: 프로젝트 보고서 작성"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            maxLength={100}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* 작업 설명 */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            작업 설명 (선택사항)
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="작업에 대한 자세한 설명을 입력하세요..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            maxLength={500}
          />
          <div className="mt-1 text-xs text-gray-500 text-right">
            {(formData.description || '').length}/500
          </div>
        </div>

        {/* 예상 시간 */}
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
            예상 시간 (분) *
          </label>
          <div className="space-y-3">
            <input
              type="number"
              id="duration"
              value={formData.estimatedDuration}
              onChange={(e) => handleInputChange('estimatedDuration', parseInt(e.target.value) || 0)}
              min="5"
              max="480"
              step="5"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.estimatedDuration ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            
            {/* 시간 제안 버튼들 */}
            <div className="flex flex-wrap gap-2">
              {[15, 25, 45, 90].map((duration) => (
                <button
                  key={duration}
                  type="button"
                  onClick={() => handleInputChange('estimatedDuration', duration)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    formData.estimatedDuration === duration
                      ? 'bg-primary-100 border-primary-500 text-primary-700'
                      : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {duration}분
                </button>
              ))}
            </div>

            {/* 시간 제안 메시지 */}
            <div className={`text-sm p-3 rounded-lg ${
              formData.estimatedDuration > 25 
                ? 'text-blue-700 bg-blue-50 border border-blue-200' 
                : 'text-gray-600 bg-gray-50'
            }`}>
              💡 {getDurationSuggestion(formData.estimatedDuration)}
              {formData.estimatedDuration > 25 && !editingTask && (
                <div className="mt-2 text-xs">
                  작업 생성 시 자동으로 작은 단위로 분할됩니다.
                </div>
              )}
            </div>
          </div>
          
          {errors.estimatedDuration && (
            <p className="mt-1 text-sm text-red-600">{errors.estimatedDuration}</p>
          )}
        </div>

        {/* 우선순위 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            우선순위 *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {priorityOptions.map((option) => (
              <motion.button
                key={option.value}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleInputChange('priority', option.value)}
                className={`p-4 border rounded-lg text-left transition-all ${
                  formData.priority === option.value
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className={`font-medium ${option.color}`}>
                  {option.label}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {option.description}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* 카테고리 */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            카테고리 *
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* 유연성 설정 */}
        <div>
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="flexible"
              checked={formData.isFlexible}
              onChange={(e) => handleInputChange('isFlexible', e.target.checked)}
              className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <div>
              <label htmlFor="flexible" className="text-sm font-medium text-gray-700">
                유연한 일정
              </label>
              <p className="text-sm text-gray-500 mt-1">
                다른 작업이나 상황에 따라 시간을 조정할 수 있습니다
              </p>
            </div>
          </div>
        </div>

        {/* 버튼들 */}
        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            isLoading={isLoading}
          >
            {editingTask ? '수정하기' : '작업 만들기'}
          </Button>
        </div>
      </form>

      {/* 작업 분할 모달 */}
      {pendingTaskData && (
        <TaskSplitModal
          isOpen={showSplitModal}
          onClose={handleSplitCancel}
          onConfirm={handleSplitConfirm}
          taskData={pendingTaskData}
        />
      )}
    </Modal>
  )
}

export default TaskForm