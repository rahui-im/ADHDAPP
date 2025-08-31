import React from 'react'
import { motion } from 'framer-motion'

interface WelcomeScreenProps {
  onNext: () => void
  onSkip: () => void
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNext, onSkip }) => {
  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-12"
    >
      {/* Header with logo and title */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', damping: 15 }}
          className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg"
        >
          <svg
            className="w-20 h-20 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
        >
          ADHD Time Manager
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-gray-600 dark:text-gray-300"
        >
          집중력을 높이고 작업을 효율적으로 관리하세요
        </motion.p>
      </div>

      {/* Features grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="grid md:grid-cols-2 gap-6 mb-12"
      >
        <FeatureCard
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          title="스마트한 작업 관리"
          description="작업을 작은 단위로 나누고 우선순위를 설정하여 관리하세요"
          delay={0.6}
        />
        
        <FeatureCard
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          title="집중 모드"
          description="방해 요소를 차단하고 현재 작업에만 집중할 수 있습니다"
          delay={0.7}
        />
        
        <FeatureCard
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="포모도로 타이머"
          description="25분 집중, 5분 휴식으로 최적의 생산성을 유지하세요"
          delay={0.8}
        />
        
        <FeatureCard
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          title="진행 상황 추적"
          description="일일 및 주간 성과를 추적하고 패턴을 분석합니다"
          delay={0.9}
        />
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex justify-between items-center"
      >
        <button
          onClick={onSkip}
          className="px-6 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          건너뛰기
        </button>
        
        <button
          onClick={onNext}
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
        >
          시작하기
        </button>
      </motion.div>
    </motion.div>
  )
}

// Feature card component
const FeatureCard: React.FC<{
  icon: React.ReactNode
  title: string
  description: string
  delay: number
}> = ({ icon, title, description, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  )
}