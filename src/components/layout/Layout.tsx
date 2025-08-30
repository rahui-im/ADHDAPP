import React from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const Layout: React.FC = () => {
  const location = useLocation()
  
  const navigationItems = [
    { path: '/dashboard', label: '대시보드', icon: '🏠' },
    { path: '/tasks', label: '작업', icon: '📝' },
    { path: '/timer', label: '타이머', icon: '⏰' },
    { path: '/analytics', label: '분석', icon: '📊' },
    { path: '/settings', label: '설정', icon: '⚙️' }
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
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center w-full px-4 py-2 rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-auto">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  )
}

export default Layout