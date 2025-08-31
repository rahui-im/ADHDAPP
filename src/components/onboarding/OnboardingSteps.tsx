import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface OnboardingStepsProps {
  step: {
    id: string
    title: string
    description: string
    target?: string
  }
  stepIndex: number
  totalSteps: number
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
}

export const OnboardingSteps: React.FC<OnboardingStepsProps> = ({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
}) => {
  const highlightRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Highlight the target element if specified
    if (step.target) {
      const targetElement = document.querySelector(step.target)
      
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect()
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

        // Add highlight overlay
        if (highlightRef.current) {
          highlightRef.current.style.position = 'fixed'
          highlightRef.current.style.top = `${rect.top - 10}px`
          highlightRef.current.style.left = `${rect.left - 10}px`
          highlightRef.current.style.width = `${rect.width + 20}px`
          highlightRef.current.style.height = `${rect.height + 20}px`
          highlightRef.current.style.zIndex = '9998'
        }

        // Scroll to element if needed
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        
        // Add pulse animation to target
        targetElement.classList.add('onboarding-highlight')
        
        return () => {
          targetElement.classList.remove('onboarding-highlight')
        }
      }
    }
  }, [step.target])

  // Content for different step types
  const getStepContent = () => {
    switch (step.id) {
      case 'dashboard':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">오늘의 개요</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">할 일, 집중 시간, 완료율을 확인하세요</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">진행 상황 추적</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">일일 및 주간 성과를 모니터링합니다</p>
              </div>
            </div>
          </div>
        )
        
      case 'tasks':
        return (
          <div className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center text-xs font-semibold text-purple-600 dark:text-purple-400">1</span>
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">작업 추가</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">새로운 작업을 빠르게 추가하세요</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center text-xs font-semibold text-purple-600 dark:text-purple-400">2</span>
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">작업 분할</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">큰 작업을 작은 단위로 나누어 관리하세요</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center text-xs font-semibold text-purple-600 dark:text-purple-400">3</span>
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">우선순위 설정</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">중요도와 긴급도에 따라 정렬하세요</p>
                </div>
              </li>
            </ul>
          </div>
        )
        
      case 'timer':
        return (
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">포모도로 기법</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">25분 집중 + 5분 휴식</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                과학적으로 입증된 시간 관리 기법으로 집중력을 유지하면서 번아웃을 방지합니다.
              </p>
            </div>
            
            <div className="flex items-center justify-around bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <button className="p-2 text-gray-600 dark:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button className="p-2 text-gray-600 dark:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button className="p-2 text-gray-600 dark:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
            </div>
          </div>
        )
        
      case 'focus-mode':
        return (
          <div className="space-y-4">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">집중 모드 기능</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>알림 일시 중지</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>현재 작업만 표시</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>방해 차단 모드</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>집중 시간 추적</span>
                </li>
              </ul>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 italic">
              집중 모드를 활성화하면 방해 요소가 최소화되어 현재 작업에만 몰입할 수 있습니다.
            </p>
          </div>
        )
        
      default:
        return null
    }
  }

  return (
    <>
      {/* Highlight overlay for target element */}
      {step.target && (
        <div 
          ref={highlightRef}
          className="pointer-events-none border-4 border-blue-500 rounded-lg animate-pulse"
          style={{
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          }}
        />
      )}
      
      {/* Step content */}
      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-8"
      >
        {/* Step header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {step.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {step.description}
          </p>
        </div>

        {/* Step specific content */}
        <div className="mb-8">
          {getStepContent()}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            건너뛰기
          </button>
          
          <div className="flex space-x-3">
            {stepIndex > 0 && (
              <button
                onClick={onPrevious}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                이전
              </button>
            )}
            
            <button
              onClick={onNext}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
            >
              {stepIndex === totalSteps - 1 ? '완료' : '다음'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

// Add CSS for highlighting effect
const style = document.createElement('style')
style.textContent = `
  .onboarding-highlight {
    position: relative;
    z-index: 9999 !important;
    animation: pulse-border 2s infinite;
  }
  
  @keyframes pulse-border {
    0% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
    }
  }
`
document.head.appendChild(style)