import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { useAccessibility } from '../../hooks/useAccessibility'

export const KeyboardShortcutsHelp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { getShortcuts } = useAccessibility()

  const shortcuts = getShortcuts()

  const defaultShortcuts = [
    { key: 'Space', description: '타이머 시작/일시정지' },
    { key: 'Escape', description: '모달 닫기' },
    { key: 'Tab', description: '다음 요소로 이동' },
    { key: 'Shift + Tab', description: '이전 요소로 이동' },
    { key: 'Enter', description: '선택된 요소 활성화' },
    { key: 'Ctrl + N', description: '새 작업 생성' },
    { key: 'Ctrl + S', description: '저장' },
    { key: '?', description: '단축키 도움말 (이 창)' }
  ]

  const allShortcuts = shortcuts.length > 0 ? shortcuts : defaultShortcuts

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(true)}
        ariaLabel="키보드 단축키 도움말 열기"
        className="rounded-full w-10 h-10 p-0"
      >
        ?
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  키보드 단축키
                </h2>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  ariaLabel="도움말 닫기"
                  className="rounded-full w-8 h-8 p-0"
                >
                  ×
                </Button>
              </div>

              <div className="space-y-3">
                {allShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm text-gray-600">
                      {'description' in shortcut ? shortcut.description : shortcut.description}
                    </span>
                    <kbd className="px-2 py-1 text-xs font-mono bg-white border border-gray-300 rounded shadow-sm">
                      {'key' in shortcut ? shortcut.key : shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>팁:</strong> Tab 키를 사용하여 모든 요소에 접근할 수 있습니다. 
                  스크린 리더를 사용하는 경우 모든 상태 변화가 음성으로 안내됩니다.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}