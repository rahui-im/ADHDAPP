import React from 'react'
import { usePWA } from '../../utils/pwaUtils'
import { useOffline } from '../../services/offlineService'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { 
  ArrowDownTrayIcon, 
  ArrowPathIcon, 
  WifiIcon,
  SignalSlashIcon,
  CloudArrowUpIcon 
} from '@heroicons/react/24/outline'

/**
 * PWA 상태 및 제어 컴포넌트
 * 앱 설치, 업데이트, 오프라인 상태 등을 관리합니다.
 */
export const PWAStatus: React.FC = () => {
  const { 
    isUpdateAvailable, 
    isInstallable, 
    isOnline, 
    isInstalled, 
    installApp, 
    updateApp 
  } = usePWA()
  
  const { 
    pendingActions, 
    lastSyncTime, 
    forceSync 
  } = useOffline()

  const [isInstalling, setIsInstalling] = React.useState(false)
  const [isSyncing, setIsSyncing] = React.useState(false)

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      await installApp()
    } catch (error) {
      console.error('Installation failed:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await forceSync()
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const formatLastSyncTime = (timestamp: number) => {
    if (!timestamp) return '동기화된 적 없음'
    
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}일 전`
    if (hours > 0) return `${hours}시간 전`
    if (minutes > 0) return `${minutes}분 전`
    return '방금 전'
  }

  return (
    <div className="space-y-4">
      {/* 네트워크 상태 */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isOnline ? (
              <WifiIcon className="w-5 h-5 text-green-600" />
            ) : (
              <SignalSlashIcon className="w-5 h-5 text-red-600" />
            )}
            <div>
              <p className="font-medium text-gray-900">
                {isOnline ? '온라인' : '오프라인'}
              </p>
              <p className="text-sm text-gray-600">
                {isOnline 
                  ? '모든 기능을 사용할 수 있습니다' 
                  : '일부 기능이 제한됩니다'
                }
              </p>
            </div>
          </div>
          
          {pendingActions > 0 && (
            <div className="flex items-center space-x-2">
              <CloudArrowUpIcon className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-600">
                {pendingActions}개 대기 중
              </span>
            </div>
          )}
        </div>

        {/* 동기화 정보 */}
        {isOnline && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  마지막 동기화: {formatLastSyncTime(lastSyncTime)}
                </p>
                {pendingActions > 0 && (
                  <p className="text-sm text-yellow-600">
                    {pendingActions}개 항목이 동기화를 기다리고 있습니다
                  </p>
                )}
              </div>
              
              {pendingActions > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="flex items-center space-x-2"
                >
                  <ArrowPathIcon className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? '동기화 중...' : '지금 동기화'}</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* 앱 업데이트 */}
      {isUpdateAvailable && (
        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">새 버전 사용 가능</h3>
              <p className="text-sm text-blue-700">
                더 나은 성능과 새로운 기능을 경험하세요
              </p>
            </div>
            <Button
              onClick={updateApp}
              className="bg-blue-600 hover:bg-blue-700"
            >
              지금 업데이트
            </Button>
          </div>
        </Card>
      )}

      {/* 앱 설치 */}
      {isInstallable && !isInstalled && (
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-green-900">앱 설치</h3>
              <p className="text-sm text-green-700">
                홈 화면에 추가하여 더 빠르게 접근하세요
              </p>
            </div>
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>{isInstalling ? '설치 중...' : '설치'}</span>
            </Button>
          </div>
        </Card>
      )}

      {/* PWA 설치 완료 */}
      {isInstalled && (
        <Card className="p-4 border-purple-200 bg-purple-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            <div>
              <h3 className="font-medium text-purple-900">앱이 설치되었습니다</h3>
              <p className="text-sm text-purple-700">
                홈 화면에서 바로 실행할 수 있습니다
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

/**
 * 간단한 PWA 상태 표시기 (헤더용)
 */
export const PWAStatusIndicator: React.FC = () => {
  const { isOnline } = usePWA()
  const { pendingActions } = useOffline()

  if (!isOnline) {
    return (
      <div className="flex items-center space-x-2 text-red-600">
        <SignalSlashIcon className="w-4 h-4" />
        <span className="text-sm">오프라인</span>
      </div>
    )
  }

  if (pendingActions > 0) {
    return (
      <div className="flex items-center space-x-2 text-yellow-600">
        <CloudArrowUpIcon className="w-4 h-4" />
        <span className="text-sm">{pendingActions}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 text-green-600">
      <WifiIcon className="w-4 h-4" />
      <span className="text-sm">온라인</span>
    </div>
  )
}