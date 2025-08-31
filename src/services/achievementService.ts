import { Achievement } from '../components/dashboard/AchievementFeedback'

export class AchievementService {
  /**
   * 작업 완료 시 성취 생성
   */
  static createTaskCompletionAchievement(taskTitle: string): Achievement {
    const achievements = [
      {
        title: "작업 완료!",
        description: `"${taskTitle}"를 성공적으로 완료했습니다!`,
        icon: "🎯",
        points: 10
      },
      {
        title: "목표 달성!",
        description: `"${taskTitle}" 완료! 한 걸음 더 나아갔어요!`,
        icon: "✅",
        points: 10
      },
      {
        title: "성공!",
        description: `"${taskTitle}"를 끝까지 해냈어요!`,
        icon: "🌟",
        points: 10
      }
    ]

    const randomAchievement = achievements[Math.floor(Math.random() * achievements.length)]

    return {
      id: crypto.randomUUID(),
      title: randomAchievement.title,
      description: randomAchievement.description,
      icon: randomAchievement.icon,
      points: randomAchievement.points
    }
  }

  /**
   * 포모도로 완료 시 성취 생성
   */
  static createPomodoroCompletionAchievement(sessionCount: number): Achievement {
    const baseAchievements = [
      {
        title: "포모도로 완료!",
        description: "25분 집중을 성공적으로 마쳤습니다!",
        icon: "🍅",
        points: 15
      },
      {
        title: "집중 성공!",
        description: "깊은 집중 시간을 완주했어요!",
        icon: "⏰",
        points: 15
      }
    ]

    // 특별한 포모도로 수에 따른 추가 성취
    if (sessionCount === 1) {
      return {
        id: crypto.randomUUID(),
        title: "첫 포모도로!",
        description: "첫 번째 포모도로를 완료했어요! 좋은 시작이에요!",
        icon: "🎉",
        points: 20
      }
    }

    if (sessionCount === 4) {
      return {
        id: crypto.randomUUID(),
        title: "집중력 마스터!",
        description: "4개의 포모도로를 완료했어요! 대단한 집중력이에요!",
        icon: "🔥",
        points: 30
      }
    }

    if (sessionCount === 8) {
      return {
        id: crypto.randomUUID(),
        title: "집중의 신!",
        description: "8개의 포모도로! 정말 놀라운 집중력이에요!",
        icon: "👑",
        points: 50
      }
    }

    const randomAchievement = baseAchievements[Math.floor(Math.random() * baseAchievements.length)]

    return {
      id: crypto.randomUUID(),
      title: randomAchievement.title,
      description: randomAchievement.description,
      icon: randomAchievement.icon,
      points: randomAchievement.points
    }
  }

  /**
   * 연속 달성 마일스톤 성취 생성
   */
  static createStreakMilestoneAchievement(streakDays: number): Achievement | null {
    const milestones = [
      { days: 3, title: "3일 연속!", description: "3일 연속 목표 달성! 습관이 만들어지고 있어요!", icon: "🌟", points: 30 },
      { days: 7, title: "일주일 연속!", description: "7일 연속 달성! 정말 대단한 의지력이에요!", icon: "⚡", points: 50 },
      { days: 14, title: "2주 연속!", description: "2주 연속! 이제 진짜 습관이 되었어요!", icon: "🔥", points: 100 },
      { days: 21, title: "3주 연속!", description: "21일 연속! 과학적으로 습관이 형성되었어요!", icon: "🏆", points: 150 },
      { days: 30, title: "한 달 연속!", description: "30일 연속! 당신은 진정한 챔피언입니다!", icon: "👑", points: 200 }
    ]

    const milestone = milestones.find(m => m.days === streakDays)
    if (!milestone) return null

    return {
      id: crypto.randomUUID(),
      title: milestone.title,
      description: milestone.description,
      icon: milestone.icon,
      points: milestone.points
    }
  }

  /**
   * 일일 목표 달성 성취 생성
   */
  static createDailyGoalAchievement(completionRate: number): Achievement | null {
    if (completionRate < 80) return null

    const achievements = [
      {
        title: "일일 목표 달성!",
        description: `오늘 목표의 ${completionRate}%를 달성했어요!`,
        icon: "🎯",
        points: 25
      },
      {
        title: "완벽한 하루!",
        description: "계획한 모든 것을 해냈어요! 정말 대단해요!",
        icon: "🌟",
        points: 30
      }
    ]

    const achievement = completionRate >= 100 ? achievements[1] : achievements[0]

    return {
      id: crypto.randomUUID(),
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      points: achievement.points
    }
  }

