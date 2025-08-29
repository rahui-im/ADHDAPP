import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import { updatePreferences } from '../../store/userSlice'
import { useNotifications } from '../../hooks/useNotifications'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

export const NotificationSettings: React.FC = () => {
  const dispatch = useDispatch()
  const userPreferences = useSelector((state: RootState) => state.user.preferences)
  const { notificationState, requestPermission } = useNotifications()

  const handleToggleNotifications = () => {
    dispatch(updatePreferences({
      notificationsEnabled: !userPreferences.notificationsEnabled
    }))
  }

  const handleRequestPermission = async () => {
    const result = await requestPermission()
    if (!result.granted && result.error) {
      // 에러 처리는 토스트나 모달로 표시할 수 있음
      console.error('알림 권한 요청 실패:', result.error)
    }
  }

  const getPermissionStatusText = () => {
    switch (notificationState.permission) {
      case 'granted':
        return '허용됨'
      case 'denied':
        return '거부됨'
      default:
        return '요청되지 않음'
    }
  }

  const getPermissionStatusColor = () => {
    switch (notificationState.permission) {
      case 'granted':
        return 'text-green-600'
      case 'denied':
        return 'text-red-600'
      default:
        return 'text-yellow-600'
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">알림 설정</h3>
      
      <div className="space-y-4">
        {/* 브라우저 지원 상태 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">브라우저 지원</span>
          <span className={`text-sm font-medium ${
            notificationState.supported ? 'text-green-600' : 'text-red-600'
          }`}>
            {notificationState.supported ? '지원됨' : '지원되지 않음'}
          </span>
        </div>

        {/* 권한 상태 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">브라우저 권한</span>
          <span className={`text-sm font-medium ${getPermissionStatusColor()}`}>
            {getPermissionStatusText()}
          </span>
        </div>

        {/* 권한 요청 버튼 */}
        {notificationState.supported && notificationState.permission !== 'granted' && (
          <div className="pt-2">
            <Button
              onClick={handleRequestPermission}
              disabled={notificationState.requesting || notificationState.permission === 'denied'}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {notificationState.requesting ? '요청 중...' : '알림 권한 요청'}
            </Button>
            
            {notificationState.permission === 'denied' && (
              <p className="text-xs text-red-600 mt-2">
                브라우저 설정에서 알림 권한을 직접 허용해주세요.
              </p>
            )}
          </div>
        )}

        {/* 알림 활성화 토글 */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            <label htmlFor="notifications-toggle" className="text-sm font-medium">
              알림 활성화
            </label>
            <p className="text-xs text-gray-500">
              포모도로 완료, 휴식 시간 등의 알림을 받습니다
            </p>
          </div>
          <button
            id="notifications-toggle"
            type="button"
            onClick={handleToggleNotifications}
            disabled={!notificationState.supported || notificationState.permission !== 'granted'}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              userPreferences.notificationsEnabled && notificationState.enabled
                ? 'bg-blue-600'
                : 'bg-gray-200'
            } ${
              !notificationState.supported || notificationState.permission !== 'granted'
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                userPreferences.notificationsEnabled && notificationState.enabled
                  ? 'translate-x-6'
                  : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* 알림 유형 설명 */}
        {userPreferences.notificationsEnabled && notificationState.enabled && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">받을 수 있는 알림</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• 포모도로 집중 시간 완료</li>
              <li>• 휴식 시간 완료</li>
              <li>• 긴 휴식 제안</li>
              <li>• 작업 완료 축하</li>
              <li>• 집중력 회복 리마인더</li>
              <li>• 일일 목표 달성</li>
              <li>• 연속 달성 기록</li>
            </ul>
          </div>
        )}
      </div>
    </Card>
  )
}