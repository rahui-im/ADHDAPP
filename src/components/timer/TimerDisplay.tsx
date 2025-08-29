import React from 'react'
import { useTimer } from '../../hooks/useTimer'

interface TimerDisplayProps {
  className?: string
  size?: 'small' | 'medium' | 'large'
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ 
  className = '', 
  size = 'large' 
}) => {
  const { mode, getTimeRemaining, getProgress, isRunning, isPaused } = useTimer()

  const sizeClasses = {
    small: {
      container: 'w-32 h-32',
      text: 'text-2xl',
      stroke: '4',
      radius: '54',
    },
    medium: {
      container: 'w-48 h-48',
      text: 'text-4xl',
      stroke: '6',
      radius: '86',
    },
    large: {
      container: 'w-64 h-64',
      text: 'text-6xl',
      stroke: '8',
      radius: '116',
    },
  }

  const currentSize = sizeClasses[size]
  const progress = getProgress()
  const timeRemaining = getTimeRemaining()
  
  // 모드별 색상 설정
  const modeColors = {
    focus: {
      primary: '#3B82F6', // blue-500
      secondary: '#DBEAFE', // blue-100
      text: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    'short-break': {
      primary: '#10B981', // green-500
      secondary: '#D1FAE5', // green-100
      text: 'text-green-600',
      bg: 'bg-green-50',
    },
    'long-break': {
      primary: '#8B5CF6', // purple-500
      secondary: '#EDE9FE', // purple-100
      text: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  }

  const colors = modeColors[mode]
  const circumference = 2 * Math.PI * Number(currentSize.radius)
  const strokeDashoffset = circumference - (progress / 100) * circumference

  // 상태별 애니메이션 클래스
  const getAnimationClass = () => {
    if (isRunning) return 'animate-pulse'
    if (isPaused) return 'opacity-75'
    return ''
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* 원형 진행률 표시기 */}
      <div className={`relative ${currentSize.container} ${getAnimationClass()}`}>
        <svg
          className="transform -rotate-90 w-full h-full"
          viewBox="0 0 144 144"
        >
          {/* 배경 원 */}
          <circle
            cx="72"
            cy="72"
            r={currentSize.radius}
            stroke={colors.secondary}
            strokeWidth={currentSize.stroke}
            fill="none"
          />
          {/* 진행률 원 */}
          <circle
            cx="72"
            cy="72"
            r={currentSize.radius}
            stroke={colors.primary}
            strokeWidth={currentSize.stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-in-out"
          />
        </svg>
        
        {/* 중앙 시간 표시 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`font-mono font-bold ${currentSize.text} ${colors.text}`}>
            {timeRemaining}
          </div>
          <div className={`text-sm font-medium ${colors.text} opacity-75 mt-1`}>
            {mode === 'focus' && '집중 시간'}
            {mode === 'short-break' && '휴식 시간'}
            {mode === 'long-break' && '긴 휴식'}
          </div>
        </div>
      </div>

      {/* 진행률 퍼센트 */}
      <div className={`text-center ${colors.bg} px-4 py-2 rounded-full`}>
        <span className={`text-sm font-semibold ${colors.text}`}>
          {Math.round(progress)}% 완료
        </span>
      </div>

      {/* 상태 표시 */}
      {(isRunning || isPaused) && (
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            isRunning ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
          }`} />
          <span className="text-sm text-gray-600">
            {isRunning ? '진행 중' : '일시정지'}
          </span>
        </div>
      )}
    </div>
  )
}

export default TimerDisplay