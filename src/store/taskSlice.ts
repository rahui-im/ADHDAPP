import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Task, CreateTaskRequest, Subtask, ScheduleAdjustment, DailySchedule, GoalAdjustment, DailyStats } from '../types'
import { schedulingService } from '../services/schedulingService'
import { goalAdjustmentService } from '../services/goalAdjustmentService'

interface TaskState {
  tasks: Task[]
  currentTask: Task | null
  dailySchedule: DailySchedule | null
  goalAdjustment: GoalAdjustment | null
  loading: boolean
  error: string | null
}

const initialState: TaskState = {
  tasks: [],
  currentTask: null,
  dailySchedule: null,
  goalAdjustment: null,
  loading: false,
  error: null,
}

// Async thunks
export const createTaskAsync = createAsyncThunk(
  'tasks/createTask',
  async (payload: CreateTaskRequest & { subtasks?: Subtask[] }) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const { subtasks, ...taskData } = payload
    
    const newTask: Task = {
      id: crypto.randomUUID(),
      ...taskData,
      subtasks: subtasks || [],
      status: 'pending',
      createdAt: new Date(),
    }
    
    // 자동 작업 분할 (subtasks가 제공되지 않은 경우에만)
    if (!subtasks && newTask.estimatedDuration > 25) {
      const subtaskCount = Math.ceil(newTask.estimatedDuration / 20)
      const subtaskDuration = Math.floor(newTask.estimatedDuration / subtaskCount)
      
      for (let i = 0; i < subtaskCount; i++) {
        const subtask: Subtask = {
          id: crypto.randomUUID(),
          title: `${newTask.title} - 단계 ${i + 1}`,
          duration: Math.min(subtaskDuration, 25),
          isCompleted: false,
        }
        newTask.subtasks.push(subtask)
      }
    }
    
    return newTask
  }
)

export const updateTaskAsync = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, updates }: { id: string; updates: Partial<CreateTaskRequest & { subtasks?: Subtask[] }> }) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300))
    return { id, updates }
  }
)

export const deleteTaskAsync = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId: string) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300))
    return taskId
  }
)

// 작업 연기 및 우선순위 재조정
export const postponeTaskAsync = createAsyncThunk(
  'tasks/postponeTask',
  async ({ taskId, tasks }: { taskId: string; tasks: Task[] }) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const adjustments = schedulingService.adjustPriorityOnPostpone(tasks, taskId)
    return { taskId, adjustments }
  }
)

// 일일 스케줄 생성
export const generateDailyScheduleAsync = createAsyncThunk(
  'tasks/generateDailySchedule',
  async ({ 
    tasks, 
    energyLevel, 
    date 
  }: { 
    tasks: Task[]; 
    energyLevel: 'low' | 'medium' | 'high'; 
    date: Date 
  }) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const scheduledTasks = schedulingService.scheduleTasksByType(tasks, energyLevel)
    const totalEstimatedTime = scheduledTasks.reduce((sum, task) => sum + task.estimatedDuration, 0)
    
    const schedule: DailySchedule = {
      date,
      tasks: scheduledTasks,
      totalEstimatedTime,
      completionRate: 0,
      adjustments: []
    }
    
    return schedule
  }
)

