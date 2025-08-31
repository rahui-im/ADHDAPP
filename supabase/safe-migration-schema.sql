-- ============================================
-- ADHD Task Manager - Safe Migration Schema
-- Version: 2.0.1
-- Created: 2025-01-01
-- For Supabase SQL Editor (Safe Update)
-- ============================================

-- This script safely updates existing schema without errors
-- It checks for existence before creating objects

-- Enable necessary extensions (if not exists)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==========================================
-- SAFE TABLE CREATION WITH DROP CASCADE
-- ==========================================

-- Drop all existing tables and recreate (CAREFUL!)
-- Uncomment below lines only if you want to completely reset
/*
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.backups CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.patterns CASCADE;
DROP TABLE IF EXISTS public.analytics CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
*/

-- ==========================================
-- 1. USERS TABLE
-- ==========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TABLE public.users (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            avatar_url TEXT,
            
            preferences JSONB DEFAULT '{
                "defaultFocusDuration": 25,
                "defaultBreakDuration": 5,
                "preferredTaskCategories": ["업무", "개인", "학습", "운동"],
                "energyTrackingEnabled": true,
                "notificationsEnabled": true
            }'::jsonb NOT NULL,
            
            settings JSONB DEFAULT '{
                "theme": "light",
                "language": "ko",
                "timezone": "Asia/Seoul",
                "focusMode": {
                    "hideNotifications": true,
                    "blockDistractions": true,
                    "showBreathingReminders": true,
                    "inactivityThreshold": 5
                },
                "timer": {
                    "focusDurations": [15, 25, 45],
                    "shortBreakDurations": [5, 10, 15],
                    "longBreakDuration": 25,
                    "cyclesBeforeLongBreak": 3
                }
            }'::jsonb NOT NULL,
            
            created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            last_active_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;

-- Safe index creation
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON public.users(last_active_at DESC);

-- ==========================================
-- 2. TASKS TABLE
-- ==========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
        CREATE TABLE public.tasks (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            estimated_duration INTEGER NOT NULL CHECK (estimated_duration > 0),
            actual_duration INTEGER,
            priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
            category TEXT DEFAULT '기타',
            status TEXT CHECK (status IN ('pending', 'in-progress', 'completed', 'postponed', 'cancelled')) DEFAULT 'pending',
            energy_level TEXT CHECK (energy_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
            is_flexible BOOLEAN DEFAULT true,
            postponed_count INTEGER DEFAULT 0,
            subtasks JSONB DEFAULT '[]'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            completed_at TIMESTAMPTZ,
            scheduled_for DATE,
            due_date DATE,
            tags TEXT[] DEFAULT '{}',
            attachments JSONB DEFAULT '[]'::jsonb,
            notes TEXT
        );
    END IF;
END $$;

-- Safe index creation for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON public.tasks(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON public.tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);

-- ==========================================
-- 3. SESSIONS TABLE
-- ==========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions') THEN
        CREATE TABLE public.sessions (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
            type TEXT CHECK (type IN ('focus', 'short-break', 'long-break')) NOT NULL,
            planned_duration INTEGER NOT NULL,
            actual_duration INTEGER,
            energy_level TEXT CHECK (energy_level IN ('low', 'medium', 'high')),
            focus_quality INTEGER CHECK (focus_quality >= 1 AND focus_quality <= 5),
            interrupted BOOLEAN DEFAULT false,
            interruptions JSONB DEFAULT '[]'::jsonb,
            started_at TIMESTAMPTZ NOT NULL,
            completed_at TIMESTAMPTZ,
            notes TEXT
        );
    END IF;
END $$;

-- Safe index creation for sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_task_id ON public.sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON public.sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_type ON public.sessions(type);

-- ==========================================
-- 4. ANALYTICS TABLE
-- ==========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics') THEN
        CREATE TABLE public.analytics (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            tasks_created INTEGER DEFAULT 0,
            tasks_completed INTEGER DEFAULT 0,
            tasks_postponed INTEGER DEFAULT 0,
            total_focus_time INTEGER DEFAULT 0,
            total_break_time INTEGER DEFAULT 0,
            longest_focus_session INTEGER DEFAULT 0,
            focus_sessions_count INTEGER DEFAULT 0,
            completed_pomodoros INTEGER DEFAULT 0,
            average_energy_level DECIMAL(3,2),
            interruption_count INTEGER DEFAULT 0,
            most_productive_hour INTEGER,
            preferred_session_duration INTEGER,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            CONSTRAINT unique_user_date UNIQUE (user_id, date)
        );
    END IF;
END $$;

-- Safe index creation for analytics
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON public.analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_user_date ON public.analytics(user_id, date DESC);

-- ==========================================
-- 5. PATTERNS TABLE
-- ==========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patterns') THEN
        CREATE TABLE public.patterns (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            pattern_type TEXT NOT NULL CHECK (pattern_type IN (
                'productivity_time', 'energy_pattern', 'task_completion', 
                'interruption_pattern', 'break_preference', 'focus_duration'
            )),
            pattern_data JSONB NOT NULL,
            confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
            valid_from DATE NOT NULL,
            valid_until DATE,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;

-- Safe index creation for patterns
CREATE INDEX IF NOT EXISTS idx_patterns_user_id ON public.patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_patterns_type ON public.patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_patterns_active ON public.patterns(user_id, is_active);

-- ==========================================
-- 6. ACHIEVEMENTS TABLE
-- ==========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'achievements') THEN
        CREATE TABLE public.achievements (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            achievement_type TEXT NOT NULL,
            achievement_name TEXT NOT NULL,
            achievement_description TEXT,
            progress INTEGER DEFAULT 0,
            target INTEGER NOT NULL,
            completed BOOLEAN DEFAULT false,
            earned_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;

-- Safe index creation for achievements
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_completed ON public.achievements(user_id, completed);

-- ==========================================
-- 7. BACKUPS TABLE
-- ==========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backups') THEN
        CREATE TABLE public.backups (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            backup_type TEXT CHECK (backup_type IN ('manual', 'automatic')) NOT NULL,
            backup_data JSONB NOT NULL,
            file_size INTEGER,
            version TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            restored_at TIMESTAMPTZ,
            restore_count INTEGER DEFAULT 0
        );
    END IF;
END $$;

-- Safe index creation for backups
CREATE INDEX IF NOT EXISTS idx_backups_user_id ON public.backups(user_id);
CREATE INDEX IF NOT EXISTS idx_backups_created ON public.backups(created_at DESC);

-- ==========================================
-- 8. NOTIFICATIONS TABLE
-- ==========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        CREATE TABLE public.notifications (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            type TEXT NOT NULL CHECK (type IN (
                'task_reminder', 'break_reminder', 'daily_summary', 
                'achievement_earned', 'goal_update', 'system'
            )),
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT false,
            is_delivered BOOLEAN DEFAULT false,
            scheduled_for TIMESTAMPTZ,
            delivered_at TIMESTAMPTZ,
            read_at TIMESTAMPTZ,
            data JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;

-- Safe index creation for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON public.notifications(scheduled_for);

-- ==========================================
-- FUNCTIONS AND TRIGGERS (Safe Creation)
-- ==========================================

-- Drop and recreate function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_analytics_updated_at ON public.analytics;
CREATE TRIGGER update_analytics_updated_at 
    BEFORE UPDATE ON public.analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patterns_updated_at ON public.patterns;
CREATE TRIGGER update_patterns_updated_at 
    BEFORE UPDATE ON public.patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- ROW LEVEL SECURITY (Safe Enable)
-- ==========================================

-- Enable RLS only if not already enabled
DO $$ 
BEGIN
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.patterns ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Drop existing policies and recreate
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
CREATE POLICY "Users can view own tasks" ON public.tasks
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
CREATE POLICY "Users can view own sessions" ON public.sessions
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own analytics" ON public.analytics;
CREATE POLICY "Users can view own analytics" ON public.analytics
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own patterns" ON public.patterns;
CREATE POLICY "Users can view own patterns" ON public.patterns
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own achievements" ON public.achievements;
CREATE POLICY "Users can view own achievements" ON public.achievements
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own backups" ON public.backups;
CREATE POLICY "Users can view own backups" ON public.backups
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- VIEWS (Safe Creation)
-- ==========================================

-- Drop and recreate views
DROP VIEW IF EXISTS today_tasks;
CREATE OR REPLACE VIEW today_tasks AS
SELECT t.*
FROM public.tasks t
WHERE t.scheduled_for = CURRENT_DATE
   OR (t.status = 'in-progress')
ORDER BY t.priority DESC, t.created_at ASC;

DROP VIEW IF EXISTS weekly_stats;
CREATE OR REPLACE VIEW weekly_stats AS
SELECT 
    user_id,
    DATE_TRUNC('week', date) as week,
    SUM(tasks_completed) as total_tasks_completed,
    SUM(total_focus_time) as total_focus_minutes,
    AVG(average_energy_level) as avg_energy,
    SUM(completed_pomodoros) as total_pomodoros
FROM public.analytics
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY user_id, DATE_TRUNC('week', date);

-- ==========================================
-- VERIFICATION
-- ==========================================

-- Check what tables were created
SELECT 
    'Migration completed!' as status,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as total_tables,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'public') as total_columns,
    (SELECT COUNT(*) FROM pg_indexes 
     WHERE schemaname = 'public') as total_indexes;

-- List all tables
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;