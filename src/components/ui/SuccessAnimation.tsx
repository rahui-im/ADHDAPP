import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import Lottie from 'lottie-react';
import successAnimation from '../../assets/animations/success.json';
import { CheckCircleIcon } from '../ui/Icons';

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