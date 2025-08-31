import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface KeyboardShortcutsProps {
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
}

interface ShortcutCategory {
  title: string
  shortcuts: {
    keys: string[]
    description: string
    icon?: React.ReactNode
  }[]
}

const shortcutCategories: ShortcutCategory[] = [
  {
    title: '작업 관리',
    shortcuts: [
      {
        keys: ['Ctrl', 'N'],
        description: '새 작업 추가',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        ),
      },
      {
        keys: ['Ctrl', 'D'],
        description: '작업 삭제',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        ),
      },
      {
        keys: ['Ctrl', 'E'],
        description: '작업 편집',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ),
      },
      {
        keys: ['Space'],
        description: '작업 완료/미완료 토글',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: '타이머 제어',
    shortcuts: [
      {
        keys: ['Ctrl', 'Space'],
        description: '타이머 시작/일시정지',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        keys: ['Ctrl', 'R'],
        description: '타이머 리셋',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ),
      },
      {
        keys: ['Ctrl', 'B'],
        description: '휴식 건너뛰기',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        ),
      },
    ],
  },
  {
    title: '집중 모드',
    shortcuts: [
      {
        keys: ['Ctrl', 'F'],
        description: '집중 모드 토글',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
      },
      {
        keys: ['Esc'],
        description: '집중 모드 종료',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: '네비게이션',
    shortcuts: [
      {
        keys: ['↑', '↓'],
        description: '작업 목록 탐색',
      },
      {
        keys: ['Tab'],
        description: '다음 요소로 이동',
      },
      {
        keys: ['Shift', 'Tab'],
        description: '이전 요소로 이동',
      },
      {
        keys: ['Ctrl', '/'],
        description: '검색 열기',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        ),
      },
    ],
  },
]

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  onNext,
  onPrevious,
  onSkip,
}) => {
  const [selectedCategory, setSelectedCategory] = useState(0)
  const [tryMode, setTryMode] = useState(false)
  const [pressedKeys, setPressedKeys] = useState<string[]>([])

  // Handle keyboard events in try mode
  React.useEffect(() => {
    if (!tryMode) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      const keys: string[] = []
      
      if (e.ctrlKey || e.metaKey) keys.push('Ctrl')
      if (e.shiftKey) keys.push('Shift')
      if (e.altKey) keys.push('Alt')
      
      // Add the main key
      if (e.key === ' ') {
        keys.push('Space')
      } else if (e.key === 'Escape') {
        keys.push('Esc')
      } else if (e.key === 'ArrowUp') {
        keys.push('↑')
      } else if (e.key === 'ArrowDown') {
        keys.push('↓')
      } else if (e.key === 'Tab') {
        keys.push('Tab')
      } else if (e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt' && e.key !== 'Meta') {
        keys.push(e.key.toUpperCase())
      }
      
      setPressedKeys(keys)
    }

    const handleKeyUp = () => {
      setTimeout(() => setPressedKeys([]), 100)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [tryMode])

  return (
    <motion.div
      key="shortcuts"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          키보드 단축키
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          효율적인 작업을 위한 단축키를 익혀보세요
        </p>
      </div>

      {/* Try mode toggle */}
      <div className="mb-6 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            연습 모드
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            키보드를 눌러 단축키를 연습해보세요
          </p>
        </div>
        <button
          onClick={() => setTryMode(!tryMode)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            tryMode
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          {tryMode ? '연습 중' : '연습 시작'}
        </button>
      </div>

      {/* Pressed keys display */}
      <AnimatePresence>
        {tryMode && pressedKeys.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mb-6 flex justify-center"
          >
            <div className="flex space-x-2">
              {pressedKeys.map((key, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span className="text-gray-400">+</span>}
                  <kbd className="px-3 py-1 bg-gray-800 text-white rounded-md text-lg font-mono">
                    {key}
                  </kbd>
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category tabs */}
      <div className="mb-6 flex space-x-2 overflow-x-auto">
        {shortcutCategories.map((category, index) => (
          <button
            key={index}
            onClick={() => setSelectedCategory(index)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === index
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {category.title}
          </button>
        ))}
      </div>

      {/* Shortcuts list */}
      <div className="mb-8 space-y-3 max-h-64 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            {shortcutCategories[selectedCategory].shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {shortcut.icon && (
                    <div className="text-gray-500 dark:text-gray-400">
                      {shortcut.icon}
                    </div>
                  )}
                  <span className="text-gray-700 dark:text-gray-300">
                    {shortcut.description}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {shortcut.keys.map((key, keyIndex) => (
                    <React.Fragment key={keyIndex}>
                      {keyIndex > 0 && (
                        <span className="text-gray-400 text-sm mx-1">+</span>
                      )}
                      <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono text-gray-700 dark:text-gray-300">
                        {key}
                      </kbd>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={onSkip}
          className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          건너뛰기
        </button>
        
        <div className="flex space-x-3">
          <button
            onClick={onPrevious}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            이전
          </button>
          
          <button
            onClick={onNext}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
          >
            다음
          </button>
        </div>
      </div>
    </motion.div>
  )
}