import { Task } from '../types'

export interface TaskRecommendation {
  task: Task
  reason: string
  priority: number // 1-10, 높을수록 더 추천
}

export class TaskRecommendationService {
  /**
   * 에너지 레벨에 따른 작업 추천
   */
  static getRecommendationsByEnergyLevel(
    tasks: Task[],
    energyLevel: 'low' | 'medium' | 'high'
  ): TaskRecommendation[] {
    const pendingTasks = tasks.filter(task => task.status === 'pending')
    const recommendations: TaskRecommendation[] = []

    for (const task of pendingTasks) {
      const recommendation = this.evaluateTaskForEnergyLevel(task, energyLevel)
      if (recommendation) {
        recommendations.push(recommendation)
      }
    }

    // 우선순위 순으로 정렬
    return recommendations.sort((a, b) => b.priority - a.priority)
  }

  /**
   * 특정 작업이 현재 에너지 레벨에 적합한지 평가
   */
  private static evaluateTaskForEnergyLevel(
    task: Task,
    energyLevel: 'low' | 'medium' | 'high'
  ): TaskRecommendation | null {
    let priority = 0
    let reason = ''

    switch (energyLevel) {
      case 'high':
        // 높은 에너지: 어려운 작업, 긴 작업, 높은 우선순위 작업 추천
        if (task.priority === 'high') {
          priority += 4
          reason += '중요한 작업이에요. '
        }
        
        if (task.estimatedDuration > 45) {
          priority += 3
          reason += '집중력이 좋을 때 긴 작업을 해보세요. '
        }
        
        if (task.category === '업무' || task.category === '학습') {
          priority += 2
          reason += '에너지가 높을 때 도전적인 작업을 추천해요. '
        }
        
        // 하위 작업이 많은 복잡한 작업
        if (task.subtasks.length > 3) {
          priority += 2
          reason += '복잡한 작업을 차근차근 진행하기 좋은 상태예요. '
        }
        break

      case 'medium':
        // 보통 에너지: 적당한 난이도와 시간의 작업 추천
        if (task.priority === 'medium') {
          priority += 3
          reason += '적당한 우선순위의 작업이에요. '
        }
        
        if (task.estimatedDuration >= 25 && task.estimatedDuration <= 45) {
          priority += 3
          reason += '적당한 길이의 작업으로 좋아요. '
        }
        
        if (task.category === '개인' || task.category === '정리') {
          priority += 2
          reason += '꾸준히 진행하기 좋은 작업이에요. '
        }
        
        // 너무 어렵지 않은 작업
        if (task.subtasks.length <= 3 && task.subtasks.length > 0) {
          priority += 2
          reason += '단계별로 진행하기 적당해요. '
        }
        break

      case 'low':
        // 낮은 에너지: 쉬운 작업, 짧은 작업, 정리 작업 추천
        if (task.priority === 'low') {
          priority += 3
          reason += '부담 없이 시작할 수 있는 작업이에요. '
        }
        
        if (task.estimatedDuration <= 25) {
          priority += 4
          reason += '짧은 시간에 완료할 수 있어요. '
        }
        
        if (task.category === '정리' || task.category === '간단한 업무') {
          priority += 3
          reason += '에너지가 낮을 때 하기 좋은 작업이에요. '
        }
        
        // 창의적이거나 재미있는 작업
        if (task.category === '취미' || task.category === '창작') {
          priority += 2
          reason += '기분 전환에 도움이 될 거예요. '
        }
        
        // 단순한 작업 (하위 작업이 적거나 없음)
        if (task.subtasks.length <= 1) {
          priority += 2
          reason += '복잡하지 않아서 부담 없어요. '
        }
        
        // 업무나 학습 작업은 우선순위 낮춤
        if (task.category === '업무' || task.category === '학습') {
          priority -= 2
        }
        break
    }

    // 최소 우선순위 임계값
    if (priority < 2) {
      return null
    }

    // 유연한 일정인 작업에 보너스
    if (task.isFlexible) {
      priority += 1
      reason += '일정 조정이 가능한 작업이에요. '
    }

    return {
      task,
      reason: reason.trim(),
      priority: Math.min(priority, 10) // 최대 10점
    }
  }

