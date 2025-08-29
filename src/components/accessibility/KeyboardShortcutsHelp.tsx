import React, { useState } from 'react'
import { useAccessibility, useKeyboardShortcuts } from '../../hooks/useAccessibility'
import { useDispatch } from 'react-redux'
import { startTimer, pauseTimer, resumeTimer, stopTimer } from '../../store/timerSlice'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Card } from '../ui/Card'

export const KeyboardShortcutsHelp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { getShortcuts } = useAccessibility()
  const dispatch = useDispatch()

  // 전역 키보드 단축키 정의
  const globalShortcuts = [
    {
      key: ' ',
      action: () => {
        // 스페이스바로 타이머 시작/일시정지
        const timerState = document.querySelector('[data-timer-running]')
        if (timerState?.getAttribute('data-timer-running') === 'true') {
          dispatch(pauseTimer())
        } else {
          dispatch(resumeTimer())
        }
      },
      description: '타이머 시작/일시정지'
    },
    {
      key: 'Escape',
      action: () => {
        dispatch(stopTimer())
      },
      description: '타이머 정지'
    },
    {
      key: 'h',
      altKey: true,
      action: () => setIsOpen(true),
      description: '키보드 단축키 도움말 열기'
    },
    {
      key: 'f',
      ctrlKey: true,
      action: () => {
        // 집중 모드 토글 (실제 구현은 FocusMode 컴포넌트에서)
        const focusButton = document.querySelector('[data-focus-toggle]') as HTMLButtonElement
        focusButton?.click()
      },
      description: '집중 모드 토글'
    },
    {
      key: 'n',
      ctrlKey: true,
      action: () => {
        // 새 작업 생성
        const newTaskButton = document.querySelector('[data-new-task]') as HTMLButtonElement
        newTaskButton?.click()
      },
      description: '새 작업 생성'
    },
    {
      key: '1',
      altKey: true,
      action: () => {
        // 15분 포모도로 설정
        const preset15 = document.querySelector('[data-timer-preset="15"]') as HTMLButtonElement
        preset15?.click()
      },
      description: '15분 포모도로 설정'
    },
    {
      key: '2',
      altKey: true,
      action: () => {
        // 25분 포모도로 설정
        const preset25 = document.querySelector('[data-timer-preset="25"]') as HTMLButtonElement
        preset25?.click()
      },
      description: '25분 포모도로 설정'
    },
    {
      key: '3',
      altKey: true,
      action: () => {
        // 45분 포모도로 설정
        const preset45 = document.querySelector('[data-timer-preset="45"]') as HTMLButtonElement
        preset45?.click()
      },
      description: '45분 포모도로 설정'
    }
  ]

  // 키보드 단축키 등록
  useKeyboardShortcuts(globalShortcuts)

  const formatShortcut = (shortcut: typeof globalShortcuts[0]) => {
    const keys = []
    if (shortcut.ctrlKey) keys.push('Ctrl')
    if (shortcut.altKey) keys.push('Alt')
    if (shortcut.shiftKey) keys.push('Shift')
    
    let keyName = shortcut.key
    if (keyName === ' ') keyName = 'Space'
    if (keyName === 'Escape') keyName = 'Esc'
    
    keys.push(keyName)
    return keys.join(' + ')
  }

  const shortcutCategories = [
    {
      title: '타이머 제어',
      shortcuts: globalShortcuts.filter(s => 
        s.description.includes('타이머') || s.description.includes('포모도로')
      )
    },
    {
      title: '작업 관리',
      shortcuts: globalShortcuts.filter(s => 
        s.description.includes('작업') || s.description.includes('집중')
      )
    },
    {
      title: '도움말',
      shortcuts: globalShortcuts.filter(s => 
        s.description.includes('도움말')
      )
    }
  ]

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(true)}
        ariaLabel="키보드 단축키 도움말"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        }
      >
        단축키 (Alt + H)
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="키보드 단축키"
        size="lg"
        priority="low"
      >
        <div className="space-y-6">
          <p className="text-gray-600">
            키보드 단축키를 사용하여 더 빠르고 효율적으로 앱을 사용할 수 있습니다.
          </p>

          {shortcutCategories.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h4 className="text-lg font-semibold mb-3 text-gray-800">
                {category.title}
              </h4>
              
              <Card className="p-4">
                <div className="space-y-3">
                  {category.shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-700">{shortcut.description}</span>
                      <kbd className="px-3 py-1 text-sm font-mono bg-gray-100 border border-gray-300 rounded-lg shadow-sm">
                        {formatShortcut(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ))}

          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-lg font-semibold mb-3 text-gray-800">
              접근성 팁
            </h4>
            
            <Card className="p-4 bg-blue-50 border-blue-200">
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• <strong>Tab</strong> 키로 요소 간 이동할 수 있습니다</li>
                <li>• <strong>Enter</strong> 또는 <strong>Space</strong>로 버튼을 클릭할 수 있습니다</li>
                <li>• <strong>Escape</strong> 키로 모달이나 드롭다운을 닫을 수 있습니다</li>
                <li>• 스크린 리더 사용자를 위한 라이브 영역이 설정되어 있습니다</li>
                <li>• 모든 인터랙티브 요소에 적절한 ARIA 레이블이 있습니다</li>
              </ul>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={() => setIsOpen(false)}
              ariaLabel="키보드 단축키 도움말 닫기"
            >
              확인
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}