// 기본 타입 정의
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

// 작업 관련 타입
export interface Subtask {
  id: string
  title: string
  duration: number // minutes (15-25)
  isCompleted: boolean
  completedAt?: Date
}

export interface Task {
  id: string
  title: string
  description?: string
  estimatedDuration: number // minutes
  subtasks: Subtask[]
  priority: 'low' | 'medium' | 'high'
  category: string
  isFlexible: boolean
  status: 'pending' | 'in-progress' | 'completed' | 'postponed'
  createdAt: Date
  completedAt?: Date
  scheduledFor?: Date // 예정된 실행 날짜
  postponedCount?: number // 연기된 횟수
}

export interface CreateTaskRequest {
  title: string
  description?: string
  estimatedDuration: number
  priority: 'low' | 'medium' | 'high'
  category: string
  isFlexible: boolean
}

// 사용자 관련 타입
export interface UserPreferences {
  defaultFocusDuration: number // minutes
  defaultBreakDuration: number // minutes
  preferredTaskCategories: string[]
  energyTrackingEnabled: boolean
  notificationsEnabled: boolean
}

export interface FocusSettings {
  hideNotifications: boolean
  blockDistractions: boolean
  showBreathingReminders: boolean
  inactivityThreshold: number // minutes
}

export interface TimerSettings {
  focusDurations: [15, 25, 45] // minutes
  shortBreakDurations: [5, 10, 15] // minutes
  longBreakDuration: 25 // minutes
  cyclesBeforeLongBreak: 3
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto'
  language: 'ko' | 'en'
  timezone: string
  focusMode: FocusSettings
  timer: TimerSettings
}

export interface User {
  id: string
  name: string
  preferences: UserPreferences
  settings: UserSettings
  createdAt: Date
  lastActiveAt: Date
}

// 타이머 관련 타입
export interface TimerState {
  mode: 'focus' | 'short-break' | 'long-break'
  duration: number // seconds
  remaining: number // seconds
  isRunning: boolean
  isPaused: boolean
  currentCycle: number
  totalCycles: number
  currentTaskId?: string
}

export type DistractionType = 'website' | 'notification' | 'inactivity' | 'manual'

// 세션 관련 타입
export interface Session {
  id: string
  taskId: string
  type: 'focus' | 'break'
  plannedDuration: number // minutes
  actualDuration: number // minutes
  startedAt: Date
  completedAt?: Date
  wasInterrupted: boolean
  interruptionReasons: DistractionType[]
  energyBefore: number // 1-5 scale
  energyAfter: number // 1-5 scale
}

// 분석 관련 타입
export interface DailyStats {
  date: Date
  tasksCompleted: number
  tasksPlanned: number
  focusMinutes: number
  breakMinutes: number
  pomodorosCompleted: number
  averageEnergyLevel: number
  distractions: DistractionType[]
}

export interface StreakData {
  current: number
  longest: number
  weeklyGoal: number
}

export interface WeeklyInsight {
  weekStart: Date
  completionRate: number
  mostProductiveDay: string
  mostProductiveHour: number
  improvementSuggestions: string[]
  goalAchievement: boolean
}

export interface AnalyticsData {
  completionRate: number
  averageFocusTime: number
  productiveHours: number[]
  preferredTaskTypes: string[]
  streakData: StreakData
  improvementAreas: string[]
}

// 컴포넌트 Props 타입
export interface DashboardProps {
  user: User
  todayTasks: Task[]
  completedPomodoros: number
  currentStreak: number
}

export interface DashboardState {
  energyLevel: 'low' | 'medium' | 'high'
  focusMode: boolean
  currentTask: Task | null
}

export interface TaskManagerProps {
  tasks: Task[]
  onTaskCreate: (task: CreateTaskRequest) => void
  onTaskUpdate: (id: string, updates: Partial<Task>) => void
  onTaskDelete: (id: string) => void
}

export interface PomodoroTimerProps {
  task: Task
  onComplete: (duration: number) => void
  onPause: () => void
  onStop: () => void
}

export interface FocusModeProps {
  isActive: boolean
  currentTask: Task
  onToggle: () => void
  onDistraction: (type: DistractionType) => void
}

export interface AnalyticsProps {
  timeRange: 'week' | 'month' | 'quarter'
  data: AnalyticsData
}

// 스케줄링 관련 타입
export interface ScheduleAdjustment {
  taskId: string
  newPriority: Task['priority']
  newPosition: number
  reason: 'postponed' | 'energy_mismatch' | 'time_constraint' | 'user_request'
}

export interface SchedulingOptions {
  respectFixedTasks: boolean
  considerEnergyLevel: boolean
  maxDailyTasks: number
  bufferTime: number // minutes between tasks
}

export interface DailySchedule {
  date: Date
  tasks: Task[]
  totalEstimatedTime: number
  completionRate: number
  adjustments: ScheduleAdjustment[]
}

export interface GoalAdjustment {
  type: 'reduce_tasks' | 'extend_deadline' | 'split_tasks' | 'lower_priority'
  message: string
  suggestedTasks: Task[]
  originalTaskCount: number
  adjustedTaskCount: number
  reason: string
}

export interface GoalAdjustmentOptions {
  minCompletionRate: number // 최소 완료율 (기본 50%)
  maxDailyTasks: number // 최대 일일 작업 수
  encouragingMessages: boolean // 격려 메시지 포함 여부
}

// 오류 관련 타입
export type AppError = 
  | 'TASK_NOT_FOUND'
  | 'TIMER_ALREADY_RUNNING'
  | 'STORAGE_QUOTA_EXCEEDED'
  | 'NOTIFICATION_PERMISSION_DENIED'
  | 'INVALID_TASK_DURATION'
  | 'SUBTASK_CREATION_FAILED'

export interface ErrorState {
  type: AppError
  message: string
  timestamp: Date
  context?: Record<string, any>
}