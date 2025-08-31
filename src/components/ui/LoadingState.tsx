import React from 'react'
import { motion } from 'framer-motion'

interface LoadingStateProps {
  message?: string
  variant?: 'spinner' | 'dots' | 'pulse'
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = '로딩 중...',
  variant = 'spinner',
  size = 'md',
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  }

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex gap-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className={`${sizeClasses[size === 'lg' ? 'sm' : 'sm']} bg-primary-500 rounded-full`}
                animate={{
                  y: ['0%', '-50%', '0%'],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: index * 0.1,
                }}
              />
            ))}
          </div>
        )
      
      case 'pulse':
        return (
          <motion.div
            className={`${sizeClasses[size]} bg-primary-500 rounded-full`}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          />
        )
      
      default:
        return (
          <motion.div
            className={`${sizeClasses[size]} border-4 border-gray-200 dark:border-gray-700 border-t-primary-500 rounded-full`}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )
    }
  }

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {renderLoader()}
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-600 dark:text-gray-400 text-sm font-medium"
        >
          {message}
        </motion.p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        {content}
      </motion.div>
    )
  }

  return content
}

export default LoadingState