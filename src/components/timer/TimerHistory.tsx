import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Card } from '../ui/Card'
import { 
  ClockIcon, 
  CalendarIcon, 
  FireIcon,
  ChartBarIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline'

interface TimerSession {
  id: string
  startTime: string
  endTime: string
  duration: number // minutes
  type: 'focus' | 'break'
  completed: boolean
  taskName?: string
  interruptions?: number
}

// 더미 데이터 (실제로는 Redux에서 가져옴)
const DUMMY_SESSIONS: TimerSession[] = [
  {
    id: '1',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
    duration: 25,
    type: 'focus',
    completed: true,
    taskName: 'React 컴포넌트 개발'
  },
  {
    id: '2',
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    duration: 30,
    type: 'focus',
    completed: true,
    taskName: '문서 작성'
  },
  {
    id: '3',
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 23.5 * 60 * 60 * 1000).toISOString(),
    duration: 30,
    type: 'focus',
    completed: false,
    taskName: '코드 리뷰',
    interruptions: 2
  }
]

export const TimerHistory: React.FC = () => {
  const [sessions] = useState<TimerSession[]>(DUMMY_SESSIONS)
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'stats'>('list')

  const stats = useMemo(() => {
    const totalFocusTime = sessions
      .filter(s => s.type === 'focus' && s.completed)
      .reduce((acc, s) => acc + s.duration, 0)
    
    const totalSessions = sessions.length
    const completedSessions = sessions.filter(s => s.completed).length
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0
    
    const today = new Date()
    const todaySessions = sessions.filter(s => {
      const sessionDate = new Date(s.startTime)
      return sessionDate.toDateString() === today.toDateString()
    })
    
    const todayFocusTime = todaySessions
      .filter(s => s.type === 'focus' && s.completed)
      .reduce((acc, s) => acc + s.duration, 0)

    return {
      totalFocusTime,
      totalSessions,
      completedSessions,
      completionRate,
      todayFocusTime,
      todaySessions: todaySessions.length
    }
  }, [sessions])

  const renderListView = () => (
    <div className="space-y-3">
      {sessions.map((session, index) => (
        <motion.div
          key={session.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  session.completed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'
                }`}>
                  {session.completed ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <ClockIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {session.taskName || '이름 없는 세션'}
                  </h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                    <span>{session.duration}분</span>
                    <span>{format(parseISO(session.startTime), 'HH:mm', { locale: ko })}</span>
                    <span>{session.type === 'focus' ? '집중' : '휴식'}</span>
                    {session.interruptions && session.interruptions > 0 && (
                      <span className="text-red-500">중단 {session.interruptions}회</span>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {format(parseISO(session.startTime), 'MM/dd', { locale: ko })}
              </span>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )

  const renderCalendarView = () => {
    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => {
          const daySessions = sessions.filter(s => {
            const sessionDate = new Date(s.startTime)
            return sessionDate.toDateString() === day.toDateString()
          })
          const dayFocusTime = daySessions
            .filter(s => s.type === 'focus' && s.completed)
            .reduce((acc, s) => acc + s.duration, 0)

          return (
            <motion.div
              key={day.toISOString()}
              whileHover={{ scale: 1.05 }}
              className="text-center"
            >
              <Card className={`p-3 ${
                day.toDateString() === today.toDateString() 
                  ? 'ring-2 ring-primary-500' 
                  : ''
              }`}>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {format(day, 'EEE', { locale: ko })}
                </div>
                <div className="text-lg font-semibold">
                  {format(day, 'd')}
                </div>
                {dayFocusTime > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                      {dayFocusTime}분
                    </div>
                    <div className="text-xs text-gray-500">
                      {daySessions.length}세션
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )
        })}
      </div>
    )
  }

  const renderStatsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <ClockIcon className="w-8 h-8 text-primary-500" />
            <span className="text-2xl font-bold">{stats.totalFocusTime}분</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">총 집중 시간</p>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <FireIcon className="w-8 h-8 text-orange-500" />
            <span className="text-2xl font-bold">{stats.completionRate.toFixed(0)}%</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">완료율</p>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <CalendarIcon className="w-8 h-8 text-green-500" />
            <span className="text-2xl font-bold">{stats.todayFocusTime}분</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">오늘 집중 시간</p>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <ChartBarIcon className="w-8 h-8 text-purple-500" />
            <span className="text-2xl font-bold">{stats.totalSessions}</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">총 세션 수</p>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <CheckCircleIcon className="w-8 h-8 text-blue-500" />
            <span className="text-2xl font-bold">{stats.completedSessions}</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">완료된 세션</p>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <CalendarIcon className="w-8 h-8 text-indigo-500" />
            <span className="text-2xl font-bold">{stats.todaySessions}</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">오늘 세션 수</p>
        </Card>
      </motion.div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">타이머 기록</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              viewMode === 'list' 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            목록
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              viewMode === 'calendar' 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            캘린더
          </button>
          <button
            onClick={() => setViewMode('stats')}
            className={`px-3 py-1 rounded-lg transition-colors ${
              viewMode === 'stats' 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            통계
          </button>
        </div>
      </div>

      {viewMode === 'list' && renderListView()}
      {viewMode === 'calendar' && renderCalendarView()}
      {viewMode === 'stats' && renderStatsView()}
    </div>
  )
}

export default TimerHistory