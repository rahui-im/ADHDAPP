import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ToastProps {
  id: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  isVisible: boolean
  onClose: (id: string) => void
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ReactNode
}

const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type = 'info',
  duration = 5000,
  isVisible,
  onClose,
  action,
  icon,
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose(id)
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [id, isVisible, duration, onClose])
  
  // ADHD 친화적 색상과 아이콘
  const typeConfig = {
    success: {
      bgColor: 'bg-success-50 border-success-200',
      textColor: 'text-success-800',
      iconColor: 'text-success-600',
      defaultIcon: '✅',
    },
    error: {
      bgColor: 'bg-red-50 border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
      defaultIcon: '❌',
    },
    warning: {
      bgColor: 'bg-warning-50 border-warning-200',
      textColor: 'text-warning-800',
      iconColor: 'text-warning-600',
      defaultIcon: '⚠️',
    },
    info: {
      bgColor: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
      defaultIcon: 'ℹ️',
    },
  }
  
  const config = typeConfig[type]
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`
            ${config.bgColor} ${config.textColor}
            border-2 rounded-xl shadow-lg p-4 mb-3 min-w-[320px] max-w-md
            backdrop-blur-sm
          `}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            {/* 아이콘 */}
            <div className={`flex-shrink-0 ${config.iconColor}`}>
              {icon || <span className="text-lg">{config.defaultIcon}</span>}
            </div>
            
            {/* 메시지 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-relaxed">
                {message}
              </p>
            </div>
            
            {/* 액션 버튼 */}
            {action && (
              <button
                onClick={action.onClick}
                className={`
                  flex-shrink-0 text-sm font-semibold underline hover:no-underline
                  ${config.iconColor} transition-colors duration-200
                `}
              >
                {action.label}
              </button>
            )}
            
            {/* 닫기 버튼 */}
            <button
              onClick={() => onClose(id)}
              className={`
                flex-shrink-0 ${config.iconColor} hover:bg-black hover:bg-opacity-10
                rounded-full p-1 transition-colors duration-200
              `}
              aria-label="알림 닫기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* 진행률 바 (duration이 있을 때) */}
          {duration > 0 && (
            <motion.div
              className="mt-3 h-1 bg-black bg-opacity-10 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className={`h-full ${config.iconColor.replace('text-', 'bg-')}`}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
              />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Toast Container 컴포넌트
interface ToastContainerProps {
  toasts: Array<{
    id: string
    message: string
    type?: 'success' | 'error' | 'warning' | 'info'
    duration?: number
    action?: {
      label: string
      onClick: () => void
    }
    icon?: React.ReactNode
  }>
  onClose: (id: string) => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center'
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
  position = 'top-right',
}) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
  }
  
  return (
    <div className={`fixed ${positionClasses[position]} z-50 pointer-events-none`}>
      <div className="pointer-events-auto">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            isVisible={true}
            onClose={onClose}
            action={toast.action}
            icon={toast.icon}
          />
        ))}
      </div>
    </div>
  )
}

export { Toast }
export default Toast