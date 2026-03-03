# Database Migration Guide

> Preserving all current functionality while upgrading to PostgreSQL

---

## Current SQLite Schema Analysis

Based on the existing backend routes, here's what we're working with:

### Current Tables (Inferred)

```sql
-- From backend/src/routes/auth.ts
users (id, email, password_hash, created_at)
sessions (id, user_id, token, expires_at)

-- From backend/src/routes/player.ts
player_stats (user_id, xp_total, level, streak_days, created_at)

-- From backend/src/routes/body.ts
body_measurements (id, user_id, date, weight, measurements_json)
workouts (id, user_id, date, exercises_json, notes)

-- From backend/src/routes/german.ts
german_progress (user_id, anki_cards, hours_listening, tandem_sessions)
german_vocabulary (id, user_id, word, learned_date)

-- From backend/src/routes/code.ts
coding_sessions (id, user_id, date, project, hours, commits)
code_skills (user_id, skill_name, progress_percent)

-- From backend/src/routes/finance.ts
finance_entries (id, user_id, date, category, amount, description)
finance_profile (user_id, income, fixed_costs, savings_goal)

-- From backend/src/routes/protocol.ts
daily_protocol (id, user_id, date, wake_time, sleep_time, tasks_completed)

-- From backend/src/routes/weekly.ts
weekly_plans (id, user_id, week_start, objectives_json, actions_json)
weekly_reviews (id, user_id, week_start, wins, failures, lessons, score)

-- From backend/src/routes/outcomes.ts
outcome_scores (user_id, week_start, body_score, mind_score, german_score, code_score, finance_score, protocol_score)

-- From backend/src/routes/coach.ts
ai_conversations (id, user_id, messages_json, created_at)

-- From backend/src/routes/telemetry.ts
telemetry (id, user_id, event_type, event_data, timestamp)
```

---

## PostgreSQL Schema (Enhanced)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE IDENTITY (Preserved + Enhanced)
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
    last_active_at TIMESTAMPTZ,
    -- Migration: Copy from users table
    -- Enhanced: Added username, display_name, avatar, bio
);

-- User settings (NEW - replaces hardcoded config)
CREATE TABLE user_settings (
    user_id UUID PRIMARY REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'cyberpunk',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    notifications_enabled BOOLEAN DEFAULT true,
    privacy_level VARCHAR(20) DEFAULT 'normal',
    settings_json JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Device management (NEW - for multi-device sync)
CREATE TABLE user_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(100),
    device_type VARCHAR(20), -- web, ios, android, desktop
    device_id VARCHAR(255) UNIQUE NOT NULL,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    push_token TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions (Enhanced from current sessions)
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
-- GAMIFICATION (Preserved + Enhanced)
-- ============================================

-- XP and leveling (from player_stats)
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
    -- Migration: Copy from player_stats
);

-- XP history (detailed tracking)
CREATE TABLE xp_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    xp_amount INTEGER NOT NULL,
    source VARCHAR(50) NOT NULL, -- daily_quest, pillar, principle, challenge, skill
    source_id UUID, -- reference to specific activity
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
    -- Migration: Can be rebuilt from existing tracking tables
);

-- Achievements/Badges
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
-- 5 PILLARS - BODY (Preserved + Enhanced)
-- ============================================

-- Body measurements (from body_measurements)
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
    source VARCHAR(20) DEFAULT 'manual', -- manual, wearable, smart_scale
    created_at TIMESTAMPTZ DEFAULT NOW()
    -- Migration: Parse measurements_json into individual columns
);

-- Workouts (from workouts)
CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workout_name VARCHAR(200),
    workout_type VARCHAR(50), -- strength, cardio, hiit, flexibility
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    exercises JSONB DEFAULT '[]', -- [{name, sets, reps, weight}]
    total_volume_kg DECIMAL(8,2), -- calculated from exercises
    calories_burned INTEGER,
    perceived_effort INTEGER CHECK (perceived_effort BETWEEN 1 AND 10),
    notes TEXT,
    source VARCHAR(20) DEFAULT 'manual', -- manual, wearable, app_import
    created_at TIMESTAMPTZ DEFAULT NOW()
    -- Migration: Parse exercises_json, calculate duration from dates
);

-- Body photos progress
CREATE TABLE body_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    photo_type VARCHAR(20), -- front, side, back
    photo_url TEXT NOT NULL,
    taken_at TIMESTAMPTZ DEFAULT NOW(),
    weight_at_time DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5 PILLARS - MIND (Preserved + Enhanced)
