import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { 
  XMarkIcon, 
  ArrowRightIcon, 
  ArrowLeftIcon,
  CheckIcon,
  LightBulbIcon,
  HeartIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface OnboardingStep {
  id: string
  title: string
  description: string
  content: React.ReactNode
  targetElement?: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  adhdTip?: string
}

interface OnboardingTourProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'ADHD Time Manager에 오신 것을 환영합니다! 🎉',
    description: 'ADHD 특성을 고려한 맞춤형 시간관리 도구입니다.',
    content: (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <SparklesIcon className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            당신을 위한 특별한 도구
          </h3>
          <p className="text-gray-600">
            ADHD를 가진 분들의 집중력과 생산성을 높이기 위해 특별히 설계되었습니다.
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <HeartIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">ADHD 친화적 설계</h4>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• 작업을 작은 단위로 자동 분할</li>
                <li>• 유연한 포모도로 타이머 (15/25/45분)</li>
                <li>• 비난하지 않는 격려 메시지</li>
                <li>• 에너지 레벨 기반 작업 추천</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    ),
    position: 'center',
    adhdTip: '완벽하지 않아도 괜찮습니다. 작은 진전도 큰 성취입니다!'
  },
  {
    id: 'tasks',
    title: '작업 관리의 마법 ✨',
    description: '큰 작업을 작은 조각으로 나누어 부담을 줄입니다.',
    content: (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">자동 작업 분할</h4>
          <p className="text-sm text-green-700 mb-3">
            25분 이상의 작업은 자동으로 15-25분 단위로 나누어집니다.
          </p>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-700">프로젝트 문서 작성 (90분)</span>
            </div>
            <div className="ml-5 space-y-1">
              <div className="flex items-center space-x-2">
                <CheckIcon className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">개요 작성 (20분)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                <span className="text-sm text-gray-600">본문 작성 (25분)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                <span className="text-sm text-gray-600">검토 및 수정 (25분)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
                <span className="text-sm text-gray-600">최종 정리 (20분)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    targetElement: '[data-tour="tasks"]',
    position: 'right',
    adhdTip: '작은 성취를 축하하세요. 각 하위 작업 완료도 큰 진전입니다!'
  },
  {
    id: 'timer',
    title: '유연한 포모도로 타이머 ⏰',
    description: '당신의 집중력에 맞는 시간을 선택하세요.',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">15분</div>
            <div className="text-xs text-blue-700">짧은 집중</div>
          </div>
          <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-2xl font-bold text-green-600">25분</div>
            <div className="text-xs text-green-700">표준</div>
          </div>
          <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">45분</div>
            <div className="text-xs text-purple-700">깊은 집중</div>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">에너지에 따른 추천</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• <strong>낮은 에너지:</strong> 15분 집중 + 간단한 작업</li>
            <li>• <strong>보통 에너지:</strong> 25분 집중 + 일반 작업</li>
            <li>• <strong>높은 에너지:</strong> 45분 집중 + 복잡한 작업</li>
          </ul>
        </div>
      </div>
    ),
    targetElement: '[data-tour="timer"]',
    position: 'left',
    adhdTip: '집중이 어려운 날에는 15분부터 시작하세요. 점진적으로 늘려가면 됩니다.'
  },
  {
    id: 'energy',
    title: '에너지 레벨 추적 ⚡',
    description: '현재 상태에 맞는 작업을 추천받으세요.',
    content: (
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <div>
              <div className="font-medium text-red-900">낮음</div>
              <div className="text-sm text-red-700">간단한 작업, 정리 업무</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <div>
              <div className="font-medium text-yellow-900">보통</div>
              <div className="text-sm text-yellow-700">일반적인 업무, 계획 세우기</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <div>
              <div className="font-medium text-green-900">높음</div>
              <div className="text-sm text-green-700">창의적 작업, 복잡한 문제 해결</div>
            </div>
          </div>
        </div>
      </div>
    ),
    targetElement: '[data-tour="energy"]',
    position: 'top',
    adhdTip: '에너지가 낮을 때 무리하지 마세요. 작은 성취도 의미 있습니다.'
  },
  {
    id: 'focus-mode',
    title: '집중 모드 🎯',
    description: '방해 요소를 최소화하고 집중력을 높입니다.',
    content: (
      <div className="space-y-4">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h4 className="font-medium text-indigo-900 mb-2">집중 모드 기능</h4>
          <ul className="text-sm text-indigo-700 space-y-1">
            <li>• 불필요한 UI 요소 숨김</li>
            <li>• 큰 타이머 화면으로 전환</li>
            <li>• 방해 요소 최소화</li>
            <li>• 부드러운 리마인더</li>
          </ul>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">비활성 감지</h4>
          <p className="text-sm text-gray-700">
            15분 이상 비활성 상태가 감지되면 부드럽게 집중을 유도합니다. 
            비난하지 않고 격려하는 메시지로 다시 시작할 수 있도록 도와드립니다.
          </p>
        </div>
      </div>
    ),
    targetElement: '[data-tour="focus-mode"]',
    position: 'bottom',
    adhdTip: '집중이 흐트러져도 괜찮습니다. 다시 시작하는 것이 중요해요.'
  },
  {
    id: 'achievements',
    title: '성취와 격려 🏆',
    description: '작은 성취도 축하하고 동기를 유지합니다.',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-sm font-medium text-purple-900">첫 포모도로</div>
          </div>
          <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-sm font-medium text-blue-900">3일 연속</div>
          </div>
          <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-2xl mb-1">⭐</div>
            <div className="text-sm font-medium text-green-900">작업 완료</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-2xl mb-1">💪</div>
            <div className="text-sm font-medium text-yellow-900">목표 달성</div>
          </div>
        </div>
        
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
          <h4 className="font-medium text-pink-900 mb-2">격려 메시지</h4>
          <p className="text-sm text-pink-700">
            "완벽하지 않아도 괜찮아요. 오늘 한 걸음 나아간 것만으로도 충분합니다!"
          </p>
        </div>
      </div>
    ),
    targetElement: '[data-tour="achievements"]',
    position: 'left',
    adhdTip: '모든 진전을 축하하세요. 작은 성취가 모여 큰 변화를 만듭니다.'
  },
  {
    id: 'complete',
    title: '준비 완료! 🚀',
    description: '이제 ADHD Time Manager를 사용할 준비가 되었습니다.',
    content: (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckIcon className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            시작할 준비가 되었습니다!
          </h3>
          <p className="text-gray-600">
            첫 번째 작업을 만들고 포모도로 타이머를 시작해보세요.
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">시작 팁</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>간단한 작업부터 시작하세요</li>
            <li>15분 타이머로 부담 없이 시작</li>
            <li>완료한 작업을 체크하며 성취감을 느끼세요</li>
            <li>에너지 레벨을 정직하게 기록하세요</li>
            <li>완벽하지 않아도 괜찮다는 것을 기억하세요</li>
          </ol>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500">
            언제든지 도움이 필요하면 설정에서 이 가이드를 다시 볼 수 있습니다.
          </p>
        </div>
      </div>
    ),
    position: 'center',
    adhdTip: '여정을 시작하는 것만으로도 이미 큰 첫걸음입니다. 자신을 믿으세요!'
  }
]

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setCurrentStep(0)
    }
  }, [isOpen])

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    setIsVisible(false)
    setTimeout(() => {
      onComplete()
      onClose()
    }, 300)
  }

  const handleSkip = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const currentStepData = onboardingSteps[currentStep]
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={handleSkip}
          />
          
          {/* 온보딩 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 z-50 flex items-center justify-center"
          >
            <Card className="w-full max-w-2xl max-h-full overflow-y-auto">
              {/* 헤더 */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {currentStep === 0 && '👋'}
                    {currentStep === 1 && '✨'}
                    {currentStep === 2 && '⏰'}
                    {currentStep === 3 && '⚡'}
                    {currentStep === 4 && '🎯'}
                    {currentStep === 5 && '🏆'}
                    {currentStep === 6 && '🚀'}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {currentStepData.title}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {currentStepData.description}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleSkip}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* 진행률 바 */}
              <div className="px-6 pt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>단계 {currentStep + 1} / {onboardingSteps.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* 콘텐츠 */}
              <div className="p-6">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentStepData.content}
                </motion.div>

                {/* ADHD 팁 */}
                {currentStepData.adhdTip && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg"
                  >
                    <div className="flex items-start space-x-3">
                      <LightBulbIcon className="w-5 h-5 text-pink-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-pink-900 mb-1">ADHD 팁</h4>
                        <p className="text-sm text-pink-700">
                          {currentStepData.adhdTip}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* 푸터 */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  {currentStep > 0 && (
                    <Button
                      onClick={handlePrevious}
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <ArrowLeftIcon className="w-4 h-4" />
                      <span>이전</span>
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleSkip}
                    variant="ghost"
                    size="sm"
                    className="text-gray-500"
                  >
                    건너뛰기
                  </Button>
                </div>

                <Button
                  onClick={handleNext}
                  className="flex items-center space-x-2"
                >
                  <span>
                    {currentStep === onboardingSteps.length - 1 ? '시작하기' : '다음'}
                  </span>
                  {currentStep === onboardingSteps.length - 1 ? (
                    <CheckIcon className="w-4 h-4" />
                  ) : (
                    <ArrowRightIcon className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default OnboardingTour