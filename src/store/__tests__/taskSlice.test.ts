import { describe, it, expect, beforeEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import taskReducer, {
  addTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  reorderTasks,
  setFilter,
  setSearchQuery,
  bulkUpdateTasks,
  bulkDeleteTasks,
  splitTask,
  setSelectedTasks,
  clearSelectedTasks,
  selectAllTasks,
  selectTask
} from '../taskSlice'
import { createMockTask } from '../../tests/utils/test-utils'

describe('taskSlice', () => {
  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    store = configureStore({
      reducer: {
        tasks: taskReducer
      }
    })
  })

  describe('Task CRUD Operations', () => {
    it('should add a new task', () => {
      const newTask = createMockTask({ title: 'New Task' })
      store.dispatch(addTask(newTask))
      
      const state = store.getState().tasks
      expect(state.items).toHaveLength(1)
      expect(state.items[0].title).toBe('New Task')
    })

    it('should update an existing task', () => {
      const task = createMockTask()
      store.dispatch(addTask(task))
      
      store.dispatch(updateTask({
        id: task.id,
        updates: { title: 'Updated Task' }
      }))
      
      const state = store.getState().tasks
      expect(state.items[0].title).toBe('Updated Task')
    })

    it('should delete a task', () => {
      const task = createMockTask()
      store.dispatch(addTask(task))
      
      store.dispatch(deleteTask(task.id))
      
      const state = store.getState().tasks
      expect(state.items).toHaveLength(0)
    })

    it('should toggle task completion', () => {
      const task = createMockTask({ status: 'pending' })
      store.dispatch(addTask(task))
      
      store.dispatch(toggleTaskComplete(task.id))
      
      const state = store.getState().tasks
      expect(state.items[0].status).toBe('completed')
      expect(state.items[0].completedAt).toBeTruthy()
    })
  })

  describe('Task Reordering', () => {
    it('should reorder tasks', () => {
      const task1 = createMockTask({ id: '1', title: 'Task 1' })
      const task2 = createMockTask({ id: '2', title: 'Task 2' })
      const task3 = createMockTask({ id: '3', title: 'Task 3' })
      
      store.dispatch(addTask(task1))
      store.dispatch(addTask(task2))
      store.dispatch(addTask(task3))
      
      store.dispatch(reorderTasks({ sourceIndex: 0, destinationIndex: 2 }))
      
      const state = store.getState().tasks
      expect(state.items[0].title).toBe('Task 2')
      expect(state.items[1].title).toBe('Task 3')
      expect(state.items[2].title).toBe('Task 1')
    })
  })

  describe('Filtering and Search', () => {
    beforeEach(() => {
      const task1 = createMockTask({ status: 'pending', title: 'Pending Task' })
      const task2 = createMockTask({ status: 'completed', title: 'Completed Task' })
      const task3 = createMockTask({ status: 'in-progress', title: 'In Progress' })
      
      store.dispatch(addTask(task1))
      store.dispatch(addTask(task2))
      store.dispatch(addTask(task3))
    })

    it('should filter tasks by status', () => {
      store.dispatch(setFilter({ status: 'completed' }))
      
      const state = store.getState().tasks
      expect(state.filter.status).toBe('completed')
    })

    it('should set search query', () => {
      store.dispatch(setSearchQuery('Task'))
      
      const state = store.getState().tasks
      expect(state.searchQuery).toBe('Task')
    })
  })

  describe('Bulk Operations', () => {
    beforeEach(() => {
      const task1 = createMockTask({ id: '1' })
      const task2 = createMockTask({ id: '2' })
      const task3 = createMockTask({ id: '3' })
      
      store.dispatch(addTask(task1))
      store.dispatch(addTask(task2))
      store.dispatch(addTask(task3))
    })

    it('should bulk update tasks', () => {
      store.dispatch(bulkUpdateTasks({
        taskIds: ['1', '2'],
        updates: { priority: 'high' }
      }))
      
      const state = store.getState().tasks
      expect(state.items[0].priority).toBe('high')
      expect(state.items[1].priority).toBe('high')
      expect(state.items[2].priority).toBe('medium')
    })

    it('should bulk delete tasks', () => {
      store.dispatch(bulkDeleteTasks(['1', '3']))
      
      const state = store.getState().tasks
      expect(state.items).toHaveLength(1)
      expect(state.items[0].id).toBe('2')
    })
  })

  describe('Task Splitting', () => {
    it('should split a task into subtasks', () => {
      const parentTask = createMockTask({ id: 'parent', title: 'Parent Task' })
      store.dispatch(addTask(parentTask))
      
      const subtasks = [
        { title: 'Subtask 1', estimatedDuration: 10 },
        { title: 'Subtask 2', estimatedDuration: 15 }
      ]
      
      store.dispatch(splitTask({ parentTaskId: 'parent', subtasks }))
      
      const state = store.getState().tasks
      expect(state.items).toHaveLength(3)
      expect(state.items[1].title).toBe('Subtask 1')
      expect(state.items[2].title).toBe('Subtask 2')
    })
  })

  describe('Task Selection', () => {
    beforeEach(() => {
      const task1 = createMockTask({ id: '1' })
      const task2 = createMockTask({ id: '2' })
      const task3 = createMockTask({ id: '3' })
      
      store.dispatch(addTask(task1))
      store.dispatch(addTask(task2))
      store.dispatch(addTask(task3))
    })

    it('should select a task', () => {
      store.dispatch(selectTask('1'))
      
      const state = store.getState().tasks
      expect(state.selectedTasks).toContain('1')
    })

    it('should select all tasks', () => {
      store.dispatch(selectAllTasks())
      
      const state = store.getState().tasks
      expect(state.selectedTasks).toHaveLength(3)
    })

    it('should clear selected tasks', () => {
      store.dispatch(selectAllTasks())
      store.dispatch(clearSelectedTasks())
      
      const state = store.getState().tasks
      expect(state.selectedTasks).toHaveLength(0)
    })

    it('should set selected tasks', () => {
      store.dispatch(setSelectedTasks(['1', '3']))
      
      const state = store.getState().tasks
      expect(state.selectedTasks).toEqual(['1', '3'])
    })
  })
})