import { schedulingService, SchedulingService } from '../schedulingService'
import { Task } from '../../types'

describe('SchedulingService', () => {
  let service: SchedulingService

  beforeEach(() => {
    service = new SchedulingService()
  })

  const createMockTask = (overrides: Partial<Task> = {}): Task => ({
    id: `task-${Math.random().toString(36).substr(2, 9)}`,
    title: 'Test Task',
    description: 'Test Description',
    estimatedDuration: 30,
    subtasks: [],
    priority: 'medium',
    category: '업무',
    isFlexible: true,
    status: 'pending',
    createdAt: new Date(),
    ...overrides,
  })

  describe('priority adjustment on postpone', () => {
    it('should increase priority of postponed task', () => {
      const tasks = [
        createMockTask({ id: 'task-1', priority: 'low' }),
        createMockTask({ id: 'task-2', priority: 'medium' }),
      ]

      const adjustments = service.adjustPriorityOnPostpone(tasks, 'task-1')

      expect(adjustments).toHaveLength(1)
      expect(adjustments[0].taskId).toBe('task-1')
      expect(adjustments[0].newPriority).toBe('medium')
      expect(adjustments[0].reason).toBe('postponed')
    })

    it('should not increase priority beyond high', () => {
      const tasks = [
        createMockTask({ id: 'task-1', priority: 'high' }),
      ]

      const adjustments = service.adjustPriorityOnPostpone(tasks, 'task-1')

      expect(adjustments).toHaveLength(0) // No adjustment needed
    })

    it('should return empty array for non-existent task', () => {
      const tasks = [
        createMockTask({ id: 'task-1' }),
      ]

      const adjustments = service.adjustPriorityOnPostpone(tasks, 'non-existent')

      expect(adjustments).toHaveLength(0)
    })

    it('should find optimal position for postponed task', () => {
      const tasks = [
        createMockTask({ id: 'task-1', priority: 'high', isFlexible: false }),
        createMockTask({ id: 'task-2', priority: 'medium', isFlexible: true }),
        createMockTask({ id: 'task-3', priority: 'low', isFlexible: true }),
      ]

      const adjustments = service.adjustPriorityOnPostpone(tasks, 'task-3')

      expect(adjustments).toHaveLength(1)
      expect(adjustments[0].newPosition).toBeGreaterThanOrEqual(0)
    })
  })

  describe('task scheduling by type', () => {
    it('should prioritize fixed tasks over flexible tasks', () => {
      const tasks = [
        createMockTask({ id: 'flexible-1', isFlexible: true, priority: 'high' }),
        createMockTask({ id: 'fixed-1', isFlexible: false, priority: 'medium' }),
        createMockTask({ id: 'flexible-2', isFlexible: true, priority: 'medium' }),
      ]

      const scheduled = service.scheduleTasksByType(tasks, 'medium')

      expect(scheduled[0].id).toBe('fixed-1') // Fixed task comes first
    })

    it('should respect maximum daily tasks limit', () => {
      const tasks = Array.from({ length: 10 }, (_, i) => 
        createMockTask({ id: `task-${i}` })
      )

      const scheduled = service.scheduleTasksByType(tasks, 'medium', { maxDailyTasks: 5 })

      expect(scheduled).toHaveLength(5)
    })

    it('should sort fixed tasks by priority', () => {
      const tasks = [
        createMockTask({ id: 'fixed-low', isFlexible: false, priority: 'low' }),
        createMockTask({ id: 'fixed-high', isFlexible: false, priority: 'high' }),
        createMockTask({ id: 'fixed-medium', isFlexible: false, priority: 'medium' }),
      ]

      const scheduled = service.scheduleTasksByType(tasks, 'medium')

      expect(scheduled[0].id).toBe('fixed-high')
      expect(scheduled[1].id).toBe('fixed-medium')
      expect(scheduled[2].id).toBe('fixed-low')
    })

    it('should filter only pending tasks', () => {
      const tasks = [
        createMockTask({ id: 'pending', status: 'pending' }),
        createMockTask({ id: 'completed', status: 'completed' }),
        createMockTask({ id: 'in-progress', status: 'in-progress' }),
      ]

      const scheduled = service.scheduleTasksByType(tasks, 'medium')

      expect(scheduled).toHaveLength(1)
      expect(scheduled[0].id).toBe('pending')
    })
  })

  describe('energy-based task recommendations', () => {
    it('should recommend short tasks for low energy', () => {
      const tasks = [
        createMockTask({ id: 'short', estimatedDuration: 15 }),
        createMockTask({ id: 'long', estimatedDuration: 60 }),
        createMockTask({ id: 'medium', estimatedDuration: 30 }),
      ]

      const recommended = service.recommendTasksByEnergy(tasks, 'low')

      expect(recommended[0].id).toBe('short')
    })

    it('should recommend creative tasks for low energy', () => {
      const tasks = [
        createMockTask({ 
          id: 'creative', 
          title: '디자인 작업',
          estimatedDuration: 45 
        }),
        createMockTask({ 
          id: 'analytical', 
          title: '데이터 분석',
          estimatedDuration: 30 
        }),
      ]

      const recommended = service.recommendTasksByEnergy(tasks, 'low')

      expect(recommended[0].id).toBe('creative')
    })

    it('should recommend complex tasks for high energy', () => {
      const tasks = [
        createMockTask({ id: 'simple', estimatedDuration: 15, priority: 'low' }),
        createMockTask({ id: 'complex', estimatedDuration: 90, priority: 'high' }),
      ]

      const recommended = service.recommendTasksByEnergy(tasks, 'high')

      expect(recommended[0].id).toBe('complex')
    })

    it('should use balanced approach for medium energy', () => {
      const tasks = [
        createMockTask({ id: 'low-priority', priority: 'low' }),
        createMockTask({ id: 'high-priority', priority: 'high' }),
        createMockTask({ id: 'medium-priority', priority: 'medium' }),
      ]

      const recommended = service.recommendTasksByEnergy(tasks, 'medium')

      expect(recommended[0].id).toBe('high-priority')
      expect(recommended[1].id).toBe('medium-priority')
      expect(recommended[2].id).toBe('low-priority')
    })

    it('should filter only pending tasks', () => {
      const tasks = [
        createMockTask({ id: 'pending', status: 'pending' }),
        createMockTask({ id: 'completed', status: 'completed' }),
      ]

      const recommended = service.recommendTasksByEnergy(tasks, 'medium')

      expect(recommended).toHaveLength(1)
      expect(recommended[0].id).toBe('pending')
    })
  })

  describe('creative task detection', () => {
    it('should identify creative tasks by keywords', () => {
      const creativeTasks = [
        createMockTask({ title: '디자인 작업' }),
        createMockTask({ title: '아이디어 회의' }),
        createMockTask({ title: '브레인스토밍 세션' }),
        createMockTask({ description: '창작 활동' }),
        createMockTask({ title: '기획안 작성' }),
        createMockTask({ title: '설계 문서' }),
      ]

      const nonCreativeTasks = [
        createMockTask({ title: '데이터 입력' }),
        createMockTask({ title: '보고서 검토' }),
        createMockTask({ title: '이메일 답장' }),
      ]

      const allTasks = [...creativeTasks, ...nonCreativeTasks]
      const recommended = service.recommendTasksByEnergy(allTasks, 'low')

      // Creative tasks should come first for low energy
      const creativeIds = creativeTasks.map(t => t.id)
      const firstRecommended = recommended.slice(0, creativeTasks.length)
      
      expect(firstRecommended.every(task => creativeIds.includes(task.id))).toBe(true)
    })
  })

  describe('priority weight calculation', () => {
    it('should sort tasks by priority correctly', () => {
      const tasks = [
        createMockTask({ id: 'low', priority: 'low', createdAt: new Date('2024-01-01') }),
        createMockTask({ id: 'high', priority: 'high', createdAt: new Date('2024-01-02') }),
        createMockTask({ id: 'medium', priority: 'medium', createdAt: new Date('2024-01-03') }),
      ]

      const scheduled = service.scheduleTasksByType(tasks, 'medium')

      expect(scheduled[0].id).toBe('high')
      expect(scheduled[1].id).toBe('medium')
      expect(scheduled[2].id).toBe('low')
    })

    it('should use creation time as tiebreaker for same priority', () => {
      const tasks = [
        createMockTask({ 
          id: 'newer', 
          priority: 'medium', 
          createdAt: new Date('2024-01-02') 
        }),
        createMockTask({ 
          id: 'older', 
          priority: 'medium', 
          createdAt: new Date('2024-01-01') 
        }),
      ]

      const scheduled = service.scheduleTasksByType(tasks, 'medium')

      expect(scheduled[0].id).toBe('older') // Older task comes first
    })
  })

  describe('energy weight calculation', () => {
    it('should give higher weight to short tasks for low energy', () => {
      const shortTask = createMockTask({ estimatedDuration: 15 })
      const longTask = createMockTask({ estimatedDuration: 90 })

      const tasks = [longTask, shortTask] // Long task first
      const recommended = service.recommendTasksByEnergy(tasks, 'low')

      expect(recommended[0].id).toBe(shortTask.id)
    })

    it('should give higher weight to complex tasks for high energy', () => {
      const simpleTask = createMockTask({ estimatedDuration: 15 })
      const complexTask = createMockTask({ 
        estimatedDuration: 90,
        subtasks: [
          { id: 'sub1', title: 'Subtask 1', duration: 30, isCompleted: false },
          { id: 'sub2', title: 'Subtask 2', duration: 30, isCompleted: false },
          { id: 'sub3', title: 'Subtask 3', duration: 30, isCompleted: false },
          { id: 'sub4', title: 'Subtask 4', duration: 30, isCompleted: false },
        ]
      })

      const tasks = [simpleTask, complexTask]
      const recommended = service.recommendTasksByEnergy(tasks, 'high')

      expect(recommended[0].id).toBe(complexTask.id)
    })

    it('should give equal weight to all tasks for medium energy', () => {
      const tasks = [
        createMockTask({ id: 'task1', estimatedDuration: 15 }),
        createMockTask({ id: 'task2', estimatedDuration: 60 }),
        createMockTask({ id: 'task3', estimatedDuration: 30 }),
      ]

      const recommended = service.recommendTasksByEnergy(tasks, 'medium')

      // Should maintain original order since all have equal energy weight
      // and same priority
      expect(recommended).toHaveLength(3)
    })
  })

  describe('service instance', () => {
    it('should export a service instance', () => {
      expect(schedulingService).toBeInstanceOf(SchedulingService)
    })

    it('should have default options', () => {
      const tasks = Array.from({ length: 15 }, (_, i) => 
        createMockTask({ id: `task-${i}` })
      )

      const scheduled = schedulingService.scheduleTasksByType(tasks, 'medium')

      // Should respect default maxDailyTasks (8)
      expect(scheduled.length).toBeLessThanOrEqual(8)
    })
  })
})