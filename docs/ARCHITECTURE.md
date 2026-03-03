# Architecture Documentation

Technical overview of the Gamified Life application (current single-user execution phase).

The active stack is `apps/web` (Next.js 16) plus `services/gateway` (Rust/Actix). The old Vite frontend has been removed from the live setup.

---

## 📁 Project Structure

```
gamified-life/
├── apps/
│   └── web/                   # Next.js frontend
├── services/
│   └── gateway/               # Rust gateway
├── backend/                   # Legacy Express API kept during migration
└── docs/                      # Documentation
```

---

## 🏗️ Backend Architecture

### Modular Structure

**Before:** Single `server.js` (1024 lines)

**After:**
```
backend/src/
├── index.ts              # Express setup, middleware, error handling
├── database/
│   └── index.ts          # SQLite connection & table initialization
├── middleware/
│   └── auth.ts           # JWT authentication + rate limiting
├── routes/
│   ├── index.ts          # Route aggregator
│   ├── auth.ts           # POST /register, POST /login, GET /me
│   ├── player.ts         # GET /stats, POST /add-xp, PUT /stats
│   ├── body.ts           # Body measurements
│   ├── workouts.ts       # Workout CRUD
│   ├── german.ts         # German learning progress
│   ├── code.ts           # Coding progress tracking
│   ├── finance.ts        # Finance tracking
│   ├── protocol.ts       # Daily protocol tracking
│   ├── outcomes.ts       # Goals/objectives/actions/checkins
│   ├── weekly.ts         # Weekly plan/review + auto-adjust
│   ├── adaptive.ts       # Baseline assessment + difficulty factor
│   ├── analytics.ts      # Trend analytics + insights
│   ├── retention.ts      # Reminder/missed-day/minimum-day loop
│   ├── coach.ts          # Chat + AI Action Mode
│   └── export.ts         # Full user backup export
└── types/
    └── index.ts          # Shared TypeScript interfaces
```

### Security Features

| Feature | Implementation | Location |
|---------|---------------|----------|
| Rate Limiting (Auth) | 5 attempts / 15 min | `routes/auth.ts` |
| Rate Limiting (Global) | 1000 requests / 15 min | `index.ts` |
| JWT Validation | Fail-fast + error codes | `middleware/auth.ts` |
| Error Handling | Centralized middleware | `index.ts` |

### JWT Error Codes

```javascript
TOKEN_MISSING     // 401 - No token provided
TOKEN_EXPIRED     // 403 - Token expired
TOKEN_INVALID     // 403 - Invalid token
```

---

## 📡 Complete API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create account (rate limited) |
| POST | `/api/auth/login` | No | Login (rate limited) |
| GET | `/api/auth/me` | Yes | Get current user |

### Player

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/player/stats` | Yes | Get player stats |
| POST | `/api/player/add-xp` | Yes | Add XP with leveling |
| PUT | `/api/player/stats` | Yes | Update stats |
| POST | `/api/player/activity` | Yes | Track activity |

### Body Tracking

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/body/measurements` | Yes | Get all measurements |
| POST | `/api/body/measurements` | Yes | Add/update measurement |
| GET | `/api/body/latest` | Yes | Get latest measurement |

### Workouts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/workouts` | Yes | Get all workouts |
| POST | `/api/workouts` | Yes | Add workout |
| GET | `/api/workouts/:id` | Yes | Get workout by ID |
| PUT | `/api/workouts/:id` | Yes | Update workout |
| DELETE | `/api/workouts/:id` | Yes | Delete workout |

### German Learning

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/german/:date` | Yes | Get progress for date |
| POST | `/api/german` | Yes | Save progress |
| GET | `/api/german/latest` | Yes | Get latest progress |

### Code Progress

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/code/stats/streak` | Yes | Get coding streak |
| GET | `/api/code/stats/total` | Yes | Get total stats |
| GET | `/api/code/latest` | Yes | Get latest progress |
| GET | `/api/code/:date` | Yes | Get progress for date |
| POST | `/api/code` | Yes | Save progress |

### Finance

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/finance` | Yes | Get entries (with date range) |
| POST | `/api/finance` | Yes | Add entry |
| DELETE | `/api/finance/:id` | Yes | Delete entry |
| GET | `/api/finance/summary` | Yes | Get summary by category |

### Daily Protocol

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/protocol/streak` | Yes | Get protocol streak |
| GET | `/api/protocol/:date` | Yes | Get protocol for date |
| POST | `/api/protocol` | Yes | Save protocol |

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check |

