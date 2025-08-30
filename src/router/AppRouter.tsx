import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Loading from '../components/ui/Loading'

// Lazy load pages for better performance
const DashboardPage = React.lazy(() => import('../pages/DashboardPage'))
const TasksPage = React.lazy(() => import('../pages/TasksPage'))
const TimerPage = React.lazy(() => import('../pages/TimerPage'))
const AnalyticsPage = React.lazy(() => import('../pages/AnalyticsPage'))
const SettingsPage = React.lazy(() => import('../pages/SettingsPage'))

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loading />
  </div>
)

const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="tasks/:taskId" element={<TasksPage />} />
          <Route path="timer" element={<TimerPage />} />
          <Route path="timer/:taskId" element={<TimerPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default AppRouter