import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TooltipProps {
  content: string | React.ReactNode
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
  disabled?: boolean
  trigger?: 'hover' | 'click' | 'focus'
  maxWidth?: string
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 500,
  className = '',
  disabled = false,
  trigger = 'hover',
  maxWidth = 'max-w-xs',
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [actualPosition, setActualPosition] = useState(position)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  
  const showTooltip = () => {
    if (disabled) return
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
      // 위치 조정 로직 (화면 경계 체크)
      if (triggerRef.current && tooltipRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect()
        const tooltipRect = tooltipRef.current.getBoundingClientRect()
        const viewport = {
          width: window.innerWidth,
          height: window.innerHeight,
        }
        
        let newPosition = position
        
        // 상하 위치 조정
        if (position === 'top' && triggerRect.top < tooltipRect.height + 10) {
          newPosition = 'bottom'
        } else if (position === 'bottom' && triggerRect.bottom + tooltipRect.height + 10 > viewport.height) {
          newPosition = 'top'
        }
        
        // 좌우 위치 조정
        if (position === 'left' && triggerRect.left < tooltipRect.width + 10) {
          newPosition = 'right'
        } else if (position === 'right' && triggerRect.right + tooltipRect.width + 10 > viewport.width) {
          newPosition = 'left'
        }
        
        setActualPosition(newPosition)
      }
    }, delay)
  }
  
  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }
  
  const toggleTooltip = () => {
    if (isVisible) {
      hideTooltip()
    } else {
      showTooltip()
    }
  }
  
  // 위치별 스타일
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  }
  
  // 화살표 위치
  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800',
  }
  
  const triggerProps = {
    ref: triggerRef,
    ...(trigger === 'hover' && {
      onMouseEnter: showTooltip,
      onMouseLeave: hideTooltip,
    }),
    ...(trigger === 'click' && {
      onClick: toggleTooltip,
    }),
    ...(trigger === 'focus' && {
      onFocus: showTooltip,
      onBlur: hideTooltip,
    }),
  }
  
  return (
    <div className="relative inline-block">
      <div {...triggerProps}>
        {children}
      </div>
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute z-50 ${positionClasses[actualPosition]} ${maxWidth} ${className}
            `}
            role="tooltip"
          >
            {/* 툴팁 내용 */}
            <div className="bg-gray-800 text-white text-sm font-medium px-3 py-2 rounded-lg shadow-lg border border-gray-700">
              {content}
            </div>
            
            {/* 화살표 */}
            <div
              className={`absolute w-0 h-0 border-4 ${arrowClasses[actualPosition]}`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// 도움말 아이콘과 함께 사용하는 헬퍼 컴포넌트
interface HelpTooltipProps {
  content: string | React.ReactNode
  className?: string
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ content, className = '' }) => {
  return (
    <Tooltip content={content} position="top" className={className}>
      <button
        type="button"
        className="inline-flex items-center justify-center w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-full hover:bg-gray-100"
        aria-label="도움말"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    </Tooltip>
  )
}

export default Tooltip