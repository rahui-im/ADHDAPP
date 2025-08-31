# 📋 PHASE 3: USER EXPERIENCE - Detailed Implementation Guide

## 📊 구현 현황 요약
**전체 진행률**: 약 40% 완료
- ✅ **P2-001**: UI/UX Polish and Animations (90% 완료)
  - ✅ 애니메이션 유틸리티
  - ✅ Loading Skeletons
  - ✅ Success Animations (confetti 포함)
  - ✅ Hover Effects
  - ✅ Page Transitions
  - ✅ Empty States
  - ⚠️ Accessibility 설정 미구현
  
- ✅ **P2-002**: Error Handling (85% 완료)
  - ✅ ErrorBoundary
  - ✅ Toast System (react-hot-toast)
  - ✅ Retry Mechanism
  - ✅ Offline Indicator
  - ⚠️ Form validation 미구현

- ❌ **P2-003**: Onboarding (미구현)
- ❌ **P2-004**: Advanced Timer (일부만 구현)
- ❌ **P2-005**: Testing (미구현)

## 🎯 Phase Overview
**Phase Goal**: Polish the user interface and improve overall user experience  
**Total Estimated Time**: 40 hours  
**Priority**: P2 - Medium Priority  
**Prerequisites**: Complete Phase 1 & 2 (Infrastructure and Core Features)  

---

## 🎨 P2-001: UI/UX Polish and Animations

### Task Overview
- **Task ID**: P2-001
- **Task Name**: UI/UX Polish and Animations
- **Priority**: Medium
- **Time Estimate**: 12 hours
  - Micro-animations: 3 hours
  - Loading Skeletons: 2 hours
  - Success Animations: 2 hours
  - Hover Effects: 2 hours
  - Page Transitions: 2 hours
  - Empty States: 1 hour
- **Dependencies**: All P0 and P1 tasks complete

### Current State vs Desired State
**Current State**:
- Basic UI without animations
- Instant state changes without feedback
- No loading indicators
- Plain empty states
- Harsh transitions

**Desired State**:
- Smooth micro-animations throughout
- Skeleton loaders during data fetch
- Celebratory success animations
- Interactive hover effects
- Smooth page transitions
- Engaging empty states

### Implementation Steps

#### Step 1: Install Animation Libraries
```bash
npm install framer-motion@11.0.3 react-intersection-observer@9.5.3 canvas-confetti@1.9.2
npm install react-loading-skeleton@3.3.1 lottie-react@2.4.0
npm install --save-dev @lottiefiles/react-lottie-player
```

#### Step 2: Create Animation Utilities
Create `src/utils/animations.ts`:

```typescript
import { Variants, Transition } from 'framer-motion';

// Standard transitions
export const transitions = {
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  } as Transition,
  
  smooth: {
    type: 'tween',
    duration: 0.3,
    ease: 'easeInOut',
  } as Transition,
  
  bounce: {
    type: 'spring',
    stiffness: 400,
    damping: 10,
  } as Transition,
};

// Page transition variants
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -20,
  },
};

// Card animation variants
export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.spring,
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    transition: transitions.smooth,
  },
  tap: {
    scale: 0.98,
  },
};

// List animation variants
export const listVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.spring,
  },
};

// Success animation variants
export const successVariants: Variants = {
  initial: {
    scale: 0,
    rotate: -180,
  },
  animate: {
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    },
  },
};

// Shake animation for errors
export const shakeVariants: Variants = {
  shake: {
    x: [-10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
    },
  },
};

// Pulse animation for attention
export const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: 'reverse',
    },
  },
};

// Skeleton pulse animation
export const skeletonPulse = {
  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  '@keyframes pulse': {
    '0%, 100%': {
      opacity: 1,
    },
    '50%': {
      opacity: 0.5,
    },
  },
};
```

#### Step 3: Create Loading Skeletons
Create `src/components/ui/Skeleton.tsx`:

