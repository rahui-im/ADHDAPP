import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface FloatingActionButtonProps {
  mainAction?: () => void;
  actions?: Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    color?: string;
  }>;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  mainIcon?: React.ReactNode;
  expandDirection?: 'up' | 'down' | 'left' | 'right';
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  mainAction,
  actions = [],
  position = 'bottom-right',
  mainIcon,
  expandDirection = 'up'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const getExpandedPosition = (index: number) => {
    const spacing = 60;
    const offset = (index + 1) * spacing;
    
    switch (expandDirection) {
      case 'up':
        return { x: 0, y: -offset };
      case 'down':
        return { x: 0, y: offset };
      case 'left':
        return { x: -offset, y: 0 };
      case 'right':
        return { x: offset, y: 0 };
      default:
        return { x: 0, y: -offset };
    }
  };

  const handleMainClick = () => {
    if (actions.length > 0) {
      setIsOpen(!isOpen);
    }
    if (mainAction && actions.length === 0) {
      mainAction();
    }
  };

  const handleActionClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <AnimatePresence>
        {isOpen && actions.map((action, index) => {
          const position = getExpandedPosition(index);
          return (
            <motion.div
              key={index}
              initial={{ scale: 0, opacity: 0, ...position }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                ...position,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: index * 0.05
                }
              }}
              exit={{ 
                scale: 0, 
                opacity: 0,
                x: 0,
                y: 0,
                transition: {
                  duration: 0.2,
                  delay: (actions.length - index - 1) * 0.05
                }
              }}
              className="absolute"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleActionClick(action.onClick)}
                className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center ${
                  action.color || 'bg-gray-600'
                } text-white hover:shadow-xl transition-shadow`}
                title={action.label}
              >
                {action.icon}
              </motion.button>
              {/* Tooltip */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileHover={{ opacity: 1, scale: 1 }}
                className={`absolute ${
                  expandDirection === 'left' ? 'right-14' : 
                  expandDirection === 'right' ? 'left-14' : 
                  'right-14'
                } top-1/2 -translate-y-1/2 bg-gray-800 text-white text-sm px-2 py-1 rounded whitespace-nowrap pointer-events-none`}
              >
                {action.label}
              </motion.div>
            </motion.div>
          )}
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        onClick={handleMainClick}
        className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:shadow-xl flex items-center justify-center relative z-10 transition-shadow"
      >
        {mainIcon || (isOpen ? <XMarkIcon className="w-6 h-6" /> : <PlusIcon className="w-6 h-6" />)}
      </motion.button>
    </div>
  );
};

export default FloatingActionButton;