  /**
   * 시간대별 작업 추천
   */
  static getRecommendationsByTimeOfDay(
    tasks: Task[],
    currentHour: number
  ): TaskRecommendation[] {
    const pendingTasks = tasks.filter(task => task.status === 'pending')
    const recommendations: TaskRecommendation[] = []

    for (const task of pendingTasks) {
      const recommendation = this.evaluateTaskForTimeOfDay(task, currentHour)
      if (recommendation) {
        recommendations.push(recommendation)
      }
    }

    return recommendations.sort((a, b) => b.priority - a.priority)
  }

  private static evaluateTaskForTimeOfDay(
    task: Task,
    currentHour: number
  ): TaskRecommendation | null {
    let priority = 0
    let reason = ''

    // 오전 (6-12시): 집중력이 높은 시간
    if (currentHour >= 6 && currentHour < 12) {
      if (task.priority === 'high' || task.category === '업무') {
        priority += 3
        reason += '오전은 집중력이 좋은 시간이에요. '
      }
      
      if (task.estimatedDuration > 30) {
        priority += 2
        reason += '긴 작업을 하기 좋은 시간대예요. '
      }
    }
    
    // 오후 (12-18시): 적당한 활동 시간
    else if (currentHour >= 12 && currentHour < 18) {
      if (task.priority === 'medium') {
        priority += 2
        reason += '오후에 적당한 작업이에요. '
      }
      
      if (task.category === '개인' || task.category === '정리') {
        priority += 2
        reason += '오후에 개인 업무를 처리하기 좋아요. '
      }
    }
    
    // 저녁 (18-22시): 가벼운 작업이나 정리
    else if (currentHour >= 18 && currentHour < 22) {
      if (task.priority === 'low' || task.estimatedDuration <= 25) {
        priority += 2
        reason += '저녁에 가볍게 할 수 있는 작업이에요. '
      }
      
      if (task.category === '취미' || task.category === '창작') {
        priority += 3
        reason += '저녁에 여유롭게 할 수 있는 활동이에요. '
      }
    }
    
    // 늦은 시간 (22시 이후): 간단한 정리나 계획
    else {
      if (task.estimatedDuration <= 15) {
        priority += 2
        reason += '잠들기 전 간단히 할 수 있어요. '
      }
      
      if (task.category === '정리' || task.category === '계획') {
        priority += 2
        reason += '하루를 마무리하며 하기 좋은 작업이에요. '
      }
    }

    return priority >= 2 ? { task, reason: reason.trim(), priority } : null
  }

  /**
   * 종합적인 작업 추천 (에너지 레벨 + 시간대 + 기타 요소)
   */
  static getComprehensiveRecommendations(
    tasks: Task[],
    energyLevel: 'low' | 'medium' | 'high',
    currentHour?: number
  ): TaskRecommendation[] {
    const energyRecommendations = this.getRecommendationsByEnergyLevel(tasks, energyLevel)
    
    if (currentHour !== undefined) {
      const timeRecommendations = this.getRecommendationsByTimeOfDay(tasks, currentHour)
      
      // 두 추천을 결합하여 점수 조정
      const combinedMap = new Map<string, TaskRecommendation>()
      
      // 에너지 기반 추천을 기본으로 설정
      for (const rec of energyRecommendations) {
        combinedMap.set(rec.task.id, rec)
      }
      
      // 시간대 추천으로 점수 보정
      for (const timeRec of timeRecommendations) {
        const existing = combinedMap.get(timeRec.task.id)
        if (existing) {
          existing.priority = Math.min(existing.priority + Math.floor(timeRec.priority / 2), 10)
          existing.reason += ` ${timeRec.reason}`
        }
      }
      
      return Array.from(combinedMap.values()).sort((a, b) => b.priority - a.priority)
    }
    
    return energyRecommendations
  }
}