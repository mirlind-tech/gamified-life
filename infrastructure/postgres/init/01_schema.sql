-- Mirlind Life OS - PostgreSQL Schema
-- ===================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- CORE IDENTITY
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    role VARCHAR(20) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ
);

CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'cyberpunk',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    notifications_enabled BOOLEAN DEFAULT true,
    privacy_level VARCHAR(20) DEFAULT 'normal',
    settings_json JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(100),
    device_type VARCHAR(20),
    device_id VARCHAR(255) UNIQUE NOT NULL,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    push_token TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES user_devices(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

-- ============================================
-- GAMIFICATION
-- ============================================

CREATE TABLE gamification_stats (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    xp_total BIGINT DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak_days INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    streak_start_date DATE,
    last_streak_broken_at TIMESTAMPTZ,
    achievements_count INTEGER DEFAULT 0,
    missions_completed INTEGER DEFAULT 0,
    challenges_completed INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE xp_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    xp_amount INTEGER NOT NULL,
    source VARCHAR(50) NOT NULL,
    source_id UUID,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    rarity VARCHAR(20) DEFAULT 'common'
);

-- ============================================
-- 5 PILLARS - BODY
-- ============================================

CREATE TABLE body_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    measured_at TIMESTAMPTZ DEFAULT NOW(),
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    body_fat_pct DECIMAL(5,2),
    biceps_cm DECIMAL(5,2),
    chest_cm DECIMAL(5,2),
    waist_cm DECIMAL(5,2),
    thighs_cm DECIMAL(5,2),
    calves_cm DECIMAL(5,2),
    shoulders_cm DECIMAL(5,2),
    neck_cm DECIMAL(5,2),
    notes TEXT,
    source VARCHAR(20) DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workout_name VARCHAR(200),
    workout_type VARCHAR(50),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    exercises JSONB DEFAULT '[]',
    total_volume_kg DECIMAL(8,2),
    calories_burned INTEGER,
    perceived_effort INTEGER CHECK (perceived_effort BETWEEN 1 AND 10),
    notes TEXT,
    source VARCHAR(20) DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE body_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    photo_type VARCHAR(20),
    photo_url TEXT NOT NULL,
    taken_at TIMESTAMPTZ DEFAULT NOW(),
    weight_at_time DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5 PILLARS - MIND
-- ============================================

CREATE TABLE meditation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_type VARCHAR(50),
    duration_minutes INTEGER NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed BOOLEAN DEFAULT true,
    mood_before INTEGER CHECK (mood_before BETWEEN 1 AND 10),
    mood_after INTEGER CHECK (mood_after BETWEEN 1 AND 10),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    gratitude TEXT[],
    intentions TEXT[],
    reflections TEXT,
    mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
    energy_score INTEGER CHECK (energy_score BETWEEN 1 AND 10),
    focus_score INTEGER CHECK (focus_score BETWEEN 1 AND 10),
    sentiment VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, entry_date)
);

CREATE TABLE principle_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    principle_number INTEGER NOT NULL CHECK (principle_number BETWEEN 1 AND 12),
    principle_name VARCHAR(100),
    unlocked_at TIMESTAMPTZ,
    completed_lessons INTEGER DEFAULT 0,
    quiz_score INTEGER,
    times_applied INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, principle_number)
);

-- ============================================
-- 5 PILLARS - GERMAN
-- ============================================

