import confetti from 'canvas-confetti'

// 기본 색상 팔레트
const colors = {
  success: ['#10b981', '#34d399', '#6ee7b7'],
  celebration: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
  achievement: ['#f59e0b', '#fbbf24', '#fcd34d'],
  primary: ['#3b82f6', '#60a5fa', '#93c5fd']
}

// 작업 완료 효과
export const taskCompleteConfetti = () => {
  const count = 200
  const defaults = {
    origin: { y: 0.7 },
    colors: colors.success
  }

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    })
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  })
  
  fire(0.2, {
    spread: 60,
  })
  
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  })
  
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
  })
  
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  })
}

// 포모도로 완료 효과
export const pomodoroCompleteConfetti = () => {
  const end = Date.now() + 3 * 1000 // 3초간 지속

  const frame = () => {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors.celebration
    })
    
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors.celebration
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }

  frame()
}

// 성과 달성 효과
export const achievementConfetti = () => {
  const duration = 5 * 1000
  const animationEnd = Date.now() + duration
  const defaults = { 
    startVelocity: 30, 
    spread: 360, 
    ticks: 60, 
    zIndex: 0,
    colors: colors.achievement
  }

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    const particleCount = 50 * (timeLeft / duration)

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    })
    
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    })
  }, 250)
}

// 마일스톤 달성 효과
export const milestoneConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: colors.primary
  })
  
  setTimeout(() => {
    confetti({
      particleCount: 100,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.6 },
      colors: colors.primary
    })
  }, 200)
  
  setTimeout(() => {
    confetti({
      particleCount: 100,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.6 },
      colors: colors.primary
    })
  }, 400)
}

// 커스텀 효과
export const customConfetti = (options?: Partial<confetti.Options>) => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    ...options
  })
}