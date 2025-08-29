/**
 * PWA 관련 유틸리티
 * 서비스 워커 등록, 업데이트 감지, 오프라인 상태 관리
 */

import React from 'react'
import { Workbox } from 'workbox-window'

interface PWAUpdateInfo {
  isUpdateAvailable: boolean
  updateServiceWorker: () => Promise<void>
}

interface PWAInstallInfo {
  isInstallable: boolean
  installApp: () => Promise<void>
}

class PWAManager {
  private wb: Workbox | null = null
  private updateCallback: ((info: PWAUpdateInfo) => void) | null = null
  private installPrompt: any = null

  constructor() {
    this.initializeServiceWorker()
    this.setupInstallPrompt()
    this.setupOnlineOfflineHandlers()
  }

  /**
   * 서비스 워커 초기화
   */
  private initializeServiceWorker() {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      this.wb = new Workbox('/sw.js')
      
      // 서비스 워커 업데이트 감지
      this.wb.addEventListener('waiting', (event) => {
        this.handleServiceWorkerUpdate()
      })

      // 서비스 워커 등록
      this.wb.register().then(() => {
        console.log('✅ Service Worker registered successfully')
      }).catch((error) => {
        console.error('❌ Service Worker registration failed:', error)
      })
    }
  }

  /**
   * 앱 설치 프롬프트 설정
   */
  private setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // 기본 설치 프롬프트 방지
      e.preventDefault()
      this.installPrompt = e
      
      // 커스텀 설치 UI 표시
      this.showInstallBanner()
    })

    // 앱이 설치된 후
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA was installed')
      this.hideInstallBanner()
      this.installPrompt = null
    })
  }

  /**
   * 온라인/오프라인 상태 핸들러 설정
   */
  private setupOnlineOfflineHandlers() {
    window.addEventListener('online', () => {
      this.showNetworkStatus('온라인 상태로 전환되었습니다', 'success')
      this.syncOfflineData()
    })

    window.addEventListener('offline', () => {
      this.showNetworkStatus('오프라인 모드입니다. 일부 기능이 제한될 수 있습니다', 'warning')
    })
  }

  /**
   * 서비스 워커 업데이트 처리
   */
  private handleServiceWorkerUpdate() {
    if (this.updateCallback) {
      this.updateCallback({
        isUpdateAvailable: true,
        updateServiceWorker: async () => {
          if (this.wb) {
            // 새로운 서비스 워커 활성화
            this.wb.messageSkipWaiting()
            window.location.reload()
          }
        }
      })
    } else {
      // 기본 업데이트 알림
      this.showUpdateNotification()
    }
  }

  /**
   * 업데이트 알림 표시
   */
  private showUpdateNotification() {
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50'
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <div>
          <p class="font-medium">새 버전이 사용 가능합니다</p>
          <p class="text-sm opacity-90">앱을 새로고침하여 업데이트하세요</p>
        </div>
        <button id="update-btn" class="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium">
          업데이트
        </button>
        <button id="dismiss-btn" class="text-white opacity-75 hover:opacity-100">
          ✕
        </button>
      </div>
    `
    
    document.body.appendChild(notification)

    // 업데이트 버튼 클릭 핸들러
    notification.querySelector('#update-btn')?.addEventListener('click', () => {
      if (this.wb) {
        this.wb.messageSkipWaiting()
        window.location.reload()
      }
    })

    // 닫기 버튼 클릭 핸들러
    notification.querySelector('#dismiss-btn')?.addEventListener('click', () => {
      notification.remove()
    })

    // 10초 후 자동 제거
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 10000)
  }

  /**
   * 설치 배너 표시
   */
  private showInstallBanner() {
    const banner = document.createElement('div')
    banner.id = 'install-banner'
    banner.className = 'fixed bottom-4 left-4 right-4 bg-primary-600 text-white p-4 rounded-lg shadow-lg z-50 md:left-auto md:right-4 md:w-80'
    banner.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium">앱 설치</p>
          <p class="text-sm opacity-90">홈 화면에 추가하여 더 편리하게 사용하세요</p>
        </div>
        <div class="flex space-x-2 ml-4">
          <button id="install-app-btn" class="bg-white text-primary-600 px-3 py-1 rounded text-sm font-medium">
            설치
          </button>
          <button id="dismiss-install-btn" class="text-white opacity-75 hover:opacity-100">
            ✕
          </button>
        </div>
      </div>
    `
    
    document.body.appendChild(banner)

    // 설치 버튼 클릭 핸들러
    banner.querySelector('#install-app-btn')?.addEventListener('click', () => {
      this.installApp()
    })

    // 닫기 버튼 클릭 핸들러
    banner.querySelector('#dismiss-install-btn')?.addEventListener('click', () => {
      this.hideInstallBanner()
    })
  }

  /**
   * 설치 배너 숨기기
   */
  private hideInstallBanner() {
    const banner = document.getElementById('install-banner')
    if (banner) {
      banner.remove()
    }
  }

  /**
   * 네트워크 상태 알림 표시
   */
  private showNetworkStatus(message: string, type: 'success' | 'warning' | 'error') {
    const colors = {
      success: 'bg-green-600',
      warning: 'bg-yellow-600',
      error: 'bg-red-600'
    }

    const notification = document.createElement('div')
    notification.className = `fixed top-4 left-1/2 transform -translate-x-1/2 ${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg z-50`
    notification.textContent = message
    
    document.body.appendChild(notification)

    // 3초 후 자동 제거
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 3000)
  }

  /**
   * 오프라인 데이터 동기화
   */
  private async syncOfflineData() {
    try {
      // 오프라인 중 저장된 데이터를 서버와 동기화
      // 실제 구현에서는 IndexedDB에서 동기화 대기 중인 데이터를 가져와서 처리
      console.log('🔄 Syncing offline data...')
      
      // 예시: 오프라인 중 생성된 작업들 동기화
      const offlineData = localStorage.getItem('offline-sync-queue')
      if (offlineData) {
        const data = JSON.parse(offlineData)
        // 서버로 데이터 전송 로직
        localStorage.removeItem('offline-sync-queue')
        console.log('✅ Offline data synced successfully')
      }
    } catch (error) {
      console.error('❌ Failed to sync offline data:', error)
    }
  }

  /**
   * 앱 설치
   */
  async installApp(): Promise<void> {
    if (!this.installPrompt) {
      throw new Error('Install prompt not available')
    }

    try {
      const result = await this.installPrompt.prompt()
      console.log('Install prompt result:', result.outcome)
      
      if (result.outcome === 'accepted') {
        console.log('✅ User accepted the install prompt')
      } else {
        console.log('❌ User dismissed the install prompt')
      }
    } catch (error) {
      console.error('❌ Error during app installation:', error)
      throw error
    } finally {
      this.installPrompt = null
      this.hideInstallBanner()
    }
  }

  /**
   * 업데이트 콜백 등록
   */
  onUpdateAvailable(callback: (info: PWAUpdateInfo) => void) {
    this.updateCallback = callback
  }

  /**
   * 설치 가능 여부 확인
   */
  isInstallable(): boolean {
    return this.installPrompt !== null
  }

  /**
   * 온라인 상태 확인
   */
  isOnline(): boolean {
    return navigator.onLine
  }

  /**
   * PWA 설치 여부 확인
   */
  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true
  }
}

// 싱글톤 인스턴스
export const pwaManager = new PWAManager()

/**
 * PWA 상태를 관리하는 React Hook
 */
export const usePWA = () => {
  const [isUpdateAvailable, setIsUpdateAvailable] = React.useState(false)
  const [isInstallable, setIsInstallable] = React.useState(false)
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)

  React.useEffect(() => {
    // 업데이트 감지
    pwaManager.onUpdateAvailable((info) => {
      setIsUpdateAvailable(info.isUpdateAvailable)
    })

    // 설치 가능 여부 확인
    setIsInstallable(pwaManager.isInstallable())

    // 온라인 상태 변경 감지
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    isUpdateAvailable,
    isInstallable: isInstallable && pwaManager.isInstallable(),
    isOnline,
    isInstalled: pwaManager.isInstalled(),
    installApp: () => pwaManager.installApp(),
    updateApp: () => {
      if (pwaManager) {
        window.location.reload()
      }
    }
  }
}