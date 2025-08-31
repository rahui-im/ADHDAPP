import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cardVariants } from '../../utils/animations'

interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  delay?: number
  disableHover?: boolean
  className?: string
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  delay = 0,
  disableHover = false,
  className = '',
  ...motionProps
}) => {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={!disableHover ? "hover" : undefined}
      whileTap={!disableHover ? "tap" : undefined}
      transition={{ delay }}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md ${className}`}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}

export default AnimatedCard