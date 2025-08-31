import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { buildAriaAttributes, AriaAttributes } from '../../utils/accessibility';

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  aria?: AriaAttributes;
  keyboardShortcut?: string;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      aria,
      keyboardShortcut,
      className = '',
      onClick,
      ...props
    },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    };

    const ariaAttributes = buildAriaAttributes({
      ...aria,
      busy: loading,
      disabled: disabled || loading,
      keyshortcuts: keyboardShortcut,
    });

    const baseClasses = 'accessible-button transition-all duration-200 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const variantClasses = {
      primary: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    const disabledClasses = (disabled || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
    const widthClasses = fullWidth ? 'w-full' : '';

    const classes = `
      ${baseClasses}
      ${variantClasses[variant]}
      ${sizeClasses[size]}
      ${disabledClasses}
      ${widthClasses}
      ${className}
    `.trim();

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        onClick={handleClick}
        {...ariaAttributes}
        {...props}
      >
        <span className="flex items-center justify-center gap-2">
          {loading && (
            <span
              className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-current"
              aria-hidden="true"
            />
          )}
          {icon && iconPosition === 'left' && !loading && (
            <span aria-hidden="true">{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && !loading && (
            <span aria-hidden="true">{icon}</span>
          )}
        </span>
        {keyboardShortcut && (
          <span className="sr-only">
            Keyboard shortcut: {keyboardShortcut}
          </span>
        )}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';