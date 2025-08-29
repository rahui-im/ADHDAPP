import React from 'react'
import { motion } from 'framer-motion'
import { useAppSelector } from '../../store/store'
import { 
  selectTodayTasks, 
  selectTodayPomodoros,
  selectCurrentStreak 
} from '../../store/selectors'
import { Task } from '../../types'
import Card from '../ui/Card'
import TaskList from './TaskList'
import ProgressBar from '../ui/ProgressBar'

interface TodayTasksProps {
  onTaskEdit?: (task: Task) => void
  onTaskStart?: (task: Task) => void
}

const TodayTasks: React.FC<TodayTasksProps> = ({
  onTaskEdit,
  onTaskStart,
}) => {
  const todayTasks = useAppSelector(selectTodayTasks)
  const todayPomodoros = useAppSelector(selectTodayPomodoros)
  const currentStreak = useAppSelector(selectCurrentStreak)

  // 오늘의 통계 계산
  const completedTasks = todayTasks.filter(task => task.status === 'completed')
  const inProgressTasks = todayTasks.filter(task => task.status === 'in-progress')
  const pendingTasks = todayTasks.filter(task => task.status === 'pending')
  
  const completionRate = todayTasks.length > 0 
    ? Math.round((completedTasks.length / todayTasks.length) * 100)
    : 0

  const totalEstimatedTime = todayTasks.reduce((sum, task) => sum + task.estimatedDuration, 0)
  const completedTime = completedTasks.reduce((sum, task) => sum + task.estimatedDuration, 0)

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}분`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`
  }

  const getMotivationalMessage = (): string => {
    if (completedTasks.length === 0) {
      return "오늘도 화이팅! 첫 번째 작업부터 시작해보세요 💪"
    } else if (completionRate >= 80) {
      return "정말 잘하고 있어요! 거의 다 왔습니다 🎉"
    } else if (completionRate >= 50) {
      return "좋은 페이스네요! 계속 이 조자로 가세요 👍"
    } else if (completionRate >= 25) {
      return "좋은 시작이에요! 조금씩 꾸준히 해나가세요 🌱"
    } else {
      return "괜찮아요, 천천히 시작해봐요. 작은 것부터! ✨"
    }
  }

  return (
    <div className="space-y-6">
      {/* 오늘의 요약 */}
      <Card className="bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              오늘의 작업 현황
            </h2>
            <div className="text-sm text-gray-600">
              {new Date().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </div>
          </div>

          {/* 통계 카드들 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-100"
            >
              <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
              <div className="text-sm text-gray-600">완료</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-100"
            >
              <div className="text-2xl font-bold text-blue-600">{inProgressTasks.length}</div>
              <div className="text-sm text-gray-600">진행중</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-100"
            >
              <div className="text-2xl font-bold text-gray-600">{pendingTasks.length}</div>
              <div className="text-sm text-gray-600">대기중</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-100"
            >
              <div className="text-2xl font-bold text-orange-600">{todayPomodoros}</div>
              <div className="text-sm text-gray-600">포모도로</div>
            </motion.div>
          </div>

          {/* 진행률 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">오늘의 완료율</span>
              <span className="text-sm font-bold text-gray-900">{completionRate}%</span>
            </div>
            <ProgressBar 
              progress={completionRate} 
              className="h-3"
              color={completionRate >= 80 ? 'green' : completionRate >= 50 ? 'primary' : 'orange'}
            />
          </div>

          {/* 시간 정보 */}
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">
              완료 시간: <span className="font-medium text-gray-900">{formatTime(completedTime)}</span>
            </div>
            <div className="text-gray-600">
              총 예상 시간: <span className="font-medium text-gray-900">{formatTime(totalEstimatedTime)}</span>
            </div>
          </div>

          {/* 연속 달성 */}
          {currentStreak > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-600">🔥</span>
                <span className="text-sm font-medium text-yellow-800">
                  {currentStreak}일 연속 달성 중!
                </span>
              </div>
            </div>
          )}

          {/* 격려 메시지 */}
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-sm text-gray-700 text-center">
              {getMotivationalMessage()}
            </p>
          </div>
        </div>
      </Card>

      {/* 작업 목록 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            오늘의 작업 목록 ({todayTasks.length}개)
          </h3>
          {todayTasks.length > 0 && (
            <div className="text-sm text-gray-500">
              우선순위 순으로 정렬됨
            </div>
          )}
        </div>

        <TaskList
          showTodayOnly={true}
          showCompleted={false}
          onTaskEdit={onTaskEdit}
          onTaskStart={onTaskStart}
        />
      </div>

      {/* 완료된 작업들 (접을 수 있음) */}
      {completedTasks.length > 0 && (
        <div>
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
                <h3 className="text-lg font-semibold text-green-800">
                  완료된 작업 ({completedTasks.length}개) 🎉
                </h3>
                <span className="text-green-600 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </div>
            </summary>
            
            <div className="mt-4">
              <TaskList
                showTodayOnly={true}
                showCompleted={true}
                onTaskEdit={onTaskEdit}
              />
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

export default TodayTasks