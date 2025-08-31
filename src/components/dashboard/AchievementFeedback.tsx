import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../ui/Button'

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  points: number
}

interface AchievementFeedbackProps {
  achievement: Achievement | null
  onDismiss: () => void
}

const AchievementFeedback: React.FC<AchievementFeedbackProps> = ({
  achievement,
  onDismiss
}) => {
  if (!achievement) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 성취 아이콘 */}
          <motion.div
            className="text-6xl mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            {achievement.icon}
          </motion.div>
          
          {/* 축하 메시지 */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              🎉 축하합니다!
            </h2>
            
            <h3 className="text-xl font-semibold text-blue-600 mb-3">
              {achievement.title}
            </h3>
            
            <p className="text-gray-600 mb-4 leading-relaxed">
              {achievement.description}
            </p>
            
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 mb-6">
              <div className="text-lg font-bold text-purple-600">
                +{achievement.points} 포인트 획득!
              </div>
            </div>
          </motion.div>
          
          {/* 액션 버튼 */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={onDismiss}
            >
              계속하기
            </Button>
          </motion.div>
          
          {/* 배경 장식 */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${10 + (i % 2) * 80}%`,
                }}
                animate={{
                  y: [0, -10, 0],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default AchievementFeedback