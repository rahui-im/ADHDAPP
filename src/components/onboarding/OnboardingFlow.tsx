import React, { useEffect, useState, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/store'
import {
  selectIsFirstVisit,
  selectIsOnboardingActive,
  selectCurrentStep,
  startOnboarding,
  nextStep,
  previousStep,
  skipOnboarding,
  completeOnboarding,
  completeStep,
} from '../../store/onboardingSlice'
import { AnimatePresence, motion } from 'framer-motion'
import { WelcomeScreen } from './WelcomeScreen'
import { OnboardingSteps } from './OnboardingSteps'
import { KeyboardShortcuts } from './KeyboardShortcuts'
import { OnboardingProgress } from './OnboardingProgress'
import confetti from 'canvas-confetti'

// Onboarding step definitions
export const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'ADHD Time Manager에 오신 것을 환영합니다!',
    description: 'ADHD 친화적인 작업 관리 도구로 집중력을 높이고 생산성을 향상시키세요.',
    component: 'welcome',
  },
  {
    id: 'dashboard',
    title: '대시보드 둘러보기',
    description: '오늘의 할 일, 집중 시간, 성과를 한눈에 확인할 수 있습니다.',
    target: '.dashboard-container',
    component: 'tour',
  },
  {
    id: 'tasks',
    title: '작업 관리',
    description: '작업을 작은 단위로 나누고, 우선순위를 설정하여 효율적으로 관리하세요.',
    target: '.task-manager',
    component: 'tour',
  },
  {
    id: 'timer',
    title: '포모도로 타이머',
    description: '25분 집중, 5분 휴식의 포모도로 기법으로 집중력을 유지하세요.',
    target: '.pomodoro-timer',
    component: 'tour',
  },
  {
    id: 'focus-mode',
    title: '집중 모드',
    description: '방해 요소를 차단하고 현재 작업에만 집중할 수 있습니다.',
    target: '.focus-mode-toggle',
    component: 'tour',
  },
  {
    id: 'shortcuts',
    title: '키보드 단축키',
    description: '빠른 작업을 위한 키보드 단축키를 익혀보세요.',
    component: 'shortcuts',
  },
  {
    id: 'complete',
    title: '준비 완료!',
    description: '이제 ADHD Time Manager를 시작할 준비가 되었습니다.',
    component: 'complete',
  },
]

export const OnboardingFlow: React.FC = () => {
  const dispatch = useAppDispatch()
  const isFirstVisit = useAppSelector(selectIsFirstVisit)
  const isActive = useAppSelector(selectIsOnboardingActive)
  const currentStepIndex = useAppSelector(selectCurrentStep)
  const [showConfetti, setShowConfetti] = useState(false)

  const currentStep = ONBOARDING_STEPS[currentStepIndex]

  // Check if this is the first visit and start onboarding
  useEffect(() => {
    if (isFirstVisit && !isActive) {
      // Small delay to ensure the app is fully loaded
      const timer = setTimeout(() => {
        dispatch(startOnboarding())
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isFirstVisit, isActive, dispatch])

  const handleNext = useCallback(() => {
    dispatch(completeStep(currentStep.id))
    
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      dispatch(nextStep())
    } else {
      // Complete onboarding
      handleComplete()
    }
  }, [currentStepIndex, currentStep.id, dispatch])

  const handlePrevious = useCallback(() => {
    if (currentStepIndex > 0) {
      dispatch(previousStep())
    }
  }, [currentStepIndex, dispatch])

  const handleSkip = useCallback(() => {
    dispatch(skipOnboarding())
  }, [dispatch])

  const handleComplete = useCallback(() => {
    // Trigger confetti effect
    setShowConfetti(true)
    
    // Fire confetti
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 }

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min
    }

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        clearInterval(interval)
        setShowConfetti(false)
        dispatch(completeOnboarding())
        return
      }

      const particleCount = 50 * (timeLeft / duration)
      
      // Confetti from the left
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'],
      })
      
      // Confetti from the right
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'],
      })
    }, 250)
  }, [dispatch])

  if (!isActive) {
    return null
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="relative w-full max-w-4xl mx-4"
        >
          {/* Progress indicator */}
          <OnboardingProgress
            currentStep={currentStepIndex}
            totalSteps={ONBOARDING_STEPS.length}
            steps={ONBOARDING_STEPS}
          />

          {/* Content container */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            <AnimatePresence mode="wait">
              {currentStep.component === 'welcome' && (
                <WelcomeScreen
                  onNext={handleNext}
                  onSkip={handleSkip}
                />
              )}
              
              {currentStep.component === 'tour' && (
                <OnboardingSteps
                  step={currentStep}
                  stepIndex={currentStepIndex}
                  totalSteps={ONBOARDING_STEPS.length}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  onSkip={handleSkip}
                />
              )}
              
              {currentStep.component === 'shortcuts' && (
                <KeyboardShortcuts
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  onSkip={handleSkip}
                />
              )}
              
              {currentStep.component === 'complete' && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-12 text-center"
                >
                  <div className="mb-8">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <svg
                        className="w-12 h-12 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                      {currentStep.title}
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                      {currentStep.description}
                    </p>
                  </div>
                  
                  <button
                    onClick={handleComplete}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
                  >
                    시작하기
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default OnboardingFlow