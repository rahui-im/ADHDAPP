import React, { useState, useEffect } from 'react'
import { notificationService } from '../../services/notificationService'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { 
  BellIcon, 
  BellSlashIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface NotificationSettingsProps {
  onClose?: () => void
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const [notificationStatus, setNotificationStatus] = useState(notificationService.getNotificationStatus())
  const [isRequesting, setIsRequesting] = useState(false)
  const [testNotificationSent, setTestNotificationSent] = useState(false)

  // 알림 상태 업데이트
  useEffect(() => {
    const updateStatus = () => {
      setNotificationStatus(notificationService.getNotificationStatus())
    }

    // 페이지 포커스 시 상태 업데이트
    window.addEventListener('focus', updateStatus)
    return () => window.removeEventListener('focus', updateStatus)
  }, [])

  const handleRequestPermission = async () => {
    setIsRequesting(true)
    try {
      const result = await notificationService.requestPermission()
      if (result.granted) {
        setNotificationStatus(notificationService.getNotificationStatus())
      } else {
        alert(result.error || '알림 권한을 허용해주세요.')
      }
    } catch (error) {
      console.error('알림 권한 요청 실패:', error)
    } finally {
      setIsRequesting(false)
    }
  }

  const handleTestNotification = async () => {
    try {
      await notificationService.notifyPomodoroComplete(
        { 
          mode: 'focus', 
          currentCycle: 1, 
          totalCycles: 4,
          duration: 1500,
          remaining: 0,
          isRunning: false,
          isPaused: false
        },
        '테스트 작업'
      )
      setTestNotificationSent(true)
      setTimeout(() => setTestNotificationSent(false), 3000)
    } catch (error) {
      console.error('테스트 알림 실패:', error)
    }
  }

  const getPermissionStatusInfo = () => {
    switch (notificationStatus.permission) {
      case 'granted':
        return {
          icon: <CheckCircleIcon className="w-5 h-5 text-green-600" />,
          text: '알림이 허용되었습니다',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      case 'denied':
        return {
          icon: <BellSlashIcon className="w-5 h-5 text-red-600" />,
          text: '알림이 차단되었습니다',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      default:
        return {
          icon: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />,
          text: '알림 권한이 필요합니다',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        }
    }
  }

  const statusInfo = getPermissionStatusInfo()

  if (!notificationStatus.supported) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <BellSlashIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            알림 지원 안함
          </h3>
          <p className="text-gray-600">
            현재 브라우저에서는 알림 기능을 지원하지 않습니다.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 알림 권한 상태 */}
      <Card className={`p-6 ${statusInfo.bgColor} ${statusInfo.borderColor} border`}>
        <div className="flex items-center space-x-3">
          {statusInfo.icon}
          <div className="flex-1">
            <h3 className={`font-semibold ${statusInfo.color}`}>
              알림 권한 상태
            </h3>
            <p className={`text-sm ${statusInfo.color}`}>
              {statusInfo.text}
            </p>
          </div>
          
          {notificationStatus.permission !== 'granted' && (
            <Button
              onClick={handleRequestPermission}
              disabled={isRequesting}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {isRequesting ? '요청 중...' : '권한 허용'}
            </Button>
          )}
        </div>

        {/* 권한이 거부된 경우 안내 */}
        {notificationStatus.permission === 'denied' && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-red-200">
            <h4 className="font-medium text-red-900 mb-2">
              알림을 다시 허용하는 방법
            </h4>
            <ol className="text-sm text-red-700 space-y-1 list-decimal list-inside">
              <li>브라우저 주소창 왼쪽의 자물쇠 아이콘을 클릭하세요</li>
              <li>"알림" 설정을 "허용"으로 변경하세요</li>
              <li>페이지를 새로고침하세요</li>
            </ol>
          </div>
        )}
      </Card>

      {/* 알림 기능 설명 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          알림 기능
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-sm">🍅</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">포모도로 완료</h4>
              <p className="text-sm text-gray-600">
                집중 시간이 끝나면 휴식을 권장하는 알림을 받습니다
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 text-sm">⏰</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">휴식 시간 완료</h4>
              <p className="text-sm text-gray-600">
                휴식이 끝나면 다음 작업을 시작하도록 알림을 받습니다
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-purple-600 text-sm">🎯</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">목표 달성</h4>
              <p className="text-sm text-gray-600">
                일일 목표나 연속 달성 기록을 축하하는 알림을 받습니다
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-yellow-600 text-sm">💭</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">집중력 리마인더</h4>
              <p className="text-sm text-gray-600">
                비활성 상태가 감지되면 부드럽게 집중을 유도하는 알림을 받습니다
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 테스트 알림 */}
      {notificationStatus.enabled && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            알림 테스트
          </h3>
          <p className="text-gray-600 mb-4">
            알림이 제대로 작동하는지 테스트해보세요.
          </p>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleTestNotification}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <BellIcon className="w-4 h-4" />
              <span>테스트 알림 보내기</span>
            </Button>
            
            {testNotificationSent && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircleIcon className="w-5 h-5" />
                <span className="text-sm">테스트 알림을 보냈습니다!</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 닫기 버튼 */}
      {onClose && (
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            닫기
          </Button>
        </div>
      )}
    </div>
  )
}

export default NotificationSettings