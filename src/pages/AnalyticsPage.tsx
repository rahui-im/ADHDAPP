import React from 'react'
import { AnalyticsOverview } from '../components/analytics/AnalyticsOverview'
import { useAnalytics } from '../hooks/useAnalytics'
import { useReports } from '../hooks/useReports'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { 
  ChartBarIcon, 
  DocumentArrowDownIcon,
  CalendarIcon,
  TrophyIcon 
} from '@heroicons/react/24/outline'

/**
 * 분석 페이지
 * 사용자의 생산성 데이터와 인사이트를 제공합니다.
 */
const AnalyticsPage: React.FC = () => {
  const { analytics, isLoading } = useAnalytics()
  const { generateWeeklyReport, isGenerating } = useReports()
  const [timeRange, setTimeRange] = React.useState<'week' | 'month' | 'quarter'>('week')

  const handleExportReport = async () => {
    try {
      await generateWeeklyReport()
    } catch (error) {
      console.error('리포트 생성 실패:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">분석 데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">생산성 분석</h1>
            <p className="text-gray-600">
              당신의 작업 패턴과 성과를 분석하여 더 나은 시간 관리를 도와드립니다.
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            {/* 기간 선택 */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'quarter')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="week">최근 1주일</option>
              <option value="month">최근 1개월</option>
              <option value="quarter">최근 3개월</option>
            </select>
            
            {/* 리포트 내보내기 */}
            <Button
              onClick={handleExportReport}
              disabled={isGenerating}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span>{isGenerating ? '생성 중...' : '리포트 내보내기'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">완료된 작업</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.totalCompletedTasks ? `${analytics.totalCompletedTasks}개` : '0개'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 집중 시간</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.totalFocusTime ? `${Math.round(analytics.totalFocusTime)}분` : '0분'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrophyIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">현재 연속 기록</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.currentStreak || 0}일
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">생산적인 시간</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.totalFocusTime ? `${Math.round(analytics.totalFocusTime / 60)}시간` : '0시간'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 상세 분석 */}
      <AnalyticsOverview />

      {/* 개선 제안 - 추후 구현 예정 */}
    </div>
  )
}

export default AnalyticsPage