import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import Lottie from 'lottie-react';
import emptyBoxAnimation from '../../assets/animations/empty-box.json';
import noDataAnimation from '../../assets/animations/no-data.json';
import searchAnimation from '../../assets/animations/search.json';

interface EmptyStateProps {
  type?: 'no-data' | 'no-results' | 'error' | 'coming-soon';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
  animation?: 'bounce' | 'fade' | 'slide';
}

export default function EmptyState({
  type = 'no-data',
  title,
  description,
  action,
  icon,
  animation = 'fade',
}: EmptyStateProps) {
  const animations = {
    'no-data': noDataAnimation,
    'no-results': searchAnimation,
    'error': emptyBoxAnimation,
    'coming-soon': emptyBoxAnimation,
  };
  
  const animationVariants = {
    bounce: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { 
        opacity: 1, 
        scale: 1,
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 20,
        },
      },
    },
    fade: {
      initial: { opacity: 0 },
      animate: { 
        opacity: 1,
        transition: { duration: 0.5 },
      },
    },
    slide: {
      initial: { opacity: 0, y: 20 },
      animate: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.4 },
      },
    },
  };
  
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 px-4"
      initial={animationVariants[animation].initial}
      animate={animationVariants[animation].animate}
    >
      {/* Animation or Icon */}
      <div className="w-48 h-48 mb-6">
        {icon ? (
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'loop',
            }}
          >
            {icon}
          </motion.div>
        ) : (
          <Lottie
            animationData={animations[type]}
            loop={true}
            autoplay={true}
          />
        )}
      </div>
      
      {/* Title */}
      <motion.h3
        className="text-xl font-semibold text-gray-900 dark:text-white mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {title}
      </motion.h3>
      
      {/* Description */}
      {description && (
        <motion.p
          className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {description}
        </motion.p>
      )}
      
      {/* Action Button */}
      {action && (
        <motion.button
          onClick={action.onClick}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}

// Specific empty states
export function NoTasksEmpty() {
  return (
    <EmptyState
      type="no-data"
      title="작업이 없습니다"
      description="첫 번째 작업을 만들어 생산성 여정을 시작하세요!"
      action={{
        label: '작업 만들기',
        onClick: () => {
          // Open task modal
          document.getElementById('new-task-button')?.click();
        },
      }}
      animation="bounce"
    />
  );
}

export function NoSearchResults() {
  return (
    <EmptyState
      type="no-results"
      title="검색 결과가 없습니다"
      description="다른 검색어를 시도하거나 필터를 조정해보세요"
      animation="slide"
    />
  );
}