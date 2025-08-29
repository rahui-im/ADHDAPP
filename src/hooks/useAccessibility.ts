import { useEffect, useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { accessibilityService, KeyboardShortcut, FocusTrapOptions } from '../services/accessibilityService'

export const useAccessibility = () => {
  const timerState = useSelector((state: RootState) => state.timer)
  const currentTask = useSelector((state: RootState) => 
    state.tasks.tasks.find(task => task.id === state.timer.currentTaskId)
  )

  // 스크린 리더 알림
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    accessibilityService.announce(message, priority)
  }, [])

  // 키보드 단축키 등록
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    accessibilityService.registerShortcut(shortcut)
  }, [])

  // 키보드 단축키 해제
  const unregisterShortcut = useCallback((key: string, modifiers?: { ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean }) => {
    accessibilityService.unregisterShortcut(key, modifiers)
  }, [])

  // 포커스 트랩 생성
  const createFocusTrap = useCallback((containerId: string, options?: FocusTrapOptions) => {
    accessibilityService.createFocusTrap(containerId, options)
  }, [])

  // 포커스 트랩 제거
  const removeFocusTrap = useCallback((containerId: string, returnFocus?: HTMLElement) => {
    accessibilityService.removeFocusTrap(containerId, returnFocus)
  }, [])

  // 버튼 접근성 향상
  const enhanceButton = useCallback((button: HTMLElement, options: {
    label?: string
    describedBy?: string
    expanded?: boolean
    pressed?: boolean
    disabled?: boolean
  }) => {
    accessibilityService.enhanceButton(button, options)
  }, [])

  // 입력 필드 접근성 향상
  const enhanceInput = useCallback((input: HTMLElement, options: {
    label?: string
    required?: boolean
    invalid?: boolean
    describedBy?: string
    errorMessage?: string
  }) => {
    accessibilityService.enhanceInput(input, options)
  }, [])

  // 진행률 표시기 접근성 향상
  const enhanceProgressBar = useCallback((progressBar: HTMLElement, options: {
    label?: string
    valueNow: number
    valueMin?: number
    valueMax?: number
    valueText?: string
  }) => {
    accessibilityService.enhanceProgressBar(progressBar, options)
  }, [])

  // 타이머 상태 알림
  const announceTimerState = useCallback((state: 'started' | 'paused' | 'resumed' | 'completed' | 'stopped', timeRemaining?: string) => {
    accessibilityService.announceTimerState(state, timeRemaining)
  }, [])

  // 작업 상태 알림
  const announceTaskState = useCallback((action: 'created' | 'completed' | 'updated' | 'deleted', taskTitle: string) => {
    accessibilityService.announceTaskState(action, taskTitle)
  }, [])

  // 등록된 단축키 목록
  const getShortcuts = useCallback(() => {
    return accessibilityService.getShortcuts()
  }, [])

  return {
    announce,
    registerShortcut,
    unregisterShortcut,
    createFocusTrap,
    removeFocusTrap,
    enhanceButton,
    enhanceInput,
    enhanceProgressBar,
    announceTimerState,
    announceTaskState,
    getShortcuts
  }
}

/**
 * 키보드 단축키를 자동으로 등록/해제하는 훅
 */
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const { registerShortcut, unregisterShortcut } = useAccessibility()

  useEffect(() => {
    // 단축키 등록
    shortcuts.forEach(shortcut => {
      registerShortcut(shortcut)
    })

    // 정리 함수
    return () => {
      shortcuts.forEach(shortcut => {
        unregisterShortcut(shortcut.key, {
          ctrlKey: shortcut.ctrlKey,
          altKey: shortcut.altKey,
          shiftKey: shortcut.shiftKey
        })
      })
    }
  }, [shortcuts, registerShortcut, unregisterShortcut])
}

/**
 * 포커스 트랩을 자동으로 관리하는 훅
 */
export const useFocusTrap = (
  containerId: string, 
  isActive: boolean, 
  options?: FocusTrapOptions
) => {
  const { createFocusTrap, removeFocusTrap } = useAccessibility()
  const returnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isActive) {
      // 현재 포커스된 요소 저장
      returnFocusRef.current = document.activeElement as HTMLElement
      
      // 포커스 트랩 생성
      createFocusTrap(containerId, {
        ...options,
        returnFocus: options?.returnFocus || returnFocusRef.current
      })
    } else {
      // 포커스 트랩 제거
      removeFocusTrap(containerId, options?.returnFocus || returnFocusRef.current)
    }

    return () => {
      if (isActive) {
        removeFocusTrap(containerId, options?.returnFocus || returnFocusRef.current)
      }
    }
  }, [isActive, containerId, createFocusTrap, removeFocusTrap, options])
}

/**
 * ARIA 라이브 영역을 관리하는 훅
 */
export const useLiveRegion = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const { announce } = useAccessibility()

  useEffect(() => {
    if (message) {
      announce(message, priority)
    }
  }, [message, priority, announce])
}