### Outcome / Weekly Loop

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/outcomes/summary` | Yes | Weekly score + linked data |
| GET | `/api/outcomes/goals` | Yes | List/create/update goals |
| GET | `/api/outcomes/objectives` | Yes | List/create/update weekly objectives |
| GET | `/api/outcomes/actions` | Yes | List/create/update daily actions |
| PUT | `/api/outcomes/checkins/:date` | Yes | Upsert daily check-in |
| GET | `/api/weekly/plan` | Yes | Weekly planning screen data |
| POST | `/api/weekly/plan` | Yes | Save weekly plan |
| GET | `/api/weekly/review` | Yes | Weekly review data |
| POST | `/api/weekly/review` | Yes | Save review + auto-adjust next week |

### Adaptive / Analytics / Retention / Export

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/adaptive/profile` | Yes | Get baseline profile |
| PUT | `/api/adaptive/profile` | Yes | Save baseline profile |
| GET | `/api/adaptive/recommendation` | Yes | Difficulty + domain minute guidance |
| GET | `/api/analytics/trends` | Yes | Adherence/output/outcome trends |
| GET | `/api/retention/settings` | Yes | Reminder + minimum-day config |
| PUT | `/api/retention/settings` | Yes | Update reminder + minimum-day config |
| GET | `/api/retention/status` | Yes | Missed-day recovery and mode status |
| GET | `/api/export/data` | Yes | Download full user JSON backup |

### Coach Action Mode

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/coach/chat` | Optional | Coach reply |
| POST | `/api/coach/actions/generate` | Yes | Generate concrete actions |
| POST | `/api/coach/actions/apply` | Yes | Apply actions into plan/caps |
| GET | `/api/coach/actions/history` | Yes | List recent AI action runs |

---

## 💾 Database Schema

**SQLite** with `better-sqlite3`

Tables auto-created on first run:

### users
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
email TEXT UNIQUE NOT NULL
username TEXT UNIQUE NOT NULL
password_hash TEXT NOT NULL
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

### player_stats
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
level INTEGER DEFAULT 1
xp INTEGER DEFAULT 0
xp_to_next INTEGER DEFAULT 100
pillars TEXT DEFAULT '{}'
skills TEXT DEFAULT '{}'
activity_stats TEXT DEFAULT '{}'
```

### body_measurements
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
date TEXT NOT NULL
weight REAL, height REAL, biceps REAL, forearms REAL
chest REAL, waist REAL, hips REAL, thighs REAL
calves REAL, shoulders REAL, wrist REAL
notes TEXT
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

### workouts
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
date TEXT NOT NULL
name TEXT NOT NULL
exercises TEXT NOT NULL  -- JSON array
duration INTEGER
notes TEXT
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

### german_progress
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
date TEXT NOT NULL
anki_cards INTEGER DEFAULT 0
anki_time INTEGER DEFAULT 0
anki_streak INTEGER DEFAULT 0
total_words INTEGER DEFAULT 0
language_transfer BOOLEAN DEFAULT 0
language_transfer_lesson INTEGER DEFAULT 1
radio_hours REAL DEFAULT 0
tandem_minutes INTEGER DEFAULT 0
notes TEXT
UNIQUE(user_id, date)
```

### code_progress
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
date TEXT NOT NULL
hours REAL DEFAULT 0
github_commits INTEGER DEFAULT 0
project TEXT
skills TEXT DEFAULT '[]'
notes TEXT
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
UNIQUE(user_id, date)
```

### finance_entries
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
date TEXT NOT NULL
amount REAL NOT NULL
category TEXT NOT NULL
description TEXT
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