-- ============================================

-- Meditation sessions
CREATE TABLE meditation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_type VARCHAR(50), -- guided, unguided, breathing
    duration_minutes INTEGER NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed BOOLEAN DEFAULT true,
    mood_before INTEGER CHECK (mood_before BETWEEN 1 AND 10),
    mood_after INTEGER CHECK (mood_after BETWEEN 1 AND 10),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal entries
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    gratitude TEXT[], -- 3 things
    intentions TEXT[],
    reflections TEXT,
    mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
    energy_score INTEGER CHECK (energy_score BETWEEN 1 AND 10),
    focus_score INTEGER CHECK (focus_score BETWEEN 1 AND 10),
    sentiment VARCHAR(20), -- positive, neutral, negative (AI-analyzed)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, entry_date)
);

-- Fang Yuan principles progress
CREATE TABLE principle_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    principle_number INTEGER NOT NULL CHECK (principle_number BETWEEN 1 AND 12),
    principle_name VARCHAR(100),
    unlocked_at TIMESTAMPTZ,
    completed_lessons INTEGER DEFAULT 0,
    quiz_score INTEGER,
    times_applied INTEGER DEFAULT 0, -- user counts how many times they applied it
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, principle_number)
);

-- ============================================
-- 5 PILLARS - GERMAN (Preserved + Enhanced)
-- ============================================

-- German study sessions (from german_progress)
CREATE TABLE german_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL, -- anki, listening, reading, tandem, lesson, output
    duration_minutes INTEGER NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Anki-specific
    anki_cards_reviewed INTEGER,
    anki_new_cards INTEGER,
    anki_time_seconds INTEGER,
    
    -- Listening-specific
    listening_material VARCHAR(200), -- podcast name, radio station, etc
    
    -- Tandem-specific
    tandem_partner VARCHAR(100),
    topics_discussed TEXT[],
    
    -- Output-specific
    output_type VARCHAR(50), -- writing, speaking
    words_written INTEGER,
    
    -- General
    new_words_learned INTEGER DEFAULT 0,
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
    notes TEXT,
    source VARCHAR(20) DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW()
    -- Migration: Map from german_progress fields
);

-- Vocabulary tracking
CREATE TABLE german_vocabulary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    word_de VARCHAR(100) NOT NULL,
    word_en VARCHAR(100) NOT NULL,
    word_type VARCHAR(20), -- noun, verb, adjective
    gender VARCHAR(10), -- der, die, das (for nouns)
    example_sentence TEXT,
    source VARCHAR(100), -- where you encountered it
    learned_at TIMESTAMPTZ,
    review_count INTEGER DEFAULT 0,
    last_reviewed_at TIMESTAMPTZ,
    next_review_at TIMESTAMPTZ,
    ease_factor DECIMAL(3,2) DEFAULT 2.5, -- SM-2 algorithm
    interval_days INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- B1 exam tracking
CREATE TABLE german_exam_progress (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    target_exam_date DATE,
    estimated_readiness INTEGER CHECK (estimated_readiness BETWEEN 0 AND 100),
    
    -- Skill breakdown
    listening_level VARCHAR(10), -- A1, A2, B1, etc
    reading_level VARCHAR(10),
    writing_level VARCHAR(10),
    speaking_level VARCHAR(10),
    grammar_level VARCHAR(10),
    
    -- Checkpoints
    checkpoint_a1_passed BOOLEAN DEFAULT false,
    checkpoint_a2_passed BOOLEAN DEFAULT false,
    checkpoint_b1_ready BOOLEAN DEFAULT false,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5 PILLARS - CODE (Preserved + Enhanced)
-- ============================================

-- Coding sessions (from coding_sessions)
CREATE TABLE coding_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_name VARCHAR(200),
    language VARCHAR(50),
    session_type VARCHAR(50), -- learning, building, debugging, reviewing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    
    -- Output
    lines_written INTEGER,
    lines_deleted INTEGER,
    commits_made INTEGER,
    files_changed INTEGER,
    
    -- Learning
    topic_studied VARCHAR(200),
    resources_used TEXT[],
    
    -- Quality
    test_coverage DECIMAL(5,2),
    bugs_fixed INTEGER,
    
    notes TEXT,
    source VARCHAR(20) DEFAULT 'manual', -- manual, ide_integration, github
    created_at TIMESTAMPTZ DEFAULT NOW()
    -- Migration: Calculate duration from start/end dates
);

