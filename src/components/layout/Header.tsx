import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../ui/Button'
import Tooltip from '../ui/Tooltip'
import { ThemeToggler } from '../ui/ThemeToggler'


interface HeaderProps {
  onMenuToggle: () => void
  focusMode: boolean
  onFocusModeToggle: () => void
  energyLevel: 'low' | 'medium' | 'high'
  onEnergyLevelChange: (level: 'low' | 'medium' | 'high') => void
  currentStreak: number
}

const Header: React.FC<HeaderProps> = ({
  onMenuToggle,
  focusMode,
  onFocusModeToggle,
  energyLevel,
  onEnergyLevelChange,
  currentStreak,
}) => {
  const energyLevels = [
    { 
      value: 'low' as const, 
      label: '낮음', 
      color: 'text-blue-500', 
      emoji: '😴',
      description: '휴식이 필요해요. 가벼운 작업부터 시작하세요.',
      bgColor: 'bg-blue-100 hover:bg-blue-200'
    },
    { 
      value: 'medium' as const, 
      label: '보통', 
      color: 'text-yellow-500', 
      emoji: '😐',
      description: '적당한 집중력이에요. 일반적인 작업에 좋습니다.',
      bgColor: 'bg-yellow-100 hover:bg-yellow-200'
    },
    { 
      value: 'high' as const, 
      label: '높음', 
      color: 'text-green-500', 
      emoji: '😄',
      description: '최고의 컨디션! 어려운 작업에 도전해보세요.',
      bgColor: 'bg-green-100 hover:bg-green-200'
    },
  ]

  const currentEnergyInfo = energyLevels.find(level => level.value === energyLevel)

  // 현재 시간 기반 인사말
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return '좋은 아침이에요! ☀️'
    if (hour < 18) return '좋은 오후에요! 🌤️'
    return '좋은 저녁이에요! 🌙'
  }

  return (
    <header className={`sticky top-0 z-10 border-b-2 transition-all duration-300 backdrop-blur-sm ${
      focusMode 
        ? 'bg-gray-900/95 border-gray-700' 
        : 'bg-white/95 border-gray-200'
    }`}>
      <div className="flex items-center justify-between px-6 py-4">
        {/* 왼쪽: 메뉴 버튼 및 인사말 */}
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={onMenuToggle}
            className={`lg:hidden ${
              focusMode
                ? 'text-gray-300 hover:bg-gray-800'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            }
          >
            메뉴
          </Button>

          {/* 인사말 (집중 모드가 아닐 때) */}
          {!focusMode && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:block"
            >
              <h2 className="text-lg font-semibold text-gray-800">
                {getGreeting()}
              </h2>
            </motion.div>
          )}

          {/* 연속 달성 표시 */}
          <AnimatePresence>
            {currentStreak > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                className={`flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-md ${
                  focusMode
                    ? 'bg-gray-800 text-yellow-400 border border-gray-700'
                    : 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-300'
                }`}
              >
                <span className="mr-2 text-lg">🔥</span>
                <span>{currentStreak}일 연속 달성!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 오른쪽: 컨트롤들 */}
        <div className="flex items-center space-x-3">
          {/* 에너지 레벨 선택 (집중 모드가 아닐 때만) */}
          {!focusMode && (
            <div className="flex items-center space-x-3">
              <Tooltip content="현재 에너지 레벨을 선택하면 맞춤형 작업을 추천해드려요!">
                <span className="text-sm font-medium text-gray-600 hidden sm:block">
                  에너지 레벨:
                </span>
              </Tooltip>
              
              <div className="flex items-center space-x-1 p-1 bg-gray-100 rounded-xl">
                {energyLevels.map((level) => (
                  <Tooltip key={level.value} content={level.description}>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onEnergyLevelChange(level.value)}
                      className={`p-3 rounded-xl transition-all duration-200 ${
                        energyLevel === level.value
                          ? `${level.bgColor} ring-2 ring-offset-2 ring-primary-400 shadow-md`
                          : 'hover:bg-gray-200'
                      }`}
                      title={`에너지 레벨: ${level.label}`}
                    >
                      <span className="text-xl">{level.emoji}</span>
                    </motion.button>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}

          {/* 현재 에너지 레벨 표시 (집중 모드일 때) */}
          {focusMode && currentEnergyInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-800 rounded-xl text-gray-300"
            >
              <span className="text-lg">{currentEnergyInfo.emoji}</span>
              <span className="text-sm font-medium hidden sm:block">
                에너지: {currentEnergyInfo.label}
              </span>
            </motion.div>
          )}

          <div className="hidden sm:block">
            <ThemeToggler />
          </div>

          {/* 집중 모드 토글 */}
          <Tooltip content={focusMode ? '집중 모드를 해제하고 모든 기능을 사용하세요' : '집중 모드로 방해 요소를 최소화하세요'}>
            <Button
              variant={focusMode ? 'warning' : 'focus'}
              size="md"
              onClick={onFocusModeToggle}
              icon={
                focusMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                )
              }
            >
              <span className="hidden sm:block">
                {focusMode ? '집중 해제' : '집중 모드'}
              </span>
              <span className="sm:hidden">
                {focusMode ? '해제' : '집중'}
              </span>
            </Button>
          </Tooltip>

          {/* 빠른 도움말 버튼 (집중 모드가 아닐 때만) */}
          {!focusMode && (
            <Tooltip content="ADHD 친화적 사용법과 팁을 확인하세요">
              <Button
                variant="secondary"
                size="md"
                className="text-gray-500 hover:text-gray-700"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                <span className="hidden sm:block">도움말</span>
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* 집중 모드 안내 바 */}
      <AnimatePresence>
        {focusMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-gray-800 to-gray-900 border-t border-gray-700 px-6 py-3"
          >
            <div className="flex items-center justify-center text-sm text-gray-300">
              <motion.span 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mr-3 text-lg"
              >
                🎯
              </motion.span>
              <span className="font-medium">
                집중 모드 활성 - 방해 요소가 최소화되었습니다
              </span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="ml-3 w-2 h-2 bg-green-400 rounded-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Header