/**
 * 트리 쉐이킹 최적화를 위한 유틸리티
 * 불필요한 코드 제거 및 번들 크기 최적화
 */

/**
 * 조건부 import를 위한 동적 로더
 */
export const conditionalImport = async <T>(
  condition: boolean,
  importFn: () => Promise<T>
): Promise<T | null> => {
  if (condition) {
    return await importFn()
  }
  return null
}

/**
 * 개발 환경에서만 로드되는 유틸리티
 */
export const loadDevTools = async () => {
  if (process.env.NODE_ENV === 'development') {
    // 개발 도구는 개발 환경에서만 로드
    const { performanceMonitor } = await import('./performanceMonitor')
    return performanceMonitor
  }
  return null
}

/**
 * 기능별 청크 분할을 위한 동적 import 헬퍼
 */
export const loadFeature = {
  analytics: () => import('../components/analytics/AnalyticsOverview'),
  timer: () => import('../components/timer/PomodoroTimer'),
  tasks: () => import('../components/tasks/TaskManager'),
  dashboard: () => import('../components/dashboard/Dashboard'),
  settings: () => import('../components/settings/NotificationSettings'),
}

/**
 * 라이브러리별 최적화된 import
 */
export const optimizedImports = {
  // Heroicons - 필요한 아이콘만 import
  icons: {
    play: () => import('@heroicons/react/24/solid/PlayIcon'),
    pause: () => import('@heroicons/react/24/solid/PauseIcon'),
    stop: () => import('@heroicons/react/24/solid/StopIcon'),
    settings: () => import('@heroicons/react/24/outline/Cog6ToothIcon'),
    chart: () => import('@heroicons/react/24/outline/ChartBarIcon'),
    task: () => import('@heroicons/react/24/outline/CheckCircleIcon'),
  },
  
  // Framer Motion - 필요한 컴포넌트만 import
  motion: {
    div: () => import('framer-motion').then(mod => ({ motion: mod.motion })),
    AnimatePresence: () => import('framer-motion').then(mod => ({ AnimatePresence: mod.AnimatePresence })),
  }
}

/**
 * 사용하지 않는 코드 감지 및 경고
 */
export const detectUnusedCode = () => {
  if (process.env.NODE_ENV === 'development') {
    // 개발 환경에서 사용하지 않는 export 감지
    console.log('🔍 Checking for unused exports...')
    
    // 실제 구현은 빌드 도구나 ESLint 플러그인을 통해 수행
    // 여기서는 개념적 구현만 제공
  }
}

/**
 * 번들 크기 최적화를 위한 설정
 */
export const bundleOptimizationConfig = {
  // 외부 라이브러리 CDN 사용 여부
  useExternalCDN: process.env.NODE_ENV === 'production',
  
  // 압축 레벨
  compressionLevel: process.env.NODE_ENV === 'production' ? 'high' : 'low',
  
  // 소스맵 생성 여부
  generateSourceMaps: process.env.NODE_ENV === 'development',
  
  // 청크 분할 임계값 (KB)
  chunkSizeThreshold: 500,
}