import React from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { ProgressBar } from '../ui/ProgressBar'
import { Task, TimerState } from '../../types'

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

  const getTimerProgress = () => {
    if (timerState.duration === 0) return 0
    return Math.round(((timerState.duration - timerState.remaining) / timerState.duration) * 100)
  }

  const getTaskProgress = () => {
    if (task.subtasks.length === 0) return 0
    const completedSubtasks = task.subtasks.filter(st => st.isCompleted).length
    return Math.round((completedSubtasks / task.subtasks.length) * 100)
  }

  const getModeLabel = (mode: TimerState['mode']) => {
    switch (mode) {
      case 'focus': return '집중 시간'
      case 'short-break': return '짧은 휴식'
      case 'long-break': return '긴 휴식'
    }
  }

  const getModeColor = (mode: TimerState['mode']) => {
    switch (mode) {
      case 'focus': return 'text-blue-600'
      case 'short-break': return 'text-green-600'
      case 'long-break': return 'text-purple-600'
    }
  }

  const getStatusIcon = () => {
    if (timerState.isRunning) return '▶️'
    if (timerState.isPaused) return '⏸️'
    return '⏹️'
  }

  return (
    <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            현재 작업
          </h2>
          <p className="text-gray-600 text-sm">
            집중해서 목표를 달성해보세요!
          </p>
        </div>
        <div className="text-right">
          <div className={`text-sm font-medium ${getModeColor(timerState.mode)}`}>
            {getModeLabel(timerState.mode)}
          </div>
          <div className="text-xs text-gray-500">
            사이클 {timerState.currentCycle}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 작업 정보 */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-gray-600 text-sm mb-3">
                {task.description}
              </p>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>⏱️ {task.estimatedDuration}분</span>
              <span>📋 {task.category}</span>
              <span className={`px-2 py-1 rounded ${
                task.priority === 'high' ? 'bg-red-100 text-red-700' :
                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {task.priority === 'high' ? '높음' : 
                 task.priority === 'medium' ? '보통' : '낮음'}
              </span>
            </div>
          </div>

          {/* 작업 진행률 */}
          {task.subtasks.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  작업 진행률
                </span>
                <span className="text-sm font-bold text-blue-600">
                  {task.subtasks.filter(st => st.isCompleted).length}/{task.subtasks.length} 완료
                </span>
              </div>
              <ProgressBar 
                progress={getTaskProgress()} 
                className="h-2 mb-2"
                color="blue"
              />
              
              {/* 하위 작업 목록 */}
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {task.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className={`flex items-center space-x-2 text-sm p-2 rounded ${
                      subtask.isCompleted ? 'bg-green-50 text-green-800' : 'bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">
                      {subtask.isCompleted ? '✅' : '⭕'}
                    </span>
                    <span className={subtask.isCompleted ? 'line-through' : ''}>
                      {subtask.title}
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {subtask.duration}분
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 타이머 정보 */}
        <div className="space-y-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-2xl">{getStatusIcon()}</span>
              <span className={`text-sm font-medium ${getModeColor(timerState.mode)}`}>
                {getModeLabel(timerState.mode)}
              </span>
            </div>
            
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {formatTime(timerState.remaining)}
            </div>
            
            <div className="text-sm text-gray-500 mb-4">
              {formatTime(timerState.duration)} 중 {formatTime(timerState.duration - timerState.remaining)} 경과
            </div>
            
            {/* 타이머 진행률 */}
            <div className="mb-4">
              <ProgressBar 
                progress={getTimerProgress()} 
                className="h-3"
                color={timerState.mode === 'focus' ? 'blue' : 'green'}
              />
            </div>
          </div>

          {/* 타이머 컨트롤 버튼들 */}
          <div className="flex space-x-2">
            {!timerState.isRunning && !timerState.isPaused && (
              <Button variant="primary" className="flex-1">
                시작
              </Button>
            )}
            
            {timerState.isRunning && (
              <Button variant="secondary" className="flex-1">
                일시정지
              </Button>
            )}
            
            {timerState.isPaused && (
              <>
                <Button variant="primary" className="flex-1">
                  재시작
                </Button>
                <Button variant="outline" className="flex-1">
                  정지
                </Button>
              </>
            )}
            
            {(timerState.isRunning || timerState.isPaused) && (
              <Button variant="outline" size="sm">
                ⏹️
              </Button>
            )}
          </div>

          {/* 사이클 정보 */}
          <div className="text-center text-sm text-gray-600">
            <div>현재 사이클: {timerState.currentCycle}</div>
            <div>총 완료: {timerState.totalCycles}개</div>
            {timerState.totalCycles > 0 && timerState.totalCycles % 3 === 0 && (
              <div className="text-purple-600 font-medium mt-1">
                🎉 긴 휴식 시간이에요!
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default CurrentTaskDisplay