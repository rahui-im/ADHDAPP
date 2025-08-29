import React from 'react'
import { useTimer } from '../../hooks/useTimer'
import { Button } from '../ui/Button'

interface TimerControlsProps {
  className?: string
  size?: 'small' | 'medium' | 'large'
  taskId?: string
}

export const TimerControls: React.FC<TimerControlsProps> = ({ 
  className = '', 
  size = 'medium',
  taskId 
}) => {
  const { 
    isRunning, 
    isPaused, 
    isActive,
    start, 
    pause, 
    resume, 
    stop, 
    reset,
    mode,
    duration 
  } = useTimer()

  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg',
  }

  const buttonSize = sizeClasses[size]

  const handleStart = () => {
    const durationInMinutes = Math.floor(duration / 60)
    start(taskId, durationInMinutes)
  }

  const handlePlayPause = () => {
    if (isRunning) {
      pause()
    } else if (isPaused) {
      resume()
    } else {
      handleStart()
    }
  }

  const handleStop = () => {
    stop()
  }

  const handleReset = () => {
    reset()
  }

  // 모드별 색상 설정
  const modeColors = {
    focus: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    'short-break': 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    'long-break': 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
  }

  const primaryColor = modeColors[mode]

  return (
    <div className={`flex items-center justify-center space-x-4 ${className}`}>
      {/* 메인 재생/일시정지 버튼 */}
      <Button
        onClick={handlePlayPause}
        className={`${buttonSize} ${primaryColor} text-white font-semibold rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50`}
        disabled={false}
      >
        <div className="flex items-center space-x-2">
          {isRunning ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>일시정지</span>
            </>
          ) : isPaused ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span>재시작</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span>시작</span>
            </>
          )}
        </div>
      </Button>

      {/* 정지 버튼 */}
      {isActive && (
        <Button
          onClick={handleStop}
          variant="outline"
          className={`${buttonSize} border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full transition-all duration-200`}
        >
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
            <span>정지</span>
          </div>
        </Button>
      )}

      {/* 리셋 버튼 */}
      {!isActive && (
        <Button
          onClick={handleReset}
          variant="ghost"
          className={`${buttonSize} text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200`}
        >
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            <span>리셋</span>
          </div>
        </Button>
      )}
    </div>
  )
}

export default TimerControls