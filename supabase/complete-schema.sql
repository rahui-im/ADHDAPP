-- ============================================
-- ADHD Task Manager - Complete Database Schema
-- Version: 2.0.0
-- Created: 2025-01-01
-- For Supabase SQL Editor
-- ============================================

-- Drop existing tables if needed (be careful in production!)
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ==========================================
-- 1. USERS TABLE (Core user information)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    
    -- User preferences as JSONB
    preferences JSONB DEFAULT '{
        "defaultFocusDuration": 25,
        "defaultBreakDuration": 5,
        "preferredTaskCategories": ["업무", "개인", "학습", "운동"],
        "energyTrackingEnabled": true,
        "notificationsEnabled": true
    }'::jsonb NOT NULL,
    
    -- User settings as JSONB
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
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_last_active ON public.users(last_active_at DESC);

-- ==========================================
-- 2. TASKS TABLE (Main task management)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Basic task information
    title TEXT NOT NULL,
    description TEXT,
    estimated_duration INTEGER NOT NULL CHECK (estimated_duration > 0), -- in minutes
    actual_duration INTEGER, -- in minutes
    
    -- Task metadata
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    category TEXT DEFAULT '기타',
    status TEXT CHECK (status IN ('pending', 'in-progress', 'completed', 'postponed', 'cancelled')) DEFAULT 'pending',
    
    -- ADHD-specific fields
    energy_level TEXT CHECK (energy_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
    is_flexible BOOLEAN DEFAULT true,
    postponed_count INTEGER DEFAULT 0,
    
    -- Subtasks stored as JSONB array
    subtasks JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    scheduled_for DATE,
    due_date DATE,
    
    -- Additional metadata
    tags TEXT[] DEFAULT '{}',
    attachments JSONB DEFAULT '[]'::jsonb,
    notes TEXT
);

-- Indexes for tasks
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_scheduled ON public.tasks(scheduled_for);
CREATE INDEX idx_tasks_created ON public.tasks(created_at DESC);
CREATE INDEX idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX idx_tasks_search ON public.tasks USING gin(to_tsvector('simple', title || ' ' || COALESCE(description, '')));

-- ==========================================
-- 3. SESSIONS TABLE (Timer sessions)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    
    -- Session details
    type TEXT CHECK (type IN ('focus', 'short-break', 'long-break')) NOT NULL,
    planned_duration INTEGER NOT NULL, -- in minutes
    actual_duration INTEGER, -- in minutes
    
    -- Session metadata
    energy_level TEXT CHECK (energy_level IN ('low', 'medium', 'high')),
    focus_quality INTEGER CHECK (focus_quality >= 1 AND focus_quality <= 5),
    
    -- Interruptions tracking
    interrupted BOOLEAN DEFAULT false,
    interruptions JSONB DEFAULT '[]'::jsonb, -- Array of interruption objects
    
    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    
    -- Notes
    notes TEXT
);

-- Indexes for sessions
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_task_id ON public.sessions(task_id);
CREATE INDEX idx_sessions_started ON public.sessions(started_at DESC);
CREATE INDEX idx_sessions_type ON public.sessions(type);
CREATE INDEX idx_sessions_user_date ON public.sessions(user_id, started_at DESC);

-- ==========================================
-- 4. ANALYTICS TABLE (Daily aggregated data)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Daily metrics
    tasks_created INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    tasks_postponed INTEGER DEFAULT 0,
    
    -- Time metrics (in minutes)
    total_focus_time INTEGER DEFAULT 0,
    total_break_time INTEGER DEFAULT 0,
    longest_focus_session INTEGER DEFAULT 0,
    
    -- Session counts
    focus_sessions_count INTEGER DEFAULT 0,
    completed_pomodoros INTEGER DEFAULT 0,
    
    -- ADHD-specific metrics
    average_energy_level DECIMAL(3,2),
    interruption_count INTEGER DEFAULT 0,
    
    -- Patterns
    most_productive_hour INTEGER, -- 0-23
    preferred_session_duration INTEGER,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one record per user per day
    CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- Indexes for analytics
CREATE INDEX idx_analytics_user_id ON public.analytics(user_id);
CREATE INDEX idx_analytics_date ON public.analytics(date DESC);
CREATE INDEX idx_analytics_user_date ON public.analytics(user_id, date DESC);

