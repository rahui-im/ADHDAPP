import React from 'react'
import { useAppSelector, useAppDispatch } from '../../store/store'
import { createTask } from '../../store/taskSlice'
import { toggleFocusMode } from '../../store/userSlice'
import {
  selectTodayTasks,
  selectTodayPomodoros,
  selectCurrentStreak,
  selectEnergyLevel,
  selectCurrentTask,
  selectTimerState,
  selectCompletedTasks,
} from '../../store/selectors'
import Card from '../ui/Card'
import ProgressBar from '../ui/ProgressBar'
import Button from '../ui/Button'
import TodayTasksSummary from './TodayTasksSummary'
import PomodoroCounter from './PomodoroCounter'
import StreakDisplay from './StreakDisplay'
import EnergyLevelTracker from './EnergyLevelTracker'
import CurrentTaskDisplay from './CurrentTaskDisplay'
import TaskRecommendations from './TaskRecommendations'
import AchievementBadges from './AchievementBadges'
import AchievementFeedback from './AchievementFeedback'
import { useAchievements } from '../../hooks/useAchievements'
import { motion } from 'framer-motion'

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch()
  const todayTasks = useAppSelector(selectTodayTasks)
  const completedPomodoros = useAppSelector(selectTodayPomodoros)
  const currentStreak = useAppSelector(selectCurrentStreak)
  const energyLevel = useAppSelector(selectEnergyLevel)
  const currentTask = useAppSelector(selectCurrentTask)
  const timerState = useAppSelector(selectTimerState)
  const completedTasks = useAppSelector(selectCompletedTasks)

  // 성취 시스템 훅
  const {
    currentAchievement,
    recentAchievements,
    totalPoints,
    level,
    dismissAchievement
  } = useAchievements()

  // 오늘의 작업 완료율 계산
  const todayCompletedTasks = todayTasks.filter(task => task.status === 'completed')
  const completionRate = todayTasks.length > 0 
    ? Math.round((todayCompletedTasks.length / todayTasks.length) * 100)
    : 0

  // 오늘의 총 집중 시간 계산 (완료된 포모도로 * 평균 시간)
  const totalFocusTime = completedPomodoros * 25 // 25분 기본값

  // 실제 액션 핸들러들
  const handleCreateTask = async () => {
    try {
      await dispatch(createTask({
        title: '새로운 작업',
        description: '설명을 입력하세요',
        estimatedDuration: 25,
        priority: 'medium',
        category: '업무',
        isFlexible: true
      })).unwrap()
      alert('새 작업이 생성되었습니다!')
    } catch (error) {
      alert('작업 생성에 실패했습니다.')
    }
  }

  const handleToggleFocusMode = () => {
    dispatch(toggleFocusMode())
    alert('집중 모드가 토글되었습니다!')
  }

  const handleViewAnalytics = () => {
    // 분석 페이지로 이동하는 로직 (나중에 라우터 구현 시)
    alert('분석 페이지로 이동합니다!')
  }

  return (
    <div className="space-y-6 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-600 mt-1">
            오늘도 집중해서 목표를 달성해보세요! 🎯
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </div>
        </div>
      </div>

      {/* 현재 작업 및 타이머 상태 */}
      {currentTask && (
        <CurrentTaskDisplay 
          task={currentTask} 
          timerState={timerState}
        />
      )}

      {/* 주요 지표 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 오늘의 작업 요약 */}
        <TodayTasksSummary 
          totalTasks={todayTasks.length}
          completedTasks={todayCompletedTasks.length}
          completionRate={completionRate}
        />

        {/* 완료된 포모도로 수 */}
        <PomodoroCounter 
          completedPomodoros={completedPomodoros}
          totalFocusTime={totalFocusTime}
        />

        {/* 연속 달성 일수 */}
        <StreakDisplay 
          currentStreak={currentStreak}
        />

        {/* 에너지 레벨 추적 */}
        <EnergyLevelTracker 
          currentLevel={energyLevel}
        />
      </div>

      {/* 오늘의 진행 상황 */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          오늘의 진행 상황
        </h2>
        
        <div className="space-y-4">
          {/* 전체 완료율 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                전체 완료율
              </span>
              <span className="text-sm font-bold text-blue-600">
                {completionRate}%
              </span>
            </div>
            <ProgressBar 
              progress={completionRate} 
              className="h-3"
              color={completionRate >= 70 ? 'green' : completionRate >= 40 ? 'yellow' : 'red'}
            />
          </div>

          {/* 집중 시간 진행률 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                집중 시간 (목표: 2시간)
              </span>
              <span className="text-sm font-bold text-purple-600">
                {Math.floor(totalFocusTime / 60)}시간 {totalFocusTime % 60}분
              </span>
            </div>
            <ProgressBar 
              progress={Math.min((totalFocusTime / 120) * 100, 100)} 
              className="h-3"
              color="purple"
            />
          </div>
        </div>
      </Card>

      {/* 추가 정보 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 작업 추천 */}
        <TaskRecommendations />
        
        {/* 성취 및 레벨 */}
        <AchievementBadges 
          recentAchievements={recentAchievements}
          totalPoints={totalPoints}
          level={level}
        />
      </div>

      {/* 테스트 버튼 */}
      <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
        <h3 className="text-lg font-bold mb-2">🧪 버튼 테스트</h3>
        <div className="flex gap-2">
          <button 
            className="px-4 py-2 bg-red-500 text-white rounded"
            onClick={() => {
              console.log('일반 HTML 버튼 클릭됨!')
              alert('일반 HTML 버튼이 동작합니다!')
            }}
          >
            일반 HTML 버튼
          </button>
          
          <Button 
            variant="primary"
            onClick={() => {
              console.log('커스텀 Button 컴포넌트 클릭됨!')
              alert('커스텀 Button 컴포넌트가 동작합니다!')
            }}
          >
            커스텀 Button
          </Button>
        </div>
      </div>

      {/* 빠른 액션 버튼들 */}
      <div className="flex flex-wrap gap-4">
        <Button 
          variant="primary" 
          size="lg"
          className="flex-1 min-w-[200px]"
          onClick={handleCreateTask}
        >
          새 작업 추가
        </Button>
        <Button 
          variant="secondary" 
          size="lg"
          className="flex-1 min-w-[200px]"
          onClick={handleToggleFocusMode}
        >
          집중 모드 시작
        </Button>
        <Button 
          variant="outline" 
          size="lg"
          className="flex-1 min-w-[200px]"
          onClick={handleViewAnalytics}
        >
          분석 보기
        </Button>
      </div>

      {/* 성취 피드백 모달 */}
      <AchievementFeedback 
        achievement={currentAchievement}
        onDismiss={dismissAchievement}
      />
    </div>
  )
}

export { Dashboard }
export default Dashboard