CREATE TABLE german_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    anki_cards_reviewed INTEGER,
    anki_new_cards INTEGER,
    anki_time_seconds INTEGER,
    listening_material VARCHAR(200),
    tandem_partner VARCHAR(100),
    topics_discussed TEXT[],
    output_type VARCHAR(50),
    words_written INTEGER,
    new_words_learned INTEGER DEFAULT 0,
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
    notes TEXT,
    source VARCHAR(20) DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE german_vocabulary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    word_de VARCHAR(100) NOT NULL,
    word_en VARCHAR(100) NOT NULL,
    word_type VARCHAR(20),
    gender VARCHAR(10),
    example_sentence TEXT,
    source VARCHAR(100),
    learned_at TIMESTAMPTZ,
    review_count INTEGER DEFAULT 0,
    last_reviewed_at TIMESTAMPTZ,
    next_review_at TIMESTAMPTZ,
    ease_factor DECIMAL(3,2) DEFAULT 2.5,
    interval_days INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE german_exam_progress (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    target_exam_date DATE,
    estimated_readiness INTEGER CHECK (estimated_readiness BETWEEN 0 AND 100),
    listening_level VARCHAR(10),
    reading_level VARCHAR(10),
    writing_level VARCHAR(10),
    speaking_level VARCHAR(10),
    grammar_level VARCHAR(10),
    checkpoint_a1_passed BOOLEAN DEFAULT false,
    checkpoint_a2_passed BOOLEAN DEFAULT false,
    checkpoint_b1_ready BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5 PILLARS - CODE
-- ============================================

CREATE TABLE coding_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_name VARCHAR(200),
    language VARCHAR(50),
    session_type VARCHAR(50),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    lines_written INTEGER,
    lines_deleted INTEGER,
    commits_made INTEGER,
    files_changed INTEGER,
    topic_studied VARCHAR(200),
    resources_used TEXT[],
    test_coverage DECIMAL(5,2),
    bugs_fixed INTEGER,
    notes TEXT,
    source VARCHAR(20) DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE code_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    skill_category VARCHAR(50),
    proficiency_level INTEGER CHECK (proficiency_level BETWEEN 0 AND 100),
    hours_practiced INTEGER DEFAULT 0,
    projects_completed INTEGER DEFAULT 0,
    last_practiced_at TIMESTAMPTZ,
    started_learning_at TIMESTAMPTZ,
    target_level INTEGER DEFAULT 80,
    is_job_relevant BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, skill_name)
);

CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(200),
    position_title VARCHAR(200),
    job_url TEXT,
    location VARCHAR(200),
    salary_range VARCHAR(100),
    applied_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'saved',
    contact_person VARCHAR(200),
    notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5 PILLARS - FINANCE
-- ============================================

CREATE TABLE finance_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entry_type VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    description TEXT,
    entry_date DATE NOT NULL,
    is_essential BOOLEAN,
    payment_method VARCHAR(50),
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(50),
    receipt_url TEXT,
    location VARCHAR(200),
    tags TEXT[],
    source VARCHAR(20) DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE finance_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    monthly_income DECIMAL(10,2),
    income_currency VARCHAR(3) DEFAULT 'EUR',
    income_frequency VARCHAR(20) DEFAULT 'monthly',
    monthly_fixed_costs DECIMAL(10,2),
    fixed_costs_breakdown JSONB,
    food_budget DECIMAL(10,2),
    discretionary_budget DECIMAL(10,2),
    savings_goal_amount DECIMAL(10,2),
    savings_goal_target_date DATE,
    current_savings DECIMAL(10,2) DEFAULT 0,
    monthly_savings_target DECIMAL(10,2),
    auto_categorization_enabled BOOLEAN DEFAULT true,
    budget_alerts_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_name VARCHAR(100),
    wallet_type VARCHAR(20),
    blockchain VARCHAR(20),
    address VARCHAR(255) UNIQUE NOT NULL,
    public_key TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20),
    tx_hash VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    from_address VARCHAR(255),
    to_address VARCHAR(255),
    amount DECIMAL(20,8),
    token_symbol VARCHAR(20),
    fee_amount DECIMAL(20,8),
    fee_token VARCHAR(20),
    memo TEXT,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROTOCOL & PLANNING
-- ============================================

CREATE TABLE daily_protocol (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    protocol_date DATE NOT NULL,
    target_wake_time TIME,
    actual_wake_time TIME,
    target_sleep_time TIME,
    actual_sleep_time TIME,
    sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 10),
    german_completed BOOLEAN DEFAULT false,
    german_duration_minutes INTEGER,
    gym_completed BOOLEAN DEFAULT false,
    gym_workout_id UUID REFERENCES workouts(id),
    coding_completed BOOLEAN DEFAULT false,
    coding_duration_minutes INTEGER,
    coding_session_id UUID REFERENCES coding_sessions(id),
    protocol_score INTEGER,
    notes TEXT,
    mood_morning INTEGER,
    mood_evening INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, protocol_date)
);

