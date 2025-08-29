import React from 'react'
import { useTimer } from '../../hooks/useTimer'
import { cycleManagerService } from '../../services/cycleManagerService'

interface CycleDisplayProps {
  className?: string
  showDetails?: boolean
}

export const CycleDisplay: React.FC<CycleDisplayProps> = ({ 
  className = '', 
  showDetails = true 
}) => {
  const { 
    currentCycle, 
    totalCycles, 
    settings, 
    mode 
  } = useTimer()

  const cycleData = cycleManagerService.calculateCycleData(
    currentCycle,
    totalCycles,
    settings
  )

  const progress = cycleManagerService.calculateCycleProgress(totalCycles, settings)

  // 현재 세트 내에서의 진행률
  const currentSetCycles = totalCycles % settings.cyclesBeforeLongBreak
  const cyclesInCurrentSet = Math.min(currentSetCycles, settings.cyclesBeforeLongBreak)

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">포모도로 사이클</h3>
          <div className="text-sm text-gray-500">
            세트 {Math.floor(totalCycles / settings.cyclesBeforeLongBreak) + 1}
          </div>
        </div>

        {/* 현재 사이클 정보 */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-blue-600">{currentCycle}</div>
            <div className="text-xs text-gray-500">현재 사이클</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-600">{totalCycles}</div>
            <div className="text-xs text-gray-500">완료된 포모도로</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-purple-600">{cycleData.cyclesUntilLongBreak}</div>
            <div className="text-xs text-gray-500">긴 휴식까지</div>
          </div>
        </div>

        {/* 진행률 바 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>현재 세트 진행률</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 사이클 시각화 */}
        <div className="flex justify-center space-x-1">
          {Array.from({ length: settings.cyclesBeforeLongBreak }, (_, index) => {
            const cycleNumber = index + 1
            const isCompleted = cycleNumber <= cyclesInCurrentSet
            const isCurrent = cycleNumber === cyclesInCurrentSet + 1 && mode === 'focus'
            
            return (
              <div
                key={index}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-blue-500 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {cycleNumber}
              </div>
            )
          })}
          
          {/* 긴 휴식 표시 */}
          <div className="flex items-center">
            <div className="w-2 h-2 bg-gray-300 rounded-full mx-1" />
            <div className="w-2 h-2 bg-gray-300 rounded-full mx-1" />
            <div className="w-2 h-2 bg-gray-300 rounded-full mx-1" />
          </div>
          <div
            className={`w-10 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
              cycleData.isLongBreakTime || mode === 'long-break'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            🌴
          </div>
        </div>

        {/* 상세 정보 */}
        {showDetails && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            {mode === 'focus' && (
              <div className="text-sm text-gray-600 text-center">
                {cycleData.cyclesUntilLongBreak === 1 
                  ? '다음 포모도로 완료 후 긴 휴식이에요!' 
                  : `${cycleData.cyclesUntilLongBreak}개 더 완료하면 긴 휴식입니다`
                }
              </div>
            )}
            
            {mode === 'long-break' && (
              <div className="text-sm text-purple-600 text-center font-medium">
                🎉 긴 휴식 시간! 충분히 쉬세요
              </div>
            )}
            
            {mode === 'short-break' && (
              <div className="text-sm text-green-600 text-center">
                잠깐 휴식 중... 다음 집중을 준비하세요
              </div>
            )}

            {/* 격려 메시지 */}
            {totalCycles > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <p className="text-sm text-blue-800">
                  {totalCycles === 1 && '첫 번째 포모도로 완료! 좋은 시작이에요 🎯'}
                  {totalCycles >= 2 && totalCycles < 5 && '꾸준히 잘하고 있어요! 계속 화이팅 💪'}
                  {totalCycles >= 5 && totalCycles < 10 && '정말 집중력이 좋네요! 훌륭해요 ⭐'}
                  {totalCycles >= 10 && '포모도로 마스터가 되어가고 있어요! 🏆'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CycleDisplay