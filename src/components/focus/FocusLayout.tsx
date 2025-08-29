import React from 'react'
import { motion } from 'framer-motion'
import { useAppSelector } from '../../store/store'
import { selectFocusMode, selectCurrentTask } from '../../store/selectors'

interface FocusLayoutProps {
  children: React.ReactNode
}

const FocusLayout: React.FC<FocusLayoutProps> = ({ children }) => {
  const focusMode = useAppSelector(selectFocusMode)
  const currentTask = useAppSelector(selectCurrentTask)

  if (!focusMode) {
    return <>{children}</>
  }

  return (
    <div className="focus-layout min-h-screen bg-gray-900 text-white">
      {/* 집중 모드 헤더 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-30"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* 현재 작업 표시 */}
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <div>
                <span className="text-sm text-gray-400">집중 중</span>
                {currentTask && (
                  <h1 className="text-lg font-medium truncate max-w-md">
                    {currentTask.title}
                  </h1>
                )}
              </div>
            </div>

            {/* 시간 표시 */}
            <div className="text-right">
              <div className="text-sm text-gray-400">
                {new Date().toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* 집중 모드 메인 컨텐츠 */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {children}
        </motion.div>
      </main>

      {/* 집중 모드 푸터 */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 p-4"
      >
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <span>🧘‍♀️</span>
              <span>집중 모드 활성</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>💡</span>
              <span>방해 요소 최소화됨</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>⏰</span>
              <span>필요시 휴식을 취하세요</span>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}

export default FocusLayout