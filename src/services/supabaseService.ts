import { supabase, isCloudSyncEnabled } from '../lib/supabase'
import type { Task, User, Session, DailyStats } from '../types'
import type { Database } from '../types/supabase'
import { storageService } from './storageService'

type TaskRow = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type SessionRow = Database['public']['Tables']['sessions']['Row']
type SessionInsert = Database['public']['Tables']['sessions']['Insert']

class SupabaseService {
  private syncQueue: Map<string, any> = new Map()
  private syncInProgress = false
  private syncInterval: NodeJS.Timeout | null = null

  constructor() {
    // 5초마다 동기화 시도
    if (isCloudSyncEnabled()) {
      this.startSyncInterval()
    }
  }

  // ========================================
  // 인증 관련 메서드
  // ========================================

  async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })

    if (error) throw error

    // 사용자 프로필 생성
    if (data.user) {
      await this.createUserProfile(data.user.id, email, name)
    }

    return data
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    // 로컬 데이터와 동기화
    if (data.user) {
      await this.syncLocalToCloud(data.user.id)
    }

    return data
  }

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    // 동기화 중지
    this.stopSyncInterval()
  }

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  // ========================================
  // 사용자 프로필 관리
  // ========================================

  private async createUserProfile(userId: string, email: string, name: string) {
    const { error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        name,
        preferences: storageService.user.loadUser()?.preferences || {},
        settings: storageService.user.loadUser()?.settings || {},
      })

    if (error) throw error
  }

  async updateUserProfile(userId: string, updates: Partial<User>) {
    const { error } = await supabase
      .from('users')
      .update({
        name: updates.name,
        preferences: updates.preferences,
        settings: updates.settings,
        last_active_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) throw error
  }

  // ========================================
  // 작업 관리
  // ========================================

  async getTasks(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return this.convertTasksFromSupabase(data || [])
  }

  async createTask(userId: string, task: Task): Promise<Task> {
    const taskData: TaskInsert = {
      user_id: userId,
      title: task.title,
      description: task.description,
      estimated_duration: task.estimatedDuration,
      subtasks: task.subtasks,
      priority: task.priority,
      category: task.category,
      is_flexible: task.isFlexible,
      status: task.status,
      scheduled_for: task.scheduledFor?.toISOString(),
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single()

    if (error) throw error

    return this.convertTaskFromSupabase(data)
  }

  async updateTask(taskId: string, updates: Partial<Task>) {
    const { error } = await supabase
      .from('tasks')
      .update({
        title: updates.title,
        description: updates.description,
        estimated_duration: updates.estimatedDuration,
        subtasks: updates.subtasks,
        priority: updates.priority,
        category: updates.category,
        is_flexible: updates.isFlexible,
        status: updates.status,
        scheduled_for: updates.scheduledFor?.toISOString(),
        completed_at: updates.completedAt?.toISOString(),
        sync_version: updates.postponedCount,
      })
      .eq('id', taskId)

    if (error) throw error
  }

  async deleteTask(taskId: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) throw error
  }

  // ========================================
  // 세션 관리
  // ========================================

  async createSession(userId: string, session: Session): Promise<void> {
    const sessionData: SessionInsert = {
      user_id: userId,
      task_id: session.taskId,
      type: session.type as 'focus' | 'short-break' | 'long-break',
      planned_duration: session.plannedDuration,
      actual_duration: session.actualDuration,
      started_at: session.startedAt.toISOString(),
      completed_at: session.completedAt?.toISOString(),
      was_interrupted: session.wasInterrupted,
      interruption_reasons: session.interruptionReasons,
      energy_before: session.energyBefore,
      energy_after: session.energyAfter,
    }

    const { error } = await supabase
      .from('sessions')
      .insert(sessionData)

    if (error) throw error
  }

  async getSessions(userId: string, startDate?: Date, endDate?: Date): Promise<Session[]> {
    let query = supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)

    if (startDate) {
      query = query.gte('started_at', startDate.toISOString())
    }

    if (endDate) {
      query = query.lte('started_at', endDate.toISOString())
    }

    const { data, error } = await query.order('started_at', { ascending: false })

    if (error) throw error

    return this.convertSessionsFromSupabase(data || [])
  }

  // ========================================
  // 분석 데이터
  // ========================================

  async saveDailyStats(userId: string, date: Date, stats: DailyStats) {
    const { error } = await supabase
      .from('analytics')
      .upsert({
        user_id: userId,
        date: date.toISOString().split('T')[0],
        daily_stats: stats,
      })

    if (error) throw error
  }

  async getDailyStats(userId: string, date: Date): Promise<DailyStats | null> {
    const { data, error } = await supabase
      .from('analytics')
      .select('daily_stats')
      .eq('user_id', userId)
      .eq('date', date.toISOString().split('T')[0])
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows found
      throw error
    }

    return data?.daily_stats as DailyStats
  }

  // ========================================
  // 백업 관리
  // ========================================

  async createBackup(userId: string, description?: string): Promise<string> {
    const { data, error } = await supabase.rpc('create_backup', {
      p_user_id: userId,
      p_backup_type: 'manual',
      p_description: description,
    })

    if (error) throw error

    return data
  }

  async getBackups(userId: string) {
    const { data, error } = await supabase
      .from('backups')
      .select('id, backup_type, version, description, created_at, file_size')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error

    return data
  }

  async restoreBackup(userId: string, backupId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('restore_backup', {
      p_user_id: userId,
      p_backup_id: backupId,
    })

    if (error) throw error

    // 복원 후 로컬 데이터 업데이트
    if (data) {
      await this.syncCloudToLocal(userId)
    }

    return data
  }

  // ========================================
  // 동기화 관련 메서드
  // ========================================

  private startSyncInterval() {
    this.syncInterval = setInterval(() => {
      this.processSyncQueue()
    }, 5000)
  }

  private stopSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  async syncLocalToCloud(userId: string) {
    if (!isCloudSyncEnabled()) return

    try {
      // 로컬 데이터 가져오기
      const localTasks = storageService.tasks.getTasks()
      const localSessions = storageService.sessions.getAllSessions()

      // 작업 동기화
      for (const task of localTasks) {
        await this.createTask(userId, task)
      }

      // 세션 동기화
      for (const session of localSessions) {
        await this.createSession(userId, session)
      }

      console.log('Local to cloud sync completed')
    } catch (error) {
      console.error('Sync error:', error)
    }
  }

  async syncCloudToLocal(userId: string) {
    if (!isCloudSyncEnabled()) return

    try {
      // 클라우드 데이터 가져오기
      const tasks = await this.getTasks(userId)
      const sessions = await this.getSessions(userId)

      // 로컬 스토리지 업데이트
      tasks.forEach(task => {
        storageService.tasks.saveTask(task)
      })

      sessions.forEach(session => {
        storageService.sessions.saveSession(session)
      })

      console.log('Cloud to local sync completed')
    } catch (error) {
      console.error('Sync error:', error)
    }
  }

  private async processSyncQueue() {
    if (this.syncInProgress || this.syncQueue.size === 0) return

    this.syncInProgress = true

    try {
      const user = await this.getCurrentUser()
      if (!user) return

      for (const [key, data] of this.syncQueue) {
        try {
          // 동기화 작업 처리
          await this.syncItem(user.id, data)
          this.syncQueue.delete(key)
        } catch (error) {
          console.error(`Failed to sync item ${key}:`, error)
        }
      }
    } finally {
      this.syncInProgress = false
    }
  }

  private async syncItem(userId: string, item: any) {
    // 아이템 타입에 따라 적절한 동기화 수행
    if (item.type === 'task') {
      await this.updateTask(item.id, item.data)
    } else if (item.type === 'session') {
      await this.createSession(userId, item.data)
    }
  }

  // ========================================
  // 실시간 구독
  // ========================================

  subscribeToTasks(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`tasks:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe()
  }

  unsubscribeFromTasks(userId: string) {
    return supabase.channel(`tasks:${userId}`).unsubscribe()
  }

  // ========================================
  // 유틸리티 메서드
  // ========================================

  private convertTaskFromSupabase(row: TaskRow): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      estimatedDuration: row.estimated_duration,
      subtasks: row.subtasks as any || [],
      priority: row.priority,
      category: row.category,
      isFlexible: row.is_flexible,
      status: row.status,
      createdAt: new Date(row.created_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      scheduledFor: row.scheduled_for ? new Date(row.scheduled_for) : undefined,
      postponedCount: row.postponed_count,
    }
  }

  private convertTasksFromSupabase(rows: TaskRow[]): Task[] {
    return rows.map(row => this.convertTaskFromSupabase(row))
  }

  private convertSessionsFromSupabase(rows: SessionRow[]): Session[] {
    return rows.map(row => ({
      id: row.id,
      taskId: row.task_id || '',
      type: row.type as 'focus' | 'break',
      plannedDuration: row.planned_duration,
      actualDuration: row.actual_duration || 0,
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      wasInterrupted: row.was_interrupted,
      interruptionReasons: row.interruption_reasons as any || [],
      energyBefore: row.energy_before || 3,
      energyAfter: row.energy_after || 3,
    }))
  }
}

export const supabaseService = new SupabaseService()