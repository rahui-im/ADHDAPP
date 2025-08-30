-- ADHD Time Manager Database Schema for Supabase
-- Version: 1.0.0
-- Created: 2024

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. USERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{
        "defaultFocusDuration": 25,
        "defaultBreakDuration": 5,
        "preferredTaskCategories": [],
        "energyTrackingEnabled": true,
        "notificationsEnabled": true
    }'::jsonb,
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
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for email lookups
CREATE INDEX idx_users_email ON public.users(email);

-- ==========================================
-- 2. TASKS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    estimated_duration INTEGER NOT NULL, -- in minutes
    subtasks JSONB DEFAULT '[]'::jsonb, -- Array of subtask objects
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    category TEXT DEFAULT 'general',
    is_flexible BOOLEAN DEFAULT true,
    status TEXT CHECK (status IN ('pending', 'in-progress', 'completed', 'postponed')) DEFAULT 'pending',
    scheduled_for TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    postponed_count INTEGER DEFAULT 0,
    sync_version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_scheduled_for ON public.tasks(scheduled_for);
CREATE INDEX idx_tasks_user_status ON public.tasks(user_id, status);

-- ==========================================
-- 3. SESSIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    type TEXT CHECK (type IN ('focus', 'short-break', 'long-break')) NOT NULL,
    planned_duration INTEGER NOT NULL, -- in minutes
    actual_duration INTEGER, -- in minutes
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    was_interrupted BOOLEAN DEFAULT false,
    interruption_reasons JSONB DEFAULT '[]'::jsonb, -- Array of distraction types
    energy_before INTEGER CHECK (energy_before >= 1 AND energy_before <= 5),
    energy_after INTEGER CHECK (energy_after >= 1 AND energy_after <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_task_id ON public.sessions(task_id);
CREATE INDEX idx_sessions_started_at ON public.sessions(started_at);
CREATE INDEX idx_sessions_user_date ON public.sessions(user_id, started_at);

-- ==========================================
-- 4. ANALYTICS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    daily_stats JSONB DEFAULT '{
        "tasksCompleted": 0,
        "tasksPlanned": 0,
        "focusMinutes": 0,
        "breakMinutes": 0,
        "pomodorosCompleted": 0,
        "averageEnergyLevel": 0,
        "distractions": []
    }'::jsonb,
    weekly_insights JSONB,
    patterns JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create indexes for analytics queries
CREATE INDEX idx_analytics_user_id ON public.analytics(user_id);
CREATE INDEX idx_analytics_date ON public.analytics(date);
CREATE INDEX idx_analytics_user_date ON public.analytics(user_id, date);

-- ==========================================
-- 5. BACKUPS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.backups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    backup_type TEXT CHECK (backup_type IN ('manual', 'auto', 'export')) DEFAULT 'manual',
    backup_data JSONB NOT NULL,
    file_size INTEGER, -- in bytes
    version TEXT DEFAULT '1.0.0',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for backup queries
CREATE INDEX idx_backups_user_id ON public.backups(user_id);
CREATE INDEX idx_backups_created_at ON public.backups(created_at DESC);

-- ==========================================
-- 6. ACHIEVEMENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for achievement queries
CREATE INDEX idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX idx_achievements_type ON public.achievements(type);

-- ==========================================
-- 7. SYNC_LOG TABLE (For conflict resolution)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.sync_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT CHECK (action IN ('create', 'update', 'delete')) NOT NULL,
    local_timestamp TIMESTAMPTZ NOT NULL,
    server_timestamp TIMESTAMPTZ DEFAULT NOW(),
    conflict_resolved BOOLEAN DEFAULT false,
    resolution_type TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for sync queries
CREATE INDEX idx_sync_log_user_id ON public.sync_log(user_id);
CREATE INDEX idx_sync_log_entity ON public.sync_log(entity_type, entity_id);
CREATE INDEX idx_sync_log_timestamp ON public.sync_log(server_timestamp DESC);

-- ==========================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON public.tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks" ON public.tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON public.tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON public.sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON public.sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Analytics policies
CREATE POLICY "Users can view own analytics" ON public.analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analytics" ON public.analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics" ON public.analytics
    FOR UPDATE USING (auth.uid() = user_id);

-- Backups policies
CREATE POLICY "Users can view own backups" ON public.backups
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own backups" ON public.backups
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own backups" ON public.backups
    FOR DELETE USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Users can view own achievements" ON public.achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own achievements" ON public.achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Sync log policies
CREATE POLICY "Users can view own sync log" ON public.sync_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sync log" ON public.sync_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 9. FUNCTIONS AND TRIGGERS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_updated_at BEFORE UPDATE ON public.analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 10. RPC FUNCTIONS
-- ==========================================

-- Function to get daily stats
CREATE OR REPLACE FUNCTION get_daily_stats(
    p_user_id UUID,
    p_date DATE
)
RETURNS JSONB AS $$
DECLARE
    v_stats JSONB;
