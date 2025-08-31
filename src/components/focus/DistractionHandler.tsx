import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppSelector, useAppDispatch } from '../../store/store'
import { selectFocusMode, selectCurrentTask, selectCurrentUser } from '../../store/selectors'
import { updateLastActive } from '../../store/userSlice'
import { DistractionEvent, distractionService } from '../../services/distractionService'
import { useMindfulness } from '../../hooks/useMindfulness'
import Button from '../ui/Button'
import Card from '../ui/Card'
import MindfulnessActivities from './MindfulnessActivities'

interface DistractionHandlerProps {
  isActive: boolean
}

interface DistractionAlert {
  id: string
  event: DistractionEvent
  isVisible: boolean
}

const DistractionHandler: React.FC<DistractionHandlerProps> = ({ isActive }) => {
  const dispatch = useAppDispatch()
  const focusMode = useAppSelector(selectFocusMode)
  const currentTask = useAppSelector(selectCurrentTask)
  const user = useAppSelector(selectCurrentUser)
  
  const [alerts, setAlerts] = useState<DistractionAlert[]>([])
  const [showInactivityReminder, setShowInactivityReminder] = useState(false)
  
  const {
    isVisible: showMindfulness,
    showMindfulness: openMindfulness,
    hideMindfulness: closeMindfulness,
    completeMindfulnessActivity
  } = useMindfulness()

  // 주의산만 이벤트 처리
  useEffect(() => {
    if (!isActive || !focusMode) return

    const unsubscribe = distractionService.onDistraction((event) => {
      handleDistractionEvent(event)
    })

    // 설정 업데이트
    if (user?.settings.focusMode) {
      distractionService.updateSettings({
        inactivityThreshold: user.settings.focusMode.inactivityThreshold,
        enableGentleReminders: user.settings.focusMode.showBreathingReminders,
        enableNotificationBlocking: user.settings.focusMode.hideNotifications,
        enableWebsiteBlocking: user.settings.focusMode.blockDistractions,
      })
    }

    return unsubscribe
  }, [isActive, focusMode, user?.settings.focusMode])

  // 주의산만 이벤트 처리
  const handleDistractionEvent = (event: DistractionEvent) => {
    console.log('Distraction detected:', event)

    switch (event.type) {
      case 'inactivity':
        handleInactivityDistraction(event)
        break
      case 'website':
        handleWebsiteDistraction(event)
        break
      case 'notification':
        handleNotificationDistraction(event)
        break
      case 'manual':
        handleManualDistraction(event)
        break
    }
  }

  // 비활성 상태 처리
  const handleInactivityDistraction = (_event: DistractionEvent) => {
    setShowInactivityReminder(true)
    
    // 분석용 데이터 저장
    // TODO: 분석 서비스에 데이터 저장
  }

  // 웹사이트 전환 처리
  const handleWebsiteDistraction = (event: DistractionEvent) => {
    if (!user?.settings.focusMode.blockDistractions) return

    const alertId = crypto.randomUUID()
    const alert: DistractionAlert = {
      id: alertId,
      event,
      isVisible: true,
    }

    setAlerts(prev => [...prev, alert])

    // 5초 후 자동 제거
    setTimeout(() => {
      removeAlert(alertId)
    }, 5000)
  }

  // 알림 처리
  const handleNotificationDistraction = (_event: DistractionEvent) => {
    // 알림 차단이 활성화된 경우 처리
    if (user?.settings.focusMode.hideNotifications) {
      console.log('Notification blocked during focus mode')
    }
  }

  // 수동 주의산만 처리
  const handleManualDistraction = (event: DistractionEvent) => {
    // 사용자가 직접 보고한 주의산만
    console.log('Manual distraction reported:', event)
  }

  // 알림 제거
  const removeAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }

  // 비활성 알림 처리
  const handleInactivityResponse = (action: 'continue' | 'break' | 'refocus') => {
    setShowInactivityReminder(false)
    dispatch(updateLastActive())

    switch (action) {
      case 'continue':
        // 계속 진행
        break
      case 'break':
        // 휴식 모드로 전환 (타이머 서비스에서 처리)
        break
      case 'refocus':
        // 마인드풀니스 활동 제안
        openMindfulness()
        break
    }
  }

  // 웹사이트 전환 알림 처리
  const handleWebsiteAlert = (alertId: string, action: 'dismiss' | 'return') => {
    removeAlert(alertId)

    if (action === 'return') {
      // 현재 작업으로 돌아가기 안내
      console.log('Returning to current task')
    }
  }

  if (!isActive || !focusMode) {
    return null
  }

  return (
    <div className="distraction-handler">
      {/* 마인드풀니스 활동 모달 */}
      <MindfulnessActivities
        isVisible={showMindfulness}
        onClose={closeMindfulness}
        onComplete={completeMindfulnessActivity}
      />

      {/* 비활성 상태 알림 */}
      <AnimatePresence>
        {showInactivityReminder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <Card className="max-w-md w-full text-center bg-white">
                <div className="space-y-6">
                  {/* 아이콘 */}
                  <div className="text-6xl">🤔</div>
                  
                  {/* 메시지 */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      잠깐, 어디 계신가요?
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {distractionService.getInactivityDuration().toFixed(0)}분 동안 활동이 없었어요. 
                      괜찮으시다면 현재 작업을 계속하거나 잠시 휴식을 취해보세요.
                    </p>
                  </div>

                  {/* 현재 작업 표시 */}
                  {currentTask && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">현재 작업</p>
                      <p className="font-medium text-gray-900">{currentTask.title}</p>
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <div className="flex flex-col space-y-3">
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => handleInactivityResponse('continue')}
                      icon={<span>✅</span>}
                    >
                      계속 진행하기
                    </Button>
                    
                    <div className="flex space-x-3">
                      <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => handleInactivityResponse('break')}
                        icon={<span>☕</span>}
                      >
                        휴식하기
                      </Button>
                      <Button
                        variant="secondary"
                        fullWidth
                        onClick={() => handleInactivityResponse('refocus')}
                        icon={<span>🧘‍♀️</span>}
                      >
                        집중 도움
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 웹사이트 전환 알림들 */}
      <div className="fixed top-20 right-6 z-40 space-y-3">
        <AnimatePresence>
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              className="max-w-sm"
            >
              <Card className="bg-yellow-50 border-yellow-200">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">⚠️</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-yellow-800 mb-1">
                      주의산만 감지
                    </h4>
                    <p className="text-sm text-yellow-700 mb-3">
                      다른 탭으로 이동하셨네요. 현재 작업에 집중해보세요!
                    </p>
                    
                    {currentTask && (
                      <div className="bg-yellow-100 p-2 rounded text-xs text-yellow-800 mb-3">
                        <strong>현재 작업:</strong> {currentTask.title}
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleWebsiteAlert(alert.id, 'return')}
                        className="text-xs"
                      >
                        돌아가기
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleWebsiteAlert(alert.id, 'dismiss')}
                        className="text-xs"
                      >
                        무시
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default DistractionHandler