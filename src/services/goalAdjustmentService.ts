import { Task, DailyStats } from '../types'

export interface GoalAdjustment {
  type: 'reduce_tasks' | 'extend_deadline' | 'split_tasks' | 'lower_priority'
  message: string
  suggestedTasks: Task[]
  originalTaskCount: number
  adjustedTaskCount: number
  reason: string
}

export interface GoalAdjustmentOptions {
  minCompletionRate: number // 최소 완료율 (기본 50%)
  maxDailyTasks: number // 최대 일일 작업 수
  encouragingMessages: boolean // 격려 메시지 포함 여부
}

export class GoalAdjustmentService {
  private defaultOptions: GoalAdjustmentOptions = {
    minCompletionRate: 0.5,
    maxDailyTasks: 6,
    encouragingMessages: true
  }

  /**
   * 완료율이 낮을 때 다음 날 계획 자동 조정
   */
  adjustGoalsForLowCompletion(
    todayStats: DailyStats,
    tomorrowTasks: Task[],
    recentStats: DailyStats[],
    options: Partial<GoalAdjustmentOptions> = {}
  ): GoalAdjustment {
    const opts = { ...this.defaultOptions, ...options }
    const completionRate = todayStats.tasksCompleted / todayStats.tasksPlanned
    
    // 완료율이 기준 이상이면 조정하지 않음
    if (completionRate >= opts.minCompletionRate) {
      return this.createNoAdjustmentResult(tomorrowTasks, completionRate)
    }

    // 최근 패턴 분석
    const recentCompletionRates = recentStats.map(stat => 
      stat.tasksCompleted / stat.tasksPlanned
    ).filter(rate => !isNaN(rate))
    
    const averageCompletionRate = recentCompletionRates.length > 0 
      ? recentCompletionRates.reduce((sum, rate) => sum + rate, 0) / recentCompletionRates.length
      : completionRate

    // 조정 전략 결정
    if (averageCompletionRate < 0.3) {
      // 매우 낮은 완료율: 대폭 감소
      return this.createDrasticReduction(tomorrowTasks, opts)
    } else if (averageCompletionRate < 0.5) {
      // 낮은 완료율: 적당한 감소
      return this.createModerateReduction(tomorrowTasks, opts)
    } else {
      // 일시적 저조: 작은 조정
      return this.createMinorAdjustment(tomorrowTasks, opts)
    }
  }

  /**
   * 사용자에게 비난하지 않는 격려 메시지 생성
   */
  generateEncouragingMessage(
    completionRate: number,
    adjustmentType: GoalAdjustment['type']
  ): string {
    const encouragingPhrases = [
      "괜찮아요! 완벽하지 않아도 됩니다.",
      "작은 진전도 의미있는 성취입니다.",
      "오늘은 쉬어가는 날이었네요.",
      "내일은 더 나은 하루가 될 거예요.",
      "자신을 너무 몰아붙이지 마세요."
    ]

    const adjustmentMessages = {
      reduce_tasks: "내일은 좀 더 여유롭게 계획해보세요.",
      extend_deadline: "시간에 쫓기지 말고 천천히 해보세요.",
      split_tasks: "큰 작업을 작은 단위로 나누어 보세요.",
      lower_priority: "우선순위를 조정해서 부담을 줄여보세요."
    }

    const randomEncouragement = encouragingPhrases[Math.floor(Math.random() * encouragingPhrases.length)]
    const adjustmentMessage = adjustmentMessages[adjustmentType]

    return `${randomEncouragement} ${adjustmentMessage}`
  }

  /**
   * 에너지 레벨과 완료율을 고려한 현실적 목표 제안
   */
  suggestRealisticGoals(
    tasks: Task[],
    energyLevel: 'low' | 'medium' | 'high',
    recentCompletionRate: number
  ): Task[] {
    const availableTasks = tasks.filter(t => t.status === 'pending')
    
    // 에너지 레벨에 따른 최대 작업 수 조정
    let maxTasks: number
    switch (energyLevel) {
      case 'low':
        maxTasks = Math.max(2, Math.floor(availableTasks.length * 0.3))
        break
      case 'medium':
        maxTasks = Math.max(3, Math.floor(availableTasks.length * 0.6))
        break
      case 'high':
        maxTasks = Math.min(8, availableTasks.length)
        break
    }

    // 최근 완료율을 고려한 추가 조정
    if (recentCompletionRate < 0.5) {
      maxTasks = Math.floor(maxTasks * 0.7)
    }

    // 우선순위와 에너지 레벨에 맞는 작업 선택
    const sortedTasks = this.sortTasksByRealism(availableTasks, energyLevel)
    
    return sortedTasks.slice(0, maxTasks)
  }

  private createNoAdjustmentResult(tasks: Task[], completionRate: number): GoalAdjustment {
    return {
      type: 'reduce_tasks',
      message: `완료율이 ${Math.round(completionRate * 100)}%로 양호합니다. 현재 계획을 유지하세요!`,
      suggestedTasks: tasks,
      originalTaskCount: tasks.length,
      adjustedTaskCount: tasks.length,
      reason: '완료율이 기준 이상'
    }
  }

