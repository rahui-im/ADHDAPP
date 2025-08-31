import React from 'react'
import { NotificationSettings } from '../components/settings/NotificationSettings'
import { BackupManager } from '../components/settings/BackupManager'
import { PWAStatus } from '../components/pwa/PWAStatus'
import { useAppSelector, useAppDispatch } from '../store/store'
import { selectCurrentUser } from '../store/selectors'
import { updateUserPreferences } from '../store/userSlice'
import { resetOnboarding, startOnboarding } from '../store/onboardingSlice'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { 
  UserIcon, 
  BellIcon, 
  CloudArrowUpIcon,
  DevicePhoneMobileIcon,
  PaintBrushIcon,
  LanguageIcon 
} from '@heroicons/react/24/outline'

/**
 * 설정 페이지
 * 사용자 프로필, 알림, 백업, PWA 설정 등을 관리합니다.
 */
const SettingsPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector(selectCurrentUser)
  const [activeTab, setActiveTab] = React.useState('profile')

  const handlePreferenceChange = (key: string, value: any) => {
    if (currentUser) {
      dispatch(updateUserPreferences({
        ...currentUser.preferences,
        [key]: value
      }))
    }
  }

  const tabs = [
    { id: 'profile', name: '프로필', icon: UserIcon },
    { id: 'notifications', name: '알림', icon: BellIcon },
    { id: 'backup', name: '백업', icon: CloudArrowUpIcon },
    { id: 'pwa', name: '앱 설정', icon: DevicePhoneMobileIcon },
    { id: 'appearance', name: '테마', icon: PaintBrushIcon },
    { id: 'onboarding', name: '온보딩', icon: UserIcon },
  ]

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">설정</h1>
        <p className="text-gray-600">
          앱의 동작 방식과 개인 설정을 관리합니다.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* 탭 네비게이션 */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700 border border-primary-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* 설정 내용 */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">프로필 설정</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    value={currentUser?.name || ''}
                    onChange={(e) => handlePreferenceChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기본 집중 시간 (분)
                  </label>
                  <select
                    value={currentUser?.preferences?.defaultFocusDuration || 25}
                    onChange={(e) => handlePreferenceChange('defaultFocusDuration', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value={15}>15분</option>
                    <option value={25}>25분</option>
                    <option value={45}>45분</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기본 휴식 시간 (분)
                  </label>
                  <select
                    value={currentUser?.preferences?.defaultBreakDuration || 5}
                    onChange={(e) => handlePreferenceChange('defaultBreakDuration', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value={5}>5분</option>
                    <option value={10}>10분</option>
                    <option value={15}>15분</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="energyTracking"
                    checked={currentUser?.preferences?.energyTrackingEnabled || false}
                    onChange={(e) => handlePreferenceChange('energyTrackingEnabled', e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="energyTracking" className="ml-2 text-sm text-gray-700">
                    에너지 레벨 추적 활성화
                  </label>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">알림 설정</h2>
              <NotificationSettings />
            </Card>
          )}

          {activeTab === 'backup' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">데이터 백업</h2>
              <BackupManager />
            </Card>
          )}

          {activeTab === 'pwa' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">앱 설정</h2>
              <PWAStatus />
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">테마 설정</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    테마
                  </label>
                  <select
                    value={currentUser?.settings?.theme || 'light'}
                    onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="light">라이트</option>
                    <option value="dark">다크</option>
                    <option value="auto">시스템 설정</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    언어
                  </label>
                  <select
                    value={currentUser?.settings?.language || 'ko'}
                    onChange={(e) => handlePreferenceChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>팁:</strong> ADHD 친화적인 디자인을 위해 높은 대비와 명확한 색상을 사용합니다.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'onboarding' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">온보딩 설정</h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">온보딩 투어</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    처음 사용자를 위한 기능 안내 투어를 다시 시작할 수 있습니다.
                  </p>
                  <div className="flex space-x-3">
                    <Button
                      variant="primary"
                      onClick={() => {
                        dispatch(resetOnboarding())
                        dispatch(startOnboarding())
                      }}
                    >
                      온보딩 다시 보기
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        dispatch(resetOnboarding())
                        alert('온보딩이 초기화되었습니다. 페이지를 새로고침하면 온보딩이 다시 시작됩니다.')
                      }}
                    >
                      온보딩 초기화
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>온보딩 기능:</strong>
                  </p>
                  <ul className="mt-2 text-sm text-blue-700 space-y-1">
                    <li>• 주요 기능 소개 및 투어</li>
                    <li>• 키보드 단축키 안내</li>
                    <li>• 단계별 진행 상황 추적</li>
                    <li>• 완료 시 축하 애니메이션</li>
                  </ul>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsPage