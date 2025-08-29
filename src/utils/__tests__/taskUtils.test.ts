import { Task, Subtask } from '../../types'

// Task utility functions for testing
export const taskUtils = {
  /**
   * Calculate total estimated duration including subtasks
   */
  calculateTotalDuration: (task: Task): number => {
    if (task.subtasks.length === 0) {
      return task.estimatedDuration
    }
    return task.subtasks.reduce((total, subtask) => total + subtask.duration, 0)
  },

  /**
   * Calculate completion percentage
   */
  calculateCompletionPercentage: (task: Task): number => {
    if (task.subtasks.length === 0) {
      return task.status === 'completed' ? 100 : 0
    }
    
    const completedSubtasks = task.subtasks.filter(st => st.isCompleted).length
    return Math.round((completedSubtasks / task.subtasks.length) * 100)
  },

  /**
   * Check if task is overdue
   */
  isOverdue: (task: Task): boolean => {
    if (!task.dueDate) return false
    return new Date() > task.dueDate && task.status !== 'completed'
  },

  /**
   * Get next incomplete subtask
   */
  getNextSubtask: (task: Task): Subtask | null => {
    return task.subtasks.find(st => !st.isCompleted) || null
  },

  /**
   * Split task into subtasks
   */
  splitTaskIntoSubtasks: (task: Task, maxSubtaskDuration: number = 25): Subtask[] => {
    if (task.estimatedDuration <= maxSubtaskDuration) {
      return []
    }

    const subtaskCount = Math.ceil(task.estimatedDuration / maxSubtaskDuration)
    const subtaskDuration = Math.floor(task.estimatedDuration / subtaskCount)
    const remainder = task.estimatedDuration % subtaskCount

    const subtasks: Subtask[] = []
    
    for (let i = 0; i < subtaskCount; i++) {
      const duration = i === subtaskCount - 1 
        ? subtaskDuration + remainder 
        : subtaskDuration

      subtasks.push({
        id: `${task.id}-subtask-${i + 1}`,
        title: `${task.title} - 단계 ${i + 1}`,
        duration: Math.min(duration, maxSubtaskDuration),
        isCompleted: false,
      })
    }

    return subtasks
  },

  /**
   * Filter tasks by status
   */
  filterTasksByStatus: (tasks: Task[], status: Task['status']): Task[] => {
    return tasks.filter(task => task.status === status)
  },

  /**
   * Filter tasks by priority
   */
  filterTasksByPriority: (tasks: Task[], priority: Task['priority']): Task[] => {
    return tasks.filter(task => task.priority === priority)
  },

  /**
   * Filter tasks by category
   */
  filterTasksByCategory: (tasks: Task[], category: string): Task[] => {
    return tasks.filter(task => task.category === category)
  },

  /**
   * Filter tasks due today
   */
  getTasksDueToday: (tasks: Task[]): Task[] => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return tasks.filter(task => {
      if (!task.dueDate) return false
      const dueDate = new Date(task.dueDate)
      return dueDate >= today && dueDate < tomorrow
    })
  },

  /**
   * Sort tasks by priority (high to low)
   */
  sortTasksByPriority: (tasks: Task[]): Task[] => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    
    return [...tasks].sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      
      // Secondary sort by creation date
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  },

  /**
   * Sort tasks by due date
   */
  sortTasksByDueDate: (tasks: Task[]): Task[] => {
    return [...tasks].sort((a, b) => {
      // Tasks without due date go to the end
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })
  },

  /**
   * Get task statistics
   */
  getTaskStatistics: (tasks: Task[]) => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'completed').length
    const inProgress = tasks.filter(t => t.status === 'in-progress').length
    const pending = tasks.filter(t => t.status === 'pending').length
    const postponed = tasks.filter(t => t.status === 'postponed').length
    const overdue = tasks.filter(t => taskUtils.isOverdue(t)).length

    return {
      total,
      completed,
      inProgress,
      pending,
      postponed,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  },

  /**
   * Estimate remaining time for task
   */
  estimateRemainingTime: (task: Task): number => {
    if (task.status === 'completed') return 0
    
    if (task.subtasks.length === 0) {
      return task.estimatedDuration
    }
    
    const remainingSubtasks = task.subtasks.filter(st => !st.isCompleted)
    return remainingSubtasks.reduce((total, subtask) => total + subtask.duration, 0)
  },

  /**
   * Check if task can be started (no dependencies blocking)
   */
  canStartTask: (task: Task, allTasks: Task[]): boolean => {
    if (task.status !== 'pending') return false
    
    // Check if any dependencies are incomplete
    if (task.dependencies) {
      const incompleteDependencies = task.dependencies.filter(depId => {
        const depTask = allTasks.find(t => t.id === depId)
        return depTask && depTask.status !== 'completed'
      })
      
      return incompleteDependencies.length === 0
    }
    
    return true
  },

  /**
   * Get task difficulty score (based on duration and subtask count)
   */
  getTaskDifficulty: (task: Task): 'easy' | 'medium' | 'hard' => {
    const duration = taskUtils.calculateTotalDuration(task)
    const subtaskCount = task.subtasks.length
    
    const score = duration + (subtaskCount * 10)
    
    if (score <= 30) return 'easy'
    if (score <= 60) return 'medium'
    return 'hard'
  },

  /**
   * Generate task summary
   */
  generateTaskSummary: (task: Task): string => {
    const duration = taskUtils.calculateTotalDuration(task)
    const completion = taskUtils.calculateCompletionPercentage(task)
    const difficulty = taskUtils.getTaskDifficulty(task)
    
    let summary = `${task.title} (${duration}분, ${difficulty})`
    
    if (task.subtasks.length > 0) {
      summary += ` - ${completion}% 완료`
    }
    
    if (taskUtils.isOverdue(task)) {
      summary += ' [지연]'
    }
    
    return summary
  }
}

