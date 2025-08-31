import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FocusManager, KeyboardKeys, announcer } from '../../utils/accessibility';
import { AccessibleButton } from './AccessibleButton';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  footer?: React.ReactNode;
  initialFocusRef?: React.RefObject<HTMLElement>;
  finalFocusRef?: React.RefObject<HTMLElement>;
  role?: 'dialog' | 'alertdialog';
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  footer,
  initialFocusRef,
  finalFocusRef,
  role = 'dialog',
  ariaLabelledBy,
  ariaDescribedBy,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).substr(2, 9)}`);
  const descId = useRef(`modal-desc-${Math.random().toString(36).substr(2, 9)}`);

  const handleClose = useCallback(() => {
    onClose();
    announcer.announce('Dialog closed');
  }, [onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        handleClose();
      }
    },
    [closeOnOverlayClick, handleClose]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === KeyboardKeys.ESCAPE) {
        e.preventDefault();
        handleClose();
      }
    },
    [closeOnEscape, handleClose]
  );

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleKeyDown);
      announcer.announce(`${title} dialog opened`);

      // Set initial focus
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else if (modalRef.current) {
        const focusable = FocusManager.getFocusableElements(modalRef.current);
        focusable[0]?.focus();
      }

      // Trap focus
      if (modalRef.current) {
        const cleanup = FocusManager.trapFocus(modalRef.current);
        return () => {
          cleanup();
          document.removeEventListener('keydown', handleKeyDown);
        };
      }
    } else {
      // Restore focus
      const elementToFocus = finalFocusRef?.current || previousActiveElement.current;
      FocusManager.restoreFocus(elementToFocus);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown, title, initialFocusRef, finalFocusRef]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby={ariaLabelledBy || titleId.current}
      aria-describedby={ariaDescribedBy || (description ? descId.current : undefined)}
      aria-modal="true"
      role={role}
    >
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          aria-hidden="true"
          onClick={handleOverlayClick}
        />

        {/* Modal */}
        <div
          ref={modalRef}
          className={`
            relative inline-block w-full transform overflow-hidden rounded-lg
            bg-white text-left align-middle shadow-xl transition-all
            ${sizeClasses[size]}
          `}
        >
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2
                id={titleId.current}
                className="text-lg font-semibold text-gray-900"
              >
                {title}
              </h2>
              {showCloseButton && (
                <AccessibleButton
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  aria={{ label: 'Close dialog' }}
                  className="rounded-full p-1"
                >
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </AccessibleButton>
              )}
            </div>
            {description && (
              <p
                id={descId.current}
                className="mt-1 text-sm text-gray-500"
              >
                {description}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-gray-200 px-6 py-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};