```typescript
import { motion } from 'framer-motion';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave';
}

export function Skeleton({
  width = '100%',
  height = 20,
  className = '',
  variant = 'text',
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  };
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
  };
  
  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={{ width, height }}
    />
  );
}

// Task Card Skeleton
export function TaskCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={24} />
          <Skeleton width="80%" height={16} />
        </div>
        <Skeleton variant="circular" width={32} height={32} />
      </div>
      <div className="flex gap-2">
        <Skeleton variant="rounded" width={60} height={24} />
        <Skeleton variant="rounded" width={60} height={24} />
        <Skeleton variant="rounded" width={80} height={24} />
      </div>
    </div>
  );
}

// Dashboard Stats Skeleton
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton width={100} height={16} />
              <Skeleton width={60} height={32} />
            </div>
            <Skeleton variant="circular" width={48} height={48} />
          </div>
        </div>
      ))}
    </div>
  );
}

// List Skeleton
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <TaskCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}
```

#### Step 4: Create Success Animations
Create `src/components/ui/SuccessAnimation.tsx`:

```typescript
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import Lottie from 'lottie-react';
import successAnimation from '../../assets/animations/success.json';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  type?: 'confetti' | 'lottie' | 'simple' | 'fireworks';
  duration?: number;
  onComplete?: () => void;
}

export default function SuccessAnimation({
  show,
  message = '성공!',
  type = 'simple',
  duration = 3000,
  onComplete,
}: SuccessAnimationProps) {
  useEffect(() => {
    if (show) {
      switch (type) {
        case 'confetti':
          triggerConfetti();
          break;
        case 'fireworks':
          triggerFireworks();
          break;
      }
      
      if (onComplete) {
        const timer = setTimeout(onComplete, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [show, type, duration, onComplete]);
  
  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
    };
    
    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }
    
    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };
  
  const triggerFireworks = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    
    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }
    
    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      
      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: {
          x: randomInRange(0.1, 0.3),
          y: Math.random() - 0.2,
        },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: {
          x: randomInRange(0.7, 0.9),
          y: Math.random() - 0.2,
        },
      });
    }, 250);
  };
  
  return (
    <AnimatePresence>
      {show && (
        <>
          {type === 'simple' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 0.5,
                  times: [0, 0.2, 0.5, 0.8, 1],
                  repeat: 1,
                  repeatDelay: 0.5,
                }}
                className="bg-green-500 text-white rounded-full p-8"
              >
                <CheckCircleIcon className="w-24 h-24" />
              </motion.div>
              {message && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="absolute bottom-1/3 text-2xl font-bold text-gray-900 dark:text-white"
                >
                  {message}
                </motion.p>
              )}
            </motion.div>
          )}
          
          {type === 'lottie' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className="w-64 h-64">
                <Lottie
                  animationData={successAnimation}
                  loop={false}
                  autoplay={true}
                />
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
```

#### Step 5: Create Hover Effects
Create `src/components/ui/HoverCard.tsx`:

```typescript
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface HoverCardProps {
  children: ReactNode;
  className?: string;
  hoverScale?: number;
  hoverShadow?: string;
  onClick?: () => void;
}

export default function HoverCard({
  children,
  className = '',
  hoverScale = 1.02,
  hoverShadow = '0 10px 30px rgba(0,0,0,0.1)',
  onClick,
}: HoverCardProps) {
  return (
    <motion.div
      className={`bg-white dark:bg-gray-800 rounded-lg p-4 cursor-pointer ${className}`}
      whileHover={{
        scale: hoverScale,
        boxShadow: hoverShadow,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

// Floating Action Button with hover effect
export function FloatingActionButton({
  onClick,
  icon: Icon,
  label,
}: {
  onClick: () => void;
  icon: any;
  label: string;
}) {
  return (
    <motion.button
      className="fixed bottom-6 right-6 bg-indigo-600 text-white rounded-full p-4 shadow-lg"
      whileHover={{
        scale: 1.1,
        boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)',
      }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      aria-label={label}
    >
      <motion.div
        animate={{
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 0.5,
          ease: 'easeInOut',
        }}
      >
        <Icon className="w-6 h-6" />
      </motion.div>
    </motion.button>
  );
}

// Interactive Button with ripple effect
export function RippleButton({
  children,
  onClick,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    
    setRipples([...ripples, { x, y, id }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
    
    onClick?.();
  };
  
  return (
    <button
      className={`relative overflow-hidden px-4 py-2 bg-indigo-600 text-white rounded-lg ${className}`}
      onClick={handleClick}
    >
      {children}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 1,
            height: 1,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            width: 300,
            height: 300,
            opacity: 0,
          }}
          transition={{
            duration: 0.6,
            ease: 'easeOut',
          }}
        />
      ))}
    </button>
  );
}
```

