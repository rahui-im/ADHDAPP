import React from 'react'
import { motion } from 'framer-motion'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  type?: 'spinner' | 'dots' | 'pulse' | 'bars'
  text?: string
  fullScreen?: boolean
  className?: string
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  color = 'primary',
  type = 'spinner',
  text,
  fullScreen = false,
  className = '',
}) => {
  // 크기별 클래스
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }
  
  // 색상별 클래스
  const colorClasses = {
    primary: 'text-primary-500',
    secondary: 'text-gray-500',
    success: 'text-success-500',
    warning: 'text-warning-500',
    danger: 'text-red-500',
  }
  
  // 스피너 컴포넌트
  const Spinner = () => (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}>
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  )
  
  // 점 애니메이션 컴포넌트
  const Dots = () => {
    const dotSize = {
      sm: 'w-1.5 h-1.5',
      md: 'w-2 h-2',
      lg: 'w-3 h-3',
      xl: 'w-4 h-4',
    }
    
    return (
      <div className="flex space-x-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={`${dotSize[size]} ${colorClasses[color]} bg-current rounded-full`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: index * 0.2,
            }}
          />
        ))}
      </div>
    )
  }
  
  // 펄스 애니메이션 컴포넌트
  const Pulse = () => (
    <motion.div
      className={`${sizeClasses[size]} ${colorClasses[color]} bg-current rounded-full`}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
      }}
    />
  )
  
  // 바 애니메이션 컴포넌트
  const Bars = () => {
    const barHeight = {
      sm: 'h-3',
      md: 'h-4',
      lg: 'h-6',
      xl: 'h-8',
    }
    
    const barWidth = {
      sm: 'w-0.5',
      md: 'w-1',
      lg: 'w-1.5',
      xl: 'w-2',
    }
    
    return (
      <div className="flex items-end space-x-1">
        {[0, 1, 2, 3, 4].map((index) => (
          <motion.div
            key={index}
            className={`${barWidth[size]} ${barHeight[size]} ${colorClasses[color]} bg-current rounded-sm`}
            animate={{
              scaleY: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: index * 0.1,
            }}
          />
        ))}
      </div>
    )
  }
  
  // 로딩 타입별 컴포넌트 선택
  const LoadingComponent = () => {
    switch (type) {
      case 'dots':
        return <Dots />
      case 'pulse':
        return <Pulse />
      case 'bars':
        return <Bars />
      default:
        return <Spinner />
    }
  }
  
  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <LoadingComponent />
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`text-sm font-medium ${colorClasses[color]} text-center`}
        >
          {text}
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
        className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50"
      >
        {content}
      </motion.div>
    )
  }
  
  return content
}

// 인라인 로딩 컴포넌트 (버튼 내부 등에서 사용)
interface InlineLoadingProps {
  size?: 'sm' | 'md'
  color?: 'white' | 'current'
  className?: string
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  size = 'sm',
  color = 'current',
  className = '',
}) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  const colorClass = color === 'white' ? 'text-white' : 'text-current'
  
  return (
    <div className={`${sizeClass} ${colorClass} animate-spin ${className}`}>
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  )
}

export { Loading }
export default Loading