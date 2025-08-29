import React from 'react'
import { motion } from 'framer-motion'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  icon?: React.ReactNode
  pulse?: boolean
  removable?: boolean
  onRemove?: () => void
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
  pulse = false,
  removable = false,
  onRemove,
}) => {
  // ADHD 친화적 색상: 높은 대비, 명확한 구분
  const variantClasses = {
    primary: 'bg-primary-100 text-primary-800 border-primary-200',
    secondary: 'bg-gray-100 text-gray-800 border-gray-200',
    success: 'bg-success-100 text-success-800 border-success-200',
    warning: 'bg-warning-100 text-warning-800 border-warning-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  }
  
  // ADHD 친화적 크기: 읽기 쉬운 텍스트
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }
  
  const baseClasses = 'inline-flex items-center gap-1.5 font-semibold rounded-full border-2 transition-all duration-200'
  const pulseClass = pulse ? 'animate-pulse-slow' : ''
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${pulseClass} ${className}`
  
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={classes}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
      {removable && onRemove && (
        <button
          onClick={onRemove}
          className="flex-shrink-0 ml-1 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
          aria-label="배지 제거"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </motion.span>
  )
}

export default Badge