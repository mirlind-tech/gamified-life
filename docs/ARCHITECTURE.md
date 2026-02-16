# Architecture Documentation

Technical overview of the Gamified Life application.

---

## 📁 Project Structure

```
gamified-life/
├── backend/                    # Express API
│   ├── src/
│   │   ├── index.js           # Entry point
│   │   ├── database/          # SQLite connection
│   │   ├── middleware/        # JWT auth
│   │   └── routes/            # API routes
│   ├── server.js              # Legacy (backup)
│   └── package.json
├── mirlind-protocol-react/     # React frontend
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── contexts/          # Auth & Game state
│   │   ├── data/              # Static data + JSON
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API services
│   │   ├── store/             # State management
│   │   ├── utils/             # Helpers
│   │   └── views/             # App views
│   └── package.json
└── docs/                       # Documentation
```

---

## 🏗️ Backend Architecture

### Modular Structure

**Before:** Single `server.js` (1024 lines)

**After:**
```
backend/src/
├── index.js              # Express setup, middleware, error handling
├── database/
│   └── index.js          # SQLite connection & table initialization
├── middleware/
│   └── auth.js           # JWT authentication + rate limiting
└── routes/
    ├── index.js          # Route aggregator
    ├── auth.js           # POST /register, POST /login, GET /me
    ├── player.js         # GET /stats, POST /add-xp, PUT /stats
    ├── body.js           # Body measurements & workouts
    ├── german.js         # German learning progress
    ├── finance.js        # Finance tracking
    └── protocol.js       # Daily protocol tracking
```

### Security Features

| Feature | Implementation | Location |
|---------|---------------|----------|
| Rate Limiting (Auth) | 5 attempts / 15 min | `routes/auth.js` |
| Rate Limiting (Global) | 100 requests / 15 min | `index.js` |
| JWT Validation | Fail-fast + error codes | `middleware/auth.js` |
| Error Handling | Centralized middleware | `index.js` |

### JWT Error Codes

```javascript
TOKEN_MISSING     // 401 - No token provided
TOKEN_EXPIRED     // 403 - Token expired
TOKEN_INVALID     // 403 - Invalid token
```

### API Endpoints

#### Authentication
```
POST /api/auth/register    # Create account
POST /api/auth/login       # Login
GET  /api/auth/me          # Get current user (protected)
```

#### Player
```
GET    /api/player/stats     # Get player stats (protected)
POST   /api/player/add-xp    # Add XP with leveling (protected)
PUT    /api/player/stats     # Update stats (protected)
POST   /api/player/activity  # Track activity (protected)
```

#### Health
```
GET /api/health              # Health check
```

### Database

**SQLite** with `better-sqlite3`

Tables auto-created on first run:
- `users` - User accounts
- `player_stats` - XP, levels, pillars
- `body_measurements` - Weight, measurements
- `workouts` - Gym sessions
- `german_progress` - Anki, Language Transfer
- `finance_entries` - Expenses
- `daily_protocol` - Routine tracking

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
│   └── index.ts
├── cards/                    # CardsView modules
│   ├── CodingRoadmapTab.tsx
│   ├── MindsetTab.tsx
│   ├── ModuleDetailModal.tsx
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
└── confetti.ts              # Celebration effects
```

---

## 🔄 Data Flow

### Authentication Flow

```
1. Login/Register → POST /api/auth/login
2. Store JWT in localStorage
3. Include JWT in all API requests (Authorization header)
4. Backend validates → returns user data
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
- `auth_token` - JWT token

---

## 🎨 The 5 Pillars

The app is built around 5 core life domains:

| Pillar | Name | Color | Description | Skills |
|--------|------|-------|-------------|--------|
| ⚡ Craft | Technical | #06b6d4 | JavaScript, React, Node.js | Programming |
| 💪 Vessel | Physical | #ec4899 | Gym, Nutrition, Sleep | Strength |
| 🗣️ Tongue | Language | #8b5cf6 | German A1→B1 | Communication |
| 🧠 Principle | Mental | #a855f7 | Focus, Discipline | Mindset |
| 💰 Capital | Financial | #10b981 | Budget, Savings | Money |

---

## 🧪 Development

### Build Commands

```bash
# Frontend
cd mirlind-protocol-react
npm run dev      # Development
npm run build    # Production build
npm run lint     # ESLint

# Backend
cd backend
npm start        # Production
npm run dev      # Development (nodemon)
```

### Environment Variables

**Required:**
- `JWT_SECRET` - Minimum 32 characters
- `PORT` - Server port (default: 3001)
- `DATABASE_URL` - PostgreSQL connection (optional, defaults to SQLite)

**Frontend:**
- `VITE_API_URL` - Backend API URL

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

- [ ] JWT_SECRET set and strong (64+ chars)
- [ ] Rate limiting enabled
- [ ] `.env` files in `.gitignore`
- [ ] Database files excluded from git
- [ ] CORS configured properly
- [ ] Input validation on all endpoints

---

## 🚀 Deployment

### Production Setup

```bash
# 1. Environment
cp backend/.env.example backend/.env
# Edit with production values

# 2. Dependencies
cd backend && npm install --production
cd ../mirlind-protocol-react && npm install && npm run build

# 3. Start
# Backend: pm2 start backend/src/index.js
# Frontend: serve -s mirlind-protocol-react/dist
```

### Health Checks

- `GET /api/health` - Backend status
- Check database connectivity
- Verify JWT validation

---

**Last Updated:** 2026-02-16  
**Version:** 1.0.0
