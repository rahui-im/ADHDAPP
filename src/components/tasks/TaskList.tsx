import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppDispatch, useAppSelector } from '../../store/store'
import { 
  selectTodayTasks, 
  selectTasksByPriority
} from '../../store/selectors'
import { 
  updateTaskStatus, 
  toggleSubtask, 
  setCurrentTask 
} from '../../store/taskSlice'
import { Task } from '../../types'
import Card from '../ui/Card'
import Button from '../ui/Button'
import ProgressBar from '../ui/ProgressBar'
import { CheckCircleIcon, ClockIcon } from '../ui/Icons'

interface TaskListProps {
  showTodayOnly?: boolean
  showCompleted?: boolean
  onTaskEdit?: (task: Task) => void
  onTaskStart?: (task: Task) => void
}

const TaskList: React.FC<TaskListProps> = ({
  showTodayOnly = true,
  showCompleted = false,
  onTaskEdit,
  onTaskStart,
}) => {
  const dispatch = useAppDispatch()
  const todayTasks = useAppSelector(selectTodayTasks)
  const tasksByPriority = useAppSelector(selectTasksByPriority)
  
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())

  // 표시할 작업 목록 결정
  const getTasksToShow = () => {
    let tasks = showTodayOnly ? todayTasks : tasksByPriority
    
    if (!showCompleted) {
      tasks = tasks.filter(task => task.status !== 'completed')
    }
    
    return tasks
  }

  const tasksToShow = getTasksToShow()

  const handleTaskStatusChange = (taskId: string, status: Task['status']) => {
    dispatch(updateTaskStatus({ id: taskId, status }))
  }

  const handleSubtaskToggle = (taskId: string, subtaskId: string) => {
    dispatch(toggleSubtask({ taskId, subtaskId }))
  }

  const handleTaskStart = (task: Task) => {
    dispatch(setCurrentTask(task))
    handleTaskStatusChange(task.id, 'in-progress')
    onTaskStart?.(task)
  }

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const calculateTaskProgress = (task: Task): number => {
    if (task.status === 'completed') return 100
    if (task.subtasks.length === 0) {
      return task.status === 'in-progress' ? 50 : 0
    }
    
    const completedSubtasks = task.subtasks.filter(st => st.isCompleted).length
    return Math.round((completedSubtasks / task.subtasks.length) * 100)
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50'
      case 'in-progress': return 'text-blue-600 bg-blue-50'
      case 'postponed': return 'text-orange-600 bg-orange-50'
      case 'pending': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusLabel = (status: Task['status']) => {
    switch (status) {
      case 'completed': return '완료'
      case 'in-progress': return '진행중'
      case 'postponed': return '연기됨'
      case 'pending': return '대기중'
      default: return '대기중'
    }
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50'
      case 'medium': return 'border-l-yellow-500 bg-yellow-50'
      case 'low': return 'border-l-gray-500 bg-gray-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  const formatTimeRemaining = (task: Task): string => {
    if (task.status === 'completed') return '완료됨'
    
    const totalMinutes = task.subtasks.length > 0 
      ? task.subtasks.filter(st => !st.isCompleted).reduce((sum, st) => sum + st.duration, 0)
      : task.estimatedDuration
    
    if (totalMinutes < 60) {
      return `${totalMinutes}분 남음`
    } else {
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      return `${hours}시간 ${minutes}분 남음`
    }
  }

  if (tasksToShow.length === 0) {
    return (
      <Card className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <CheckCircleIcon className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {showTodayOnly ? '오늘 할 작업이 없습니다' : '작업이 없습니다'}
        </h3>
        <p className="text-gray-600">
          {showCompleted 
            ? '모든 작업을 완료했습니다! 🎉' 
            : '새로운 작업을 만들어 시작해보세요.'
          }
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {tasksToShow.map((task) => {
          const progress = calculateTaskProgress(task)
          const isExpanded = expandedTasks.has(task.id)
          
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={`border-l-4 ${getPriorityColor(task.priority)} hover:shadow-md transition-shadow`}>
                <div className="space-y-4">
                  {/* 작업 헤더 */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {task.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      
                      {/* 작업 메타 정보 */}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>{formatTimeRemaining(task)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span>📁</span>
                          <span>{task.category}</span>
                        </span>
                        {task.subtasks.length > 0 && (
                          <span className="flex items-center space-x-1">
                            <span>📋</span>
                            <span>{task.subtasks.filter(st => st.isCompleted).length}/{task.subtasks.length} 단계</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 액션 버튼들 */}
                    <div className="flex items-center space-x-2 ml-4">
                      {task.status === 'pending' && (
                        <Button
                          onClick={() => handleTaskStart(task)}
                          variant="primary"
                          size="sm"
                        >
                          시작하기
                        </Button>
                      )}
                      {task.status === 'in-progress' && (
                        <Button
                          onClick={() => handleTaskStatusChange(task.id, 'completed')}
                          variant="success"
                          size="sm"
                        >
                          완료
                        </Button>
                      )}
                      {onTaskEdit && (
                        <Button
                          onClick={() => onTaskEdit(task)}
                          variant="secondary"
                          size="sm"
                        >
                          수정
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* 진행률 바 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">진행률</span>
                      <span className="font-medium text-gray-900">{progress}%</span>
                    </div>
                    <ProgressBar 
                      progress={progress} 
                      className="h-2"
                      color={task.status === 'completed' ? 'success' : 'primary'}
                    />
                  </div>

                  {/* 하위 작업 목록 */}
                  {task.subtasks.length > 0 && (
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleTaskExpansion(task.id)}
                        className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                          ▶
                        </span>
                        <span>세부 단계 {isExpanded ? '숨기기' : '보기'}</span>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-2 pl-4 border-l-2 border-gray-200"
                          >
                            {task.subtasks.map((subtask, index) => (
                              <motion.div
                                key={subtask.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`flex items-center space-x-3 p-3 rounded-lg border ${
                                  subtask.isCompleted 
                                    ? 'bg-green-50 border-green-200' 
                                    : 'bg-white border-gray-200'
                                }`}
                              >
                                <button
                                  onClick={() => handleSubtaskToggle(task.id, subtask.id)}
                                  className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                    subtask.isCompleted
                                      ? 'bg-green-500 border-green-500 text-white'
                                      : 'border-gray-300 hover:border-green-400'
                                  }`}
                                >
                                  {subtask.isCompleted && (
                                    <CheckCircleIcon className="w-3 h-3" />
                                  )}
                                </button>
                                
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm font-medium ${
                                    subtask.isCompleted 
                                      ? 'text-green-800 line-through' 
                                      : 'text-gray-900'
                                  }`}>
                                    {subtask.title}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {subtask.duration}분 예상
                                    {subtask.completedAt && (
                                      <span className="ml-2">
                                        • 완료: {new Date(subtask.completedAt).toLocaleTimeString('ko-KR', { 
                                          hour: '2-digit', 
                                          minute: '2-digit' 
                                        })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* 작업 생성일 */}
                  <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                    생성일: {new Date(task.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short'
                    })}
                    {task.completedAt && (
                      <span className="ml-4">
                        완료일: {new Date(task.completedAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short'
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export default TaskList