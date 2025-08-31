import { motion } from 'framer-motion';
import { ReactNode, useState } from 'react';

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