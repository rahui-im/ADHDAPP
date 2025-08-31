import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import TimerTemplates from './TimerTemplates'
import TimerHistory from './TimerHistory'
import { AmbientSounds } from './AmbientSounds'
import { 
  ClockIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  MusicalNoteIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'

type TabType = 'timer' | 'templates' | 'history' | 'sounds' | 'settings'

interface CustomTimerSettings {
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  cyclesBeforeLongBreak: number
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  notificationSound: string
  notificationVolume: number
}

export const TimerAdvanced: React.FC = () => {
  const dispatch = useDispatch()
  const [activeTab, setActiveTab] = useState<TabType>('timer')
  const [customSettings, setCustomSettings] = useState<CustomTimerSettings>({
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    cyclesBeforeLongBreak: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    notificationSound: 'bell',
    notificationVolume: 50
  })

  const tabs = [
    { id: 'timer' as TabType, label: '타이머', icon: ClockIcon },
    { id: 'templates' as TabType, label: '템플릿', icon: AdjustmentsHorizontalIcon },
    { id: 'history' as TabType, label: '기록', icon: ChartBarIcon },
    { id: 'sounds' as TabType, label: '사운드', icon: MusicalNoteIcon },
    { id: 'settings' as TabType, label: '설정', icon: Cog6ToothIcon }
  ]

  const renderCustomTimer = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">커스텀 타이머 설정</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 시간 설정 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                집중 시간 (분)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={customSettings.focusDuration}
                  onChange={(e) => setCustomSettings({
                    ...customSettings,
                    focusDuration: parseInt(e.target.value)
                  })}
                  className="flex-1"
                />
                <span className="w-12 text-center font-semibold">
                  {customSettings.focusDuration}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                짧은 휴식 (분)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={customSettings.shortBreakDuration}
                  onChange={(e) => setCustomSettings({
                    ...customSettings,
                    shortBreakDuration: parseInt(e.target.value)
                  })}
                  className="flex-1"
                />
                <span className="w-12 text-center font-semibold">
                  {customSettings.shortBreakDuration}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                긴 휴식 (분)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="10"
                  max="30"
                  value={customSettings.longBreakDuration}
                  onChange={(e) => setCustomSettings({
                    ...customSettings,
                    longBreakDuration: parseInt(e.target.value)
                  })}
                  className="flex-1"
                />
                <span className="w-12 text-center font-semibold">
                  {customSettings.longBreakDuration}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                긴 휴식 전 사이클 수
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="2"
                  max="6"
                  value={customSettings.cyclesBeforeLongBreak}
                  onChange={(e) => setCustomSettings({
                    ...customSettings,
                    cyclesBeforeLongBreak: parseInt(e.target.value)
                  })}
                  className="flex-1"
                />
                <span className="w-12 text-center font-semibold">
                  {customSettings.cyclesBeforeLongBreak}
                </span>
              </div>
            </div>
          </div>

          {/* 자동화 설정 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm font-medium">휴식 자동 시작</span>
              <button
                onClick={() => setCustomSettings({
                  ...customSettings,
                  autoStartBreaks: !customSettings.autoStartBreaks
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  customSettings.autoStartBreaks ? 'bg-primary-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    customSettings.autoStartBreaks ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm font-medium">포모도로 자동 시작</span>
              <button
                onClick={() => setCustomSettings({
                  ...customSettings,
                  autoStartPomodoros: !customSettings.autoStartPomodoros
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  customSettings.autoStartPomodoros ? 'bg-primary-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    customSettings.autoStartPomodoros ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 알림 설정 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                알림 소리
              </label>
              <select
                value={customSettings.notificationSound}
                onChange={(e) => setCustomSettings({
                  ...customSettings,
                  notificationSound: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="bell">종소리</option>
                <option value="chime">차임벨</option>
                <option value="ding">딩동</option>
                <option value="knock">노크</option>
                <option value="none">없음</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                알림 볼륨
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={customSettings.notificationVolume}
                  onChange={(e) => setCustomSettings({
                    ...customSettings,
                    notificationVolume: parseInt(e.target.value)
                  })}
                  className="flex-1"
                />
                <span className="w-12 text-center font-semibold">
                  {customSettings.notificationVolume}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="primary" onClick={() => console.log('설정 적용')}>
            설정 적용
          </Button>
          <Button variant="secondary" onClick={() => console.log('초기화')}>
            초기화
          </Button>
        </div>
      </Card>

      {/* 빠른 프리셋 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">빠른 프리셋</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: '5분 집중', focus: 5, break: 1 },
            { label: '15분 스프린트', focus: 15, break: 3 },
            { label: '25분 클래식', focus: 25, break: 5 },
            { label: '45분 딥워크', focus: 45, break: 10 }
          ].map((preset) => (
            <motion.button
              key={preset.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCustomSettings({
                ...customSettings,
                focusDuration: preset.focus,
                shortBreakDuration: preset.break
              })}
              className="p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 transition-colors"
            >
              <p className="font-semibold text-gray-900 dark:text-white">
                {preset.label}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {preset.focus}분 / {preset.break}분
              </p>
            </motion.button>
          ))}
        </div>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* 탭 네비게이션 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'timer' && renderCustomTimer()}
          {activeTab === 'templates' && <TimerTemplates />}
          {activeTab === 'history' && <TimerHistory />}
          {activeTab === 'sounds' && <AmbientSounds />}
          {activeTab === 'settings' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">고급 설정</h3>
              <p className="text-gray-600 dark:text-gray-400">
                추가 설정 옵션이 여기에 표시됩니다.
              </p>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default TimerAdvanced