import React, { useState } from 'react'
import { useTimer } from '../../hooks/useTimer'
import { cycleManagerService } from '../../services/cycleManagerService'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface LongBreakModalProps {
  isOpen: boolean
  onClose: () => void
  onStartLongBreak: () => void
  onSkipLongBreak: () => void
}

export const LongBreakModal: React.FC<LongBreakModalProps> = ({
  isOpen,
  onClose,
  onStartLongBreak,
  onSkipLongBreak
}) => {
  const { totalCycles, settings } = useTimer()
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null)

  const suggestion = cycleManagerService.generateLongBreakSuggestion(totalCycles, settings)

  const activities = [
    { id: 'walk', icon: '🚶‍♀️', title: '산책하기', description: '신선한 공기를 마시며 걸어보세요' },
    { id: 'stretch', icon: '🧘‍♀️', title: '스트레칭', description: '몸의 긴장을 풀어주세요' },
    { id: 'music', icon: '🎵', title: '음악 듣기', description: '좋아하는 음악으로 기분 전환' },
    { id: 'snack', icon: '🍎', title: '간식 먹기', description: '건강한 간식으로 에너지 충전' },
    { id: 'meditation', icon: '🧠', title: '명상하기', description: '마음을 비우고 집중력 회복' },
    { id: 'nature', icon: '🌿', title: '자연 보기', description: '창밖 풍경이나 식물 관찰하기' },
  ]

  const handleStartLongBreak = () => {
    onStartLongBreak()
    onClose()
  }

  const handleSkipLongBreak = () => {
    onSkipLongBreak()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center space-y-6">
        {/* 축하 메시지 */}
        <div className="space-y-2">
          <div className="text-4xl">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900">{suggestion.title}</h2>
          <p className="text-gray-600">{suggestion.message}</p>
        </div>

        {/* 통계 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalCycles}</div>
              <div className="text-sm text-gray-600">완료된 포모도로</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.floor(totalCycles / settings.cyclesBeforeLongBreak)}
              </div>
              <div className="text-sm text-gray-600">완료된 세트</div>
            </div>
          </div>
        </div>

        {/* 활동 제안 */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">휴식 활동 추천</h3>
          <div className="grid grid-cols-2 gap-3">
            {activities.map((activity) => (
              <button
                key={activity.id}
                onClick={() => setSelectedActivity(activity.id)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                  selectedActivity === activity.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{activity.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900">{activity.title}</div>
                    <div className="text-xs text-gray-600">{activity.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ADHD 맞춤 팁 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
          <h4 className="font-semibold text-yellow-800 mb-2">💡 효과적인 긴 휴식 팁</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 완전히 다른 환경으로 이동해보세요</li>
            <li>• 스마트폰이나 컴퓨터에서 잠시 떨어져 있으세요</li>
            <li>• 몸을 움직이는 활동을 선택해보세요</li>
            <li>• 충분한 수분을 섭취하세요</li>
          </ul>
        </div>

        {/* 버튼 */}
        <div className="flex space-x-3">
          <Button
            onClick={handleSkipLongBreak}
            variant="outline"
            className="flex-1"
          >
            짧은 휴식으로 변경
          </Button>
          <Button
            onClick={handleStartLongBreak}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            {settings.longBreakDuration}분 긴 휴식 시작
          </Button>
        </div>

        {/* 선택한 활동 표시 */}
        {selectedActivity && (
          <div className="text-sm text-gray-600">
            선택한 활동: {activities.find(a => a.id === selectedActivity)?.title}
          </div>
        )}
      </div>
    </Modal>
  )
}

export default LongBreakModal