import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppSelector, useAppDispatch } from '../../store/store'
import { selectFocusMode, selectEnergyLevel, selectCurrentStreak, selectCurrentTask } from '../../store/selectors'
import { toggleFocusMode, setEnergyLevel } from '../../store/userSlice'
import { DistractionType } from '../../types'
import Header from './Header'
import Sidebar from './Sidebar'
import Button from '../ui/Button'
import { FocusMode } from '../focus'
import { useAccessibility } from '../../hooks/useAccessibility'

interface LayoutProps {
  children: React.ReactNode
  currentPage: string
  onNavigate: (page: string) => void
}

const Layout: React.FC<LayoutProps> = ({
  children,
  currentPage,
  onNavigate,
}) => {
  const dispatch = useAppDispatch()
  const focusMode = useAppSelector(selectFocusMode)
  const energyLevel = useAppSelector(selectEnergyLevel)
  const currentStreak = useAppSelector(selectCurrentStreak)
  const currentTask = useAppSelector(selectCurrentTask)
  const { announce } = useAccessibility()
  
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showFocusBreakReminder, setShowFocusBreakReminder] = useState(false)

  // ADHD 친화적 기능: 집중 모드에서 주기적 휴식 알림
  useEffect(() => {
    if (focusMode) {
      const breakReminder = setInterval(() => {
        setShowFocusBreakReminder(true)
      }, 25 * 60 * 1000) // 25분마다 휴식 알림

      return () => clearInterval(breakReminder)
    }
  }, [focusMode])

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  const handleFocusModeToggle = () => {
    const newFocusMode = !focusMode
    dispatch(toggleFocusMode())
    setShowFocusBreakReminder(false)
    
    // 집중 모드 변경 알림
    announce(
      newFocusMode ? '집중 모드가 활성화되었습니다' : '집중 모드가 비활성화되었습니다',
      'assertive'
    )
  }

  const handleDistraction = (type: DistractionType) => {
    console.log('Distraction detected:', type)
    // 주의산만 감지 시 처리 로직은 다음 단계에서 구현
  }

  const handleEnergyLevelChange = (level: 'low' | 'medium' | 'high') => {
    dispatch(setEnergyLevel(level))
    
    // 에너지 레벨 변경 알림
    const levelNames = {
      low: '낮음',
      medium: '보통',
      high: '높음'
    }
    announce(`에너지 레벨이 ${levelNames[level]}으로 설정되었습니다`, 'polite')
  }

  const handleBreakReminderDismiss = () => {
    setShowFocusBreakReminder(false)
  }

  // ADHD 친화적 배경색: 에너지 레벨에 따른 색상 조정
  const getBackgroundColor = () => {
    if (focusMode) return 'bg-gray-900'
    
    switch (energyLevel) {
      case 'low':
        return 'bg-blue-50 dark:bg-blue-900/20' // 차분한 파란색
      case 'high':
        return 'bg-green-50 dark:bg-green-900/20' // 활기찬 초록색
      default:
        return 'bg-gray-50 dark:bg-gray-800' // 기본 회색
    }
  }

  // 집중 모드일 때는 특별한 레이아웃 사용
  if (focusMode) {
    return (
      <div 
        className="min-h-screen bg-gray-900 transition-all duration-300"
        role="application" 
        aria-label="집중 모드"
      >
        {/* 사이드바 */}
        <nav role="navigation" aria-label="메인 네비게이션">
          <Sidebar
            isOpen={sidebarOpen}
            onClose={handleSidebarClose}
            currentPage={currentPage}
            onNavigate={onNavigate}
            focusMode={focusMode}
            energyLevel={energyLevel}
          />
        </nav>

        {/* 메인 컨텐츠 영역 */}
        <div className="lg:ml-80 flex flex-col min-h-screen transition-all duration-300">
          {/* 헤더 */}
          <header role="banner">
            <Header
              onMenuToggle={handleMenuToggle}
              focusMode={focusMode}
              onFocusModeToggle={handleFocusModeToggle}
              energyLevel={energyLevel}
              onEnergyLevelChange={handleEnergyLevelChange}
              currentStreak={currentStreak}
            />
          </header>

          {/* 페이지 컨텐츠 */}
          <main 
            className="flex-1 bg-gray-900 transition-all duration-300"
            role="main"
            aria-label={`${currentPage} 페이지`}
          >
            <div className="container mx-auto px-4 py-6 max-w-4xl transition-all duration-300">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </div>
          </main>

          <FocusMode
            isActive={focusMode}
            currentTask={currentTask || undefined}
            onToggle={handleFocusModeToggle}
            onDistraction={handleDistraction}
          />
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`min-h-screen transition-all duration-300 ${getBackgroundColor()}`}
      role="application"
      aria-label="ADHD 시간관리 앱"
    >
      {/* 사이드바 */}
      <nav role="navigation" aria-label="메인 네비게이션">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={handleSidebarClose}
          currentPage={currentPage}
          onNavigate={onNavigate}
          focusMode={focusMode}
          energyLevel={energyLevel}
        />
      </nav>

      {/* 메인 컨텐츠 영역 */}
      <div className={`${focusMode ? '' : 'lg:ml-80'} flex flex-col min-h-screen transition-all duration-300`}>
        {/* 헤더 */}
        <header role="banner">
          <Header
            onMenuToggle={handleMenuToggle}
            focusMode={focusMode}
            onFocusModeToggle={handleFocusModeToggle}
            energyLevel={energyLevel}
            onEnergyLevelChange={handleEnergyLevelChange}
            currentStreak={currentStreak}
          />
        </header>

        {/* 페이지 컨텐츠 */}
        <main 
          className={`flex-1 transition-all duration-300 ${getBackgroundColor()}`}
          role="main"
          aria-label={`${currentPage} 페이지`}
        >
          <div className={`container mx-auto px-4 py-6 ${
            focusMode ? 'max-w-4xl' : 'max-w-7xl'
          } transition-all duration-300`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
        </main>



        {/* 휴식 알림 모달 */}
        <AnimatePresence>
          {showFocusBreakReminder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="break-reminder-title"
              aria-describedby="break-reminder-description"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
              >
                <div className="text-6xl mb-4" aria-hidden="true">🧘‍♀️</div>
                <h3 
                  id="break-reminder-title"
                  className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2"
                >
                  잠깐 휴식하세요!
                </h3>
                <p 
                  id="break-reminder-description"
                  className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed"
                >
                  25분간 집중하셨습니다. 5분 정도 휴식을 취하고 다시 시작하는 것이 좋습니다.
                </p>
                
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleBreakReminderDismiss}
                    icon={<span aria-hidden="true">✅</span>}
                    ariaLabel="휴식 취하기"
                    announceOnClick="휴식을 시작합니다"
                  >
                    휴식 취하기
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={handleBreakReminderDismiss}
                    ariaLabel="계속 집중하기"
                    announceOnClick="집중을 계속합니다"
                  >
                    계속하기
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 에너지 레벨별 배경 패턴 (집중 모드가 아닐 때) */}
        {!focusMode && (
          <div className="fixed inset-0 pointer-events-none opacity-5 z-0">
            {energyLevel === 'high' && (
              <div className="absolute inset-0 bg-gradient-to-br from-green-200 to-blue-200" />
            )}
            {energyLevel === 'low' && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-purple-200" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Layout