describe('taskUtils', () => {
  const createMockTask = (overrides: Partial<Task> = {}): Task => ({
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    estimatedDuration: 30,
    subtasks: [],
    priority: 'medium',
    category: '업무',
    isFlexible: true,
    status: 'pending',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  })

  const createMockSubtask = (overrides: Partial<Subtask> = {}): Subtask => ({
    id: 'subtask-1',
    title: 'Test Subtask',
    duration: 15,
    isCompleted: false,
    ...overrides,
  })

  describe('duration calculations', () => {
    it('should calculate total duration without subtasks', () => {
      const task = createMockTask({ estimatedDuration: 45 })
      expect(taskUtils.calculateTotalDuration(task)).toBe(45)
    })

    it('should calculate total duration with subtasks', () => {
      const task = createMockTask({
        subtasks: [
          createMockSubtask({ duration: 15 }),
          createMockSubtask({ duration: 20 }),
          createMockSubtask({ duration: 10 }),
        ]
      })
      expect(taskUtils.calculateTotalDuration(task)).toBe(45)
    })

    it('should estimate remaining time for incomplete task', () => {
      const task = createMockTask({
        estimatedDuration: 60,
        subtasks: [
          createMockSubtask({ duration: 20, isCompleted: true }),
          createMockSubtask({ duration: 20, isCompleted: false }),
          createMockSubtask({ duration: 20, isCompleted: false }),
        ]
      })
      expect(taskUtils.estimateRemainingTime(task)).toBe(40)
    })

    it('should return zero remaining time for completed task', () => {
      const task = createMockTask({ status: 'completed' })
      expect(taskUtils.estimateRemainingTime(task)).toBe(0)
    })
  })

  describe('completion calculations', () => {
    it('should calculate completion percentage without subtasks', () => {
      const pendingTask = createMockTask({ status: 'pending' })
      const completedTask = createMockTask({ status: 'completed' })
      
      expect(taskUtils.calculateCompletionPercentage(pendingTask)).toBe(0)
      expect(taskUtils.calculateCompletionPercentage(completedTask)).toBe(100)
    })

    it('should calculate completion percentage with subtasks', () => {
      const task = createMockTask({
        subtasks: [
          createMockSubtask({ isCompleted: true }),
          createMockSubtask({ isCompleted: true }),
          createMockSubtask({ isCompleted: false }),
          createMockSubtask({ isCompleted: false }),
        ]
      })
      expect(taskUtils.calculateCompletionPercentage(task)).toBe(50)
    })

    it('should handle empty subtasks array', () => {
      const task = createMockTask({ subtasks: [] })
      expect(taskUtils.calculateCompletionPercentage(task)).toBe(0)
    })
  })

  describe('overdue detection', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-15T14:30:00'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should detect overdue tasks', () => {
      const overdueTask = createMockTask({
        dueDate: new Date('2024-01-14T23:59:59'),
        status: 'pending'
      })
      expect(taskUtils.isOverdue(overdueTask)).toBe(true)
    })

    it('should not mark completed tasks as overdue', () => {
      const completedTask = createMockTask({
        dueDate: new Date('2024-01-14T23:59:59'),
        status: 'completed'
      })
      expect(taskUtils.isOverdue(completedTask)).toBe(false)
    })

    it('should not mark tasks without due date as overdue', () => {
      const task = createMockTask({ dueDate: undefined })
      expect(taskUtils.isOverdue(task)).toBe(false)
    })

    it('should not mark future tasks as overdue', () => {
      const futureTask = createMockTask({
        dueDate: new Date('2024-01-16T14:30:00')
      })
      expect(taskUtils.isOverdue(futureTask)).toBe(false)
    })
  })

  describe('subtask management', () => {
    it('should get next incomplete subtask', () => {
      const task = createMockTask({
        subtasks: [
          createMockSubtask({ id: 'sub1', isCompleted: true }),
          createMockSubtask({ id: 'sub2', isCompleted: false }),
          createMockSubtask({ id: 'sub3', isCompleted: false }),
        ]
      })
      
      const nextSubtask = taskUtils.getNextSubtask(task)
      expect(nextSubtask?.id).toBe('sub2')
    })

    it('should return null if all subtasks are completed', () => {
      const task = createMockTask({
        subtasks: [
          createMockSubtask({ isCompleted: true }),
          createMockSubtask({ isCompleted: true }),
        ]
      })
      
      expect(taskUtils.getNextSubtask(task)).toBeNull()
    })

    it('should split task into subtasks', () => {
      const task = createMockTask({ estimatedDuration: 75 })
      const subtasks = taskUtils.splitTaskIntoSubtasks(task, 25)
      
      expect(subtasks).toHaveLength(3)
      expect(subtasks[0].duration).toBe(25)
      expect(subtasks[1].duration).toBe(25)
      expect(subtasks[2].duration).toBe(25)
    })

    it('should not split short tasks', () => {
      const task = createMockTask({ estimatedDuration: 20 })
      const subtasks = taskUtils.splitTaskIntoSubtasks(task, 25)
      
      expect(subtasks).toHaveLength(0)
    })

    it('should handle remainder in task splitting', () => {
      const task = createMockTask({ estimatedDuration: 70 })
      const subtasks = taskUtils.splitTaskIntoSubtasks(task, 25)
      
      expect(subtasks).toHaveLength(3)
      const totalDuration = subtasks.reduce((sum, st) => sum + st.duration, 0)
      expect(totalDuration).toBe(70)
    })
  })

  describe('task filtering', () => {
    const tasks = [
      createMockTask({ id: '1', status: 'pending', priority: 'high', category: '업무' }),
      createMockTask({ id: '2', status: 'completed', priority: 'medium', category: '개인' }),
      createMockTask({ id: '3', status: 'in-progress', priority: 'low', category: '업무' }),
    ]

    it('should filter tasks by status', () => {
      const pending = taskUtils.filterTasksByStatus(tasks, 'pending')
      const completed = taskUtils.filterTasksByStatus(tasks, 'completed')
      
      expect(pending).toHaveLength(1)
      expect(pending[0].id).toBe('1')
      expect(completed).toHaveLength(1)
      expect(completed[0].id).toBe('2')
    })

    it('should filter tasks by priority', () => {
      const highPriority = taskUtils.filterTasksByPriority(tasks, 'high')
      const mediumPriority = taskUtils.filterTasksByPriority(tasks, 'medium')
      
      expect(highPriority).toHaveLength(1)
      expect(highPriority[0].id).toBe('1')
      expect(mediumPriority).toHaveLength(1)
      expect(mediumPriority[0].id).toBe('2')
    })

    it('should filter tasks by category', () => {
      const workTasks = taskUtils.filterTasksByCategory(tasks, '업무')
      const personalTasks = taskUtils.filterTasksByCategory(tasks, '개인')
      
      expect(workTasks).toHaveLength(2)
      expect(personalTasks).toHaveLength(1)
      expect(personalTasks[0].id).toBe('2')
    })
  })

  describe('task sorting', () => {
    const tasks = [
      createMockTask({ 
        id: '1', 
        priority: 'low', 
        createdAt: new Date('2024-01-03'),
        dueDate: new Date('2024-01-20')
      }),
      createMockTask({ 
        id: '2', 
        priority: 'high', 
        createdAt: new Date('2024-01-01'),
        dueDate: new Date('2024-01-18')
      }),
      createMockTask({ 
        id: '3', 
        priority: 'medium', 
        createdAt: new Date('2024-01-02'),
        dueDate: undefined
      }),
    ]

    it('should sort tasks by priority', () => {
      const sorted = taskUtils.sortTasksByPriority(tasks)
      
      expect(sorted[0].id).toBe('2') // high
      expect(sorted[1].id).toBe('3') // medium
      expect(sorted[2].id).toBe('1') // low
    })

    it('should use creation date as tiebreaker for same priority', () => {
      const samePriorityTasks = [
        createMockTask({ id: '1', priority: 'medium', createdAt: new Date('2024-01-02') }),
        createMockTask({ id: '2', priority: 'medium', createdAt: new Date('2024-01-01') }),
      ]
      
      const sorted = taskUtils.sortTasksByPriority(samePriorityTasks)
      expect(sorted[0].id).toBe('2') // Earlier creation date
    })

    it('should sort tasks by due date', () => {
      const sorted = taskUtils.sortTasksByDueDate(tasks)
      
      expect(sorted[0].id).toBe('2') // 2024-01-18
      expect(sorted[1].id).toBe('1') // 2024-01-20
      expect(sorted[2].id).toBe('3') // no due date (goes to end)
    })
  })

  describe('task statistics', () => {
    const tasks = [
      createMockTask({ id: '1', status: 'completed' }),
      createMockTask({ id: '2', status: 'in-progress' }),
      createMockTask({ id: '3', status: 'pending' }),
      createMockTask({ id: '4', status: 'postponed' }),
      createMockTask({ 
        id: '5', 
        status: 'pending',
        dueDate: new Date('2024-01-01') // Overdue
      }),
    ]

    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-15T14:30:00'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should calculate task statistics', () => {
      const stats = taskUtils.getTaskStatistics(tasks)
      
      expect(stats.total).toBe(5)
      expect(stats.completed).toBe(1)
      expect(stats.inProgress).toBe(1)
      expect(stats.pending).toBe(2)
      expect(stats.postponed).toBe(1)
      expect(stats.overdue).toBe(1)
      expect(stats.completionRate).toBe(20) // 1/5 * 100
    })

    it('should handle empty task list', () => {
      const stats = taskUtils.getTaskStatistics([])
      
      expect(stats.total).toBe(0)
      expect(stats.completionRate).toBe(0)
    })
  })

  describe('task difficulty assessment', () => {
    it('should assess easy tasks', () => {
      const easyTask = createMockTask({ estimatedDuration: 15 })
      expect(taskUtils.getTaskDifficulty(easyTask)).toBe('easy')
    })

    it('should assess medium tasks', () => {
      const mediumTask = createMockTask({ estimatedDuration: 45 })
      expect(taskUtils.getTaskDifficulty(mediumTask)).toBe('medium')
    })

    it('should assess hard tasks', () => {
      const hardTask = createMockTask({ 
        estimatedDuration: 60,
        subtasks: [
          createMockSubtask(),
          createMockSubtask(),
          createMockSubtask(),
        ]
      })
      expect(taskUtils.getTaskDifficulty(hardTask)).toBe('hard')
    })
  })

  describe('task summary generation', () => {
    it('should generate basic task summary', () => {
      const task = createMockTask({ title: 'Write Report', estimatedDuration: 30 })
      const summary = taskUtils.generateTaskSummary(task)
      
      expect(summary).toBe('Write Report (30분, easy)')
    })

    it('should include completion percentage for tasks with subtasks', () => {
      const task = createMockTask({
        title: 'Complex Task',
        estimatedDuration: 60,
        subtasks: [
          createMockSubtask({ isCompleted: true }),
          createMockSubtask({ isCompleted: false }),
        ]
      })
      const summary = taskUtils.generateTaskSummary(task)
      
      expect(summary).toContain('50% 완료')
    })

    it('should mark overdue tasks', () => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-15T14:30:00'))
      
      const overdueTask = createMockTask({
        title: 'Overdue Task',
        dueDate: new Date('2024-01-14T23:59:59')
      })
      const summary = taskUtils.generateTaskSummary(overdueTask)
      
      expect(summary).toContain('[지연]')
      
      jest.useRealTimers()
    })
  })
})