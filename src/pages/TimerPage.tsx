import React from 'react'
import { PomodoroTimer } from '../components/timer/PomodoroTimer'
import { TimerSettings } from '../components/timer/TimerSettings'
import { FocusMode } from '../components/focus/FocusMode'
import { useAppSelector } from '../store/store'
import { selectCurrentTask } from '../store/selectors'

/**
 * 타이머 페이지
 * 포모도로 타이머, 집중 모드, 타이머 설정을 관리합니다.
 */
const TimerPage: React.FC = () => {
  const currentTask = useAppSelector(selectCurrentTask)
  const [showSettings, setShowSettings] = React.useState(false)

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">포모도로 타이머</h1>
        <p className="text-gray-600">
          집중력을 높이고 생산성을 향상시키는 시간 관리 도구입니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 타이머 영역 */}
        <div className="lg:col-span-2">
          <PomodoroTimer />
          
          {/* 현재 작업 표시 */}
          {currentTask && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">현재 작업</h3>
              <p className="text-blue-800">{currentTask.title}</p>
              {currentTask.description && (
                <p className="text-sm text-blue-600 mt-1">{currentTask.description}</p>
              )}
            </div>
          )}
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 집중 모드 */}
          <FocusMode 
            isActive={false}
            currentTask={currentTask || undefined}
            onToggle={() => {}}
            onDistraction={() => {}}
          />
          
          {/* 타이머 설정 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">타이머 설정</h3>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showSettings ? '숨기기' : '설정'}
              </button>
            </div>
            
            {showSettings && <TimerSettings />}
          </div>

          {/* 도움말 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">포모도로 기법이란?</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>• 25분 집중 + 5분 휴식의 사이클</p>
              <p>• 4회 반복 후 긴 휴식 (15-30분)</p>
              <p>• 집중력 향상과 번아웃 방지</p>
              <p>• ADHD에 특히 효과적</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimerPage