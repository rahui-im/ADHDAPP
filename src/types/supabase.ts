// Supabase 데이터베이스 타입 정의
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          preferences: Json
          settings: Json
          created_at: string
          updated_at: string
          last_active_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          avatar_url?: string | null
          preferences?: Json
          settings?: Json
          created_at?: string
          updated_at?: string
          last_active_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          preferences?: Json
          settings?: Json
          created_at?: string
          updated_at?: string
          last_active_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          estimated_duration: number
          subtasks: Json
          priority: 'low' | 'medium' | 'high'
          category: string
          is_flexible: boolean
          status: 'pending' | 'in-progress' | 'completed' | 'postponed'
          scheduled_for: string | null
          completed_at: string | null
          postponed_count: number
          sync_version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          estimated_duration: number
          subtasks?: Json
          priority?: 'low' | 'medium' | 'high'
          category?: string
          is_flexible?: boolean
          status?: 'pending' | 'in-progress' | 'completed' | 'postponed'
          scheduled_for?: string | null
          completed_at?: string | null
          postponed_count?: number
          sync_version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          estimated_duration?: number
          subtasks?: Json
          priority?: 'low' | 'medium' | 'high'
          category?: string
          is_flexible?: boolean
          status?: 'pending' | 'in-progress' | 'completed' | 'postponed'
          scheduled_for?: string | null
          completed_at?: string | null
          postponed_count?: number
          sync_version?: number
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          task_id: string | null
          type: 'focus' | 'short-break' | 'long-break'
          planned_duration: number
          actual_duration: number | null
          started_at: string
          completed_at: string | null
          was_interrupted: boolean
          interruption_reasons: Json
          energy_before: number | null
          energy_after: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id?: string | null
          type: 'focus' | 'short-break' | 'long-break'
          planned_duration: number
          actual_duration?: number | null
          started_at: string
          completed_at?: string | null
          was_interrupted?: boolean
          interruption_reasons?: Json
          energy_before?: number | null
          energy_after?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string | null
          type?: 'focus' | 'short-break' | 'long-break'
          planned_duration?: number
          actual_duration?: number | null
          started_at?: string
          completed_at?: string | null
          was_interrupted?: boolean
          interruption_reasons?: Json
          energy_before?: number | null
          energy_after?: number | null
          created_at?: string
        }
      }
      analytics: {
        Row: {
          id: string
          user_id: string
          date: string
          daily_stats: Json
          weekly_insights: Json | null
          patterns: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          daily_stats?: Json
          weekly_insights?: Json | null
          patterns?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          daily_stats?: Json
          weekly_insights?: Json | null
          patterns?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      backups: {
        Row: {
          id: string
          user_id: string
          backup_type: 'manual' | 'auto' | 'export'
          backup_data: Json
          file_size: number | null
          version: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          backup_type?: 'manual' | 'auto' | 'export'
          backup_data: Json
          file_size?: number | null
          version?: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          backup_type?: 'manual' | 'auto' | 'export'
          backup_data?: Json
          file_size?: number | null
          version?: string
          description?: string | null
          created_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          type: string
          name: string
          description: string | null
          earned_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          name: string
          description?: string | null
          earned_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          name?: string
          description?: string | null
          earned_at?: string
          metadata?: Json
        }
      }
      sync_log: {
        Row: {
          id: string
          user_id: string
          entity_type: string
          entity_id: string
          action: 'create' | 'update' | 'delete'
          local_timestamp: string
          server_timestamp: string
          conflict_resolved: boolean
          resolution_type: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          entity_type: string
          entity_id: string
          action: 'create' | 'update' | 'delete'
          local_timestamp: string
          server_timestamp?: string
          conflict_resolved?: boolean
          resolution_type?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string
          entity_type?: string
          entity_id?: string
          action?: 'create' | 'update' | 'delete'
          local_timestamp?: string
          server_timestamp?: string
          conflict_resolved?: boolean
          resolution_type?: string | null
          metadata?: Json
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_daily_stats: {
        Args: {
          p_user_id: string
          p_date: string
        }
        Returns: Json
      }
      calculate_streak: {
        Args: {
          p_user_id: string
        }
        Returns: number
      }
      create_backup: {
        Args: {
          p_user_id: string
          p_backup_type?: string
          p_description?: string
        }
        Returns: string
      }
      restore_backup: {
        Args: {
          p_user_id: string
          p_backup_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}