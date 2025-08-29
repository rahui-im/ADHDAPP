import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

export interface Achievement {
  id: string
  type: 'task_completed' | 'pomodoro_completed' | 'streak_milestone' | 'daily_goal' | 'focus_time'
  title: string
  description: string
  icon: string
  color: string
  points: number
  timestamp: Date
}

interface AchievementFeedbackProps {
  achievement?: Achievement
  onDismiss?: () => void
  showEncouragement?: boolean
}

const AchievementFeedback: React.FC<AchievementFeedbackProps> = ({
  achievement,
  onDismiss,
  showEncouragement = true
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (achievement) {
      setIsVisible(true)
      setShowConfetti(true)
      
      // 자동으로 사라지게 하기 (5초 후)
      const timer = setTimeout(() => {
        handleDismiss()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [achievement])

  const handleDismiss = () => {
    setIsVisible(false)
    setShowConfetti(false)
    setTimeout(() => {
      onDismiss?.()
    }, 300)
  }

  if (!achievement) return null

  const getEncouragementMessage = (type: Achievement['type']) => {
    const messages = {
      task_completed: [
        "훌륭해요! 또 하나의 목표를 달성했네요! 🎯",
        "완료! 이런 식으로 계속 해나가면 됩니다! 💪",
        "성공! 작은 성취가 모여 큰 변화를 만들어요! ✨",
        "잘했어요! 꾸준함이 가장 큰 힘이에요! 🌟"
      ],
      pomodoro_completed: [
        "포모도로 완료! 집중력이 정말 좋아졌어요! 🍅",
        "25분 집중 성공! 이런 리듬을 유지해보세요! ⏰",
        "집중 완료! 뇌가 더 강해지고 있어요! 🧠",
        "포모도로 달성! 작은 집중이 큰 성과를 만들어요! 🎯"
      ],
      streak_milestone: [
        "연속 달성! 정말 대단한 의지력이에요! 🔥",
        "스트릭 달성! 꾸준함의 힘을 보여주고 있어요! 💎",
        "연속 기록! 이런 일관성이 성공의 비결이에요! 🏆",
        "스트릭 완성! 습관이 만들어지고 있어요! ⭐"
      ],
      daily_goal: [
        "일일 목표 달성! 오늘 하루 정말 수고했어요! 🎉",
        "하루 목표 완료! 계획한 대로 실행하는 능력이 훌륭해요! 👏",
        "데일리 골 성공! 이런 하루가 쌓여 큰 변화를 만들어요! 🌈",
        "오늘 목표 달성! 자신에게 자랑스러워해도 돼요! 🏅"
      ],
      focus_time: [
        "집중 시간 목표 달성! 뇌가 더 강해지고 있어요! 🧠",
        "포커스 타임 완료! 깊은 집중의 힘을 경험하고 있어요! 🎯",
        "집중 목표 성공! 이런 몰입이 최고의 성과를 만들어요! ⚡",
        "집중력 목표 달성! 정말 인상적인 집중력이에요! 🌟"
      ]
    }
    
    const typeMessages = messages[type] || messages.task_completed
    return typeMessages[Math.floor(Math.random() * typeMessages.length)]
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleDismiss}
          >
            {/* 성취 카드 */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 25 
              }}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className={`p-8 max-w-md mx-4 text-center bg-gradient-to-br ${achievement.color} border-2 border-white shadow-2xl`}>
                {/* 아이콘과 애니메이션 */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="text-6xl mb-4"
                >
                  {achievement.icon}
                </motion.div>

                {/* 제목 */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white mb-2"
                >
                  {achievement.title}
                </motion.h2>

                {/* 설명 */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white text-opacity-90 mb-4"
                >
                  {achievement.description}
                </motion.p>

                {/* 포인트 */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="bg-white bg-opacity-20 rounded-full px-4 py-2 mb-6 inline-block"
                >
                  <span className="text-white font-bold">
                    +{achievement.points} 포인트
                  </span>
                </motion.div>

                {/* 격려 메시지 */}
                {showEncouragement && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white bg-opacity-10 rounded-lg p-4 mb-6"
                  >
                    <p className="text-white text-sm">
                      {getEncouragementMessage(achievement.type)}
                    </p>
                  </motion.div>
                )}

                {/* 버튼 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button
                    variant="secondary"
                    onClick={handleDismiss}
                    className="bg-white text-gray-900 hover:bg-gray-100"
                  >
                    계속하기
                  </Button>
                </motion.div>
              </Card>

              {/* 컨페티 효과 */}
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        opacity: 1, 
                        y: 0, 
                        x: 0, 
                        scale: 1,
                        rotate: 0 
                      }}
                      animate={{ 
                        opacity: 0, 
                        y: -100 + Math.random() * -100, 
                        x: (Math.random() - 0.5) * 200,
                        scale: 0,
                        rotate: Math.random() * 360
                      }}
                      transition={{ 
                        duration: 2 + Math.random() * 2,
                        delay: Math.random() * 0.5
                      }}
                      className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 6)]
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default AchievementFeedback