#### Step 6: Create Page Transitions
Create `src/components/ui/PageTransition.tsx`:

```typescript
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { ReactNode } from 'react';

const pageVariants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  in: {
    opacity: 1,
    x: 0,
  },
  out: {
    opacity: 0,
    x: 20,
  },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4,
};

export default function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Stagger children animation wrapper
export function StaggerContainer({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 24,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
```

#### Step 7: Create Empty States
Create `src/components/ui/EmptyState.tsx`:

```typescript
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
```

### Files to Modify/Create
- ✅ Create: `src/utils/animations.ts`
- ✅ Create: `src/components/ui/Skeleton.tsx`
- ✅ Create: `src/components/ui/SuccessAnimation.tsx`
- ✅ Create: `src/components/ui/HoverCard.tsx`
- ✅ Create: `src/components/ui/PageTransition.tsx`
- ✅ Create: `src/components/ui/EmptyState.tsx`
- ✅ Add: Lottie animation files
- ✅ Update: All components to use animations

### Testing Requirements

```typescript
// src/tests/animations/Animations.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SuccessAnimation } from '../../components/ui/SuccessAnimation';
import { HoverCard } from '../../components/ui/HoverCard';

describe('UI Animations', () => {
  it('shows success animation when triggered', async () => {
    const { rerender } = render(
      <SuccessAnimation show={false} message="Test Success" />
    );
    
    expect(screen.queryByText('Test Success')).not.toBeInTheDocument();
    
    rerender(<SuccessAnimation show={true} message="Test Success" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Success')).toBeInTheDocument();
    });
  });
  
  it('applies hover effects on cards', async () => {
    render(
      <HoverCard>
        <div>Test Card</div>
      </HoverCard>
    );
    
    const card = screen.getByText('Test Card').parentElement;
    
    fireEvent.mouseEnter(card!);
    // Check for scale transform
    expect(card).toHaveStyle({ transform: expect.stringContaining('scale') });
  });
});
```

### Common Pitfalls to Avoid
1. **Performance**: Don't overuse animations, they can impact performance
2. **Accessibility**: Respect prefers-reduced-motion settings
3. **Mobile**: Test animations on mobile devices
4. **Battery**: Consider battery usage with continuous animations
5. **Browser Support**: Check animation support across browsers

### Definition of Done
- [x] All interactions have appropriate feedback
- [x] Loading states use skeletons
- [x] Success actions trigger celebrations
- [x] Hover effects are smooth
- [x] Page transitions work
- [x] Empty states are engaging
- [ ] Animations respect accessibility settings
- [ ] Performance remains good

---

## 🚨 P2-002: Error Handling and User Feedback

### Task Overview
- **Task ID**: P2-002
- **Task Name**: Error Handling and User Feedback
- **Priority**: Medium
- **Time Estimate**: 8 hours
  - Error Boundaries: 2 hours
  - Toast System: 2 hours
  - Error Messages: 1 hour
  - Retry Mechanisms: 2 hours
  - Offline Detection: 1 hour
- **Dependencies**: P0-003 (Redux integration)

### Implementation Steps

#### Step 1: Create Error Boundary Component
Create `src/components/ui/ErrorBoundary.tsx`:

```typescript
import { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log to error reporting service
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }
  
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };
  
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              문제가 발생했습니다
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 나중에 다시 시도해주세요.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                  오류 상세 정보
                </summary>
                <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                다시 시도
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                페이지 새로고침
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Hook for error handling
export function useErrorHandler() {
  return (error: Error, errorInfo?: string) => {
    console.error('Error:', error);
    
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error, {
        extra: {
          errorInfo,
        },
      });
    }
    
    // You can also dispatch to Redux or show toast here
  };
}
```

