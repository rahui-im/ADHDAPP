import React from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
  onClick?: () => void
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  border?: boolean
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'sm',
  hover = false,
  onClick,
  variant = 'default',
  border = true,
  rounded = 'lg',
}) => {
  // ADHD 친화적 패딩: 더 넉넉한 공간
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  }
  
  // ADHD 친화적 그림자: 더 명확한 구분
  const shadowClasses = {
    none: '',
    sm: 'shadow-md',
    md: 'shadow-lg',
    lg: 'shadow-xl',
    xl: 'shadow-2xl',
  }
  
  // 둥근 모서리
  const roundedClasses = {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    '2xl': 'rounded-3xl',
  }
  
  // 변형별 색상
  const variantClasses = {
    default: 'bg-white border-gray-200',
    primary: 'bg-primary-50 border-primary-200',
    success: 'bg-success-50 border-success-200',
    warning: 'bg-warning-50 border-warning-200',
    danger: 'bg-red-50 border-red-200',
  }
  
  const borderClass = border ? 'border-2' : ''
  const baseClasses = `${variantClasses[variant]} ${roundedClasses[rounded]} ${paddingClasses[padding]} ${shadowClasses[shadow]} ${borderClass} transition-all duration-200`
  const interactiveClasses = onClick ? 'cursor-pointer hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary-200' : ''
  const classes = `${baseClasses} ${interactiveClasses} ${className}`
  
  const cardContent = (
    <div 
      className={classes} 
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      } : undefined}
    >
      {children}
    </div>
  )
  
  if (hover && onClick) {
    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {cardContent}
      </motion.div>
    )
  }
  
  return cardContent
}

// 특화된 카드 컴포넌트들
interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'danger'
  trend?: {
    value: number
    isPositive: boolean
  }
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend,
}) => {
  const colorClasses = {
    primary: 'text-primary-600 bg-primary-50',
    success: 'text-success-600 bg-success-50',
    warning: 'text-warning-600 bg-warning-50',
    danger: 'text-red-600 bg-red-50',
  }
  
  return (
    <Card padding="md" shadow="sm" hover>
      <div className="flex items-center">
        {icon && (
          <div className={`flex-shrink-0 p-3 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
        
        <div className={`${icon ? 'ml-4' : ''} flex-1`}>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          
          {trend && (
            <div className="flex items-center mt-1">
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-success-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">
                지난 주 대비
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

interface TaskCardProps {
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  estimatedTime: number // minutes
  progress?: number // 0-100
  isCompleted?: boolean
  onClick?: () => void
}

export const TaskCard: React.FC<TaskCardProps> = ({
  title,
  description,
  priority,
  estimatedTime,
  progress = 0,
  isCompleted = false,
  onClick,
}) => {
  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-warning-100 text-warning-800',
    high: 'bg-red-100 text-red-800',
  }
  
  const priorityLabels = {
    low: '낮음',
    medium: '보통',
    high: '높음',
  }
  
  return (
    <Card padding="md" shadow="sm" hover onClick={onClick}>
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h3 className={`font-semibold ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {title}
          </h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[priority]}`}>
            {priorityLabels[priority]}
          </span>
        </div>
        
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>예상 시간: {estimatedTime}분</span>
          {progress > 0 && (
            <span>{Math.round(progress)}% 완료</span>
          )}
        </div>
        
        {progress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-primary-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
      </div>
    </Card>
  )
}

export { Card }
export default Card