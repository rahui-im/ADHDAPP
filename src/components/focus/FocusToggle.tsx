import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppSelector, useAppDispatch } from '../../store/store'
import { selectFocusMode, selectCurrentUser } from '../../store/selectors'
import { toggleFocusMode } from '../../store/userSlice'
import Button from '../ui/Button'
import Tooltip from '../ui/Tooltip'

interface FocusToggleProps {
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const FocusToggle: React.FC<FocusToggleProps> = ({
  className = '',
  showLabel = true,
  size = 'md',
}) => {
  const dispatch = useAppDispatch()
  const focusMode = useAppSelector(selectFocusMode)
  const user = useAppSelector(selectCurrentUser)
  const [showTooltip, setShowTooltip] = useState(false)

  const handleToggle = () => {
    dispatch(toggleFocusMode())
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-sm'
      case 'lg':
        return 'w-12 h-12 text-lg'
      default:
        return 'w-10 h-10 text-base'
    }
  }

  const getButtonVariant = () => {
    return focusMode ? 'primary' : 'secondary'
  }

  const getTooltipText = () => {
    if (focusMode) {
      return '집중 모드를 해제하여 모든 기능에 접근할 수 있습니다'
    }
    return '집중 모드를 활성화하여 방해 요소를 최소화합니다'
  }

  return (
    <div className={`focus-toggle ${className}`}>
      <Tooltip content={getTooltipText()} disabled={!showTooltip}>
        <div
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Button
            variant={getButtonVariant()}
            onClick={handleToggle}
            className={`${getSizeClasses()} ${focusMode ? 'ring-2 ring-green-400 ring-opacity-50' : ''} transition-all duration-200`}
            aria-label={focusMode ? '집중 모드 해제' : '집중 모드 활성화'}
          >
            <motion.div
              animate={{ 
                scale: focusMode ? 1.1 : 1,
                rotate: focusMode ? 360 : 0 
              }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center"
            >
              {focusMode ? '🎯' : '🧘‍♀️'}
            </motion.div>
          </Button>
        </div>
      </Tooltip>

      {/* 상태 표시 레이블 */}
      <AnimatePresence>
        {showLabel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mt-2 text-center"
          >
            <span className={`text-xs font-medium ${
              focusMode 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {focusMode ? '집중 모드' : '일반 모드'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 집중 모드 활성 표시 */}
      <AnimatePresence>
        {focusMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default FocusToggle