#### Step 2: Create Enhanced Toast System
Create `src/components/ui/Toast.tsx`:

```typescript
import { Toaster, toast, ToastOptions } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';

// Custom toast component
interface CustomToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  action?: {
    label: string;
    onClick: () => void;
  };
}

function CustomToast({ message, type, action }: CustomToastProps) {
  const icons = {
    success: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
    error: <XCircleIcon className="w-5 h-5 text-red-500" />,
    info: <InformationCircleIcon className="w-5 h-5 text-blue-500" />,
    warning: <ExclamationCircleIcon className="w-5 h-5 text-yellow-500" />,
  };
  
  const colors = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`flex items-start gap-3 p-4 rounded-lg border ${colors[type]} shadow-lg`}
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="flex-1">
        <p className="text-sm text-gray-900 dark:text-white">{message}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => toast.dismiss()}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// Toast utility functions
export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    toast.custom(
      (t) => (
        <AnimatePresence>
          {t.visible && <CustomToast message={message} type="success" />}
        </AnimatePresence>
      ),
      options
    );
  },
  
  error: (message: string, action?: { label: string; onClick: () => void }, options?: ToastOptions) => {
    toast.custom(
      (t) => (
        <AnimatePresence>
          {t.visible && <CustomToast message={message} type="error" action={action} />}
        </AnimatePresence>
      ),
      options
    );
  },
  
  info: (message: string, options?: ToastOptions) => {
    toast.custom(
      (t) => (
        <AnimatePresence>
          {t.visible && <CustomToast message={message} type="info" />}
        </AnimatePresence>
      ),
      options
    );
  },
  
  warning: (message: string, options?: ToastOptions) => {
    toast.custom(
      (t) => (
        <AnimatePresence>
          {t.visible && <CustomToast message={message} type="warning" />}
        </AnimatePresence>
      ),
      options
    );
  },
  
  promise: async <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages);
  },
};

// Toast container component
export function ToastContainer() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
        },
      }}
    />
  );
}
```

#### Step 3: Create Retry Mechanism
Create `src/utils/retry.ts`:

```typescript
export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  onRetry?: (attempt: number, error: Error) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 'exponential',
    onRetry,
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      onRetry?.(attempt, lastError);
      
      const waitTime = backoff === 'exponential' 
        ? delay * Math.pow(2, attempt - 1)
        : delay * attempt;
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError!;
}

// React hook for retry logic
export function useRetry() {
  const [retrying, setRetrying] = useState(false);
  const [attempt, setAttempt] = useState(0);
  
  const retry = useCallback(async <T,>(
    fn: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> => {
    setRetrying(true);
    setAttempt(0);
    
    try {
      const result = await withRetry(fn, {
        ...options,
        onRetry: (attemptNum, error) => {
          setAttempt(attemptNum);
          options?.onRetry?.(attemptNum, error);
        },
      });
      
      return result;
    } finally {
      setRetrying(false);
      setAttempt(0);
    }
  }, []);
  
  return { retry, retrying, attempt };
}
```

