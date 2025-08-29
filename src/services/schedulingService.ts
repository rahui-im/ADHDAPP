import { Task } from '../types'

export interface ScheduleAdjustment {
  taskId: string
  newPriority: Task['priority']
  newPosition: number
  reason: 'postponed' | 'energy_mismatch' | 'time_constraint' | 'user_request'
}

export interface SchedulingOptions {
  respectFixedTasks: boolean
  considerEnergyLevel: boolean
  maxDailyTasks: number
  bufferTime: number // minutes between tasks
}

export class SchedulingService {
  private defaultOptions: SchedulingOptions = {
    respectFixedTasks: true,
    considerEnergyLevel: true,
    maxDailyTasks: 8,
    bufferTime: 10
  }

  /**
   * 작업 연기 시 자동 우선순위 재조정
   */
  adjustPriorityOnPostpone(
    tasks: Task[],
    postponedTaskId: string,
    options: Partial<SchedulingOptions> = {}
  ): ScheduleAdjustment[] {
    const opts = { ...this.defaultOptions, ...options }
    const adjustments: ScheduleAdjustment[] = []
    
    const postponedTask = tasks.find(t => t.id === postponedTaskId)
    if (!postponedTask) return adjustments

    // 연기된 작업의 우선순위를 한 단계 높임 (다음에 더 중요하게 처리)
    const newPriority = this.increasePriority(postponedTask.priority)
    if (newPriority !== postponedTask.priority) {
      adjustments.push({
        taskId: postponedTaskId,
        newPriority,
        newPosition: this.findOptimalPosition(tasks, postponedTask, newPriority, opts),
        reason: 'postponed'
      })
    }

    // 유연한 작업들의 우선순위 재조정
    const flexibleTasks = tasks.filter(t => 
      t.isFlexible && 
      t.id !== postponedTaskId && 
      t.status === 'pending'
    )

    flexibleTasks.forEach(task => {
      const adjustment = this.calculatePriorityAdjustment(task, tasks, opts)
      if (adjustment) {
        adjustments.push(adjustment)
      }
    })

    return adjustments
  }

  /**
   * 고정 일정 vs 유연 일정에 따른 스케줄링
   */
  scheduleTasksByType(
    tasks: Task[],
    energyLevel: 'low' | 'medium' | 'high',
    options: Partial<SchedulingOptions> = {}
  ): Task[] {
    const opts = { ...this.defaultOptions, ...options }
    
    // 고정 작업과 유연 작업 분리
    const fixedTasks = tasks.filter(t => !t.isFlexible && t.status === 'pending')
    const flexibleTasks = tasks.filter(t => t.isFlexible && t.status === 'pending')
    
    // 고정 작업은 우선순위와 생성 시간 순으로 정렬
    const sortedFixedTasks = this.sortTasksByPriority(fixedTasks)
    
    // 유연 작업은 에너지 레벨과 우선순위를 고려하여 정렬
    const sortedFlexibleTasks = this.sortFlexibleTasksByEnergyAndPriority(
      flexibleTasks, 
      energyLevel
    )
    
    // 최대 일일 작업 수 제한 적용
    const totalTasks = Math.min(
      sortedFixedTasks.length + sortedFlexibleTasks.length,
      opts.maxDailyTasks
    )
    
    // 고정 작업을 먼저 배치하고, 남은 자리에 유연 작업 배치
    const scheduledTasks: Task[] = []
    
    // 고정 작업 추가
    scheduledTasks.push(...sortedFixedTasks)
    
    // 유연 작업 추가 (남은 자리만큼)
    const remainingSlots = totalTasks - sortedFixedTasks.length
    if (remainingSlots > 0) {
      scheduledTasks.push(...sortedFlexibleTasks.slice(0, remainingSlots))
    }
    
    return scheduledTasks
  }

  /**
   * 에너지 레벨에 따른 작업 추천
   */
  recommendTasksByEnergy(
    tasks: Task[],
    energyLevel: 'low' | 'medium' | 'high'
  ): Task[] {
    const availableTasks = tasks.filter(t => t.status === 'pending')
    
    switch (energyLevel) {
      case 'low':
        // 낮은 에너지: 짧고 쉬운 작업, 창의적 작업 우선
        return availableTasks
          .filter(t => t.estimatedDuration <= 30 || this.isCreativeTask(t))
          .sort((a, b) => a.estimatedDuration - b.estimatedDuration)
      
      case 'medium':
        // 보통 에너지: 균형잡힌 작업 배치
        return this.sortTasksByPriority(availableTasks)
      
      case 'high':
        // 높은 에너지: 복잡하고 중요한 작업 우선
        return availableTasks
          .sort((a, b) => {
            const priorityWeight = this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority)
            const durationWeight = b.estimatedDuration - a.estimatedDuration
            return priorityWeight * 2 + durationWeight * 0.1
          })
      
      default:
        return availableTasks
    }
  }

  private increasePriority(priority: Task['priority']): Task['priority'] {
    switch (priority) {
      case 'low': return 'medium'
      case 'medium': return 'high'
      case 'high': return 'high' // 이미 최고 우선순위
      default: return priority
    }
  }

  private findOptimalPosition(
    tasks: Task[],
    task: Task,
    newPriority: Task['priority'],
    options: SchedulingOptions
  ): number {
    const pendingTasks = tasks.filter(t => t.status === 'pending')
    
    // 새로운 우선순위에 맞는 위치 찾기
    for (let i = 0; i < pendingTasks.length; i++) {
      const currentTask = pendingTasks[i]
      
      // 고정 작업은 건드리지 않음
      if (!currentTask.isFlexible && options.respectFixedTasks) {
        continue
      }
      
      // 우선순위가 낮거나 같으면 이 위치에 삽입
      if (this.getPriorityWeight(currentTask.priority) <= this.getPriorityWeight(newPriority)) {
        return i
      }
    }
    
    return pendingTasks.length
  }

  private calculatePriorityAdjustment(
    task: Task,
    allTasks: Task[],
    options: SchedulingOptions
  ): ScheduleAdjustment | null {
    // 복잡한 우선순위 조정 로직은 향후 확장 가능
    // 현재는 기본적인 조정만 수행
    return null
  }

  private sortTasksByPriority(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      const priorityDiff = this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority)
      if (priorityDiff !== 0) return priorityDiff
      
      // 우선순위가 같으면 생성 시간 순
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  }

  private sortFlexibleTasksByEnergyAndPriority(
    tasks: Task[],
    energyLevel: 'low' | 'medium' | 'high'
  ): Task[] {
    return [...tasks].sort((a, b) => {
      // 에너지 레벨에 따른 가중치
      const energyWeightA = this.getEnergyWeight(a, energyLevel)
      const energyWeightB = this.getEnergyWeight(b, energyLevel)
      
      if (energyWeightA !== energyWeightB) {
        return energyWeightB - energyWeightA
      }
      
      // 에너지 가중치가 같으면 우선순위로
      return this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority)
    })
  }

  private getPriorityWeight(priority: Task['priority']): number {
    switch (priority) {
      case 'high': return 3
      case 'medium': return 2
      case 'low': return 1
      default: return 0
    }
  }

  private getEnergyWeight(task: Task, energyLevel: 'low' | 'medium' | 'high'): number {
    const isShortTask = task.estimatedDuration <= 30
    const isCreative = this.isCreativeTask(task)
    const isComplex = task.estimatedDuration > 60 || task.subtasks.length > 3
    
    switch (energyLevel) {
      case 'low':
        if (isShortTask || isCreative) return 3
        if (isComplex) return 1
        return 2
      
      case 'medium':
        return 2 // 모든 작업에 동일한 가중치
      
      case 'high':
        if (isComplex) return 3
        if (isShortTask) return 1
        return 2
      
      default:
        return 1
    }
  }

  private isCreativeTask(task: Task): boolean {
    const creativeKeywords = ['디자인', '아이디어', '브레인스토밍', '창작', '기획', '설계']
    const text = `${task.title} ${task.description || ''}`.toLowerCase()
    
    return creativeKeywords.some(keyword => text.includes(keyword.toLowerCase()))
  }
}

export const schedulingService = new SchedulingService()