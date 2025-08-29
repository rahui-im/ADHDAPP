import React, { useEffect, useState } from 'react'
import { useAnalytics } from '../../hooks/useAnalytics'
import { usePatternAnalysis } from '../../hooks/usePatternAnalysis'
import { useReports } from '../../hooks/useReports'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Loading } from '../ui/Loading'

interface AnalyticsOverviewProps {
  className?: string
}

export const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ className = '' }) => {
  const { analytics, serviceStatus, isLoading, error } = useAnalytics()
  const { insights, isAnalyzing, runComprehensiveAnalysis } = usePatternAnalysis()
  const { weeklyReport, getCurrentWeekReport, isGenerating } = useReports()
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'reports'>('overview')

  useEffect(() => {
    // 컴포넌트 마운트 시 현재 주 리포트 가져오기
    getCurrentWeekReport()
  }, [getCurrentWeekReport])

  const handleRefreshAnalysis = async () => {
    await runComprehensiveAnalysis(true)
  }

  const handleGenerateReport = async () => {
    await getCurrentWeekReport()
  }

  if (isLoading || isAnalyzing || isGenerating) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loading />
        <span className="ml-2 text-gray-600">
          {isLoading && '데이터를 불러오는 중...'}
          {isAnalyzing && '패턴을 분석하는 중...'}
          {isGenerating && '리포트를 생성하는 중...'}
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">분석 오류</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefreshAnalysis} variant="primary">
            다시 시도
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 탭 네비게이션 */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          개요
        </button>
        <button
          onClick={() => setActiveTab('patterns')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'patterns'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          패턴 분석
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'reports'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          리포트
        </button>
      </div>

      {/* 개요 탭 */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 세션</p>
                <p className="text-2xl font-bold text-gray-900">{serviceStatus.sessionCount}</p>
              </div>
              <div className="text-blue-500">📊</div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">일일 통계</p>
                <p className="text-2xl font-bold text-gray-900">{serviceStatus.statsCount}</p>
              </div>
              <div className="text-green-500">📈</div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">현재 연속</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.currentStreak}일</p>
              </div>
              <div className="text-orange-500">🔥</div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 집중 시간</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(analytics.totalFocusTime / 60)}h
                </p>
              </div>
              <div className="text-purple-500">⏰</div>
            </div>
          </Card>
        </div>
      )}

      {/* 패턴 분석 탭 */}
      {activeTab === 'patterns' && insights && (
        <div className="space-y-6">
          {/* 생산성 패턴 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">생산성 패턴</h3>
              <div className="text-2xl">📊</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">생산성 점수</p>
                <p className="text-xl font-bold text-blue-600">
                  {insights.productivity.productivityScore}점
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">최적 시간대</p>
                <p className="text-xl font-bold text-green-600">
                  {insights.productivity.peakProductivityHour}시
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">생산적인 시간</p>
                <p className="text-sm text-gray-900">
                  {insights.productivity.mostProductiveHours.join('시, ')}시
                </p>
              </div>
            </div>
          </Card>

          {/* 집중력 패턴 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">집중력 패턴</h3>
              <div className="text-2xl">🧠</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">평균 집중 시간</p>
                <p className="text-xl font-bold text-blue-600">
                  {insights.focus.averageFocusTime}분
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">최적 집중 시간</p>
                <p className="text-xl font-bold text-green-600">
                  {insights.focus.optimalFocusDuration}분
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">일관성</p>
                <p className="text-xl font-bold text-purple-600">
                  {insights.focus.focusConsistency}%
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">트렌드</p>
              <div className="flex items-center mt-1">
                <span className={`text-sm font-medium ${
                  insights.focus.focusTrend === 'improving' ? 'text-green-600' :
                  insights.focus.focusTrend === 'declining' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {insights.focus.focusTrend === 'improving' ? '📈 향상 중' :
                   insights.focus.focusTrend === 'declining' ? '📉 감소 중' :
                   '➡️ 안정적'}
                </span>
              </div>
            </div>
          </Card>

          {/* 주의산만 패턴 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">주의산만 패턴</h3>
              <div className="text-2xl">🎯</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">세션당 평균 주의산만</p>
                <p className="text-xl font-bold text-orange-600">
                  {insights.distractions.averageDistractionsPerSession}회
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">주요 주의산만 유형</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {insights.distractions.mostCommonDistractions.map((type, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
                    >
                      {type === 'website' ? '웹사이트' :
                       type === 'notification' ? '알림' :
                       type === 'inactivity' ? '비활성' : '수동'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* 추천사항 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">개인화된 추천</h3>
              <div className="text-2xl">💡</div>
            </div>
            <div className="space-y-3">
              {insights.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <p className="text-gray-700">{recommendation}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* 리포트 탭 */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {weeklyReport ? (
            <>
              {/* 주간 요약 */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    주간 리포트 ({weeklyReport.weekStart.toLocaleDateString()} - {weeklyReport.weekEnd.toLocaleDateString()})
                  </h3>
                  <Button onClick={handleGenerateReport} variant="outline" size="sm">
                    새로고침
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {weeklyReport.summary.completionRate}%
                    </p>
                    <p className="text-sm text-gray-600">완료율</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round(weeklyReport.summary.totalFocusTime / 60)}h
                    </p>
                    <p className="text-sm text-gray-600">총 집중 시간</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {weeklyReport.summary.pomodorosCompleted}
                    </p>
                    <p className="text-sm text-gray-600">완료된 포모도로</p>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800 font-medium">💬 동기부여 메시지</p>
                  <p className="text-blue-700 mt-1">{weeklyReport.motivationalMessage}</p>
                </div>
              </Card>

              {/* 성취 */}
              {weeklyReport.achievements.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">이번 주 성취</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {weeklyReport.achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg"
                      >
                        <div className="text-2xl">{achievement.icon}</div>
                        <div>
                          <p className="font-medium text-gray-900">{achievement.title}</p>
                          <p className="text-sm text-gray-600">{achievement.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* 개선 영역 */}
              {weeklyReport.improvements.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">개선 영역</h3>
                  <div className="space-y-4">
                    {weeklyReport.improvements.map((improvement, index) => (
                      <div key={index} className="border-l-4 border-orange-400 pl-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{improvement.title}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            improvement.priority === 'high' ? 'bg-red-100 text-red-800' :
                            improvement.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {improvement.priority === 'high' ? '높음' :
                             improvement.priority === 'medium' ? '보통' : '낮음'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{improvement.description}</p>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-orange-400 h-2 rounded-full"
                              style={{ width: `${improvement.currentScore}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">
                            {improvement.currentScore}/{improvement.targetScore}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {improvement.suggestions.slice(0, 2).map((suggestion, idx) => (
                            <p key={idx} className="text-xs text-gray-500">• {suggestion}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* 다음 주 목표 */}
              {weeklyReport.nextWeekGoals.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">다음 주 목표</h3>
                  <div className="space-y-4">
                    {weeklyReport.nextWeekGoals.map((goal) => (
                      <div key={goal.id} className="border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{goal.title}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            goal.isAchievable ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {goal.isAchievable ? '달성 가능' : '도전적'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-400 h-2 rounded-full"
                              style={{ 
                                width: `${Math.min(100, (goal.currentValue / goal.targetValue) * 100)}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">
                            {goal.currentValue}/{goal.targetValue} {goal.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-6 text-center">
              <div className="text-gray-400 mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">리포트가 없습니다</h3>
              <p className="text-gray-600 mb-4">
                충분한 데이터가 수집되면 자동으로 리포트가 생성됩니다.
              </p>
              <Button onClick={handleGenerateReport} variant="primary">
                리포트 생성
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* 새로고침 버튼 */}
      <div className="flex justify-center">
        <Button
          onClick={handleRefreshAnalysis}
          variant="outline"
          disabled={isAnalyzing}
        >
          {isAnalyzing ? '분석 중...' : '분석 새로고침'}
        </Button>
      </div>
    </div>
  )
}