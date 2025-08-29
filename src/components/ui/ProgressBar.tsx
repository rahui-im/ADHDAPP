import React from 'react'
import { motion } from 'framer-motion'

interface ProgressBarProps {
  progress: number // 0-100
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'success' | 'warning' | 'danger'
  showLabel?: boolean
  label?: string
  animated?: boolean
  className?: string
  showMilestones?: boolean
  celebrateCompletion?: boolean
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  size = 'md',
  color = 'primary',
  showLabel = false,
  label,
  animated = true,
  className = '',
  showMilestones = false,
  celebrateCompletion = true,
}) => {
  // progress 값을 0-100 범위로 제한
  const clampedProgress = Math.max(0, Math.min(100, progress))
  const isComplete = clampedProgress >= 100
  
  // ADHD 친화적 크기: 더 큰 시각적 요소
  const sizeClasses = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-6',
    xl: 'h-8',
  }
  
  // ADHD 친화적 색상: 높은 대비, 명확한 구분
  const colorClasses = {
    primary: isComplete ? 'bg-gradient-to-r from-primary-500 to-primary-600' : 'bg-primary-500',
    success: isComplete ? 'bg-gradient-to-r from-success-500 to-success-600' : 'bg-success-500',
    warning: isComplete ? 'bg-gradient-to-r from-warning-500 to-warning-600' : 'bg-warning-500',
    danger: isComplete ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-red-500',
  }
  
  const backgroundColorClasses = {
    primary: 'bg-primary-100',
    success: 'bg-success-100',
    warning: 'bg-warning-100',
    danger: 'bg-red-100',
  }
  
  // 마일스톤 위치 (25%, 50%, 75%)
  const milestones = [25, 50, 75]
  
  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            {label || '진행률'}
            {isComplete && celebrateCompletion && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 500 }}
                className="text-lg"
              >
                🎉
              </motion.span>
            )}
          </span>
          <span className={`text-sm font-bold ${isComplete ? 'text-success-600' : 'text-gray-700'}`}>
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}
      
      <div className="relative">
        <div className={`w-full ${backgroundColorClasses[color]} rounded-full overflow-hidden ${sizeClasses[size]} shadow-inner border border-gray-200`}>
          <motion.div
            className={`h-full ${colorClasses[color]} rounded-full relative overflow-hidden`}
            initial={{ width: 0 }}
            animate={{ width: `${clampedProgress}%` }}
            transition={animated ? { duration: 0.8, ease: 'easeOut' } : { duration: 0 }}
          >
            {/* 진행률 바 내부 애니메이션 효과 */}
            {animated && clampedProgress > 0 && (
              <motion.div
                className="absolute inset-0 bg-white opacity-20"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            )}
          </motion.div>
        </div>
        
        {/* 마일스톤 표시 */}
        {showMilestones && (
          <div className="absolute inset-0 flex items-center">
            {milestones.map((milestone) => (
              <div
                key={milestone}
                className="absolute w-0.5 h-full bg-white opacity-60"
                style={{ left: `${milestone}%` }}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* 완료 시 축하 메시지 */}
      {isComplete && celebrateCompletion && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-2 text-sm font-medium text-success-600 flex items-center gap-1"
        >
          ✅ 완료되었습니다!
        </motion.div>
      )}
    </div>
  )
}

// 원형 진행률 바 컴포넌트
interface CircularProgressProps {
  progress: number // 0-100
  size?: number // px
  strokeWidth?: number
  color?: 'primary' | 'success' | 'warning' | 'danger'
  showLabel?: boolean
  children?: React.ReactNode
  className?: string
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = 'primary',
  showLabel = true,
  children,
  className = '',
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress))
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference
  
  const colorClasses = {
    primary: 'stroke-primary-500',
    success: 'stroke-success-500',
    warning: 'stroke-warning-500',
    danger: 'stroke-red-500',
  }
  
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* 배경 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        
        {/* 진행률 원 */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className={colorClasses[color]}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      
      {/* 중앙 컨텐츠 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showLabel && (
          <span className="text-lg font-semibold text-gray-700">
            {Math.round(clampedProgress)}%
          </span>
        ))}
      </div>
    </div>
  )
}

export { ProgressBar }
export default ProgressBar