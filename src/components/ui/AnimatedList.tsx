import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { listVariants, listItemVariants } from '../../utils/animations'

interface AnimatedListProps {
  children: React.ReactNode[]
  className?: string
  staggerDelay?: number
}

const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  className = '',
  staggerDelay = 0.05
}) => {
  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="visible"
      className={className}
      custom={staggerDelay}
    >
      <AnimatePresence mode="popLayout">
        {React.Children.map(children, (child, index) => (
          <motion.div
            key={index}
            variants={listItemVariants}
            layout
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

export default AnimatedList