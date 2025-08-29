import React from 'react'
import { TaskManager } from '../components/tasks/TaskManager'

const TasksPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">작업 관리</h1>
      <TaskManager />
    </div>
  )
}

export default TasksPage