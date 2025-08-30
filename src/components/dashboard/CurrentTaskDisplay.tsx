import React from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { motion } from 'framer-motion'
import { Task } from '../../types'

interface TimerState {
  mode: 'focus' | 'short-break' | 'long-break'
  duration: number
  remaining: number
  isRunning: boolean
  isPaused: boolean
}

interface CurrentTaskDisplayProps {
  task: Task
  timerState: TimerState
}

const CurrentTaskDisplay: React.FC<CurrentTaskDisplayProps> = ({
  task,
  timerState
}) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = timerState.duration > 0 
    ? ((timerState.duration - timerState.remaining) / timerState.duration) * 100 
    : 0

  return (
    <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">현재 작업</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            timerState.isRunning ? 'bg-green-500 animate-pulse' : 
            timerState.isPaused ? 'bg-yellow-500' : 'bg-gray-400'
          }`} />
          <span className="text-sm font-medium text-gray-600">
            {timerState.isRunning ? '진행 중' : 
             timerState.isPaused ? '일시정지' : '대기 중'}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-gray-600 text-sm">
              {task.description}
            </p>
          )}
        </div>

        {/* 타이머 표시 */}
        <div className="text-center">
          <motion.div
            className="text-4xl font-mono font-bold text-blue-600 mb-2"
            animate={{ scale: timerState.isRunning ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 1, repeat: timerState.isRunning ? Infinity : 0 }}
          >
            {formatTime(timerState.remaining)}
          </motion.div>
          
          <div className="text-sm text-gray-500 mb-4">
            {timerState.mode === 'focus' && '집중 시간'}
            {timerState.mode === 'short-break' && '짧은 휴식'}
            {timerState.mode === 'long-break' && '긴 휴식'}
          </div>

          {/* 진행률 바 */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <motion.div
              className="bg-blue-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* 하위 작업 진행률 */}
        {task.subtasks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              하위 작업 ({task.subtasks.filter(st => st.isCompleted).length}/{task.subtasks.length})
            </h4>
            <div className="space-y-1">
              {task.subtasks.slice(0, 3).map((subtask) => (
                <div key={subtask.id} className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    subtask.isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <span className={`text-sm ${
                    subtask.isCompleted ? 'text-gray-500 line-through' : 'text-gray-700'
                  }`}>
                    {subtask.title}
                  </span>
                </div>
              ))}
              {task.subtasks.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{task.subtasks.length - 3}개 더
                </div>
              )}
            </div>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="flex space-x-2">
          <Button
            variant={timerState.isRunning ? "warning" : "primary"}
            size="sm"
            className="flex-1"
            onClick={() => {
              console.log('타이머 토글')
              alert('타이머 기능은 아직 구현 중입니다!')
            }}
          >
            {timerState.isRunning ? '일시정지' : '시작'}
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              console.log('작업 완료')
              alert('작업 완료 기능은 아직 구현 중입니다!')
            }}
          >
            완료
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default CurrentTaskDisplay