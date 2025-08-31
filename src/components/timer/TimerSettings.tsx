import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import { updateTimerSettings } from '../../store/timerSlice'
import { TimerSettings as TimerSettingsType } from '../../types'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

interface TimerSettingsProps {
  onClose?: () => void
}

export const TimerSettings: React.FC<TimerSettingsProps> = ({ onClose }) => {
  const dispatch = useDispatch()
  const timerSettings = useSelector((state: RootState) => state.timer.settings)
  const userPreferences = useSelector((state: RootState) => state.user.currentUser?.preferences)

  const handleFocusDurationSelect = () => {
    // 타이머 설정 업데이트
    dispatch(updateTimerSettings({
      focusDurations: timerSettings.focusDurations
    }))
  }

  const handleBreakDurationSelect = () => {
    // 타이머 설정 업데이트
    dispatch(updateTimerSettings({
      shortBreakDurations: timerSettings.shortBreakDurations
    }))
  }

  const handleLongBreakDurationChange = (duration: number) => {
    const newSettings: Partial<TimerSettingsType> = {
      longBreakDuration: duration as 25
    }

    dispatch(updateTimerSettings(newSettings))
  }

  const handleCyclesBeforeLongBreakChange = (cycles: number) => {
    const newSettings: Partial<TimerSettingsType> = {
      cyclesBeforeLongBreak: cycles as 3
    }

    dispatch(updateTimerSettings(newSettings))
  }

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">타이머 설정</h2>
          {onClose && (
            <Button variant="ghost" onClick={onClose} className="text-gray-500">
              ✕
            </Button>
          )}
        </div>

        {/* 집중 시간 설정 */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">집중 시간 선택</h3>
          <p className="text-sm text-gray-600">
            ADHD 특성에 맞는 집중 시간을 선택하세요. 짧은 시간부터 시작하는 것을 권장합니다.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {timerSettings.focusDurations.map((duration: number) => (
              <Button
                key={duration}
                variant="outline"
                className={`p-4 h-auto flex flex-col items-center space-y-2 ${
                  userPreferences?.defaultFocusDuration === duration
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'hover:border-blue-300'
                }`}
                onClick={() => handleFocusDurationSelect()}
              >
                <span className="text-2xl font-bold">{duration}분</span>
                <span className="text-xs text-gray-500">
                  {duration === 15 && '짧은 집중'}
                  {duration === 25 && '표준 집중'}
                  {duration === 45 && '깊은 집중'}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* 휴식 시간 설정 */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">휴식 시간 선택</h3>
          <p className="text-sm text-gray-600">
            집중 후 충분한 휴식을 취하세요. 에너지 레벨에 따라 조정할 수 있습니다.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {timerSettings.shortBreakDurations.map((duration: number) => (
              <Button
                key={duration}
                variant="outline"
                className={`p-4 h-auto flex flex-col items-center space-y-2 ${
                  userPreferences?.defaultBreakDuration === duration
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'hover:border-green-300'
                }`}
                onClick={() => handleBreakDurationSelect()}
              >
                <span className="text-2xl font-bold">{duration}분</span>
                <span className="text-xs text-gray-500">
                  {duration === 5 && '짧은 휴식'}
                  {duration === 10 && '표준 휴식'}
                  {duration === 15 && '긴 휴식'}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* 긴 휴식 설정 */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">긴 휴식 시간</h3>
          <p className="text-sm text-gray-600">
            여러 번의 포모도로 완료 후 취할 긴 휴식 시간입니다.
          </p>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="20"
              max="45"
              step="5"
              value={timerSettings.longBreakDuration}
              onChange={(e) => handleLongBreakDurationChange(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-lg font-semibold text-gray-800 min-w-[60px]">
              {timerSettings.longBreakDuration}분
            </span>
          </div>
        </div>

        {/* 긴 휴식 주기 설정 */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">긴 휴식 주기</h3>
          <p className="text-sm text-gray-600">
            몇 번의 포모도로 완료 후 긴 휴식을 취할지 설정합니다.
          </p>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="2"
              max="6"
              step="1"
              value={timerSettings.cyclesBeforeLongBreak}
              onChange={(e) => handleCyclesBeforeLongBreakChange(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-lg font-semibold text-gray-800 min-w-[80px]">
              {timerSettings.cyclesBeforeLongBreak}회 후
            </span>
          </div>
        </div>

        {/* ADHD 맞춤 팁 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">💡 ADHD 맞춤 팁</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 처음에는 15분 집중으로 시작해보세요</li>
            <li>• 에너지가 낮을 때는 더 짧은 시간을 선택하세요</li>
            <li>• 휴식 시간에는 완전히 다른 활동을 해보세요</li>
            <li>• 자신만의 패턴을 찾아가는 것이 중요합니다</li>
          </ul>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end space-x-3">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
          )}
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
            설정 저장
          </Button>
        </div>
      </div>
    </Card>
  )
}