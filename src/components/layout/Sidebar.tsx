import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  currentPage: string
  onNavigate: (page: string) => void
  focusMode: boolean
  energyLevel: 'low' | 'medium' | 'high'
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentPage,
  onNavigate,
  focusMode,
  energyLevel,
}) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: '대시보드',
      emoji: '📊',
      description: '오늘의 진행상황',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
        </svg>
      ),
    },
    {
      id: 'tasks',
      label: '작업 관리',
      emoji: '✅',
      description: '할 일 정리하기',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'timer',
      label: '포모도로',
      emoji: '⏰',
      description: '집중 시간 관리',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'analytics',
      label: '분석',
      emoji: '📈',
      description: '성과 확인하기',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: '설정',
      emoji: '⚙️',
      description: '개인화 설정',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ]

  // 집중 모드에서는 필수 메뉴만 표시
  const visibleItems = focusMode 
    ? menuItems.filter(item => ['dashboard', 'timer'].includes(item.id))
    : menuItems

  const handleItemClick = (itemId: string) => {
    onNavigate(itemId)
    onClose() // 모바일에서 메뉴 선택 후 사이드바 닫기
  }

  // 에너지 레벨별 색상 테마
  const getEnergyTheme = () => {
    if (focusMode) return { bg: 'bg-gray-900', text: 'text-white', border: 'border-gray-700' }
    
    switch (energyLevel) {
      case 'low':
        return { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200' }
      case 'high':
        return { bg: 'bg-green-50', text: 'text-green-900', border: 'border-green-200' }
      default:
        return { bg: 'bg-white', text: 'text-gray-900', border: 'border-gray-200' }
    }
  }

  const theme = getEnergyTheme()

  return (
    <>
      {/* 오버레이 (모바일) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900 bg-opacity-50 z-20 lg:hidden backdrop-blur-sm"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* 사이드바 */}
      <motion.div
        initial={{ x: -320 }}
        animate={{ 
          x: isOpen ? 0 : -320
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`fixed top-0 left-0 z-30 h-full w-80 shadow-2xl lg:relative lg:translate-x-0 lg:shadow-none lg:border-r-2 ${theme.bg} ${theme.border}`}
      >
        <div className="flex flex-col h-full">
          {/* 헤더 */}
          <div className={`flex items-center justify-between p-6 border-b-2 ${theme.border}`}>
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🧠</div>
              <div>
                <h1 className={`text-xl font-bold ${theme.text}`}>
                  {focusMode ? '집중 모드' : 'ADHD Timer'}
                </h1>
                {!focusMode && (
                  <p className="text-xs text-gray-500">
                    당신의 집중력 파트너
                  </p>
                )}
              </div>
            </div>
            
            {/* 모바일 닫기 버튼 */}
            <button
              onClick={onClose}
              className={`lg:hidden p-2 rounded-xl transition-colors duration-200 ${
                focusMode 
                  ? 'hover:bg-gray-800 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 에너지 레벨 표시 (집중 모드가 아닐 때) */}
          {!focusMode && (
            <div className="px-6 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">현재 에너지</span>
                <div className="flex items-center space-x-2">
                  {energyLevel === 'low' && <span className="text-blue-500">😴 낮음</span>}
                  {energyLevel === 'medium' && <span className="text-yellow-500">😐 보통</span>}
                  {energyLevel === 'high' && <span className="text-green-500">😄 높음</span>}
                </div>
              </div>
            </div>
          )}

          {/* 네비게이션 메뉴 */}
          <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto">
            {visibleItems.map((item, index) => {
              const isActive = currentPage === item.id
              
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center p-4 text-left rounded-2xl transition-all duration-200 group ${
                    isActive
                      ? focusMode
                        ? 'bg-gray-800 text-white shadow-lg'
                        : 'bg-primary-100 text-primary-800 border-2 border-primary-300 shadow-md'
                      : focusMode
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
                  }`}
                >
                  {/* 이모지 아이콘 */}
                  <div className="flex-shrink-0 text-2xl mr-4">
                    {item.emoji}
                  </div>
                  
                  {/* 메뉴 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base">
                      {item.label}
                    </div>
                    {!focusMode && (
                      <div className="text-xs text-gray-500 mt-1">
                        {item.description}
                      </div>
                    )}
                  </div>
                  
                  {/* 활성 표시기 */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className={`w-3 h-3 rounded-full ${
                        focusMode ? 'bg-white' : 'bg-primary-500'
                      }`}
                    />
                  )}
                  
                  {/* 호버 화살표 */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ 
                      opacity: isActive ? 1 : 0,
                      x: isActive ? 0 : -10
                    }}
                    className="ml-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.div>
                </motion.button>
              )
            })}
          </nav>

          {/* 하단 정보 */}
          {!focusMode && (
            <div className="p-6 border-t-2 border-gray-200">
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-2">
                  ADHD Time Manager v1.0.0
                </div>
                <div className="text-xs text-gray-400">
                  💪 당신의 집중력을 응원합니다!
                </div>
              </div>
            </div>
          )}

          {/* 집중 모드 하단 */}
          {focusMode && (
            <div className="p-6 border-t-2 border-gray-700">
              <div className="text-center text-gray-400">
                <div className="text-sm mb-2">🎯 집중 중</div>
                <div className="text-xs">
                  방해 요소가 최소화되었습니다
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}

export default Sidebar