BEGIN
    SELECT 
        jsonb_build_object(
            'tasksCompleted', COUNT(*) FILTER (WHERE t.status = 'completed' AND DATE(t.completed_at) = p_date),
            'focusMinutes', COALESCE(SUM(s.actual_duration) FILTER (WHERE s.type = 'focus'), 0),
            'breakMinutes', COALESCE(SUM(s.actual_duration) FILTER (WHERE s.type IN ('short-break', 'long-break')), 0),
            'pomodorosCompleted', COUNT(*) FILTER (WHERE s.type = 'focus' AND s.completed_at IS NOT NULL)
        ) INTO v_stats
    FROM public.users u
    LEFT JOIN public.tasks t ON u.id = t.user_id
    LEFT JOIN public.sessions s ON u.id = s.user_id AND DATE(s.started_at) = p_date
    WHERE u.id = p_user_id
    GROUP BY u.id;
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate streak
CREATE OR REPLACE FUNCTION calculate_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_streak INTEGER := 0;
    v_date DATE := CURRENT_DATE;
    v_has_activity BOOLEAN;
BEGIN
    LOOP
        SELECT EXISTS (
            SELECT 1 
            FROM public.sessions 
            WHERE user_id = p_user_id 
            AND DATE(started_at) = v_date
            AND type = 'focus'
            AND completed_at IS NOT NULL
        ) INTO v_has_activity;
        
        IF NOT v_has_activity THEN
            EXIT;
        END IF;
        
        v_streak := v_streak + 1;
        v_date := v_date - INTERVAL '1 day';
    END LOOP;
    
    RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create backup
CREATE OR REPLACE FUNCTION create_backup(
    p_user_id UUID,
    p_backup_type TEXT DEFAULT 'manual',
    p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_backup_id UUID;
    v_backup_data JSONB;
BEGIN
    -- Collect all user data
    SELECT jsonb_build_object(
        'user', row_to_json(u.*),
        'tasks', COALESCE(json_agg(DISTINCT t.*) FILTER (WHERE t.id IS NOT NULL), '[]'::json),
        'sessions', COALESCE(json_agg(DISTINCT s.*) FILTER (WHERE s.id IS NOT NULL), '[]'::json),
        'analytics', COALESCE(json_agg(DISTINCT a.*) FILTER (WHERE a.id IS NOT NULL), '[]'::json),
        'achievements', COALESCE(json_agg(DISTINCT ac.*) FILTER (WHERE ac.id IS NOT NULL), '[]'::json),
        'backup_timestamp', NOW()
    ) INTO v_backup_data
    FROM public.users u
    LEFT JOIN public.tasks t ON u.id = t.user_id
    LEFT JOIN public.sessions s ON u.id = s.user_id
    LEFT JOIN public.analytics a ON u.id = a.user_id
    LEFT JOIN public.achievements ac ON u.id = ac.user_id
    WHERE u.id = p_user_id
    GROUP BY u.id;
    
    -- Create backup record
    INSERT INTO public.backups (user_id, backup_type, backup_data, file_size, description)
    VALUES (
        p_user_id,
        p_backup_type,
        v_backup_data,
        octet_length(v_backup_data::text),
        p_description
    )
    RETURNING id INTO v_backup_id;
    
    RETURN v_backup_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore backup
CREATE OR REPLACE FUNCTION restore_backup(
    p_user_id UUID,
    p_backup_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_backup_data JSONB;
BEGIN
    -- Get backup data
    SELECT backup_data INTO v_backup_data
    FROM public.backups
    WHERE id = p_backup_id AND user_id = p_user_id;
    
    IF v_backup_data IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Note: Actual restoration logic would be more complex
    -- This is a simplified version for demonstration
    -- In production, you'd need to handle conflicts and merging
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 11. INITIAL DATA (Optional)
-- ==========================================

-- Insert default achievement types
CREATE TABLE IF NOT EXISTS public.achievement_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    points INTEGER DEFAULT 10,
    criteria JSONB
);

INSERT INTO public.achievement_types (name, description, icon, criteria) VALUES
    ('first_task', '첫 작업 완료', '🎯', '{"tasks_completed": 1}'),
    ('pomodoro_master', '포모도로 마스터', '🍅', '{"pomodoros_completed": 100}'),
    ('streak_week', '일주일 연속 사용', '🔥', '{"streak_days": 7}'),
    ('early_bird', '얼리버드', '🌅', '{"morning_sessions": 20}'),
    ('night_owl', '올빼미', '🦉', '{"night_sessions": 20}'),
    ('focus_champion', '집중 챔피언', '🏆', '{"focus_hours": 50}'),
    ('task_crusher', '작업 분쇄기', '💪', '{"tasks_completed": 100}')
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- 12. GRANT PERMISSIONS
-- ==========================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant limited permissions to anonymous users (for public data only)
GRANT SELECT ON public.achievement_types TO anon;

-- ==========================================
-- END OF SCHEMA
-- ==========================================