import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { useTimer } from '../../hooks/useTimer'
import { cycleManagerService } from '../../services/cycleManagerService'
import { Task } from '../../types'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import TimerDisplay from './TimerDisplay'
import TimerControls from './TimerControls'
import TimerPresets from './TimerPresets'
import CycleDisplay from './CycleDisplay'
import LongBreakModal from './LongBreakModal'
import { TimerSettings } from './TimerSettings'

interface PomodoroTimerProps {
  task?: Task
  onComplete?: (duration: number) => void
  onPause?: () => void
  onStop?: () => void
  className?: string
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  task,
  onComplete,
  onPause,
  onStop,
  className = ''
}) => {
  const { 
    mode, 
    currentTaskId, 
    isRunning, 
    isPaused, 
    remaining, 
    duration,
    currentCycle,
    totalCycles,
    settings,
    changeMode
  } = useTimer()
  
  const { focusMode } = useSelector((state: RootState) => state.user)
  const [showSettings, setShowSettings] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [showLongBreakModal, setShowLongBreakModal] = useState(false)
  const [lastCompletedMode, setLastCompletedMode] = useState<'focus' | 'short-break' | 'long-break' | null>(null)

  // 타이머 완료 감지
  useEffect(() => {
    if (remaining === 0 && (isRunning || isPaused)) {
      setLastCompletedMode(mode)
      
      // 집중 시간 완료 후 긴 휴식 시간인지 확인
      if (mode === 'focus') {
        const nextModeData = cycleManagerService.determineNextMode(mode, totalCycles, settings)
        if (nextModeData.isLongBreakTime) {
          setShowLongBreakModal(true)
        } else {
          setShowCompletionModal(true)
        }
        onComplete?.(Math.floor(duration / 60))
      } else {
        setShowCompletionModal(true)
        onPause?.()
      }
    }
  }, [remaining, isRunning, isPaused, mode, duration, totalCycles, settings, onComplete, onPause])

  // 일시정지/정지 시 콜백
  useEffect(() => {
    if (isPaused) {
      onPause?.()
    }
  }, [isPaused, onPause])

  useEffect(() => {
    if (!isRunning && !isPaused && remaining === duration) {
      onStop?.()
    }
  }, [isRunning, isPaused, remaining, duration, onStop])

  const handleCloseCompletionModal = () => {
    setShowCompletionModal(false)
    setLastCompletedMode(null)
  }

  const handleStartLongBreak = () => {
    // 긴 휴식 모드로 전환은 이미 completeTimer에서 처리됨
    setShowLongBreakModal(false)
    setShowCompletionModal(true)
  }

  const handleSkipLongBreak = () => {
    // 짧은 휴식으로 변경
    changeMode('short-break')
    setShowLongBreakModal(false)
    setShowCompletionModal(true)
  }

  const getCompletionMessage = () => {
    switch (lastCompletedMode) {
      case 'focus':
        return {
          title: '🎉 집중 시간 완료!',
          message: '훌륭해요! 집중 시간을 성공적으로 완료했습니다.',
          suggestion: '이제 잠시 휴식을 취하세요.',
        }
      case 'short-break':
        return {
          title: '✨ 휴식 완료!',
          message: '좋은 휴식이었어요. 에너지가 충전되었나요?',
          suggestion: '다음 집중 시간을 시작해보세요.',
        }
      case 'long-break':
        return {
          title: '🌟 긴 휴식 완료!',
          message: '완전히 재충전되었네요! 정말 잘하고 있어요.',
          suggestion: '새로운 사이클을 시작할 준비가 되었습니다.',
        }
      default:
        return {
          title: '완료!',
          message: '시간이 완료되었습니다.',
          suggestion: '',
        }
    }
  }

  const completionData = getCompletionMessage()

  return (
    <div className={className}>
      <Card className={`p-6 ${focusMode ? 'shadow-2xl border-2' : 'shadow-lg'}`}>
        <div className="space-y-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {mode === 'focus' && '🎯 집중 시간'}
                {mode === 'short-break' && '☕ 휴식 시간'}
                {mode === 'long-break' && '🌴 긴 휴식'}
              </h2>
              {task && (
                <p className="text-sm text-gray-600 mt-1">
                  작업: {task.title}
                </p>
              )}
            </div>
            
            {!focusMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="text-gray-500 hover:text-gray-700"
              >
                ⚙️ 설정
              </Button>
            )}
          </div>

          {/* 사이클 정보 */}
          {!focusMode && (
            <CycleDisplay showDetails={false} />
          )}

          {/* 타이머 프리셋 (집중 모드가 아닐 때만) */}
          {!focusMode && !isRunning && !isPaused && (
            <TimerPresets />
          )}

          {/* 타이머 디스플레이 */}
          <div className="flex justify-center">
            <TimerDisplay size={focusMode ? 'large' : 'medium'} />
          </div>

          {/* 타이머 컨트롤 */}
          <TimerControls 
            size={focusMode ? 'large' : 'medium'}
            taskId={task?.id || currentTaskId}
          />

          {/* ADHD 친화적 격려 메시지 */}
          {!focusMode && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {isRunning && mode === 'focus' && '집중하고 있어요! 잘하고 있습니다 💪'}
                {isRunning && mode !== 'focus' && '휴식 중이에요. 충분히 쉬세요 😌'}
                {isPaused && '일시정지 중입니다. 언제든 다시 시작하세요'}
                {!isRunning && !isPaused && '준비되면 시작 버튼을 눌러주세요'}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* 설정 모달 */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="타이머 설정"
      >
        <TimerSettings onClose={() => setShowSettings(false)} />
      </Modal>

      {/* 긴 휴식 제안 모달 */}
      <LongBreakModal
        isOpen={showLongBreakModal}
        onClose={() => setShowLongBreakModal(false)}
        onStartLongBreak={handleStartLongBreak}
        onSkipLongBreak={handleSkipLongBreak}
      />

      {/* 완료 축하 모달 */}
      <Modal
        isOpen={showCompletionModal}
        onClose={handleCloseCompletionModal}
        title={completionData.title}
      >
        <div className="text-center space-y-4">
          <p className="text-lg text-gray-800">{completionData.message}</p>
          {completionData.suggestion && (
            <p className="text-sm text-gray-600">{completionData.suggestion}</p>
          )}
          
          {lastCompletedMode === 'focus' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                🎯 {Math.floor(duration / 60)}분 집중을 완료했습니다!
              </p>
              {totalCycles > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  총 {totalCycles}개의 포모도로를 완료했어요
                </p>
              )}
            </div>
          )}

          <Button
            onClick={handleCloseCompletionModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
          >
            확인
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default PomodoroTimer