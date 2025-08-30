import React from 'react'
import { motion } from 'framer-motion'
import Button from '../ui/Button'

interface LayoutProps {
  children: React.ReactNode
  currentPage: string
  onNavigate: (page: string) => void
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const navigationItems = [
    { id: 'dashboard', label: '대시보드', icon: '🏠' },
    { id: 'tasks', label: '작업', icon: '📝' },
    { id: 'timer', label: '타이머', icon: '⏰' },
    { id: 'analytics', label: '분석', icon: '📊' },
    { id: 'settings', label: '설정', icon: '⚙️' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 사이드바 */}
      <nav className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-8">
            ADHD Time Manager
          </h1>
          
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.id}>
                <Button
                  variant={currentPage === item.id ? 'primary' : 'secondary'}
                  className="w-full justify-start"
                  onClick={() => onNavigate(item.id)}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.label}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-auto">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}

export default Layout