CREATE TABLE weekly_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    body_objective TEXT,
    mind_objective TEXT,
    german_objective TEXT,
    code_objective TEXT,
    finance_objective TEXT,
    daily_actions JSONB DEFAULT '[]',
    target_german_hours DECIMAL(4,2),
    target_coding_hours DECIMAL(4,2),
    target_workouts INTEGER,
    target_savings DECIMAL(10,2),
    ai_generated BOOLEAN DEFAULT false,
    ai_prompt TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

CREATE TABLE weekly_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    wins TEXT[],
    failures TEXT[],
    lessons TEXT[],
    overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 60),
    body_score INTEGER CHECK (body_score BETWEEN 0 AND 10),
    mind_score INTEGER CHECK (mind_score BETWEEN 0 AND 10),
    german_score INTEGER CHECK (german_score BETWEEN 0 AND 10),
    code_score INTEGER CHECK (code_score BETWEEN 0 AND 10),
    finance_score INTEGER CHECK (finance_score BETWEEN 0 AND 10),
    protocol_score INTEGER CHECK (protocol_score BETWEEN 0 AND 10),
    ai_insights TEXT,
    pattern_analysis JSONB,
    recommendations TEXT[],
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

-- ============================================
-- AI & MESSAGING
-- ============================================

CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200),
    conversation_type VARCHAR(50),
    model_used VARCHAR(50) DEFAULT 'local-llama',
    messages JSONB DEFAULT '[]',
    related_domain VARCHAR(20),
    related_entity_id UUID,
    message_count INTEGER DEFAULT 0,
    tokens_used INTEGER,
    user_satisfaction INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_type VARCHAR(20),
    name VARCHAR(200),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_participants (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_message_id UUID,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    message_type VARCHAR(20) DEFAULT 'text',
    content TEXT,
    encrypted_payload TEXT,
    reply_to_id UUID REFERENCES messages(id),
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(refresh_token_hash);

-- Tracking indexes
CREATE INDEX idx_daily_protocol_user_date ON daily_protocol(user_id, protocol_date);
CREATE INDEX idx_weekly_plans_user_week ON weekly_plans(user_id, week_start);
CREATE INDEX idx_weekly_reviews_user_week ON weekly_reviews(user_id, week_start);
CREATE INDEX idx_body_measurements_user_date ON body_measurements(user_id, measured_at);
CREATE INDEX idx_workouts_user_date ON workouts(user_id, started_at);
CREATE INDEX idx_german_sessions_user_date ON german_sessions(user_id, started_at);
CREATE INDEX idx_coding_sessions_user_date ON coding_sessions(user_id, started_at);
CREATE INDEX idx_finance_entries_user_date ON finance_entries(user_id, entry_date);
CREATE INDEX idx_xp_history_user_date ON xp_history(user_id, created_at);

-- Message indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);

-- ============================================
-- UPDATED AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gamification_stats_updated_at BEFORE UPDATE ON gamification_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_principle_progress_updated_at BEFORE UPDATE ON principle_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_german_vocabulary_updated_at BEFORE UPDATE ON german_vocabulary 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_german_exam_progress_updated_at BEFORE UPDATE ON german_exam_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_code_skills_updated_at BEFORE UPDATE ON code_skills 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finance_profiles_updated_at BEFORE UPDATE ON finance_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_protocol_updated_at BEFORE UPDATE ON daily_protocol 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_plans_updated_at BEFORE UPDATE ON weekly_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_reviews_updated_at BEFORE UPDATE ON weekly_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default admin user (password: admin123 - change in production!)
-- Password hash is bcrypt of "admin123"
INSERT INTO users (id, email, username, password_hash, display_name, role)
VALUES (
    uuid_generate_v4(),
    'admin@mirlind.io',
    'admin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA.qGZvKG6G',
    'System Administrator',
    'admin'
);
