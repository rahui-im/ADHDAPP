import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { 
  ClockIcon, 
  BookmarkIcon, 
  SparklesIcon,
  TrashIcon,
  PlusIcon 
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface TimerTemplate {
  id: string
  name: string
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  cyclesBeforeLongBreak: number
  icon?: string
  color?: string
  description?: string
}

const PRESET_TEMPLATES: TimerTemplate[] = [
  {
    id: 'classic-pomodoro',
    name: '클래식 포모도로',
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    cyclesBeforeLongBreak: 4,
    icon: '🍅',
    color: 'bg-red-500',
    description: '전통적인 포모도로 기법'
  },
  {
    id: 'adhd-sprint',
    name: 'ADHD 스프린트',
    focusDuration: 15,
    shortBreakDuration: 3,
    longBreakDuration: 10,
    cyclesBeforeLongBreak: 3,
    icon: '⚡',
    color: 'bg-yellow-500',
    description: '짧은 집중력을 위한 빠른 사이클'
  },
  {
    id: 'deep-focus',
    name: '딥 포커스',
    focusDuration: 45,
    shortBreakDuration: 10,
    longBreakDuration: 20,
    cyclesBeforeLongBreak: 2,
    icon: '🧘',
    color: 'bg-purple-500',
    description: '깊은 집중이 필요한 작업용'
  },
  {
    id: 'micro-burst',
    name: '마이크로 버스트',
    focusDuration: 10,
    shortBreakDuration: 2,
    longBreakDuration: 5,
    cyclesBeforeLongBreak: 5,
    icon: '🚀',
    color: 'bg-blue-500',
    description: '매우 짧은 집중 세션'
  },
  {
    id: 'study-session',
    name: '학습 세션',
    focusDuration: 30,
    shortBreakDuration: 10,
    longBreakDuration: 30,
    cyclesBeforeLongBreak: 3,
    icon: '📚',
    color: 'bg-green-500',
    description: '학습과 복습에 최적화'
  }
]

export const TimerTemplates: React.FC = () => {
  const dispatch = useDispatch()
  const [customTemplates, setCustomTemplates] = useState<TimerTemplate[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [newTemplate, setNewTemplate] = useState<Partial<TimerTemplate>>({
    name: '',
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    cyclesBeforeLongBreak: 4
  })

  const applyTemplate = (template: TimerTemplate) => {
    // dispatch(updateTimerSettings({
    //   focusDuration: template.focusDuration,
    //   shortBreakDuration: template.shortBreakDuration,
    //   longBreakDuration: template.longBreakDuration,
    //   cyclesBeforeLongBreak: template.cyclesBeforeLongBreak
    // }))
    toast.success(`${template.name} 템플릿이 적용되었습니다!`)
  }

  const saveCustomTemplate = () => {
    if (!newTemplate.name) {
      toast.error('템플릿 이름을 입력해주세요')
      return
    }

    const template: TimerTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplate.name,
      focusDuration: newTemplate.focusDuration || 25,
      shortBreakDuration: newTemplate.shortBreakDuration || 5,
      longBreakDuration: newTemplate.longBreakDuration || 15,
      cyclesBeforeLongBreak: newTemplate.cyclesBeforeLongBreak || 4,
      icon: '⭐',
      color: 'bg-indigo-500'
    }

    setCustomTemplates([...customTemplates, template])
    setIsCreating(false)
    setNewTemplate({
      name: '',
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      cyclesBeforeLongBreak: 4
    })
    toast.success('커스텀 템플릿이 저장되었습니다!')
  }

  const deleteCustomTemplate = (id: string) => {
    setCustomTemplates(customTemplates.filter(t => t.id !== id))
    toast.success('템플릿이 삭제되었습니다')
  }

  const renderTemplateCard = (template: TimerTemplate, isCustom: boolean = false) => (
    <motion.div
      key={template.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="p-4 cursor-pointer hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{template.icon}</span>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {template.name}
            </h3>
          </div>
          {isCustom && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteCustomTemplate(template.id)
              }}
              className="text-red-500 hover:text-red-700"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {template.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {template.description}
          </p>
        )}

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">집중:</span>
            <span className="font-medium">{template.focusDuration}분</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">짧은 휴식:</span>
            <span className="font-medium">{template.shortBreakDuration}분</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">긴 휴식:</span>
            <span className="font-medium">{template.longBreakDuration}분</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">사이클:</span>
            <span className="font-medium">{template.cyclesBeforeLongBreak}회</span>
          </div>
        </div>

        <Button
          onClick={() => applyTemplate(template)}
          variant="primary"
          size="sm"
          className="w-full mt-4"
        >
          적용하기
        </Button>
      </Card>
    </motion.div>
  )

  return (
    <div className="space-y-6">
      {/* 프리셋 템플릿 */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <SparklesIcon className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-semibold">추천 템플릿</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRESET_TEMPLATES.map(template => renderTemplateCard(template))}
        </div>
      </div>

      {/* 커스텀 템플릿 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookmarkIcon className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold">내 템플릿</h2>
          </div>
          <Button
            onClick={() => setIsCreating(true)}
            variant="secondary"
            size="sm"
            leftIcon={<PlusIcon className="w-4 h-4" />}
          >
            새 템플릿
          </Button>
        </div>

        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <Card className="p-4">
                <h3 className="font-semibold mb-3">새 템플릿 만들기</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="템플릿 이름"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-600">집중 시간 (분)</label>
                      <input
                        type="number"
                        value={newTemplate.focusDuration}
                        onChange={(e) => setNewTemplate({ ...newTemplate, focusDuration: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">짧은 휴식 (분)</label>
                      <input
                        type="number"
                        value={newTemplate.shortBreakDuration}
                        onChange={(e) => setNewTemplate({ ...newTemplate, shortBreakDuration: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={saveCustomTemplate} variant="primary" size="sm">
                      저장
                    </Button>
                    <Button onClick={() => setIsCreating(false)} variant="secondary" size="sm">
                      취소
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {customTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customTemplates.map(template => renderTemplateCard(template, true))}
          </div>
        ) : !isCreating && (
          <Card className="p-8 text-center">
            <BookmarkIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              아직 저장된 템플릿이 없습니다
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

export default TimerTemplates