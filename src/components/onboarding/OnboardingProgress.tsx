import React from 'react'
import { motion } from 'framer-motion'

interface OnboardingProgressProps {
  currentStep: number
  totalSteps: number
  steps: {
    id: string
    title: string
  }[]
}

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  currentStep,
  totalSteps,
  steps,
}) => {
  const progress = ((currentStep + 1) / totalSteps) * 100

  return (
    <div className="mb-6">
      {/* Progress bar */}
      <div className="relative">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>
        
        {/* Step indicators */}
        <div className="absolute top-0 left-0 w-full h-2 flex justify-between">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="relative"
              style={{ left: `${(index / (totalSteps - 1)) * 100}%` }}
            >
              <motion.div
                className={`absolute -top-1.5 w-5 h-5 rounded-full border-2 ${
                  index <= currentStep
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-white'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: index === currentStep ? 1.2 : 1 }}
                transition={{ duration: 0.3 }}
                style={{ transform: 'translateX(-50%)' }}
              >
                {index < currentStep && (
                  <svg
                    className="w-3 h-3 text-white absolute top-0.5 left-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      {/* Step counter and current step title */}
      <div className="mt-4 flex justify-between items-center">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-sm font-medium text-gray-600 dark:text-gray-300"
        >
          단계 {currentStep + 1} / {totalSteps}
        </motion.div>
        
        <motion.div
          key={steps[currentStep].title}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-sm font-medium text-gray-900 dark:text-white"
        >
          {steps[currentStep].title}
        </motion.div>
      </div>

      {/* Mobile-friendly step dots */}
      <div className="mt-4 flex justify-center space-x-2 md:hidden">
        {steps.map((_, index) => (
          <motion.div
            key={index}
            className={`w-2 h-2 rounded-full ${
              index === currentStep
                ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                : index < currentStep
                ? 'bg-blue-300 dark:bg-blue-700'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
            initial={{ scale: 0 }}
            animate={{ scale: index === currentStep ? 1.5 : 1 }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  )
}

export default OnboardingProgress