-- Tech stack curriculum progress
CREATE TABLE code_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    skill_category VARCHAR(50), -- language, framework, tool, concept
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

-- Job hunt tracking
CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(200),
    position_title VARCHAR(200),
    job_url TEXT,
    location VARCHAR(200),
    salary_range VARCHAR(100),
    applied_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'saved', -- saved, applied, interview, offer, rejected
    contact_person VARCHAR(200),
    notes TEXT,
    follow_up_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5 PILLARS - FINANCE (Preserved + Enhanced)
-- ============================================

-- Finance entries (from finance_entries)
CREATE TABLE finance_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entry_type VARCHAR(20) NOT NULL, -- income, expense, saving
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    description TEXT,
    entry_date DATE NOT NULL,
    
    -- Expense-specific
    is_essential BOOLEAN, -- for budget analysis
    payment_method VARCHAR(50), -- cash, card, crypto
    
    -- Recurring
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(50), -- monthly, yearly
    
    -- Metadata
    receipt_url TEXT,
    location VARCHAR(200),
    tags TEXT[],
    
    source VARCHAR(20) DEFAULT 'manual', -- manual, bank_sync, receipt_scan
    created_at TIMESTAMPTZ DEFAULT NOW()
    -- Migration: Copy from finance_entries
);

-- Finance profile/budget (from finance_profile)
CREATE TABLE finance_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- Income
    monthly_income DECIMAL(10,2),
    income_currency VARCHAR(3) DEFAULT 'EUR',
    income_frequency VARCHAR(20) DEFAULT 'monthly', -- weekly, monthly
    
    -- Fixed costs
    monthly_fixed_costs DECIMAL(10,2),
    fixed_costs_breakdown JSONB, -- {rent: 620, gym: 32, ...}
    
    -- Budget
    food_budget DECIMAL(10,2),
    discretionary_budget DECIMAL(10,2),
    
    -- Savings
    savings_goal_amount DECIMAL(10,2),
    savings_goal_target_date DATE,
    current_savings DECIMAL(10,2) DEFAULT 0,
    monthly_savings_target DECIMAL(10,2),
    
    -- Tracking
    auto_categorization_enabled BOOLEAN DEFAULT true,
    budget_alerts_enabled BOOLEAN DEFAULT true,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
    -- Migration: Copy from finance_profile
);

-- Crypto wallets (NEW)
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_name VARCHAR(100),
    wallet_type VARCHAR(20), -- self_custody, smart_contract
    blockchain VARCHAR(20), -- bitcoin, ethereum, solana
    address VARCHAR(255) UNIQUE NOT NULL,
    public_key TEXT,
    -- Private key is NEVER stored (MPC or encrypted)
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crypto transactions (NEW)
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20), -- send, receive, swap
    tx_hash VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, failed
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
-- PROTOCOL & PLANNING (Preserved + Enhanced)
-- ============================================

-- Daily protocol/check-ins (from daily_protocol)
CREATE TABLE daily_protocol (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    protocol_date DATE NOT NULL,
    
    -- Sleep
    target_wake_time TIME,
    actual_wake_time TIME,
    target_sleep_time TIME,
    actual_sleep_time TIME,
    sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 10),
    
    -- Tasks
    german_completed BOOLEAN DEFAULT false,
    german_duration_minutes INTEGER,
    gym_completed BOOLEAN DEFAULT false,
    gym_workout_id UUID REFERENCES workouts(id),
    coding_completed BOOLEAN DEFAULT false,
    coding_duration_minutes INTEGER,
    coding_session_id UUID REFERENCES coding_sessions(id),
    
    -- Other
    protocol_score INTEGER,
    notes TEXT,
    mood_morning INTEGER,
    mood_evening INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, protocol_date)
    -- Migration: Copy from daily_protocol
);

-- Weekly plans (from weekly_plans)
CREATE TABLE weekly_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    
    -- Objectives for each pillar
    body_objective TEXT,
    mind_objective TEXT,
    german_objective TEXT,
    code_objective TEXT,
    finance_objective TEXT,
    
    -- Daily actions (JSON for flexibility)
    daily_actions JSONB DEFAULT '[]', -- [{day: 'monday', action: '...', completed: false}]
    
    -- Targets
    target_german_hours DECIMAL(4,2),
    target_coding_hours DECIMAL(4,2),
    target_workouts INTEGER,
    target_savings DECIMAL(10,2),
    
    -- AI generation metadata
    ai_generated BOOLEAN DEFAULT false,
    ai_prompt TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, week_start)
    -- Migration: Parse objectives_json into structured fields
);

