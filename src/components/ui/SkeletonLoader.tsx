import React from 'react'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

interface SkeletonLoaderProps {
  count?: number
  height?: number | string
  width?: number | string
  circle?: boolean
  className?: string
  variant?: 'text' | 'card' | 'list' | 'dashboard'
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  count = 1,
  height,
  width,
  circle = false,
  className = '',
  variant = 'text'
}) => {
  const isDark = document.documentElement.classList.contains('dark')
  
  const baseColor = isDark ? '#374151' : '#e5e7eb'
  const highlightColor = isDark ? '#4b5563' : '#f3f4f6'

  const renderVariant = () => {
    switch (variant) {
      case 'card':
        return (
          <div className={`rounded-lg p-4 ${className}`}>
            <Skeleton height={120} className="mb-4" />
            <Skeleton count={2} className="mb-2" />
            <div className="flex gap-2 mt-4">
              <Skeleton width={80} height={32} />
              <Skeleton width={80} height={32} />
            </div>
          </div>
        )
      
      case 'list':
        return (
          <div className={`space-y-4 ${className}`}>
            {Array.from({ length: count }).map((_, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-lg">
                <Skeleton circle width={40} height={40} />
                <div className="flex-1">
                  <Skeleton width="60%" className="mb-2" />
                  <Skeleton width="40%" />
                </div>
                <Skeleton width={60} height={24} />
              </div>
            ))}
          </div>
        )
      
      case 'dashboard':
        return (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="p-4 rounded-lg">
                <Skeleton height={60} className="mb-2" />
                <Skeleton width="40%" />
              </div>
            ))}
          </div>
        )
      
      default:
        return (
          <Skeleton
            count={count}
            height={height}
            width={width}
            circle={circle}
            className={className}
          />
        )
    }
  }

  return (
    <SkeletonTheme baseColor={baseColor} highlightColor={highlightColor}>
      {renderVariant()}
    </SkeletonTheme>
  )
}

export default SkeletonLoader