#### Step 4: Create Offline Detection
Create `src/components/ui/OfflineIndicator.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
}

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  
  useEffect(() => {
    if (isOnline && !showReconnected) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);
  
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 bg-red-600 text-white py-3 px-4 z-50"
        >
          <div className="flex items-center justify-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span className="font-medium">오프라인 상태입니다</span>
            <span className="text-sm opacity-90">변경사항이 저장되지 않을 수 있습니다</span>
          </div>
        </motion.div>
      )}
      
      {showReconnected && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 bg-green-600 text-white py-3 px-4 z-50"
        >
          <div className="flex items-center justify-center gap-2">
            <WifiIcon className="w-5 h-5" />
            <span className="font-medium">연결이 복구되었습니다</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Files to Modify/Create
- ✅ Create: `src/components/ui/ErrorBoundary.tsx`
- ✅ Create: `src/components/ui/Toast.tsx`
- ✅ Create: `src/utils/retry.ts`
- ✅ Create: `src/components/ui/OfflineIndicator.tsx`
- ✅ Update: App.tsx to include error boundaries
- ✅ Update: All async operations to use retry

### Definition of Done
- [x] Error boundaries catch and display errors
- [x] Toast notifications work for all actions
- [x] Retry mechanisms work for failed operations
- [x] Offline state is detected and shown
- [ ] Form validation errors display properly
- [ ] Success confirmations show
- [ ] Tests pass

---

## 🎓 P2-003: Onboarding and Help System

### Task Overview
- **Task ID**: P2-003
- **Task Name**: Onboarding and Help System
- **Priority**: Medium
- **Time Estimate**: 10 hours
  - Welcome Tour: 3 hours
  - Tooltips: 2 hours
  - Help Documentation: 2 hours
  - Keyboard Shortcuts: 2 hours
  - Progress Tracking: 1 hour
- **Dependencies**: P1-002 (Settings must be complete)

### Implementation Steps

#### Step 1: Create Onboarding Flow
Create `src/components/onboarding/OnboardingFlow.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { completeOnboarding, setOnboardingStep } from '../../store/slices/settingsSlice';
import confetti from 'canvas-confetti';

const steps: Step[] = [
  {
    target: '.dashboard-welcome',
    content: (
      <div>
        <h3 className="font-bold text-lg mb-2">ADHD 타임 매니저에 오신 것을 환영합니다! 👋</h3>
        <p>이 앱은 ADHD를 가진 분들의 시간 관리를 돕기 위해 설계되었습니다.</p>
        <p className="mt-2">간단한 투어를 시작해볼까요?</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.task-button',
    content: (
      <div>
        <h3 className="font-bold text-lg mb-2">작업 만들기 📝</h3>
        <p>여기서 새로운 작업을 만들 수 있습니다.</p>
        <p className="mt-2">25분 이상의 작업은 자동으로 작은 단위로 나뉩니다!</p>
      </div>
    ),
  },
  {
    target: '.timer-section',
    content: (
      <div>
        <h3 className="font-bold text-lg mb-2">포모도로 타이머 ⏰</h3>
        <p>25분 집중, 5분 휴식의 포모도로 기법을 사용합니다.</p>
        <p className="mt-2">ADHD에 최적화된 시간 설정도 제공됩니다.</p>
      </div>
    ),
  },
  {
    target: '.energy-tracker',
    content: (
      <div>
        <h3 className="font-bold text-lg mb-2">에너지 레벨 추적 ⚡</h3>
        <p>하루 중 에너지 레벨을 추적하여 최적의 작업 시간을 찾아드립니다.</p>
      </div>
    ),
  },
  {
    target: '.analytics-link',
    content: (
      <div>
        <h3 className="font-bold text-lg mb-2">분석 및 인사이트 📊</h3>
        <p>생산성 패턴을 분석하고 개인화된 추천을 받아보세요.</p>
      </div>
    ),
  },
  {
    target: '.settings-link',
    content: (
      <div>
        <h3 className="font-bold text-lg mb-2">설정 ⚙️</h3>
        <p>알림, 테마, 타이머 설정 등을 개인화할 수 있습니다.</p>
      </div>
    ),
];

export default function OnboardingFlow() {
  const dispatch = useAppDispatch();
  const { hasCompletedOnboarding, onboardingStep } = useAppSelector(
    (state) => state.settings.onboarding
  );
  const [run, setRun] = useState(!hasCompletedOnboarding);
  const [stepIndex, setStepIndex] = useState(onboardingStep || 0);
  
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, type } = data;
    
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      dispatch(completeOnboarding());
      
      if (status === STATUS.FINISHED) {
        // Celebration!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } else if (type === 'step:after') {
      setStepIndex(index + 1);
      dispatch(setOnboardingStep(index + 1));
    }
  };
  
  return (
    <>
      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        continuous
        showProgress
        showSkipButton
        styles={{
          options: {
            primaryColor: '#6366f1',
            textColor: '#1f2937',
            backgroundColor: '#ffffff',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            arrowColor: '#ffffff',
            width: 380,
            zIndex: 10000,
          },
          buttonNext: {
            backgroundColor: '#6366f1',
            color: '#ffffff',
          },
          buttonBack: {
            color: '#6b7280',
          },
          buttonSkip: {
            color: '#ef4444',
          },
        }}
        locale={{
          back: '이전',
          close: '닫기',
          last: '완료',
          next: '다음',
          skip: '건너뛰기',
        }}
        callback={handleJoyrideCallback}
      />
      
      {/* Welcome Modal for first-time users */}
      <AnimatePresence>
        {!hasCompletedOnboarding && stepIndex === 0 && (
          <WelcomeModal onStart={() => setStepIndex(1)} />
        )}
      </AnimatePresence>
    </>
  );
}

