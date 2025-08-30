/**
 * 성능 모니터링 유틸리티
 * 번들 크기, 로딩 시간, 메모리 사용량 등을 모니터링합니다.
 */
import React from 'react'

interface PerformanceMetrics {
  bundleSize?: number
  loadTime?: number
  memoryUsage?: number
  renderTime?: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {}
  private observers: PerformanceObserver[] = []

  constructor() {
    this.initializeObservers()
  }

  /**
   * 성능 관찰자 초기화
   */
  private initializeObservers() {
    if (typeof window === 'undefined') return

    // Navigation Timing API를 사용한 로딩 시간 측정
    if ('performance' in window && 'getEntriesByType' in performance) {
      this.measureLoadTime()
    }

    // Memory API를 사용한 메모리 사용량 측정
    if ('memory' in performance) {
      this.measureMemoryUsage()
    }

    // Long Task API를 사용한 렌더링 성능 측정
    if ('PerformanceObserver' in window) {
      this.observeLongTasks()
    }
  }

  /**
   * 페이지 로딩 시간 측정
   */
  private measureLoadTime() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        this.metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart
        this.logMetric('Load Time', this.metrics.loadTime, 'ms')
      }
    })
  }

  /**
   * 메모리 사용량 측정
   */
  private measureMemoryUsage() {
    const memory = (performance as any).memory
    if (memory) {
      this.metrics.memoryUsage = memory.usedJSHeapSize
      this.logMetric('Memory Usage', Math.round(memory.usedJSHeapSize / 1024 / 1024), 'MB')
    }
  }

  /**
   * 긴 작업 관찰 (50ms 이상)
   */
  private observeLongTasks() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.duration > 50) {
            console.warn(`Long task detected: ${entry.duration}ms`, entry)
          }
        })
      })
      
      observer.observe({ entryTypes: ['longtask'] })
      this.observers.push(observer)
    } catch (error) {
      // Long Task API가 지원되지 않는 경우 무시
    }
  }

  /**
   * 컴포넌트 렌더링 시간 측정
   */
  measureRenderTime(componentName: string, startTime: number) {
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    if (renderTime > 16) { // 60fps 기준 16ms 초과 시 경고
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`)
    }
    
    return renderTime
  }

  /**
   * 번들 크기 추정 (네트워크 요청 기반)
   */
  estimateBundleSize() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      let totalSize = 0
      
      resources.forEach((resource) => {
        if (resource.name.includes('.js') || resource.name.includes('.css')) {
          totalSize += resource.transferSize || 0
        }
      })
      
      this.metrics.bundleSize = totalSize
      this.logMetric('Estimated Bundle Size', Math.round(totalSize / 1024), 'KB')
    }
  }

  /**
   * 메트릭 로깅
   */
  private logMetric(name: string, value: number, unit: string) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${name}: ${value}${unit}`)
    }
  }

  /**
   * 모든 메트릭 반환
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * 관찰자 정리
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// 싱글톤 인스턴스
export const performanceMonitor = new PerformanceMonitor()

/**
 * React 컴포넌트 성능 측정을 위한 HOC
 */
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) => {
  return (props: P) => {
    const startTime = performance.now()
    
    React.useEffect(() => {
      performanceMonitor.measureRenderTime(componentName, startTime)
    })
    
    return React.createElement(WrappedComponent, props)
  }
}

/**
 * 성능 측정을 위한 React Hook
 */
export const usePerformanceMonitoring = (componentName: string) => {
  const startTimeRef = React.useRef<number>()
  
  React.useEffect(() => {
    startTimeRef.current = performance.now()
    
    return () => {
      if (startTimeRef.current) {
        performanceMonitor.measureRenderTime(componentName, startTimeRef.current)
      }
    }
  }, [componentName])
  
  return {
    measureRenderTime: (taskName: string) => {
      const startTime = performance.now()
      return () => {
        const endTime = performance.now()
        console.log(`${componentName} - ${taskName}: ${(endTime - startTime).toFixed(2)}ms`)
      }
    }
  }
}