// 목표 조정 제안 생성
export const generateGoalAdjustmentAsync = createAsyncThunk(
  'tasks/generateGoalAdjustment',
  async ({ 
    todayStats, 
    tomorrowTasks, 
    recentStats 
  }: { 
    todayStats: DailyStats; 
    tomorrowTasks: Task[]; 
    recentStats: DailyStats[] 
  }) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const adjustment = goalAdjustmentService.adjustGoalsForLowCompletion(
      todayStats,
      tomorrowTasks,
      recentStats
    )
    
    return adjustment
  }
)

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {

    // 하위 작업 완료 토글
    toggleSubtask: (state, action: PayloadAction<{ taskId: string; subtaskId: string }>) => {
      const { taskId, subtaskId } = action.payload
      const task = state.tasks.find(t => t.id === taskId)
      
      if (task) {
        const subtask = task.subtasks.find(st => st.id === subtaskId)
        if (subtask) {
          subtask.isCompleted = !subtask.isCompleted
          subtask.completedAt = subtask.isCompleted ? new Date() : undefined
          
          // 모든 하위 작업이 완료되면 전체 작업 완료
          const allCompleted = task.subtasks.every(st => st.isCompleted)
          if (allCompleted && task.status !== 'completed') {
            task.status = 'completed'
            task.completedAt = new Date()
          }
        }
      }
    },

    // 현재 작업 설정
    setCurrentTask: (state, action: PayloadAction<Task | null>) => {
      state.currentTask = action.payload
    },

    // 작업 상태 변경
    updateTaskStatus: (state, action: PayloadAction<{ id: string; status: Task['status'] }>) => {
      const { id, status } = action.payload
      const task = state.tasks.find(t => t.id === id)
      
      if (task) {
        task.status = status
        if (status === 'completed') {
          task.completedAt = new Date()
          // 모든 하위 작업도 완료 처리
          task.subtasks.forEach(subtask => {
            subtask.isCompleted = true
            subtask.completedAt = new Date()
          })
        }
      }
    },

    // 작업 우선순위 재조정
    reorderTasks: (state, action: PayloadAction<{ taskId: string; newIndex: number }>) => {
      const { taskId, newIndex } = action.payload
      const taskIndex = state.tasks.findIndex(t => t.id === taskId)
      
      if (taskIndex !== -1) {
        const [task] = state.tasks.splice(taskIndex, 1)
        state.tasks.splice(newIndex, 0, task)
      }
    },

    // 작업 연기
    postponeTask: (state, action: PayloadAction<string>) => {
      const taskId = action.payload
      const task = state.tasks.find(t => t.id === taskId)
      
      if (task) {
        task.status = 'postponed'
        task.postponedCount = (task.postponedCount || 0) + 1
        
        // 연기된 작업의 우선순위를 높임
        if (task.priority === 'low') {
          task.priority = 'medium'
        } else if (task.priority === 'medium') {
          task.priority = 'high'
        }
      }
    },

    // 스케줄 조정 적용
    applyScheduleAdjustments: (state, action: PayloadAction<ScheduleAdjustment[]>) => {
      const adjustments = action.payload
      
      adjustments.forEach(adjustment => {
        const task = state.tasks.find(t => t.id === adjustment.taskId)
        if (task) {
          task.priority = adjustment.newPriority
        }
      })
      
      // 일일 스케줄에 조정 사항 기록
      if (state.dailySchedule) {
        state.dailySchedule.adjustments.push(...adjustments)
      }
    },

    // 에너지 레벨에 따른 작업 재정렬
    reorderTasksByEnergy: (state, action: PayloadAction<'low' | 'medium' | 'high'>) => {
      const energyLevel = action.payload
      const pendingTasks = state.tasks.filter(t => t.status === 'pending')
      const recommendedTasks = schedulingService.recommendTasksByEnergy(pendingTasks, energyLevel)
      
      // 추천된 순서로 작업 재정렬
      const otherTasks = state.tasks.filter(t => t.status !== 'pending')
      state.tasks = [...recommendedTasks, ...otherTasks]
    },

    // 로딩 상태 설정
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },

    // 오류 설정
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    // 목표 조정 수락
    acceptGoalAdjustment: (state, action: PayloadAction<Task[]>) => {
      const suggestedTasks = action.payload
      
      // 제안된 작업들로 내일 계획 업데이트
      const pendingTasks = state.tasks.filter(t => t.status === 'pending')
      const suggestedTaskIds = new Set(suggestedTasks.map(t => t.id))
      
      // 제안되지 않은 작업들은 연기 상태로 변경
      pendingTasks.forEach(task => {
        if (!suggestedTaskIds.has(task.id)) {
          task.status = 'postponed'
          task.postponedCount = (task.postponedCount || 0) + 1
        }
      })
      
      state.goalAdjustment = null
    },

    // 목표 조정 거절
    declineGoalAdjustment: (state) => {
      state.goalAdjustment = null
    },

    // 현실적 목표 제안
    suggestRealisticGoals: (state, action: PayloadAction<{
      energyLevel: 'low' | 'medium' | 'high';
      recentCompletionRate: number;
    }>) => {
      const { energyLevel, recentCompletionRate } = action.payload
      const pendingTasks = state.tasks.filter(t => t.status === 'pending')
      
      const realisticTasks = goalAdjustmentService.suggestRealisticGoals(
        pendingTasks,
        energyLevel,
        recentCompletionRate
      )
      
      // 현실적이지 않은 작업들은 우선순위를 낮춤
      const realisticTaskIds = new Set(realisticTasks.map(t => t.id))
      pendingTasks.forEach(task => {
        if (!realisticTaskIds.has(task.id) && task.priority !== 'low') {
          if (task.priority === 'high') {
            task.priority = 'medium'
          } else if (task.priority === 'medium') {
            task.priority = 'low'
          }
        }
      })
    },

    // 오늘의 작업 필터링을 위한 셀렉터 헬퍼
    clearCompletedTasks: (state) => {
      state.tasks = state.tasks.filter(task => task.status !== 'completed')
    },
  },
  extraReducers: (builder) => {
    // Create task
    builder
      .addCase(createTaskAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createTaskAsync.fulfilled, (state, action) => {
        state.loading = false
        state.tasks.push(action.payload)
      })
      .addCase(createTaskAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '작업 생성에 실패했습니다'
      })
    
    // Update task
    builder
      .addCase(updateTaskAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateTaskAsync.fulfilled, (state, action) => {
        state.loading = false
        const { id, updates } = action.payload
        const taskIndex = state.tasks.findIndex(task => task.id === id)
        
        if (taskIndex !== -1) {
          state.tasks[taskIndex] = { ...state.tasks[taskIndex], ...updates }
          
          // 현재 작업이 업데이트된 경우
          if (state.currentTask?.id === id) {
            state.currentTask = state.tasks[taskIndex]
          }
        }
      })
      .addCase(updateTaskAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '작업 수정에 실패했습니다'
      })
    
    // Delete task
    builder
      .addCase(deleteTaskAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteTaskAsync.fulfilled, (state, action) => {
        state.loading = false
        const taskId = action.payload
        state.tasks = state.tasks.filter(task => task.id !== taskId)
        
        // 현재 작업이 삭제된 경우
        if (state.currentTask?.id === taskId) {
          state.currentTask = null
        }
      })
      .addCase(deleteTaskAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '작업 삭제에 실패했습니다'
      })
    
    // Postpone task
    builder
      .addCase(postponeTaskAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(postponeTaskAsync.fulfilled, (state, action) => {
        state.loading = false
        const { taskId, adjustments } = action.payload
        
        // 작업 연기 처리
        const task = state.tasks.find(t => t.id === taskId)
        if (task) {
          task.status = 'postponed'
          task.postponedCount = (task.postponedCount || 0) + 1
        }
        
        // 우선순위 조정 적용
        adjustments.forEach(adjustment => {
          const adjustTask = state.tasks.find(t => t.id === adjustment.taskId)
          if (adjustTask) {
            adjustTask.priority = adjustment.newPriority
          }
        })
        
        // 일일 스케줄에 조정 사항 기록
        if (state.dailySchedule) {
          state.dailySchedule.adjustments.push(...adjustments)
        }
      })
      .addCase(postponeTaskAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '작업 연기에 실패했습니다'
      })
    
    // Generate daily schedule
    builder
      .addCase(generateDailyScheduleAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(generateDailyScheduleAsync.fulfilled, (state, action) => {
        state.loading = false
        state.dailySchedule = action.payload
      })
      .addCase(generateDailyScheduleAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '일일 스케줄 생성에 실패했습니다'
      })
    
    // Generate goal adjustment
    builder
      .addCase(generateGoalAdjustmentAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(generateGoalAdjustmentAsync.fulfilled, (state, action) => {
        state.loading = false
        state.goalAdjustment = action.payload
      })
      .addCase(generateGoalAdjustmentAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '목표 조정 제안 생성에 실패했습니다'
      })
  },
})

export const {
  toggleSubtask,
  setCurrentTask,
  updateTaskStatus,
  reorderTasks,
  postponeTask,
  applyScheduleAdjustments,
  reorderTasksByEnergy,
  acceptGoalAdjustment,
  declineGoalAdjustment,
  suggestRealisticGoals,
  setLoading,
  setError,
  clearCompletedTasks,
} = taskSlice.actions

// Export async thunks
export const createTask = createTaskAsync
export const updateTask = updateTaskAsync
export const deleteTask = deleteTaskAsync
export const postponeTaskWithAdjustment = postponeTaskAsync
export const generateDailySchedule = generateDailyScheduleAsync
export const generateGoalAdjustment = generateGoalAdjustmentAsync

export default taskSlice.reducer