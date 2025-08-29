import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from './Button'
import { useFocusTrap, useAccessibility } from '../../hooks/useAccessibility'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  priority?: 'low' | 'medium' | 'high'
  focusMode?: boolean
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  priority = 'medium',
  focusMode = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLButtonElement>(null)
  const { announce } = useAccessibility()
  
  // 포커스 트랩 사용
  useFocusTrap('modal-container', isOpen, {
    initialFocus: firstFocusableRef.current || undefined
  })
  
  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!closeOnEscape) return
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, closeOnEscape])
  
  // 모달이 열릴 때 body 스크롤 방지 및 접근성 알림
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      
      // 스크린 리더에 모달 열림 알림
      const modalTitle = title || '모달'
      announce(`${modalTitle} 대화상자가 열렸습니다`, 'assertive')
      
      // 첫 번째 포커스 가능한 요소에 포커스
      setTimeout(() => {
        firstFocusableRef.current?.focus()
      }, 100)
    } else {
      document.body.style.overflow = 'unset'
      announce('대화상자가 닫혔습니다', 'polite')
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, title, announce])
  
  // ADHD 친화적 크기: 더 큰 모달, 읽기 쉬운 레이아웃
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  }
  
  // 우선순위별 시각적 구분
  const priorityClasses = {
    low: 'border-gray-200',
    medium: 'border-primary-200',
    high: 'border-warning-300 shadow-warning-100',
  }
  
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose()
    }
  }
  
  // 포커스 트랩 (집중 모드에서 중요)
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Tab' && focusMode) {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      
      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
        
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }
  }
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* 오버레이 - ADHD 친화적 색상 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed inset-0 transition-opacity ${
                focusMode 
                  ? 'bg-gray-900 bg-opacity-90' 
                  : 'bg-gray-600 bg-opacity-75'
              }`}
              onClick={handleOverlayClick}
            />
            
            {/* 모달 위치 조정을 위한 숨겨진 요소 */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            
            {/* 모달 컨테이너 */}
            <motion.div
              id="modal-container"
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`inline-block w-full ${sizeClasses[size]} p-8 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl border-4 ${priorityClasses[priority]}`}
              onKeyDown={handleKeyDown}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'modal-title' : undefined}
              aria-describedby="modal-content"
            >
              {/* 헤더 */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between mb-6">
                  {title && (
                    <h3 
                      id="modal-title"
                      className="text-xl font-bold text-gray-900 flex items-center gap-2"
                    >
                      {priority === 'high' && <span className="text-warning-500">⚠️</span>}
                      {title}
                    </h3>
                  )}
                  
                  {showCloseButton && (
                    <Button
                      ref={firstFocusableRef}
                      variant="secondary"
                      size="sm"
                      onClick={onClose}
                      className="ml-auto"
                      aria-label="모달 닫기"
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      }
                    >
                      닫기
                    </Button>
                  )}
                </div>
              )}
              
              {/* 컨텐츠 */}
              <div id="modal-content" className="text-gray-700 text-base leading-relaxed">
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

export { Modal }
export default Modal