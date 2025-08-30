import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './store/store'
import App from './App'
import './index.css'
import './i18n' // i18n 초기화

// PWA 서비스 워커 등록
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('❌ SW registration failed: ', registrationError)
      })
  })
}

// Loading component while rehydrating
const LoadingView = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-600">데이터를 불러오는 중...</p>
    </div>
  </div>
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={<LoadingView />} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </React.StrictMode>,
)