### daily_protocol
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
date TEXT NOT NULL
wake05 BOOLEAN DEFAULT 0
german_study BOOLEAN DEFAULT 0
gym_workout BOOLEAN DEFAULT 0
coding_hours REAL DEFAULT 0
sleep22 BOOLEAN DEFAULT 0
notes TEXT
UNIQUE(user_id, date)
```

### outcome_* tables
`outcome_goals`, `outcome_weekly_objectives`, `outcome_daily_actions`, `outcome_checkins` power the command-center objective board.

### weekly_reviews
Stores weekly wins/failures/lessons/adjustments and review confidence with auto-adjust flag.

### adaptive_profiles
Stores baseline domain levels, daily capacity, stress level, and computed difficulty factor.

### retention_settings
Stores reminder window and minimum viable day settings.

### ai_action_runs
Audit trail for AI-generated actions and whether they were applied.

### finance_caps
Monthly spending caps set manually or by AI Action Mode.

---

## ⚛️ Frontend Architecture

### Component Organization

```
src/views/                    # Page-level views
├── protocol/                 # ProtocolView modules
│   ├── DailyProtocolTab.tsx
│   ├── BodyTrackingTab.tsx
│   ├── GermanTab.tsx
│   ├── CodeTab.tsx
│   ├── FinanceTab.tsx
│   ├── WeeklyTab.tsx
│   ├── types.ts
│   └── index.ts
├── cards/                    # CardsView modules
│   ├── CodingRoadmapTab.tsx
│   ├── MindsetTab.tsx
│   ├── FangYuanView.tsx
│   ├── ModuleDetailModal.tsx
│   ├── types.ts
│   └── index.ts
├── ProtocolView.tsx          # Main shell
├── CardsView.tsx             # Main shell
└── ...
```

### Data Layer

```
src/data/
├── json/                     # Static JSON data
│   ├── skills.json          # Skill definitions (18KB)
│   └── roadmap.json         # JS curriculum (19.7KB)
├── skills.ts                # Imports from JSON
├── roadmap.ts               # Imports from JSON
├── fangyuan.ts              # Mindset teachings
├── challenges.ts            # Challenge definitions
├── habits.ts                # Habit tracking
└── quests.ts                # Daily quests
```

### State Management

**GameContext** - Global player state
- Player stats (level, XP, pillars)
- Authentication state
- Toast notifications
- Activity tracking

**AuthContext** - Authentication state
- User info
- Login/logout functions

### Utilities

```
src/utils/
├── logger.ts                # Environment-aware logging
├── emojis.ts                # Emoji constants
├── confetti.ts              # Celebration effects
└── willpower.ts             # Willpower calculations
```

---

## 🔄 Data Flow

### Authentication Flow

```
1. Login/Register → POST /api/auth/login
2. Store access token in sessionStorage
3. Set HttpOnly refresh cookie (`/api/auth`)
4. Include access token in API requests (Authorization header)
5. On `TOKEN_EXPIRED`, frontend calls `/api/auth/refresh` and retries
```

### XP/Leveling Flow

```
1. User completes activity (frontend)
2. addXP(amount, pillarType) called
3. POST /api/player/add-xp (if authenticated)
4. Backend calculates level up
5. Return new stats → update UI
```

### LocalStorage Persistence

Data stored locally when offline:
- `mirlind-protocol-save` - Player stats
- `mirlind-quests` - Daily quests
- `mirlind-fangyuan` - Unlocked teachings
- `mirlind-daily-teaching` - Current teaching
- `mirlind-finance-profile` - Editable monthly finance inputs
- `mirlind-savings-progress` - Savings progress and checkpoints
- `auth_token` - JWT token

---

## 🎨 The 5 Pillars

The app is built around 5 core life domains:

| Pillar | Name | Color | Description | Skills |
|--------|------|-------|-------------|--------|
| ⚡ Craft | Technical | #06b6d4 | JavaScript, React, Node.js | Programming |
| 💪 Vessel | Physical | #ec4899 | Gym, Nutrition, Sleep | Strength |
| 🗣️ Tongue | Language | #8b5cf6 | German A1- to job-ready communication | Communication |
| 🧠 Principle | Mental | #a855f7 | Focus, Discipline | Mindset |
| 💰 Capital | Financial | #10b981 | Budget, Savings | Money |

---

## 🧪 Development

### Build Commands

```bash
# Frontend
cd apps/web
npm run dev      # Development
npm run build    # Production build
npm run lint     # ESLint

# Gateway
cargo run -p gateway
cargo check -p gateway
```

### Environment Variables

**Gateway:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Minimum 32 characters
- `PORT` - Server port (default: 3000)

**Frontend:**
- `NEXT_PUBLIC_GATEWAY_URL` - Gateway base URL

**CORS behavior:**
- Production: only origins listed in `CORS_ORIGIN` are allowed
- Development: explicit allowlist + localhost/127.0.0.1 on any port

---

## 📊 Performance Considerations

### Optimizations Applied

1. **JSON Data Files** - Static data loaded once
2. **Component Splitting** - Lazy load tabs
3. **Logger Utility** - Suppresses logs in production
4. **Rate Limiting** - Prevents API abuse

### Bundle Size

- Main JS: ~900KB (gzipped)
- CSS: ~60KB
- JSON Data: ~38KB

---

## 🔒 Security Checklist

- [x] JWT_SECRET set and strong (64+ chars)
- [x] Rate limiting enabled
- [x] `.env` files in `.gitignore`
- [x] Database files excluded from git
- [x] CORS configured properly
- [x] Input validation on all endpoints
- [x] Route ordering fixed (static before parameterized)

---

## 🚀 Deployment

### Production Setup

```bash
# 1. Environment
cp services/gateway/.env.example services/gateway/.env
# Edit with production values

# 2. Dependencies
docker compose up -d postgres redis
cd apps/web && npm install && npm run build

# 3. Start
# Gateway: cargo run -p gateway
# Frontend: cd apps/web && npm run start
```

### Health Checks

- `GET /health` - Gateway status
- Check database connectivity
- Verify JWT validation

---

## 📝 Route Ordering Rules

**Important:** Express routes are matched in order. Static routes must be defined BEFORE parameterized routes.

```javascript
// ✅ CORRECT - Static routes first
router.get('/streak', ...);      // Matches /streak
router.get('/latest', ...);      // Matches /latest
router.get('/:date', ...);       // Matches anything else

// ❌ WRONG - Parameterized route catches everything
router.get('/:date', ...);       // Would match /streak as a date!
router.get('/streak', ...);      // Never reached
```

---

**Last Updated:** 2026-02-22  
**Version:** 1.3.0
