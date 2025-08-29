import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../ui/Button'
import Card from '../ui/Card'

export interface MindfulnessActivity {
  id: string
  type: 'breathing' | 'stretching' | 'meditation' | 'grounding'
  title: string
  description: string
  duration: number // seconds
  instructions: string[]
  icon: string
}

interface MindfulnessActivitiesProps {
  isVisible: boolean
  onClose: () => void
  onComplete: (activityId: string, duration: number) => void
}

const ACTIVITIES: MindfulnessActivity[] = [
  {
    id: 'box-breathing',
    type: 'breathing',
    title: '박스 호흡법',
    description: '4-4-4-4 리듬으로 마음을 진정시키는 호흡법입니다.',
    duration: 120, // 2분
    instructions: [
      '편안한 자세로 앉아주세요',
      '4초 동안 천천히 숨을 들이마시세요',
      '4초 동안 숨을 참아주세요',
      '4초 동안 천천히 숨을 내쉬세요',
      '4초 동안 잠시 멈춰주세요',
      '이 과정을 반복해주세요'
    ],
    icon: '🫁'
  },
  {
    id: 'neck-stretch',
    type: 'stretching',
    title: '목과 어깨 스트레칭',
    description: '긴장된 목과 어깨를 풀어주는 간단한 스트레칭입니다.',
    duration: 180, // 3분
    instructions: [
      '의자에 바르게 앉아주세요',
      '목을 천천히 오른쪽으로 기울여 10초 유지',
      '목을 천천히 왼쪽으로 기울여 10초 유지',
      '어깨를 천천히 뒤로 돌려주세요 (5회)',
      '어깨를 천천히 앞으로 돌려주세요 (5회)',
      '목을 천천히 앞뒤로 움직여주세요'
    ],
    icon: '🤸‍♀️'
  },
  {
    id: 'five-senses',
    type: 'grounding',
    title: '5-4-3-2-1 그라운딩',
    description: '현재 순간에 집중하는 그라운딩 기법입니다.',
    duration: 300, // 5분
    instructions: [
      '주변을 둘러보며 보이는 것 5가지를 찾아보세요',
      '만질 수 있는 것 4가지를 찾아 실제로 만져보세요',
      '들리는 소리 3가지에 집중해보세요',
      '냄새나는 것 2가지를 찾아보세요',
      '맛볼 수 있는 것 1가지를 찾아보세요',
      '천천히 깊게 숨을 쉬며 현재에 집중하세요'
    ],
    icon: '🌱'
  },
  {
    id: 'mini-meditation',
    type: 'meditation',
    title: '3분 미니 명상',
    description: '짧지만 효과적인 집중력 회복 명상입니다.',
    duration: 180, // 3분
    instructions: [
      '편안한 자세로 앉아 눈을 감아주세요',
      '자연스러운 호흡에 집중해주세요',
      '생각이 떠오르면 판단하지 말고 그냥 흘려보내세요',
      '호흡으로 다시 돌아와주세요',
      '몸의 긴장을 천천히 풀어주세요',
      '마음이 평온해지는 것을 느껴보세요'
    ],
    icon: '🧘‍♀️'
  }
]

