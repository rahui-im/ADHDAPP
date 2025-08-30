import React, { useRef, useEffect } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
// import { useAccessibility } from '../../hooks/useAccessibility'

interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'children'> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'focus' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
  children: React.ReactNode
  fullWidth?: boolean
  icon?: React.ReactNode
  // 접근성 관련 props
  ariaLabel?: string
  ariaDescribedBy?: string
  ariaExpanded?: boolean
  ariaPressed?: boolean
  announceOnClick?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  fullWidth = false,
  icon,
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaPressed,
  announceOnClick,
  onClick,
  ...props
}, ref) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  // const { enhanceButton, announce } = useAccessibility()
  // ADHD 친화적 기본 클래스: 큰 터치 타겟, 명확한 시각적 피드백
  const baseClasses = 'font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:shadow-md transform-gpu'
  
  // ADHD 친화적 색상: 높은 대비, 명확한 구분
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white focus:ring-blue-300 border-2 border-blue-600',
    secondary: 'bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 focus:ring-gray-300 border-2 border-gray-300 hover:border-gray-400',
    success: 'bg-green-500 hover:bg-green-600 active:bg-green-700 text-white focus:ring-green-300 border-2 border-green-600',
    warning: 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white focus:ring-yellow-300 border-2 border-yellow-600',
    danger: 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white focus:ring-red-300 border-2 border-red-600',
    focus: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white focus:ring-blue-300 border-2 border-blue-600 animate-pulse-slow',
    outline: 'bg-transparent hover:bg-gray-50 active:bg-gray-100 text-gray-700 focus:ring-gray-300 border-2 border-gray-300 hover:border-gray-400',
    ghost: 'bg-transparent hover:bg-gray-100 active:bg-gray-200 text-gray-600 focus:ring-gray-300 border-2 border-transparent',
  }
  
  // ADHD 친화적 크기: 더 큰 터치 타겟, 읽기 쉬운 텍스트
  const sizeClasses = {
    sm: 'px-4 py-2.5 text-sm min-h-[40px]',
    md: 'px-6 py-3.5 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]',
    xl: 'px-10 py-5 text-xl min-h-[64px]',
  }
  
  const widthClass = fullWidth ? 'w-full' : ''
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`
  
  // 접근성 속성 설정
  useEffect(() => {
    if (buttonRef.current) {
      // enhanceButton(buttonRef.current, {
      //   label: ariaLabel,
      //   describedBy: ariaDescribedBy,
      //   expanded: ariaExpanded,
      //   pressed: ariaPressed,
      //   disabled: disabled || isLoading
      // })
    }
  }, [ariaLabel, ariaDescribedBy, ariaExpanded, ariaPressed, disabled, isLoading])

  // 클릭 핸들러 (접근성 알림 포함)
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (announceOnClick) {
      // announce(announceOnClick, 'polite')
      console.log('Button clicked:', announceOnClick)
    }
    if (onClick) {
      onClick(event)
    }
  }
  
  return (
    <motion.button
      ref={ref || buttonRef}
      whileHover={{ 
        scale: disabled || isLoading ? 1 : 1.02,
        y: disabled || isLoading ? 0 : -1
      }}
      whileTap={{ 
        scale: disabled || isLoading ? 1 : 0.98,
        y: disabled || isLoading ? 0 : 1
      }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={classes}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
          <span>로딩중...</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
        </div>
      )}
    </motion.button>
  )
})

Button.displayName = 'Button'

export { Button }
export default Button