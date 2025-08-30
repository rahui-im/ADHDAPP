import React, { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from './store/store'
import { selectCurrentUser, selectIsAuthenticated } from './store/selectors'
import { initializeUser } from './store/userSlice'
import { storageService } from './services'
import AppRouter from './router/AppRouter'
import Button from './components/ui/Button'
import Card from './components/ui/Card'
import { KeyboardShortcutsHelp } from './components/accessibility/KeyboardShortcutsHelp'
import { useAccessibility } from './hooks/useAccessibility'
import { performanceMonitor } from './utils/performanceMonitor'
import InstallPrompt from './components/pwa/InstallPrompt'
import OnboardingTour from './components/onboarding/OnboardingTour'
import { useOnboarding } from './hooks/useOnboarding'

function App() {
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector(selectCurrentUser)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const [isInitializing, setIsInitializing] = useState(true)
  const { announce } = useAccessibility()
  const { 
    showOnboarding, 
    completeOnboarding, 
    skipOnboarding
  } = useOnboarding()

  // 앱 초기화
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 성능 모니터링 시작
        performanceMonitor.estimateBundleSize()
        
        // 저장된 사용자 데이터 로드
        const savedUser = storageService.user.loadUser()
        
        if (savedUser) {
          dispatch(initializeUser({ name: savedUser.name }))
        }
        
        setIsInitializing(false)
      } catch (error) {
        console.error('앱 초기화 실패:', error)
        setIsInitializing(false)
      }
    }

    initializeApp()
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      performanceMonitor.cleanup()
    }
  }, [dispatch])

  // 사용자 등록 처리
  const handleUserSetup = (name: string) => {
    dispatch(initializeUser({ name }))
    announce('환영합니다! 앱 사용을 시작합니다.', 'polite')
  }

  // 로딩 중
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">앱을 초기화하는 중...</p>
        </div>
      </div>
    )
  }

  // 사용자 설정이 필요한 경우
  if (!isAuthenticated || !currentUser) {
    return <WelcomeScreen onUserSetup={handleUserSetup} />
  }

  // 메인 앱 with Router
  return (
    <BrowserRouter>
      <div className="app-container">
        {/* 스킵 링크 */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-lg z-50"
        >
          메인 콘텐츠로 건너뛰기
        </a>
        
        {/* Router Configuration */}
        <AppRouter />
        
        {/* 키보드 단축키 도움말 */}
        <div className="fixed bottom-4 right-4 z-40">
          <KeyboardShortcutsHelp />
        </div>
        
        {/* PWA 설치 프롬프트 */}
        <InstallPrompt />
        
        {/* 온보딩 투어 */}
        <OnboardingTour
          isOpen={showOnboarding && isAuthenticated}
          onClose={skipOnboarding}
          onComplete={completeOnboarding}
        />
      </div>
    </BrowserRouter>
  )
}

// 환영 화면 컴포넌트
const WelcomeScreen: React.FC<{ onUserSetup: (name: string) => void }> = ({ onUserSetup }) => {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onUserSetup(name.trim())
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-success-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ADHD Time Manager
          </h1>
          <p className="text-gray-600">
            ADHD를 위한 맞춤형 시간관리 도구에 오신 것을 환영합니다! 🎯
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              이름을 알려주세요
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 김철수"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <Button type="submit" className="w-full" size="lg">
            시작하기
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>모든 데이터는 브라우저에 안전하게 저장됩니다.</p>
        </div>
      </Card>
    </div>
  )
}

export default App