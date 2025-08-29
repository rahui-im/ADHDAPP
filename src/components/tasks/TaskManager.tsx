import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppDispatch, useAppSelector } from '../../store/store'
import { 
  createTaskAsync, 
  updateTaskAsync, 
  deleteTaskAsync
} from '../../store/taskSlice'
import { 
  selectAllTasks, 
  selectTasksLoading 
} from '../../store/selectors'
import { CreateTaskRequest, Task, Subtask } from '../../types'
import TaskForm from './TaskForm'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { PlusIcon, PencilIcon, TrashIcon } from '../ui/Icons'

const TaskManager: React.FC = () => {
  const dispatch = useAppDispatch()
  const tasks = useAppSelector(selectAllTasks)
  const isLoading = useAppSelector(selectTasksLoading)
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)

  const handleCreateTask = async (taskData: CreateTaskRequest, subtasks?: Subtask[]) => {
    console.log('Creating task:', taskData, subtasks)
    try {
      const result = await dispatch(createTaskAsync({ ...taskData, subtasks })).unwrap()
      console.log('Task created successfully:', result)
      setIsFormOpen(false)
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const handleUpdateTask = async (taskData: CreateTaskRequest, subtasks?: Subtask[]) => {
    if (!editingTask) return
    
    try {
      await dispatch(updateTaskAsync({ 
        id: editingTask.id, 
        updates: { ...taskData, subtasks }
      })).unwrap()
      setEditingTask(null)
      setIsFormOpen(false)
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('이 작업을 삭제하시겠습니까?')) return
    
    setDeletingTaskId(taskId)
    try {
      await dispatch(deleteTaskAsync(taskId)).unwrap()
    } catch (error) {
      console.error('Failed to delete task:', error)
    } finally {
      setDeletingTaskId(null)
    }
  }

  const openEditForm = (task: Task) => {
    setEditingTask(task)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingTask(null)
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityLabel = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return '높음'
      case 'medium': return '보통'
      case 'low': return '낮음'
      default: return '보통'
    }
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200'
      case 'in-progress': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'postponed': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'pending': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
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

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">작업 관리</h2>
          <p className="text-gray-600 mt-1">
            작업을 생성하고 관리하세요. 큰 작업은 자동으로 작은 단위로 분할됩니다.
          </p>
        </div>
        <Button
          onClick={() => {
            console.log('New task button clicked')
            setIsFormOpen(true)
          }}
          variant="primary"
          className="flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>새 작업</span>
        </Button>
      </div>

      {/* 작업 목록 */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <PlusIcon className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              아직 작업이 없습니다
            </h3>
            <p className="text-gray-600 mb-6">
              첫 번째 작업을 만들어 시작해보세요!
            </p>
            <Button
              onClick={() => setIsFormOpen(true)}
              variant="primary"
            >
              첫 작업 만들기
            </Button>
          </Card>
        ) : (
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* 작업 제목과 상태 */}
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {task.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>

                      {/* 작업 설명 */}
                      {task.description && (
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* 작업 정보 */}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          ⏱️ {task.estimatedDuration}분
                        </span>
                        <span className="flex items-center">
                          📁 {task.category}
                        </span>
                        {task.isFlexible && (
                          <span className="flex items-center">
                            🔄 유연한 일정
                          </span>
                        )}
                        {task.subtasks.length > 0 && (
                          <span className="flex items-center">
                            📋 {task.subtasks.filter(st => st.isCompleted).length}/{task.subtasks.length} 하위작업
                          </span>
                        )}
                      </div>

                      {/* 생성일 */}
                      <div className="text-xs text-gray-400 mt-2">
                        생성일: {new Date(task.createdAt).toLocaleDateString('ko-KR')}
                      </div>
                    </div>

                    {/* 액션 버튼들 */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        onClick={() => openEditForm(task)}
                        variant="secondary"
                        size="sm"
                        className="p-2"
                        disabled={deletingTaskId === task.id}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteTask(task.id)}
                        variant="danger"
                        size="sm"
                        className="p-2"
                        isLoading={deletingTaskId === task.id}
                        disabled={deletingTaskId === task.id}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* 작업 폼 모달 */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        editingTask={editingTask}
        isLoading={isLoading}
      />
    </div>
  )
}

export { TaskManager }
export default TaskManager