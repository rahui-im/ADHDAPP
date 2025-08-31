import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppSelector, useAppDispatch } from '../../store/store'
import { selectCurrentUser } from '../../store/selectors'
import { setFocusMode, updateFocusSettings } from '../../store/userSlice'
import { FocusModeProps, FocusSettings } from '../../types'
import { useMindfulness } from '../../hooks/useMindfulness'
import Button from '../ui/Button'
import Card from '../ui/Card'
import DistractionHandler from './DistractionHandler'

interface FocusModeState {
  isMinimal: boolean
  showControls: boolean
  lastActivity: Date
}

const FocusMode: React.FC<FocusModeProps> = ({
  isActive,
  currentTask,
  onToggle,
  onDistraction,
}) => {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectCurrentUser)
  const [state, setState] = useState<FocusModeState>({
    isMinimal: false,
    showControls: true,
    lastActivity: new Date(),
  })

  const focusSettings = user?.settings.focusMode
  const { showMindfulness, shouldSuggestMindfulness } = useMindfulness()

  // 집중 모드 활성화/비활성화
  const handleToggleFocusMode = () => {
    dispatch(setFocusMode(!isActive))
    onToggle()
  }

  // 미니멀 모드 토글
  const handleToggleMinimal = () => {
    setState(prev => ({ ...prev, isMinimal: !prev.isMinimal }))
  }

  // 컨트롤 표시/숨김 토글
  const handleToggleControls = () => {
    setState(prev => ({ ...prev, showControls: !prev.showControls }))
  }

  // 집중 모드 설정 업데이트
  const handleUpdateSettings = (updates: Partial<FocusSettings>) => {
    if (focusSettings) {
      dispatch(updateFocusSettings(updates))
    }
  }

  // 활동 감지 및 업데이트
  const updateActivity = () => {
    setState(prev => ({ ...prev, lastActivity: new Date() }))
  }

  // 마우스/키보드 활동 감지
  useEffect(() => {
    if (!isActive) return

    const handleActivity = () => updateActivity()
    
    document.addEventListener('mousemove', handleActivity)
    document.addEventListener('keypress', handleActivity)
    document.addEventListener('click', handleActivity)
    document.addEventListener('scroll', handleActivity)

    return () => {
      document.removeEventListener('mousemove', handleActivity)
      document.removeEventListener('keypress', handleActivity)
      document.removeEventListener('click', handleActivity)
      document.removeEventListener('scroll', handleActivity)
    }
  }, [isActive])

  // 비활성 상태 감지 (15분 임계값)
  useEffect(() => {
    if (!isActive || !focusSettings?.inactivityThreshold) return

    const checkInactivity = () => {
      const now = new Date()
      const timeSinceLastActivity = (now.getTime() - state.lastActivity.getTime()) / (1000 * 60) // minutes
      
      if (timeSinceLastActivity >= focusSettings.inactivityThreshold) {
        onDistraction('inactivity')
      }
    }

    const interval = setInterval(checkInactivity, 60000) // 1분마다 체크
    return () => clearInterval(interval)
  }, [isActive, state.lastActivity, focusSettings?.inactivityThreshold, onDistraction])

  if (!isActive) {
    return null
  }

  return (
    <div className="focus-mode-overlay">
      {/* 주의산만 감지 및 처리 */}
      <DistractionHandler isActive={isActive} />

      {/* 집중 모드 배경 오버레이 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gray-900 bg-opacity-95 z-40 pointer-events-none"
      />

      {/* 미니멀 모드 컨테이너 */}
      <AnimatePresence>
        {state.isMinimal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <Card className="bg-gray-800 border-gray-700 text-white max-w-md w-full">
              <div className="text-center space-y-6">
                {/* 현재 작업 표시 */}
                {currentTask && (
                  <div>
                    <h2 className="text-xl font-semibold mb-2">현재 작업</h2>
                    <p className="text-gray-300">{currentTask.title}</p>
                  </div>
                )}

                {/* 집중 상태 표시 */}
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-lg font-medium">집중 중...</span>
                </div>

                {/* 미니멀 모드 해제 버튼 */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleToggleMinimal}
                  className="text-xs"
                >
                  상세 보기
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 집중 모드 컨트롤 패널 */}
      <AnimatePresence>
        {state.showControls && !state.isMinimal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Card className="bg-gray-800 border-gray-700 text-white p-6 min-w-[300px]">
              <div className="space-y-4">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                    <span className="font-semibold">집중 모드</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleControls}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </Button>
                </div>

                {/* 현재 작업 */}
                {currentTask && (
                  <div className="border-t border-gray-700 pt-4">
                    <h3 className="text-sm font-medium text-gray-300 mb-1">현재 작업</h3>
                    <p className="text-white">{currentTask.title}</p>
                  </div>
                )}

                {/* 집중 모드 옵션 */}
                <div className="border-t border-gray-700 pt-4 space-y-3">
                  <h3 className="text-sm font-medium text-gray-300">옵션</h3>
                  
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={focusSettings?.hideNotifications}
                        onChange={(e) => handleUpdateSettings({ hideNotifications: e.target.checked })}
                        className="rounded border-gray-600 bg-gray-700 text-green-400 focus:ring-green-400"
                      />
                      <span className="text-sm">알림 숨기기</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={focusSettings?.showBreathingReminders}
                        onChange={(e) => handleUpdateSettings({ showBreathingReminders: e.target.checked })}
                        className="rounded border-gray-600 bg-gray-700 text-green-400 focus:ring-green-400"
                      />
                      <span className="text-sm">호흡 알림 표시</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={focusSettings?.blockDistractions}
                        onChange={(e) => handleUpdateSettings({ blockDistractions: e.target.checked })}
                        className="rounded border-gray-600 bg-gray-700 text-green-400 focus:ring-green-400"
                      />
                      <span className="text-sm">방해 요소 차단</span>
                    </label>
                  </div>
                </div>

                {/* 마인드풀니스 제안 */}
                {shouldSuggestMindfulness && (
                  <div className="border-t border-gray-700 pt-4">
                    <div className="bg-blue-900/50 p-3 rounded-lg mb-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">🧘‍♀️</span>
                        <span className="text-sm font-medium text-blue-300">집중력 회복 제안</span>
                      </div>
                      <p className="text-xs text-blue-200">
                        잠시 마인드풀니스 활동으로 집중력을 회복해보세요.
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={showMindfulness}
                      className="w-full mb-3"
                      icon={<span>🌱</span>}
                    >
                      마인드풀니스 활동
                    </Button>
                  </div>
                )}

                {/* 액션 버튼 */}
                <div className="border-t border-gray-700 pt-4 flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleToggleMinimal}
                    className="flex-1"
                  >
                    미니멀 모드
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleToggleFocusMode}
                    className="flex-1"
                  >
                    집중 모드 해제
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 컨트롤 패널 토글 버튼 (숨겨진 상태일 때) */}
      <AnimatePresence>
        {!state.showControls && !state.isMinimal && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleToggleControls}
            className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
          >
            <span className="text-lg">⚙️</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

export { FocusMode }
export default FocusMode