import React from 'react'
import { useTimer } from '../../hooks/useTimer'
import { Button } from '../ui/Button'

interface TimerPresetsProps {
  className?: string
}

export const TimerPresets: React.FC<TimerPresetsProps> = ({ className = '' }) => {
  const { mode, settings, setFocusTime, setBreakTime, isActive } = useTimer()

  const focusPresets = [
    { duration: 15, label: '15분', description: '짧은 집중', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    { duration: 25, label: '25분', description: '표준 집중', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    { duration: 45, label: '45분', description: '깊은 집중', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  ] as const

  const breakPresets = [
    { duration: 5, label: '5분', description: '짧은 휴식', color: 'bg-green-100 text-green-800 border-green-300' },
    { duration: 10, label: '10분', description: '표준 휴식', color: 'bg-green-100 text-green-800 border-green-300' },
    { duration: 15, label: '15분', description: '긴 휴식', color: 'bg-green-100 text-green-800 border-green-300' },
  ] as const

  if (mode === 'focus') {
    return (
      <div className={`space-y-3 ${className}`}>
        <h3 className="text-sm font-medium text-gray-700">집중 시간 선택</h3>
        <div className="grid grid-cols-3 gap-2">
          {focusPresets.map((preset) => (
            <Button
              key={preset.duration}
              variant="outline"
              size="sm"
              disabled={isActive}
              className={`p-3 h-auto flex flex-col items-center space-y-1 ${preset.color} hover:opacity-80 disabled:opacity-50`}
              onClick={() => setFocusTime(preset.duration)}
            >
              <span className="font-bold">{preset.label}</span>
              <span className="text-xs">{preset.description}</span>
            </Button>
          ))}
        </div>
        <p className="text-xs text-gray-500 text-center">
          에너지 레벨에 맞는 시간을 선택하세요
        </p>
      </div>
    )
  }

  if (mode === 'short-break') {
    return (
      <div className={`space-y-3 ${className}`}>
        <h3 className="text-sm font-medium text-gray-700">휴식 시간 선택</h3>
        <div className="grid grid-cols-3 gap-2">
          {breakPresets.map((preset) => (
            <Button
              key={preset.duration}
              variant="outline"
              size="sm"
              disabled={isActive}
              className={`p-3 h-auto flex flex-col items-center space-y-1 ${preset.color} hover:opacity-80 disabled:opacity-50`}
              onClick={() => setBreakTime(preset.duration)}
            >
              <span className="font-bold">{preset.label}</span>
              <span className="text-xs">{preset.description}</span>
            </Button>
          ))}
        </div>
        <p className="text-xs text-gray-500 text-center">
          충분한 휴식으로 에너지를 회복하세요
        </p>
      </div>
    )
  }

  // long-break 모드에서는 프리셋 선택 불가
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="text-center p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <h3 className="text-sm font-medium text-indigo-800 mb-1">긴 휴식 시간</h3>
        <p className="text-xs text-indigo-600">
          {settings.longBreakDuration}분의 긴 휴식으로 완전히 재충전하세요
        </p>
      </div>
    </div>
  )
}

export default TimerPresets