  private createDrasticReduction(tasks: Task[], options: GoalAdjustmentOptions): GoalAdjustment {
    const targetCount = Math.max(2, Math.floor(tasks.length * 0.4))
    const priorityTasks = this.selectHighPriorityTasks(tasks, targetCount)
    
    return {
      type: 'reduce_tasks',
      message: options.encouragingMessages 
        ? this.generateEncouragingMessage(0.3, 'reduce_tasks')
        : '작업 수를 대폭 줄여서 부담을 덜어보세요.',
      suggestedTasks: priorityTasks,
      originalTaskCount: tasks.length,
      adjustedTaskCount: priorityTasks.length,
      reason: '최근 완료율이 매우 낮음 (30% 미만)'
    }
  }

  private createModerateReduction(tasks: Task[], options: GoalAdjustmentOptions): GoalAdjustment {
    const targetCount = Math.max(3, Math.floor(tasks.length * 0.6))
    const selectedTasks = this.selectBalancedTasks(tasks, targetCount)
    
    return {
      type: 'reduce_tasks',
      message: options.encouragingMessages
        ? this.generateEncouragingMessage(0.4, 'reduce_tasks')
        : '작업 수를 적당히 줄여서 현실적인 목표를 세워보세요.',
      suggestedTasks: selectedTasks,
      originalTaskCount: tasks.length,
      adjustedTaskCount: selectedTasks.length,
      reason: '최근 완료율이 낮음 (30-50%)'
    }
  }

  private createMinorAdjustment(tasks: Task[], options: GoalAdjustmentOptions): GoalAdjustment {
    const targetCount = Math.max(4, Math.floor(tasks.length * 0.8))
    const adjustedTasks = this.selectRecentTasks(tasks, targetCount)
    
    return {
      type: 'lower_priority',
      message: options.encouragingMessages
        ? this.generateEncouragingMessage(0.5, 'lower_priority')
        : '우선순위를 조정해서 부담을 조금 줄여보세요.',
      suggestedTasks: adjustedTasks,
      originalTaskCount: tasks.length,
      adjustedTaskCount: adjustedTasks.length,
      reason: '일시적인 완료율 저조'
    }
  }

  private selectHighPriorityTasks(tasks: Task[], count: number): Task[] {
    return [...tasks]
      .sort((a, b) => {
        // 고정 작업 우선
        if (a.isFlexible !== b.isFlexible) {
          return a.isFlexible ? 1 : -1
        }
        // 높은 우선순위 우선
        const priorityWeight = { high: 3, medium: 2, low: 1 }
        return priorityWeight[b.priority] - priorityWeight[a.priority]
      })
      .slice(0, count)
  }

  private selectBalancedTasks(tasks: Task[], count: number): Task[] {
    const fixedTasks = tasks.filter(t => !t.isFlexible)
    const flexibleTasks = tasks.filter(t => t.isFlexible)
    
    // 고정 작업은 모두 포함, 유연 작업은 우선순위 순으로 선택
    const selectedFixed = fixedTasks.slice(0, Math.min(fixedTasks.length, count))
    const remainingSlots = count - selectedFixed.length
    
    const selectedFlexible = flexibleTasks
      .sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 }
        return priorityWeight[b.priority] - priorityWeight[a.priority]
      })
      .slice(0, remainingSlots)
    
    return [...selectedFixed, ...selectedFlexible]
  }

  private selectRecentTasks(tasks: Task[], count: number): Task[] {
    return [...tasks]
      .sort((a, b) => {
        // 최근 생성된 작업 우선 (사용자의 최신 의도 반영)
        const timeWeight = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        const priorityWeight = { high: 3, medium: 2, low: 1 }
        const priority = (priorityWeight[b.priority] - priorityWeight[a.priority]) * 1000
        
        return priority + timeWeight * 0.001
      })
      .slice(0, count)
  }

  private sortTasksByRealism(tasks: Task[], energyLevel: 'low' | 'medium' | 'high'): Task[] {
    return [...tasks].sort((a, b) => {
      // 에너지 레벨에 따른 작업 적합성 점수
      const scoreA = this.calculateRealismScore(a, energyLevel)
      const scoreB = this.calculateRealismScore(b, energyLevel)
      
      return scoreB - scoreA
    })
  }

  private calculateRealismScore(task: Task, energyLevel: 'low' | 'medium' | 'high'): number {
    let score = 0
    
    // 우선순위 점수
    const priorityScore = { high: 3, medium: 2, low: 1 }
    score += priorityScore[task.priority] * 10
    
    // 에너지 레벨 적합성
    const isShortTask = task.estimatedDuration <= 30
    const isLongTask = task.estimatedDuration > 60
    
    switch (energyLevel) {
      case 'low':
        if (isShortTask) score += 15
        if (isLongTask) score -= 10
        break
      case 'medium':
        score += 5 // 중립적
        break
      case 'high':
        if (isLongTask) score += 15
        if (isShortTask) score -= 5
        break
    }
    
    // 고정 작업 보너스
    if (!task.isFlexible) score += 20
    
    // 연기 횟수 페널티
    if (task.postponedCount) {
      score += task.postponedCount * 5 // 연기된 작업은 우선순위 상승
    }
    
    return score
  }
}

export const goalAdjustmentService = new GoalAdjustmentService()