import React, { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/store'
import { 
  createTaskAsync, 
  updateTaskAsync
} from '../../store/taskSlice'
import { 
  selectFilteredTasks, 
  selectTasksLoading 
} from '../../store/selectors'
import { CreateTaskRequest, Task, Subtask } from '../../types'
import TaskForm from './TaskForm'
import DeleteTaskDialog from './DeleteTaskDialog'
import DraggableTaskList from './DraggableTaskList'
import TaskFilter from './TaskFilter'
import BulkOperations from './BulkOperations'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { PlusIcon } from '../ui/Icons'

const TaskManager: React.FC = () => {
  const dispatch = useAppDispatch()
  const tasks = useAppSelector(selectFilteredTasks)
  const isLoading = useAppSelector(selectTasksLoading)
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<{ id: string; title: string; hasSubtasks: boolean } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([])

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

  const handleDeleteClick = (task: Task) => {
    setDeletingTask({
      id: task.id,
      title: task.title,
      hasSubtasks: task.subtasks && task.subtasks.length > 0
    })
  }

  const handleDeleteConfirm = () => {
    setDeletingTask(null)
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }
  
  const handleSelectTask = (task: Task) => {
    const isSelected = selectedTasks.some(t => t.id === task.id)
    if (isSelected) {
      setSelectedTasks(selectedTasks.filter(t => t.id !== task.id))
    } else {
      setSelectedTasks([...selectedTasks, task])
    }
  }
  
  // const handleSelectAll = () => {
  //   if (selectedTasks.length === filteredTasks.length) {
  //     setSelectedTasks([])
  //   } else {
  //     setSelectedTasks(filteredTasks)
  //   }
  // }
  
  const handleClearSelection = () => {
    setSelectedTasks([])
  }

  // Filter tasks by search term
  const filteredTasks = tasks.filter(task => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      task.title.toLowerCase().includes(term) ||
      (task.description && task.description.toLowerCase().includes(term)) ||
      task.category.toLowerCase().includes(term)
    )
  })

  const openEditForm = (task: Task) => {
    setEditingTask(task)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingTask(null)
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

      {/* 필터 및 검색 */}
      <TaskFilter onSearch={handleSearch} />

      {/* 작업 목록 */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
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
          <>
            <DraggableTaskList
              tasks={filteredTasks}
              onEdit={openEditForm}
              onDelete={handleDeleteClick}
              selectedTasks={selectedTasks}
              onSelectTask={handleSelectTask}
            />
            <BulkOperations
              selectedTasks={selectedTasks}
              onClearSelection={handleClearSelection}
            />
          </>
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

      {/* 삭제 확인 모달 */}
      {deletingTask && (
        <DeleteTaskDialog
          isOpen={true}
          onClose={handleDeleteConfirm}
          taskId={deletingTask.id}
          taskTitle={deletingTask.title}
          hasSubtasks={deletingTask.hasSubtasks}
        />
      )}
    </div>
  )
}

export { TaskManager }
export default TaskManager