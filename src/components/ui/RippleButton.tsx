import React, { useState, useRef, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RippleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  rippleColor?: string;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

const RippleButton: React.FC<RippleButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  rippleColor,
  className = '',
  icon,
  iconPosition = 'left'
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleId = useRef(0);

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const getRippleColor = () => {
    if (rippleColor) return rippleColor;
    
    switch (variant) {
      case 'primary':
        return 'rgba(255, 255, 255, 0.3)';
      case 'secondary':
        return 'rgba(0, 0, 0, 0.1)';
      case 'danger':
        return 'rgba(255, 255, 255, 0.3)';
      case 'success':
        return 'rgba(255, 255, 255, 0.3)';
      case 'ghost':
        return 'rgba(0, 0, 0, 0.1)';
      default:
        return 'rgba(255, 255, 255, 0.3)';
    }
  };

  const createRipple = (event: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const newRipple: Ripple = {
      id: rippleId.current++,
      x,
      y,
      size
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation completes
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    createRipple(event);
    if (onClick && !disabled) {
      // Delay the onClick slightly to show the ripple effect
      setTimeout(() => {
        onClick();
      }, 100);
    }
  };

  return (
    <motion.button
      ref={buttonRef}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative overflow-hidden rounded-lg font-medium
        transition-colors duration-200 focus:outline-none focus:ring-2 
        focus:ring-offset-2 focus:ring-blue-500
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {/* Button Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {icon && iconPosition === 'left' && (
          <motion.span
            initial={{ rotate: 0 }}
            whileHover={{ rotate: 15 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {icon}
          </motion.span>
        )}
        {children}
        {icon && iconPosition === 'right' && (
          <motion.span
            initial={{ rotate: 0 }}
            whileHover={{ rotate: -15 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {icon}
          </motion.span>
        )}
      </span>

      {/* Ripple Effects */}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              position: 'absolute',
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              borderRadius: '50%',
              backgroundColor: getRippleColor(),
              pointerEvents: 'none',
              zIndex: 1
            }}
          />
        ))}
      </AnimatePresence>

      {/* Hover Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: disabled ? 0 : 0.1 }}
        className="absolute inset-0 bg-white pointer-events-none z-0"
      />
    </motion.button>
  );
};

export default RippleButton;