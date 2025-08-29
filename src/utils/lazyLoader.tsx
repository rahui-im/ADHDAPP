import React, { Suspense, ComponentType } from 'react'
import { Loading } from '../components/ui/Loading'

/**
 * 지연 로딩을 위한 HOC
 * 컴포넌트를 동적으로 import하고 로딩 상태를 처리합니다.
 */
export const withLazyLoading = <P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = React.lazy(importFunc)
  
  return (props: P) => (
    <Suspense fallback={fallback || <Loading />}>
      <LazyComponent {...props} />
    </Suspense>
  )
}

/**
 * 페이지별 지연 로딩 컴포넌트들
 */
export const LazyDashboardPage = withLazyLoading(
  () => import('../pages/DashboardPage'),
  <div className="flex items-center justify-center min-h-[400px]">
    <Loading message="대시보드를 불러오는 중..." />
  </div>
)

export const LazyTasksPage = withLazyLoading(
  () => import('../pages/TasksPage'),
  <div className="flex items-center justify-center min-h-[400px]">
    <Loading message="작업 관리를 불러오는 중..." />
  </div>
)

export const LazyTimerPage = withLazyLoading(
  () => import('../pages/TimerPage'),
  <div className="flex items-center justify-center min-h-[400px]">
    <Loading message="타이머를 불러오는 중..." />
  </div>
)

export const LazyAnalyticsPage = withLazyLoading(
  () => import('../pages/AnalyticsPage'),
  <div className="flex items-center justify-center min-h-[400px]">
    <Loading message="분석 데이터를 불러오는 중..." />
  </div>
)

export const LazySettingsPage = withLazyLoading(
  () => import('../pages/SettingsPage'),
  <div className="flex items-center justify-center min-h-[400px]">
    <Loading message="설정을 불러오는 중..." />
  </div>
)