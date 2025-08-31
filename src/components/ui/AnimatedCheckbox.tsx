import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/outline';

interface AnimatedCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  disabled?: boolean;
  animationType?: 'bounce' | 'scale' | 'rotate' | 'slide';
}

const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({
  checked,
  onChange,
  label,
  size = 'md',
  color = 'blue',
  disabled = false,
  animationType = 'bounce'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const colorClasses = {
    blue: 'bg-blue-600 border-blue-600',
    green: 'bg-green-600 border-green-600',
    red: 'bg-red-600 border-red-600',
    purple: 'bg-purple-600 border-purple-600',
    yellow: 'bg-yellow-600 border-yellow-600'
  };

  const getAnimationVariants = () => {
    switch (animationType) {
      case 'bounce':
        return {
          initial: { scale: 0, opacity: 0 },
          animate: { 
            scale: [0, 1.2, 1], 
            opacity: 1,
            transition: {
              duration: 0.3,
              times: [0, 0.6, 1],
              type: "spring",
              stiffness: 500,
              damping: 15
            }
          },
          exit: { 
            scale: 0, 
            opacity: 0,
            transition: { duration: 0.2 }
          }
        };
      case 'scale':
        return {
          initial: { scale: 0 },
          animate: { 
            scale: 1,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 20
            }
          },
          exit: { 
            scale: 0,
            transition: { duration: 0.15 }
          }
        };
      case 'rotate':
        return {
          initial: { scale: 0, rotate: -180 },
          animate: { 
            scale: 1, 
            rotate: 0,
            transition: {
              type: "spring",
              stiffness: 200,
              damping: 15
            }
          },
          exit: { 
            scale: 0, 
            rotate: 180,
            transition: { duration: 0.2 }
          }
        };
      case 'slide':
        return {
          initial: { x: -20, opacity: 0 },
          animate: { 
            x: 0, 
            opacity: 1,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 25
            }
          },
          exit: { 
            x: 20, 
            opacity: 0,
            transition: { duration: 0.15 }
          }
        };
      default:
        return {
          initial: { scale: 0 },
          animate: { scale: 1 },
          exit: { scale: 0 }
        };
    }
  };

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const variants = getAnimationVariants();

  return (
    <label className={`inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className="relative">
        <motion.div
          whileHover={!disabled ? { scale: 1.05 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
          className="relative"
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={() => {}}
            onClick={handleClick}
            disabled={disabled}
            className="sr-only"
          />
          <div
            className={`${sizeClasses[size]} rounded border-2 transition-colors ${
              checked 
                ? colorClasses[color as keyof typeof colorClasses] || colorClasses.blue
                : 'bg-white border-gray-300'
            } ${disabled ? '' : 'hover:border-gray-400'}`}
          >
            <AnimatePresence mode="wait">
              {checked && (
                <motion.div
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <CheckIcon className={`${iconSizes[size]} text-white stroke-[3]`} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Ripple Effect */}
        <AnimatePresence>
          {checked && !disabled && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0.8 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className={`absolute inset-0 rounded-full ${
                colorClasses[color as keyof typeof colorClasses] || colorClasses.blue
              } pointer-events-none`}
              style={{
                transformOrigin: 'center',
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {label && (
        <motion.span
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className={`ml-2 text-gray-700 select-none ${
            size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
          }`}
        >
          {label}
        </motion.span>
      )}
    </label>
  );
};

export default AnimatedCheckbox;