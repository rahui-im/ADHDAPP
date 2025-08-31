-- ============================================
-- ADHD Task Manager - Complete Reset & Create Schema
-- Version: 3.0.0
-- Created: 2025-01-01
-- WARNING: This will DELETE all existing data!
-- ============================================

-- Step 1: Drop everything first (CASCADE will handle dependencies)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Step 2: Grant permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- Step 3: Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA public;

-- ==========================================
-- CREATE ALL TABLES
-- ==========================================

-- 1. USERS TABLE
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

-- 2. TASKS TABLE
CREATE TABLE public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    estimated_duration INTEGER NOT NULL CHECK (estimated_duration > 0),
    actual_duration INTEGER,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    category TEXT DEFAULT '기타',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'postponed', 'cancelled')),
    energy_level TEXT DEFAULT 'medium' CHECK (energy_level IN ('low', 'medium', 'high')),
    is_flexible BOOLEAN DEFAULT true,
    postponed_count INTEGER DEFAULT 0,
    subtasks JSONB DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT '{}',
    attachments JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    scheduled_for DATE,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SESSIONS TABLE
CREATE TABLE public.sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('focus', 'short-break', 'long-break')),
    planned_duration INTEGER NOT NULL,
    actual_duration INTEGER,
    energy_level TEXT CHECK (energy_level IN ('low', 'medium', 'high')),
    focus_quality INTEGER CHECK (focus_quality >= 1 AND focus_quality <= 5),
    interrupted BOOLEAN DEFAULT false,
    interruptions JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ANALYTICS TABLE
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
    UNIQUE(user_id, date)
);

-- 5. PATTERNS TABLE
CREATE TABLE public.patterns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pattern_type TEXT NOT NULL CHECK (pattern_type IN (
        'productivity_time', 'energy_pattern', 'task_completion', 
        'interruption_pattern', 'break_preference', 'focus_duration'
    )),
    pattern_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ACHIEVEMENTS TABLE
CREATE TABLE public.achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    achievement_type TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    achievement_description TEXT,
    progress INTEGER DEFAULT 0,
    target INTEGER NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    earned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BACKUPS TABLE
CREATE TABLE public.backups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    backup_type TEXT NOT NULL CHECK (backup_type IN ('manual', 'automatic')),
    backup_data JSONB NOT NULL,
    file_size INTEGER,
    version TEXT NOT NULL DEFAULT '1.0.0',
    restored_at TIMESTAMPTZ,
    restore_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. NOTIFICATIONS TABLE
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

-- ==========================================
-- CREATE INDEXES
-- ==========================================

-- Users indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_last_active ON public.users(last_active_at DESC);

-- Tasks indexes
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_scheduled ON public.tasks(scheduled_for);
CREATE INDEX idx_tasks_created ON public.tasks(created_at DESC);
CREATE INDEX idx_tasks_user_status ON public.tasks(user_id, status);

-- Sessions indexes
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_task_id ON public.sessions(task_id);
CREATE INDEX idx_sessions_started ON public.sessions(started_at DESC);
CREATE INDEX idx_sessions_type ON public.sessions(type);

-- Analytics indexes
CREATE INDEX idx_analytics_user_id ON public.analytics(user_id);
CREATE INDEX idx_analytics_date ON public.analytics(date DESC);
CREATE INDEX idx_analytics_user_date ON public.analytics(user_id, date DESC);

-- Patterns indexes
CREATE INDEX idx_patterns_user_id ON public.patterns(user_id);
CREATE INDEX idx_patterns_type ON public.patterns(pattern_type);
CREATE INDEX idx_patterns_active ON public.patterns(user_id, is_active);

-- Achievements indexes
CREATE INDEX idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX idx_achievements_completed ON public.achievements(user_id, is_completed);

-- Backups indexes
CREATE INDEX idx_backups_user_id ON public.backups(user_id);
CREATE INDEX idx_backups_created ON public.backups(created_at DESC);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_scheduled ON public.notifications(scheduled_for);

-- ==========================================
-- CREATE FUNCTIONS
-- ==========================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- CREATE TRIGGERS
-- ==========================================

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_updated_at 
    BEFORE UPDATE ON public.analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patterns_updated_at 
    BEFORE UPDATE ON public.patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- ENABLE ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- CREATE RLS POLICIES
-- ==========================================

-- Users policies
CREATE POLICY "Users can view own data" ON public.users
    FOR ALL USING (auth.uid() = id);

-- Tasks policies
CREATE POLICY "Users can manage own tasks" ON public.tasks
    FOR ALL USING (auth.uid() = user_id);

-- Sessions policies
CREATE POLICY "Users can manage own sessions" ON public.sessions
    FOR ALL USING (auth.uid() = user_id);

-- Analytics policies
CREATE POLICY "Users can view own analytics" ON public.analytics
    FOR ALL USING (auth.uid() = user_id);

-- Patterns policies
CREATE POLICY "Users can view own patterns" ON public.patterns
    FOR ALL USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Users can view own achievements" ON public.achievements
    FOR ALL USING (auth.uid() = user_id);

-- Backups policies
CREATE POLICY "Users can manage own backups" ON public.backups
    FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can manage own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- CREATE VIEWS
-- ==========================================

-- Today's tasks view
CREATE VIEW today_tasks AS
SELECT t.*
FROM public.tasks t
WHERE (t.scheduled_for = CURRENT_DATE OR t.status = 'in-progress')
ORDER BY t.priority DESC, t.created_at ASC;

-- Weekly statistics view
CREATE VIEW weekly_stats AS
SELECT 
    user_id,
    DATE_TRUNC('week', date) as week_start,
    SUM(tasks_completed) as total_tasks_completed,
    SUM(total_focus_time) as total_focus_minutes,
    AVG(average_energy_level) as avg_energy_level,
    SUM(completed_pomodoros) as total_pomodoros
FROM public.analytics
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY user_id, DATE_TRUNC('week', date);

-- User productivity summary
CREATE VIEW user_productivity AS
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
    COALESCE(AVG(s.focus_quality), 0) as avg_focus_quality,
    COALESCE(SUM(s.actual_duration), 0) as total_focus_time
FROM public.users u
LEFT JOIN public.tasks t ON u.id = t.user_id
LEFT JOIN public.sessions s ON u.id = s.user_id
GROUP BY u.id, u.name, u.email;

-- ==========================================
-- INSERT SAMPLE DATA (Optional)
-- ==========================================

-- Create a test user (commented out by default)
/*
INSERT INTO public.users (email, name) 
VALUES ('test@example.com', 'Test User')
ON CONFLICT (email) DO NOTHING;
*/

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Check tables
SELECT 
    'Schema creation complete!' as message,
    COUNT(*) as table_count,
    NOW() as created_at
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- List all created tables with row counts
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check indexes
SELECT 
    COUNT(*) as total_indexes
FROM pg_indexes
WHERE schemaname = 'public';

-- Check policies
SELECT 
    COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public';