function WelcomeModal({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          환영합니다! 🎉
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          ADHD 타임 매니저는 당신의 생산성 파트너입니다.
          몇 분만 투자하여 주요 기능을 알아보세요.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onStart}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            투어 시작하기
          </button>
          <button
            onClick={() => {
              // Skip onboarding
            }}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
          >
            나중에
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
```

#### Step 2: Create Tooltip System
Create `src/components/ui/Tooltip.tsx`:

```typescript
import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  interactive?: boolean;
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  interactive = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  let timeout: NodeJS.Timeout;
  
  const showTooltip = () => {
    timeout = setTimeout(() => setIsVisible(true), delay);
  };
  
  const hideTooltip = () => {
    clearTimeout(timeout);
    if (!interactive) {
      setIsVisible(false);
    }
  };
  
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };
  
  const arrows = {
    top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-gray-900',
    bottom: 'top-[-4px] left-1/2 -translate-x-1/2 border-b-gray-900',
    left: 'right-[-4px] top-1/2 -translate-y-1/2 border-l-gray-900',
    right: 'left-[-4px] top-1/2 -translate-y-1/2 border-r-gray-900',
  };
  
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`absolute ${positions[position]} z-50 pointer-events-none`}
            onMouseEnter={() => interactive && setIsVisible(true)}
            onMouseLeave={() => interactive && setIsVisible(false)}
            style={{ pointerEvents: interactive ? 'auto' : 'none' }}
          >
            <div className="bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg px-3 py-2 max-w-xs">
              {content}
              <div
                className={`absolute w-0 h-0 border-4 border-transparent ${arrows[position]}`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Help icon with tooltip
export function HelpTooltip({ content }: { content: ReactNode }) {
  return (
    <Tooltip content={content} position="top">
      <QuestionMarkCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
    </Tooltip>
  );
}
```

#### Step 3: Create Keyboard Shortcuts
Create `src/hooks/useKeyboardShortcuts.ts`:

```typescript
import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from './redux';
import { showToast } from '../components/ui/Toast';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

const shortcuts: Shortcut[] = [
  {
    key: 'n',
    ctrl: true,
    action: () => {
      // Open new task modal
      document.getElementById('new-task-button')?.click();
    },
    description: '새 작업 만들기',
  },
  {
    key: 's',
    ctrl: true,
    action: () => {
      // Start/pause timer
      document.getElementById('timer-toggle')?.click();
    },
    description: '타이머 시작/일시정지',
  },
  {
    key: '/',
    ctrl: true,
    action: () => {
      // Focus search
      document.getElementById('search-input')?.focus();
    },
    description: '검색',
  },
  {
    key: '?',
    shift: true,
    action: () => {
      // Show shortcuts help
      document.getElementById('shortcuts-help')?.click();
    },
    description: '단축키 도움말',
  },
  {
    key: '1',
    alt: true,
    action: () => navigate('/'),
    description: '대시보드로 이동',
  },
  {
    key: '2',
    alt: true,
    action: () => navigate('/tasks'),
    description: '작업 관리로 이동',
  },
  {
    key: '3',
    alt: true,
    action: () => navigate('/timer'),
    description: '타이머로 이동',
  },
  {
    key: '4',
    alt: true,
    action: () => navigate('/analytics'),
    description: '분석으로 이동',
  },
  {
    key: '5',
    alt: true,
    action: () => navigate('/settings'),
    description: '설정으로 이동',
  },
];

export function useKeyboardShortcuts(enabled: boolean = true) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Don't trigger shortcuts when typing in inputs
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return;
    }
    
    const shortcut = shortcuts.find(s => {
      const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = s.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const altMatch = s.alt ? event.altKey : !event.altKey;
      const shiftMatch = s.shift ? event.shiftKey : !event.shiftKey;
      
      return keyMatch && ctrlMatch && altMatch && shiftMatch;
    });
    
    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  }, [enabled]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);
  
  return shortcuts;
}