-- ==========================================
-- 5. PATTERNS TABLE (User behavior patterns)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.patterns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Pattern identification
    pattern_type TEXT NOT NULL CHECK (pattern_type IN (
        'productivity_time', 'energy_pattern', 'task_completion', 
        'interruption_pattern', 'break_preference', 'focus_duration'
    )),
    
    -- Pattern data
    pattern_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Validity
    valid_from DATE NOT NULL,
    valid_until DATE,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for patterns
CREATE INDEX idx_patterns_user_id ON public.patterns(user_id);
CREATE INDEX idx_patterns_type ON public.patterns(pattern_type);
CREATE INDEX idx_patterns_active ON public.patterns(user_id, is_active);

-- ==========================================
-- 6. ACHIEVEMENTS TABLE (Gamification)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Achievement details
    achievement_type TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    achievement_description TEXT,
    
    -- Progress
    progress INTEGER DEFAULT 0,
    target INTEGER NOT NULL,
    completed BOOLEAN DEFAULT false,
    
    -- Timestamps
    earned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for achievements
CREATE INDEX idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX idx_achievements_completed ON public.achievements(user_id, completed);

-- ==========================================
-- 7. BACKUPS TABLE (Data backup tracking)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.backups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Backup details
    backup_type TEXT CHECK (backup_type IN ('manual', 'automatic')) NOT NULL,
    backup_data JSONB NOT NULL,
    file_size INTEGER, -- in bytes
    
    -- Metadata
    version TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Restore information
    restored_at TIMESTAMPTZ,
    restore_count INTEGER DEFAULT 0
);

-- Indexes for backups
CREATE INDEX idx_backups_user_id ON public.backups(user_id);
CREATE INDEX idx_backups_created ON public.backups(created_at DESC);

-- ==========================================
-- 8. NOTIFICATIONS TABLE (Notification queue)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Notification details
    type TEXT NOT NULL CHECK (type IN (
        'task_reminder', 'break_reminder', 'daily_summary', 
        'achievement_earned', 'goal_update', 'system'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    is_delivered BOOLEAN DEFAULT false,
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    
    -- Metadata
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_scheduled ON public.notifications(scheduled_for);

-- ==========================================
-- FUNCTIONS AND TRIGGERS
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

CREATE TRIGGER update_patterns_updated_at BEFORE UPDATE ON public.patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create daily analytics record
CREATE OR REPLACE FUNCTION create_daily_analytics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.analytics (user_id, date)
    VALUES (NEW.user_id, CURRENT_DATE)
    ON CONFLICT (user_id, date) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create analytics record when user is created
CREATE TRIGGER create_analytics_on_user_create
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION create_daily_analytics();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view own tasks" ON public.tasks
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions" ON public.sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analytics" ON public.analytics
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own patterns" ON public.patterns
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own achievements" ON public.achievements
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own backups" ON public.backups
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- VIEWS FOR COMMON QUERIES
-- ==========================================

-- View for today's tasks
CREATE OR REPLACE VIEW today_tasks AS
SELECT t.*
FROM public.tasks t
WHERE t.scheduled_for = CURRENT_DATE
   OR (t.status = 'in-progress')
ORDER BY t.priority DESC, t.created_at ASC;

-- View for weekly statistics
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
-- INITIAL DATA (Optional)
-- ==========================================

-- Insert default achievement types
INSERT INTO public.achievements (user_id, achievement_type, achievement_name, achievement_description, target)
SELECT 
    id,
    'first_task',
    'First Step',
    'Complete your first task',
    1
FROM public.users
ON CONFLICT DO NOTHING;

-- ==========================================
-- GRANTS (Adjust based on your needs)
-- ==========================================

-- Grant necessary permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant read access to anonymous users for public data (if needed)
-- GRANT SELECT ON public.some_public_table TO anon;

-- ==========================================
-- COMMENTS FOR DOCUMENTATION
-- ==========================================

COMMENT ON TABLE public.users IS 'Core user information and preferences';
COMMENT ON TABLE public.tasks IS 'Task management with ADHD-specific features';
COMMENT ON TABLE public.sessions IS 'Timer sessions tracking focus and break periods';
COMMENT ON TABLE public.analytics IS 'Daily aggregated analytics data';
COMMENT ON TABLE public.patterns IS 'User behavior patterns for intelligent recommendations';
COMMENT ON TABLE public.achievements IS 'Gamification and achievement tracking';
COMMENT ON TABLE public.backups IS 'User data backup history';
COMMENT ON TABLE public.notifications IS 'Notification queue and history';

-- ==========================================
-- END OF SCHEMA
-- ==========================================

-- Verify installation
SELECT 
    'Schema created successfully!' as message,
    COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';