const MindfulnessActivities: React.FC<MindfulnessActivitiesProps> = ({
  isVisible,
  onClose,
  onComplete,
}) => {
  const [selectedActivity, setSelectedActivity] = useState<MindfulnessActivity | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)

  // 타이머 정리
  useEffect(() => {
    return () => {
      if (timer) {
        clearInterval(timer)
      }
    }
  }, [timer])

  // 활동 선택
  const handleSelectActivity = (activity: MindfulnessActivity) => {
    setSelectedActivity(activity)
    setCurrentStep(0)
    setTimeRemaining(activity.duration)
  }

  // 활동 시작
  const handleStartActivity = () => {
    if (!selectedActivity) return

    setIsActive(true)
    setTimeRemaining(selectedActivity.duration)

    const newTimer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleCompleteActivity()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    setTimer(newTimer)
  }

  // 활동 완료
  const handleCompleteActivity = () => {
    if (timer) {
      clearInterval(timer)
      setTimer(null)
    }

    if (selectedActivity) {
      onComplete(selectedActivity.id, selectedActivity.duration - timeRemaining)
    }

    setIsActive(false)
    setSelectedActivity(null)
    setCurrentStep(0)
  }

  // 활동 중단
  const handleStopActivity = () => {
    if (timer) {
      clearInterval(timer)
      setTimer(null)
    }
    setIsActive(false)
  }

  // 다음 단계
  const handleNextStep = () => {
    if (selectedActivity && currentStep < selectedActivity.instructions.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  // 이전 단계
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 활동 타입별 색상
  const getActivityColor = (type: MindfulnessActivity['type']) => {
    switch (type) {
      case 'breathing':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'stretching':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'meditation':
        return 'bg-purple-50 border-purple-200 text-purple-800'
      case 'grounding':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <Card className="bg-white">
            {!selectedActivity ? (
              // 활동 선택 화면
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    마인드풀니스 활동 🧘‍♀️
                  </h2>
                  <p className="text-gray-600">
                    집중력을 회복하고 마음을 진정시키는 활동을 선택해보세요.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {ACTIVITIES.map((activity) => (
                    <motion.button
                      key={activity.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectActivity(activity)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${getActivityColor(activity.type)} hover:shadow-md`}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{activity.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{activity.title}</h3>
                          <p className="text-sm opacity-80 mb-2">{activity.description}</p>
                          <div className="text-xs opacity-60">
                            약 {Math.ceil(activity.duration / 60)}분
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="flex justify-center">
                  <Button variant="secondary" onClick={onClose}>
                    닫기
                  </Button>
                </div>
              </div>
            ) : (
              // 선택된 활동 화면
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl mb-2">{selectedActivity.icon}</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedActivity.title}
                  </h2>
                  <p className="text-gray-600">{selectedActivity.description}</p>
                </div>

                {!isActive ? (
                  // 시작 전 안내
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-3">진행 방법:</h3>
                      <ol className="space-y-2">
                        {selectedActivity.instructions.map((instruction, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                            <span className="flex-shrink-0 w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-semibold">
                              {index + 1}
                            </span>
                            <span>{instruction}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        variant="primary"
                        fullWidth
                        onClick={handleStartActivity}
                        icon={<span>▶️</span>}
                      >
                        시작하기 ({Math.ceil(selectedActivity.duration / 60)}분)
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setSelectedActivity(null)}
                      >
                        뒤로
                      </Button>
                    </div>
                  </div>
                ) : (
                  // 활동 진행 중
                  <div className="space-y-6">
                    {/* 타이머 */}
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary-600 mb-2">
                        {formatTime(timeRemaining)}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all duration-1000"
                          style={{
                            width: `${((selectedActivity.duration - timeRemaining) / selectedActivity.duration) * 100}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* 현재 단계 */}
                    <div className="bg-primary-50 p-6 rounded-lg text-center">
                      <div className="text-sm text-primary-600 mb-2">
                        단계 {currentStep + 1} / {selectedActivity.instructions.length}
                      </div>
                      <p className="text-lg text-primary-800 font-medium">
                        {selectedActivity.instructions[currentStep]}
                      </p>
                    </div>

                    {/* 단계 네비게이션 */}
                    <div className="flex justify-between items-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handlePrevStep}
                        disabled={currentStep === 0}
                      >
                        이전
                      </Button>

                      <div className="flex space-x-2">
                        {selectedActivity.instructions.map((_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full ${
                              index === currentStep ? 'bg-primary-500' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleNextStep}
                        disabled={currentStep === selectedActivity.instructions.length - 1}
                      >
                        다음
                      </Button>
                    </div>

                    {/* 컨트롤 버튼 */}
                    <div className="flex space-x-3">
                      <Button
                        variant="success"
                        fullWidth
                        onClick={handleCompleteActivity}
                        icon={<span>✅</span>}
                      >
                        완료
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={handleStopActivity}
                      >
                        중단
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default MindfulnessActivities