  /**
   * 집중 시간 목표 달성 성취 생성
   */
  static createFocusTimeAchievement(focusMinutes: number): Achievement | null {
    const milestones = [
      { minutes: 60, title: "1시간 집중!", description: "1시간 집중을 달성했어요!", icon: "⏰", points: 20 },
      { minutes: 120, title: "2시간 집중!", description: "2시간 집중! 정말 대단한 집중력이에요!", icon: "🧠", points: 40 },
      { minutes: 180, title: "3시간 집중!", description: "3시간 집중! 집중력의 마스터예요!", icon: "🔥", points: 60 },
      { minutes: 240, title: "4시간 집중!", description: "4시간 집중! 믿을 수 없는 집중력이에요!", icon: "👑", points: 80 }
    ]

    const milestone = milestones.find(m => m.minutes === focusMinutes)
    if (!milestone) return null

    return {
      id: crypto.randomUUID(),
      title: milestone.title,
      description: milestone.description,
      icon: milestone.icon,
      points: milestone.points
    }
  }

  /**
   * 특별한 성취들 (보너스)
   */
  static createSpecialAchievement(type: 'first_task' | 'perfect_week' | 'comeback'): Achievement {
    const specialAchievements = {
      first_task: {
        title: "첫 걸음!",
        description: "첫 번째 작업을 완료했어요! 모든 여행은 첫 걸음부터 시작됩니다!",
        icon: "🚀",
        points: 25
      },
      perfect_week: {
        title: "완벽한 한 주!",
        description: "일주일 동안 모든 목표를 달성했어요! 정말 대단해요!",
        icon: "🏆",
        points: 100
      },
      comeback: {
        title: "컴백!",
        description: "다시 시작하는 용기가 정말 멋져요! 포기하지 않는 마음이 최고예요!",
        icon: "💪",
        points: 30
      }
    }

    const achievement = specialAchievements[type]

    return {
      id: crypto.randomUUID(),
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      points: achievement.points
    }
  }

  /**
   * 성취 레벨 계산 (총 포인트 기반)
   */
  static calculateLevel(totalPoints: number): { level: number; title: string; nextLevelPoints: number } {
    const levels = [
      { level: 1, title: "새싹", minPoints: 0 },
      { level: 2, title: "초보자", minPoints: 100 },
      { level: 3, title: "학습자", minPoints: 250 },
      { level: 4, title: "실행자", minPoints: 500 },
      { level: 5, title: "숙련자", minPoints: 1000 },
      { level: 6, title: "전문가", minPoints: 2000 },
      { level: 7, title: "마스터", minPoints: 4000 },
      { level: 8, title: "전설", minPoints: 8000 },
      { level: 9, title: "신화", minPoints: 15000 },
      { level: 10, title: "불멸", minPoints: 30000 }
    ]

    let currentLevel = levels[0]
    let nextLevel = levels[1]

    for (let i = 0; i < levels.length - 1; i++) {
      if (totalPoints >= levels[i].minPoints && totalPoints < levels[i + 1].minPoints) {
        currentLevel = levels[i]
        nextLevel = levels[i + 1]
        break
      }
    }

    // 최고 레벨인 경우
    if (totalPoints >= levels[levels.length - 1].minPoints) {
      currentLevel = levels[levels.length - 1]
      nextLevel = { level: 11, title: "최고", minPoints: Infinity }
    }

    return {
      level: currentLevel.level,
      title: currentLevel.title,
      nextLevelPoints: nextLevel.minPoints - totalPoints
    }
  }

  /**
   * 격려 메시지 생성 (실패나 어려움이 있을 때)
   */
  static createEncouragementMessage(situation: 'low_completion' | 'missed_day' | 'distracted'): string {
    const messages = {
      low_completion: [
        "괜찮아요! 완벽하지 않아도 시작하는 것이 중요해요. 내일은 더 잘할 수 있을 거예요! 💪",
        "작은 진전도 진전이에요. 자신을 너무 혹독하게 대하지 마세요. 천천히 가도 괜찮아요! 🌱",
        "모든 날이 완벽할 수는 없어요. 오늘 한 것만으로도 충분히 대단해요! ✨",
        "실패는 성공의 어머니예요. 오늘의 경험이 내일을 더 나은 날로 만들어줄 거예요! 🌟"
      ],
      missed_day: [
        "하루 쉬었다고 해서 모든 게 끝나는 건 아니에요. 다시 시작하면 돼요! 🚀",
        "완벽한 사람은 없어요. 중요한 건 다시 일어서는 것이죠. 화이팅! 💪",
        "쉬는 것도 때로는 필요해요. 충분히 쉬었으니 이제 다시 시작해봐요! 🌈",
        "연속 기록이 끊어져도 괜찮아요. 새로운 기록을 만들어가면 되니까요! ⭐"
      ],
      distracted: [
        "집중하기 어려운 날이 있어요. 그런 날엔 더 작은 목표부터 시작해보세요! 🎯",
        "산만함도 ADHD의 일부예요. 자신을 이해하고 받아들이는 것부터 시작해요! 💝",
        "완벽한 집중은 없어요. 조금씩이라도 앞으로 나아가는 게 중요해요! 🐢",
        "오늘은 집중이 어려웠나요? 내일은 분명 더 나을 거예요. 포기하지 마세요! 🌅"
      ]
    }

    const situationMessages = messages[situation]
    return situationMessages[Math.floor(Math.random() * situationMessages.length)]
  }
}