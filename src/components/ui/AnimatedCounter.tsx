import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  animationType?: 'spring' | 'smooth' | 'bounce' | 'flip';
  showSign?: boolean;
  formatNumber?: (value: number) => string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  size = 'md',
  color = 'text-gray-900',
  animationType = 'spring',
  showSign = false,
  formatNumber
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const springValue = useSpring(0);
  const displaySpringValue = useTransform(springValue, (latest) => 
    formatNumber ? formatNumber(latest) : latest.toFixed(decimals)
  );

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl',
    xl: 'text-4xl font-bold'
  };

  useEffect(() => {
    if (animationType === 'spring' || animationType === 'bounce') {
      springValue.set(value);
    } else if (animationType === 'flip') {
      // For flip animation, we'll use discrete values
      setDisplayValue(value);
    } else {
      // Smooth animation
      const startTime = Date.now();
      const startValue = previousValue.current;
      const endValue = value;
      const animationDuration = duration * 1000;

      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        
        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = startValue + (endValue - startValue) * easeOutQuart;
        
        setDisplayValue(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }

    previousValue.current = value;
  }, [value, duration, animationType, springValue]);

  const formatDisplayValue = (val: number) => {
    if (formatNumber) {
      return formatNumber(val);
    }
    
    const formatted = val.toFixed(decimals);
    // Add thousand separators
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const getSign = () => {
    if (!showSign) return '';
    const diff = value - previousValue.current;
    if (diff > 0) return '+';
    if (diff < 0) return '-';
    return '';
  };

  const sign = getSign();
  const signColor = sign === '+' ? 'text-green-500' : sign === '-' ? 'text-red-500' : '';

  // Flip Animation Component
  const FlipNumber: React.FC<{ digit: string; index: number }> = ({ digit, index }) => {
    return (
      <div className="relative inline-block" style={{ width: 'auto' }}>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={`${digit}-${index}-${Date.now()}`}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              delay: index * 0.02
            }}
            className="inline-block"
          >
            {digit}
          </motion.span>
        </AnimatePresence>
      </div>
    );
  };

  if (animationType === 'spring' || animationType === 'bounce') {
    return (
      <motion.div
        className={`inline-flex items-center ${sizeClasses[size]} ${color} ${className}`}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 0.3 }}
      >
        {prefix && <span className="mr-1">{prefix}</span>}
        {sign && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`mr-1 ${signColor}`}
          >
            {sign}
          </motion.span>
        )}
        <motion.span
          style={{
            display: 'inline-block',
            minWidth: '1ch'
          }}
        >
          {displaySpringValue}
        </motion.span>
        {suffix && <span className="ml-1">{suffix}</span>}
      </motion.div>
    );
  }

  if (animationType === 'flip') {
    const formattedValue = formatDisplayValue(displayValue);
    const digits = formattedValue.split('');
    
    return (
      <div className={`inline-flex items-center ${sizeClasses[size]} ${color} ${className}`}>
        {prefix && <span className="mr-1">{prefix}</span>}
        {sign && (
          <motion.span
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mr-1 ${signColor}`}
          >
            {sign}
          </motion.span>
        )}
        <div className="inline-flex">
          {digits.map((digit, index) => (
            <FlipNumber key={index} digit={digit} index={index} />
          ))}
        </div>
        {suffix && <span className="ml-1">{suffix}</span>}
      </div>
    );
  }

  // Smooth animation (default)
  return (
    <motion.div
      className={`inline-flex items-center ${sizeClasses[size]} ${color} ${className}`}
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {prefix && <span className="mr-1">{prefix}</span>}
      {sign && (
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 500 }}
          className={`mr-1 ${signColor}`}
        >
          {sign}
        </motion.span>
      )}
      <motion.span
        key={value}
        initial={value > previousValue.current ? { y: -10 } : { y: 10 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {formatDisplayValue(displayValue)}
      </motion.span>
      {suffix && <span className="ml-1">{suffix}</span>}
    </motion.div>
  );
};

export default AnimatedCounter;