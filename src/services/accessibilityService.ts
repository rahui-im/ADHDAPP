/**
 * 접근성 관련 유틸리티 서비스
 * 키보드 네비게이션, ARIA 지원, 포커스 관리 등을 담당
 */

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  action: () => void
  description: string
}

export interface FocusTrapOptions {
  initialFocus?: HTMLElement | string
  returnFocus?: HTMLElement
  allowOutsideClick?: boolean
}

class AccessibilityService {
  private keyboardShortcuts: Map<string, KeyboardShortcut> = new Map()
  private focusTraps: Map<string, HTMLElement[]> = new Map()
  private announcements: HTMLElement | null = null

  constructor() {
    this.initializeAnnouncements()
    this.setupGlobalKeyboardHandlers()
  }

  /**
   * 스크린 리더용 라이브 영역 초기화
   */
  private initializeAnnouncements(): void {
    // 기존 announcement 영역이 있으면 제거
    const existing = document.getElementById('accessibility-announcements')
    if (existing) {
      existing.remove()
    }

    // 새로운 announcement 영역 생성
    this.announcements = document.createElement('div')
    this.announcements.id = 'accessibility-announcements'
    this.announcements.setAttribute('aria-live', 'polite')
    this.announcements.setAttribute('aria-atomic', 'true')
    this.announcements.style.position = 'absolute'
    this.announcements.style.left = '-10000px'
    this.announcements.style.width = '1px'
    this.announcements.style.height = '1px'
    this.announcements.style.overflow = 'hidden'
    
    document.body.appendChild(this.announcements)
  }