-- Weekly reviews (from weekly_reviews)
CREATE TABLE weekly_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    
    -- Reflections
    wins TEXT[],
    failures TEXT[],
    lessons TEXT[],
    
    -- Scores
    overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 60),
    body_score INTEGER CHECK (body_score BETWEEN 0 AND 10),
    mind_score INTEGER CHECK (mind_score BETWEEN 0 AND 10),
    german_score INTEGER CHECK (german_score BETWEEN 0 AND 10),
    code_score INTEGER CHECK (code_score BETWEEN 0 AND 10),
    finance_score INTEGER CHECK (finance_score BETWEEN 0 AND 10),
    protocol_score INTEGER CHECK (protocol_score BETWEEN 0 AND 10),
    
    -- Insights (AI-generated)
    ai_insights TEXT,
    pattern_analysis JSONB,
    recommendations TEXT[],
    
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, week_start)
    -- Migration: Copy from weekly_reviews
);

-- ============================================
-- AI & MESSAGING (New + Migration)
-- ============================================

-- AI conversations (from ai_conversations, enhanced)
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200),
    conversation_type VARCHAR(50), -- coaching, planning, analysis, general
    model_used VARCHAR(50) DEFAULT 'local-llama',
    messages JSONB DEFAULT '[]',
    
    -- Context
    related_domain VARCHAR(20), -- body, mind, german, code, finance
    related_entity_id UUID, -- link to workout, session, etc
    
    -- Metrics
    message_count INTEGER DEFAULT 0,
    tokens_used INTEGER,
    user_satisfaction INTEGER, -- 1-5 rating
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
    -- Migration: Copy from ai_conversations
);

-- Messages (for new messaging feature)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_type VARCHAR(20), -- direct, group
    name VARCHAR(200),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_participants (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- member, admin, owner
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_message_id UUID,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    message_type VARCHAR(20) DEFAULT 'text', -- text, image, file, system
    content TEXT,
    encrypted_payload TEXT, -- for E2EE
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

-- Tracking indexes (most queried)
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

-- Full-text search indexes
CREATE INDEX idx_journal_search ON journal_entries USING gin(to_tsvector('english', reflections));
CREATE INDEX idx_ai_conversations_search ON ai_conversations USING gin(to_tsvector('english', messages::text));
```

---

## Migration Scripts

### Step 1: Export from SQLite
```bash
# Create backup
cp backend/mirlind.db backend/mirlind.db.backup

# Export to JSON
sqlite3 backend/mirlind.db ".mode json" ".output users.json" "SELECT * FROM users;"
sqlite3 backend/mirlind.db ".mode json" ".output body_measurements.json" "SELECT * FROM body_measurements;"
# ... repeat for all tables
```

### Step 2: Transform & Import
```rust
// services/gateway/src/bin/migrate.rs
use serde::Deserialize;
use sqlx::{sqlite::SqlitePool, postgres::PgPool};

#[derive(Deserialize)]
struct OldUser {
    id: String,
    email: String,
    password_hash: String,
    created_at: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let sqlite = SqlitePool::connect("sqlite:backend/mirlind.db").await?;
    let postgres = PgPool::connect(&std::env::var("DATABASE_URL")?).await?;
    
    println!("🔄 Starting migration...");
    
    // Migrate users
    let old_users = sqlx::query_as::<_, OldUser>("SELECT * FROM users")
        .fetch_all(&sqlite)
        .await?;
    
    for user in old_users {
        sqlx::query(
            "INSERT INTO users (id, email, username, password_hash, created_at)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO NOTHING"
        )
        .bind(&user.id)
        .bind(&user.email)
        .bind(user.email.split('@').next().unwrap_or("user")) // generate username from email
        .bind(&user.password_hash)
        .bind(&user.created_at)
        .execute(&postgres)
        .await?;
    }
    println!("✅ Migrated {} users", old_users.len());
    
    // Migrate other tables...
    
    println!("✅ Migration complete!");
    Ok(())
}
```

---

## Verification Checklist

After migration, verify:

- [ ] All users migrated with correct credentials
- [ ] All measurements present
- [ ] All workouts present
- [ ] Weekly scores match
- [ ] XP totals match
- [ ] Finance entries sum correctly
- [ ] AI conversations accessible
- [ ] No data loss

---

*This ensures zero data loss while upgrading to the new system.*
