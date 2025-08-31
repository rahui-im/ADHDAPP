import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';
import { TrashIcon, HeartIcon, StarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface SwipeAction {
  icon: React.ReactNode;
  color: string;
  action: () => void;
  threshold?: number;
  label?: string;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  swipeThreshold?: number;
  className?: string;
  showActionHints?: boolean;
  swipeDirection?: 'horizontal' | 'vertical' | 'both';
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  upAction?: SwipeAction;
  downAction?: SwipeAction;
  returnToCenter?: boolean;
  maxSwipeDistance?: number;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = {
    icon: <TrashIcon className="w-6 h-6" />,
    color: 'bg-red-500',
    action: () => onSwipeLeft?.(),
    label: 'Delete'
  },
  rightAction = {
    icon: <HeartIcon className="w-6 h-6" />,
    color: 'bg-green-500',
    action: () => onSwipeRight?.(),
    label: 'Like'
  },
  swipeThreshold = 100,
  className = '',
  showActionHints = true,
  swipeDirection = 'horizontal',
  onSwipeUp,
  onSwipeDown,
  upAction = {
    icon: <StarIcon className="w-6 h-6" />,
    color: 'bg-yellow-500',
    action: () => onSwipeUp?.(),
    label: 'Star'
  },
  downAction = {
    icon: <CheckCircleIcon className="w-6 h-6" />,
    color: 'bg-blue-500',
    action: () => onSwipeDown?.(),
    label: 'Complete'
  },
  returnToCenter = true,
  maxSwipeDistance = 300
}) => {
  const [isSwipedAway, setIsSwipedAway] = useState(false);
  const [swipeActionTriggered, setSwipeActionTriggered] = useState<string | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Transform values for visual feedback
  const rotateZ = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(
    x,
    [-maxSwipeDistance, -swipeThreshold, 0, swipeThreshold, maxSwipeDistance],
    [0.5, 1, 1, 1, 0.5]
  );

  // Background color indicators
  const leftIndicatorOpacity = useTransform(
    x,
    [-swipeThreshold, 0],
    [1, 0]
  );
  const rightIndicatorOpacity = useTransform(
    x,
    [0, swipeThreshold],
    [0, 1]
  );
  const upIndicatorOpacity = useTransform(
    y,
    [-swipeThreshold, 0],
    [1, 0]
  );
  const downIndicatorOpacity = useTransform(
    y,
    [0, swipeThreshold],
    [0, 1]
  );

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const shouldTriggerLeft = info.offset.x < -swipeThreshold && swipeDirection !== 'vertical';
    const shouldTriggerRight = info.offset.x > swipeThreshold && swipeDirection !== 'vertical';
    const shouldTriggerUp = info.offset.y < -swipeThreshold && swipeDirection !== 'horizontal';
    const shouldTriggerDown = info.offset.y > swipeThreshold && swipeDirection !== 'horizontal';

    if (shouldTriggerLeft && leftAction) {
      setSwipeActionTriggered('left');
      if (!returnToCenter) {
        setIsSwipedAway(true);
      }
      setTimeout(() => {
        leftAction.action();
        if (returnToCenter) {
          setSwipeActionTriggered(null);
        }
      }, returnToCenter ? 300 : 0);
    } else if (shouldTriggerRight && rightAction) {
      setSwipeActionTriggered('right');
      if (!returnToCenter) {
        setIsSwipedAway(true);
      }
      setTimeout(() => {
        rightAction.action();
        if (returnToCenter) {
          setSwipeActionTriggered(null);
        }
      }, returnToCenter ? 300 : 0);
    } else if (shouldTriggerUp && upAction) {
      setSwipeActionTriggered('up');
      if (!returnToCenter) {
        setIsSwipedAway(true);
      }
      setTimeout(() => {
        upAction.action();
        if (returnToCenter) {
          setSwipeActionTriggered(null);
        }
      }, returnToCenter ? 300 : 0);
    } else if (shouldTriggerDown && downAction) {
      setSwipeActionTriggered('down');
      if (!returnToCenter) {
        setIsSwipedAway(true);
      }
      setTimeout(() => {
        downAction.action();
        if (returnToCenter) {
          setSwipeActionTriggered(null);
        }
      }, returnToCenter ? 300 : 0);
    }
  };

  const dragConstraints = {
    left: swipeDirection === 'vertical' ? 0 : -maxSwipeDistance,
    right: swipeDirection === 'vertical' ? 0 : maxSwipeDistance,
    top: swipeDirection === 'horizontal' ? 0 : -maxSwipeDistance,
    bottom: swipeDirection === 'horizontal' ? 0 : maxSwipeDistance
  };

  if (isSwipedAway && !returnToCenter) {
    return null;
  }

  return (
    <div className="relative">
      {/* Action Indicators */}
      {showActionHints && (
        <>
          {/* Left Action Indicator */}
          {swipeDirection !== 'vertical' && leftAction && (
            <motion.div
              style={{ opacity: leftIndicatorOpacity }}
              className={`absolute inset-y-0 left-0 w-20 ${leftAction.color} rounded-l-lg flex items-center justify-center`}
            >
              <div className="text-white">
                {leftAction.icon}
                {leftAction.label && (
                  <p className="text-xs mt-1">{leftAction.label}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Right Action Indicator */}
          {swipeDirection !== 'vertical' && rightAction && (
            <motion.div
              style={{ opacity: rightIndicatorOpacity }}
              className={`absolute inset-y-0 right-0 w-20 ${rightAction.color} rounded-r-lg flex items-center justify-center`}
            >
              <div className="text-white">
                {rightAction.icon}
                {rightAction.label && (
                  <p className="text-xs mt-1">{rightAction.label}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Up Action Indicator */}
          {swipeDirection !== 'horizontal' && upAction && (
            <motion.div
              style={{ opacity: upIndicatorOpacity }}
              className={`absolute inset-x-0 top-0 h-20 ${upAction.color} rounded-t-lg flex items-center justify-center`}
            >
              <div className="text-white">
                {upAction.icon}
                {upAction.label && (
                  <p className="text-xs mt-1">{upAction.label}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Down Action Indicator */}
          {swipeDirection !== 'horizontal' && downAction && (
            <motion.div
              style={{ opacity: downIndicatorOpacity }}
              className={`absolute inset-x-0 bottom-0 h-20 ${downAction.color} rounded-b-lg flex items-center justify-center`}
            >
              <div className="text-white">
                {downAction.icon}
                {downAction.label && (
                  <p className="text-xs mt-1">{downAction.label}</p>
                )}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Swipeable Card */}
      <AnimatePresence>
        {!isSwipedAway && (
          <motion.div
            drag={swipeDirection === 'both' ? true : swipeDirection === 'horizontal' ? 'x' : 'y'}
            dragConstraints={dragConstraints}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{
              x: swipeDirection !== 'vertical' ? x : 0,
              y: swipeDirection !== 'horizontal' ? y : 0,
              rotateZ: swipeDirection === 'horizontal' ? rotateZ : 0,
              opacity
            }}
            animate={
              swipeActionTriggered
                ? swipeActionTriggered === 'left'
                  ? { x: -window.innerWidth, opacity: 0 }
                  : swipeActionTriggered === 'right'
                  ? { x: window.innerWidth, opacity: 0 }
                  : swipeActionTriggered === 'up'
                  ? { y: -window.innerHeight, opacity: 0 }
                  : { y: window.innerHeight, opacity: 0 }
                : returnToCenter
                ? { x: 0, y: 0 }
                : {}
            }
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative bg-white rounded-lg shadow-lg cursor-grab active:cursor-grabbing ${className}`}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {children}

            {/* Success Feedback Overlay */}
            <AnimatePresence>
              {swipeActionTriggered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.3 }}
                    className={`w-20 h-20 rounded-full flex items-center justify-center text-white ${
                      swipeActionTriggered === 'left'
                        ? leftAction.color
                        : swipeActionTriggered === 'right'
                        ? rightAction.color
                        : swipeActionTriggered === 'up'
                        ? upAction.color
                        : downAction.color
                    }`}
                  >
                    {swipeActionTriggered === 'left'
                      ? leftAction.icon
                      : swipeActionTriggered === 'right'
                      ? rightAction.icon
                      : swipeActionTriggered === 'up'
                      ? upAction.icon
                      : downAction.icon}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SwipeableCard;