  /**
   * 전역 키보드 이벤트 핸들러 설정
   */
  private setupGlobalKeyboardHandlers(): void {
    document.addEventListener('keydown', (event) => {
      try {
        const shortcutKey = this.getShortcutKey(event)
        const shortcut = this.keyboardShortcuts.get(shortcutKey)
        
        if (shortcut) {
          // event.preventDefault() // BUG: This prevents default actions like space bar on buttons.
          shortcut.action()
        }
      } catch (error) {
        console.warn('Keyboard shortcut error:', error)
      }
    })

    // 포커스 가시성 개선
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        document.body.classList.add('keyboard-navigation')
      }
    })

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation')
    })
  }

  /**
   * 키보드 단축키 등록
   */
  registerShortcut(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey({
      key: shortcut.key,
      ctrlKey: shortcut.ctrlKey || false,
      altKey: shortcut.altKey || false,
      shiftKey: shortcut.shiftKey || false
    } as KeyboardEvent)
    
    this.keyboardShortcuts.set(key, shortcut)
  }

  /**
   * 키보드 단축키 해제
   */
  unregisterShortcut(key: string, modifiers?: { ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean }): void {
    const shortcutKey = this.getShortcutKey({
      key,
      ctrlKey: modifiers?.ctrlKey || false,
      altKey: modifiers?.altKey || false,
      shiftKey: modifiers?.shiftKey || false
    } as KeyboardEvent)
    
    this.keyboardShortcuts.delete(shortcutKey)
  }

  /**
   * 단축키 키 생성
   */
  private getShortcutKey(event: KeyboardEvent | { key: string; ctrlKey: boolean; altKey: boolean; shiftKey: boolean }): string {
    const modifiers = []
    if (event.ctrlKey) modifiers.push('ctrl')
    if (event.altKey) modifiers.push('alt')
    if (event.shiftKey) modifiers.push('shift')
    
    // event.key가 undefined이거나 null인 경우를 처리
    const key = event.key || ''
    return [...modifiers, key.toLowerCase()].join('+')
  }

  /**
   * 스크린 리더에 메시지 알림
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.announcements) return

    this.announcements.setAttribute('aria-live', priority)
    this.announcements.textContent = message

    // 메시지 초기화 (다음 알림을 위해)
    setTimeout(() => {
      if (this.announcements) {
        this.announcements.textContent = ''
      }
    }, 1000)
  }

  /**
   * 포커스 트랩 설정 (모달, 드롭다운 등에서 사용)
   */
  createFocusTrap(containerId: string, options: FocusTrapOptions = {}): void {
    const container = document.getElementById(containerId)
    if (!container) return

    const focusableElements = this.getFocusableElements(container)
    this.focusTraps.set(containerId, focusableElements)

    // 초기 포커스 설정
    if (options.initialFocus) {
      const initialElement = typeof options.initialFocus === 'string'
        ? document.querySelector(options.initialFocus) as HTMLElement
        : options.initialFocus
      
      if (initialElement) {
        initialElement.focus()
      }
    } else if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    // 키보드 이벤트 핸들러
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        this.handleTabInTrap(event, containerId)
      } else if (event.key === 'Escape') {
        this.removeFocusTrap(containerId, options.returnFocus)
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    container.setAttribute('data-focus-trap-handler', 'true')
  }

  /**
   * 포커스 트랩 제거
   */
  removeFocusTrap(containerId: string, returnFocus?: HTMLElement): void {
    const container = document.getElementById(containerId)
    if (!container) return

    // 이벤트 핸들러 제거
    if (container.hasAttribute('data-focus-trap-handler')) {
      container.removeEventListener('keydown', this.handleTabInTrap)
      container.removeAttribute('data-focus-trap-handler')
    }

    this.focusTraps.delete(containerId)

    // 포커스 복원
    if (returnFocus) {
      returnFocus.focus()
    }
  }

  /**
   * 포커스 트랩 내에서 Tab 키 처리
   */
  private handleTabInTrap(event: KeyboardEvent, containerId: string): void {
    const focusableElements = this.focusTraps.get(containerId)
    if (!focusableElements || focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    const activeElement = document.activeElement as HTMLElement

    if (event.shiftKey) {
      // Shift + Tab (역방향)
      if (activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab (정방향)
      if (activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }

  /**
   * 포커스 가능한 요소들 찾기
   */
  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[]
  }

  /**
   * 요소에 적절한 ARIA 속성 설정
   */
  setAriaAttributes(element: HTMLElement, attributes: Record<string, string>): void {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(`aria-${key}`, value)
    })
  }

  /**
   * 버튼에 적절한 접근성 속성 설정
   */
  enhanceButton(button: HTMLElement, options: {
    label?: string
    describedBy?: string
    expanded?: boolean
    pressed?: boolean
    disabled?: boolean
  }): void {
    if (options.label) {
      button.setAttribute('aria-label', options.label)
    }
    
    if (options.describedBy) {
      button.setAttribute('aria-describedby', options.describedBy)
    }
    
    if (typeof options.expanded === 'boolean') {
      button.setAttribute('aria-expanded', options.expanded.toString())
    }
    
    if (typeof options.pressed === 'boolean') {
      button.setAttribute('aria-pressed', options.pressed.toString())
    }
    
    if (options.disabled) {
      button.setAttribute('aria-disabled', 'true')
      button.setAttribute('tabindex', '-1')
    }
  }

  /**
   * 입력 필드에 적절한 접근성 속성 설정
   */
  enhanceInput(input: HTMLElement, options: {
    label?: string
    required?: boolean
    invalid?: boolean
    describedBy?: string
    errorMessage?: string
  }): void {
    if (options.label) {
      input.setAttribute('aria-label', options.label)
    }
    
    if (options.required) {
      input.setAttribute('aria-required', 'true')
    }
    
    if (typeof options.invalid === 'boolean') {
      input.setAttribute('aria-invalid', options.invalid.toString())
    }
    
    if (options.describedBy) {
      input.setAttribute('aria-describedby', options.describedBy)
    }
  }

  /**
   * 진행률 표시기에 접근성 속성 설정
   */
  enhanceProgressBar(progressBar: HTMLElement, options: {
    label?: string
    valueNow: number
    valueMin?: number
    valueMax?: number
    valueText?: string
  }): void {
    progressBar.setAttribute('role', 'progressbar')
    
    if (options.label) {
      progressBar.setAttribute('aria-label', options.label)
    }
    
    progressBar.setAttribute('aria-valuenow', options.valueNow.toString())
    progressBar.setAttribute('aria-valuemin', (options.valueMin || 0).toString())
    progressBar.setAttribute('aria-valuemax', (options.valueMax || 100).toString())
    
    if (options.valueText) {
      progressBar.setAttribute('aria-valuetext', options.valueText)
    }
  }

  /**
   * 타이머 상태 알림
   */
  announceTimerState(state: 'started' | 'paused' | 'resumed' | 'completed' | 'stopped', timeRemaining?: string): void {
    const messages = {
      started: `타이머가 시작되었습니다${timeRemaining ? `. ${timeRemaining} 남았습니다` : ''}`,
      paused: '타이머가 일시정지되었습니다',
      resumed: `타이머가 재시작되었습니다${timeRemaining ? `. ${timeRemaining} 남았습니다` : ''}`,
      completed: '타이머가 완료되었습니다',
      stopped: '타이머가 중지되었습니다'
    }
    
    this.announce(messages[state], 'assertive')
  }

  /**
   * 작업 상태 알림
   */
  announceTaskState(action: 'created' | 'completed' | 'updated' | 'deleted', taskTitle: string): void {
    const messages = {
      created: `새 작업 "${taskTitle}"이 생성되었습니다`,
      completed: `작업 "${taskTitle}"이 완료되었습니다`,
      updated: `작업 "${taskTitle}"이 수정되었습니다`,
      deleted: `작업 "${taskTitle}"이 삭제되었습니다`
    }
    
    this.announce(messages[action])
  }

  /**
   * 등록된 키보드 단축키 목록 반환
   */
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.keyboardShortcuts.values())
  }

  /**
   * 정리 함수
   */
  cleanup(): void {
    this.keyboardShortcuts.clear()
    this.focusTraps.clear()
    
    if (this.announcements) {
      this.announcements.remove()
      this.announcements = null
    }
  }
}

// 싱글톤 인스턴스 생성
export const accessibilityService = new AccessibilityService()