// Shortcuts help modal
export function KeyboardShortcutsHelp() {
  const shortcuts = useKeyboardShortcuts(false); // Get shortcuts without enabling
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        키보드 단축키
      </h3>
      
      <div className="space-y-2">
        {shortcuts.map((shortcut, index) => (
          <div
            key={index}
            className="flex justify-between items-center py-2 border-b dark:border-gray-700"
          >
            <span className="text-gray-700 dark:text-gray-300">
              {shortcut.description}
            </span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
              {[
                shortcut.ctrl && '⌘',
                shortcut.alt && 'Alt',
                shortcut.shift && 'Shift',
                shortcut.key.toUpperCase(),
              ].filter(Boolean).join(' + ')}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Files to Modify/Create
- ❌ Create: `src/components/onboarding/OnboardingFlow.tsx`
- ❌ Create: `src/components/ui/Tooltip.tsx`
- ❌ Create: `src/hooks/useKeyboardShortcuts.ts`
- ❌ Create: `src/components/help/HelpCenter.tsx`
- ❌ Create: `src/components/help/VideoTutorials.tsx`
- ❌ Update: App.tsx to include onboarding

### Definition of Done
- [ ] Welcome tour works for new users
- [ ] Tooltips appear on hover
- [ ] Keyboard shortcuts work
- [ ] Help documentation accessible
- [ ] Onboarding progress tracked
- [ ] Context-sensitive help available
- [ ] Tests pass

---

## ⏱️ P2-004: Advanced Timer Features

### Task Overview
- **Task ID**: P2-004
- **Task Name**: Advanced Timer Features
- **Priority**: Medium
- **Time Estimate**: 10 hours
  - Custom Durations: 2 hours
  - Timer Templates: 2 hours
  - Focus Mode: 2 hours
  - Timer History: 2 hours
  - Ambient Sounds: 2 hours
- **Dependencies**: P0-005, P1-004 (Timer and Notifications)

### Implementation Steps

[Implementation details for advanced timer features would continue here...]

### Files to Modify/Create
- ❌ Create: `src/components/timer/TimerAdvanced.tsx`
- ❌ Create: `src/components/timer/TimerTemplates.tsx`
- ✅ Create: `src/components/timer/FocusMode.tsx` (Phase 1에서 구현됨)
- ❌ Create: `src/components/timer/TimerHistory.tsx`
- ❌ Create: `src/components/timer/AmbientSounds.tsx`

### Definition of Done
- [ ] Custom timer durations work
- [ ] Templates can be saved/loaded
- [ ] Focus mode minimizes distractions
- [ ] Timer history is tracked
- [ ] Ambient sounds play during sessions
- [ ] Tests pass

---

## 📊 Phase 3 Summary

### Phase 3 Completion Checklist
- [x] P2-001: UI/UX Polish ✅ (90% 완료)
- [x] P2-002: Error Handling ✅ (85% 완료)
- [ ] P2-003: Onboarding ❌ (미구현)
- [ ] P2-004: Advanced Timer ❌ (일부 구현)
- [ ] P2-005: Testing Implementation ❌ (미구현)

### Quality Metrics
- Animation performance: < 60fps maintained
- Error recovery: 100% of errors handled gracefully
- Onboarding completion: > 80% of new users
- Help accessibility: < 2 clicks to any help content
- Keyboard navigation: 100% of features accessible

### Moving to Phase 4
Phase 3 focuses on user experience. Once complete, Phase 4 will optimize performance and PWA features for production readiness.

---

This completes the detailed implementation guide for Phase 3: User Experience.