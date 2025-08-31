import React, { useState } from 'react'
import { motion } from 'framer-motion'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'focus'
  showCharCount?: boolean
  maxLength?: number
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  size = 'md',
  variant = 'default',
  showCharCount = false,
  maxLength,
  value,
  onChange,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`
  
  // ADHD 친화적 기본 클래스: 큰 터치 타겟, 명확한 시각적 피드백
  const baseClasses = 'w-full border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-1 bg-white shadow-sm hover:shadow-md focus:shadow-lg'
  
  // 크기별 클래스
  const sizeClasses = {
    sm: 'px-3 py-2.5 text-sm min-h-[40px]',
    md: 'px-4 py-3.5 text-base min-h-[48px]',
    lg: 'px-5 py-4 text-lg min-h-[56px]',
  }
  
  // 상태별 클래스
  const getStateClasses = () => {
    if (error) {
      return 'border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50'
    }
    if (variant === 'focus') {
      return 'border-primary-400 focus:border-primary-500 focus:ring-primary-200 bg-primary-50'
    }
    return 'border-gray-300 focus:border-primary-500 focus:ring-primary-200 hover:border-gray-400'
  }
  
  // 아이콘 패딩 클래스
  const paddingClasses = leftIcon && rightIcon
    ? 'pl-12 pr-12'
    : leftIcon
    ? 'pl-12'
    : rightIcon
    ? 'pr-12'
    : ''
  
  const classes = `${baseClasses} ${sizeClasses[size]} ${getStateClasses()} ${paddingClasses} ${className}`
  
  const charCount = typeof value === 'string' ? value.length : 0
  
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <motion.div 
        className="relative"
        animate={{ scale: isFocused ? 1.01 : 1 }}
        transition={{ duration: 0.15 }}
      >
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <div className={`${error ? 'text-red-400' : 'text-gray-400'}`}>
              {leftIcon}
            </div>
          </div>
        )}
        
        <input
          id={inputId}
          className={classes}
          value={value}
          onChange={onChange}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          maxLength={maxLength}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <div className={`${error ? 'text-red-400' : 'text-gray-400'}`}>
              {rightIcon}
            </div>
          </div>
        )}
      </motion.div>
      
      <div className="flex justify-between items-start mt-2">
        <div className="flex-1">
          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-600 font-medium" 
              role="alert"
            >
              ⚠️ {error}
            </motion.p>
          )}
          
          {helperText && !error && (
            <p className="text-sm text-gray-500">
              💡 {helperText}
            </p>
          )}
        </div>
        
        {showCharCount && maxLength && (
          <div className="text-sm text-gray-500 ml-2">
            <span className={charCount > maxLength * 0.9 ? 'text-warning-600 font-medium' : ''}>
              {charCount}/{maxLength}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default Input