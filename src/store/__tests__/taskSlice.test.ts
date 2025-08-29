import { configureStore } from '@reduxjs/toolkit'
import taskReducer, {
  toggleSubtask,
  setCurrentTask,
  updateTaskStatus,
  reorderTasks,
  postponeTask,
  applyScheduleAdjustments,
  reorderTasksByEnergy,
  acceptGoalAdjustment,
  declineGoalAdjustment,
  suggestRealisticGoals,
  setLoading,
  setError,
  clearCompletedTasks,
  createTaskAsync,
  updateTaskAsync,
  deleteTaskAsync,
} from '../taskSlice'
import { Task, CreateTaskRequest, Subtask, ScheduleAdjustment } from '../../types'

// Mock services
jest.mock('../../services/schedulingService', () => ({
  schedulingService: {
    adjustPriorityOnPostpone: jest.fn(() => []),
    scheduleTasksByType: jest.fn((tasks) => tasks),
    recommendTasksByEnergy: jest.fn((tasks) => tasks),
  },
}))

jest.mock('../../services/goalAdjustmentService', () => ({
  goalAdjustmentService: {
    adjustGoalsForLowCompletion: jest.fn(() => ({
      type: 'reduce_tasks',
      suggestedTasks: [],
      message: 'Test adjustment',
      confidence: 0.8,
    })),
    suggestRealisticGoals: jest.fn((tasks) => tasks.slice(0, 3)),
  },
}))

describe('taskSlice', () => {
  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    store = configureStore({
      reducer: {
        tasks: taskReducer,
      },
    })
  })

  const mockTask: Task = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    estimatedDuration: 30,
    subtasks: [
      {
        id: 'subtask-1',
        title: 'Subtask 1',
        duration: 15,
        isCompleted: false,
      },
      {
        id: 'subtask-2',
        title: 'Subtask 2',
        duration: 15,
        isCompleted: false,
      },
    ],
    priority: 'medium',
    category: '업무',
    isFlexible: true,
    status: 'pending',
    createdAt: new Date('2024-01-01'),
  }

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().tasks
      expect(state.tasks).toEqual([])
      expect(state.currentTask).toBeNull()
      expect(state.dailySchedule).toBeNull()
      expect(state.goalAdjustment).toBeNull()
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('synchronous actions', () => {
    beforeEach(() => {
      // Add mock task to state
      store.dispatch({ type: 'tasks/addMockTask', payload: mockTask })
    })

    it('should toggle subtask completion', () => {
      store.dispatch(toggleSubtask({ taskId: 'task-1', subtaskId: 'subtask-1' }))
      
      const state = store.getState().tasks
      const task = state.tasks.find(t => t.id === 'task-1')
      const subtask = task?.subtasks.find(st => st.id === 'subtask-1')
      
      expect(subtask?.isCompleted).toBe(true)
      expect(subtask?.completedAt).toBeInstanceOf(Date)
    })

    it('should complete task when all subtasks are completed', () => {
      store.dispatch(toggleSubtask({ taskId: 'task-1', subtaskId: 'subtask-1' }))
      store.dispatch(toggleSubtask({ taskId: 'task-1', subtaskId: 'subtask-2' }))
      
      const state = store.getState().tasks
      const task = state.tasks.find(t => t.id === 'task-1')
      
      expect(task?.status).toBe('completed')
      expect(task?.completedAt).toBeInstanceOf(Date)
    })

    it('should set current task', () => {
      store.dispatch(setCurrentTask(mockTask))
      
      const state = store.getState().tasks
      expect(state.currentTask).toEqual(mockTask)
    })

    it('should update task status', () => {
      store.dispatch(updateTaskStatus({ id: 'task-1', status: 'in-progress' }))
      
      const state = store.getState().tasks
      const task = state.tasks.find(t => t.id === 'task-1')
      
      expect(task?.status).toBe('in-progress')
    })

    it('should complete task and all subtasks when status is completed', () => {
      store.dispatch(updateTaskStatus({ id: 'task-1', status: 'completed' }))
      
      const state = store.getState().tasks
      const task = state.tasks.find(t => t.id === 'task-1')
      
      expect(task?.status).toBe('completed')
      expect(task?.completedAt).toBeInstanceOf(Date)
      expect(task?.subtasks.every(st => st.isCompleted)).toBe(true)
    })

    it('should reorder tasks', () => {
      const task2: Task = { ...mockTask, id: 'task-2', title: 'Task 2' }
      store.dispatch({ type: 'tasks/addMockTask', payload: task2 })
      
      store.dispatch(reorderTasks({ taskId: 'task-1', newIndex: 1 }))
      
      const state = store.getState().tasks
      expect(state.tasks[1].id).toBe('task-1')
    })

    it('should postpone task and increase priority', () => {
      store.dispatch(postponeTask('task-1'))
      
      const state = store.getState().tasks
      const task = state.tasks.find(t => t.id === 'task-1')
      
      expect(task?.status).toBe('postponed')
      expect(task?.postponedCount).toBe(1)
      expect(task?.priority).toBe('high')
    })

    it('should apply schedule adjustments', () => {
      const adjustments: ScheduleAdjustment[] = [
        {
          taskId: 'task-1',
          newPriority: 'high',
          newPosition: 0,
          reason: 'postponed',
        },
      ]
      
      store.dispatch(applyScheduleAdjustments(adjustments))
      
      const state = store.getState().tasks
      const task = state.tasks.find(t => t.id === 'task-1')
      
      expect(task?.priority).toBe('high')
    })

    it('should clear completed tasks', () => {
      store.dispatch(updateTaskStatus({ id: 'task-1', status: 'completed' }))
      store.dispatch(clearCompletedTasks())
      
      const state = store.getState().tasks
      expect(state.tasks.length).toBe(0)
    })

    it('should set loading state', () => {
      store.dispatch(setLoading(true))
      
      const state = store.getState().tasks
      expect(state.loading).toBe(true)
    })

    it('should set error state', () => {
      const errorMessage = 'Test error'
      store.dispatch(setError(errorMessage))
      
      const state = store.getState().tasks
      expect(state.error).toBe(errorMessage)
    })
  })

  describe('async actions', () => {
    it('should create task with auto-splitting', async () => {
      const taskRequest: CreateTaskRequest = {
        title: 'Long Task',
        description: 'A task that should be split',
        estimatedDuration: 60,
        priority: 'medium',
        category: '업무',
        isFlexible: true,
      }

      await store.dispatch(createTaskAsync(taskRequest))
      
      const state = store.getState().tasks
      expect(state.tasks.length).toBe(1)
      expect(state.tasks[0].subtasks.length).toBeGreaterThan(0)
      expect(state.loading).toBe(false)
    })

    it('should update task', async () => {
      // First create a task
      const taskRequest: CreateTaskRequest = {
        title: 'Original Task',
        estimatedDuration: 30,
        priority: 'medium',
        category: '업무',
        isFlexible: true,
      }

      await store.dispatch(createTaskAsync(taskRequest))
      const createdTask = store.getState().tasks.tasks[0]

      // Then update it
      const updates = { title: 'Updated Task', priority: 'high' as const }
      await store.dispatch(updateTaskAsync({ id: createdTask.id, updates }))
      
      const state = store.getState().tasks
      const updatedTask = state.tasks.find(t => t.id === createdTask.id)
      
      expect(updatedTask?.title).toBe('Updated Task')
      expect(updatedTask?.priority).toBe('high')
    })

    it('should delete task', async () => {
      // First create a task
      const taskRequest: CreateTaskRequest = {
        title: 'Task to Delete',
        estimatedDuration: 30,
        priority: 'medium',
        category: '업무',
        isFlexible: true,
      }

      await store.dispatch(createTaskAsync(taskRequest))
      const createdTask = store.getState().tasks.tasks[0]

      // Then delete it
      await store.dispatch(deleteTaskAsync(createdTask.id))
      
      const state = store.getState().tasks
      expect(state.tasks.length).toBe(0)
    })

    it('should handle async action errors', async () => {
      // Mock crypto.randomUUID to throw error
      const originalRandomUUID = global.crypto.randomUUID
      global.crypto.randomUUID = jest.fn(() => {
        throw new Error('UUID generation failed')
      })

      const taskRequest: CreateTaskRequest = {
        title: 'Failing Task',
        estimatedDuration: 30,
        priority: 'medium',
        category: '업무',
        isFlexible: true,
      }

      await store.dispatch(createTaskAsync(taskRequest))
      
      const state = store.getState().tasks
      expect(state.error).toBeTruthy()
      expect(state.loading).toBe(false)

      // Restore original function
      global.crypto.randomUUID = originalRandomUUID
    })
  })

  describe('goal adjustment', () => {
    beforeEach(() => {
      store.dispatch({ type: 'tasks/addMockTask', payload: mockTask })
    })

    it('should accept goal adjustment', () => {
      const suggestedTasks = [mockTask]
      store.dispatch(acceptGoalAdjustment(suggestedTasks))
      
      const state = store.getState().tasks
      expect(state.goalAdjustment).toBeNull()
    })

    it('should decline goal adjustment', () => {
      store.dispatch(declineGoalAdjustment())
      
      const state = store.getState().tasks
      expect(state.goalAdjustment).toBeNull()
    })

    it('should suggest realistic goals', () => {
      store.dispatch(suggestRealisticGoals({
        energyLevel: 'low',
        recentCompletionRate: 0.3,
      }))
      
      // Should not throw error and complete successfully
      const state = store.getState().tasks
      expect(state.error).toBeNull()
    })
  })
})

// Add custom reducer for testing
const taskSliceWithMockActions = {
  ...taskReducer,
  extraReducers: (builder: any) => {
    // Call original extraReducers
    const originalExtraReducers = (taskReducer as any).extraReducers
    if (originalExtraReducers) {
      originalExtraReducers(builder)
    }
    
    // Add mock action for testing
    builder.addCase('tasks/addMockTask', (state: any, action: any) => {
      state.tasks.push(action.payload)
    })
  },
}