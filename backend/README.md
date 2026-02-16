# Mirlind Protocol Backend

SQLite-based Express API for the Mirlind Protocol application.

## Quick Start

```bash
npm install
npm start
```

Server runs on http://localhost:3001

## Environment Variables

Create `.env` file:
```env
PORT=3001
JWT_SECRET=your-secret-key-min-32-chars
DATABASE_URL=postgresql://postgres:password@localhost:5432/mirlind_protocol
```

**Note:** If `JWT_SECRET` is not set, the server will exit immediately.

## API Endpoints

### Auth
```
POST /api/auth/register    # Register new user (rate limited: 5/15min)
POST /api/auth/login       # Login (rate limited: 5/15min)
GET  /api/auth/me          # Get current user (protected)
```

### Player
```
GET    /api/player/stats     # Get player stats (protected)
POST   /api/player/add-xp    # Add XP with leveling (protected)
PUT    /api/player/stats     # Update stats (protected)
POST   /api/player/activity  # Track activity (protected)
```

### Health
```
GET /api/health              # Health check
```

## Architecture

```
src/
├── index.js              # Express setup, middleware
├── database/
│   └── index.js          # SQLite connection
├── middleware/
│   └── auth.js           # JWT validation
└── routes/
    ├── index.js          # Route aggregator
    ├── auth.js           # Auth routes + rate limiting
    ├── player.js         # Player stats
    ├── body.js           # Body measurements
    ├── german.js         # German progress
    ├── finance.js        # Finance tracking
    └── protocol.js       # Daily protocol
```

## Security

- **Rate Limiting:** 5 auth attempts per 15 minutes
- **Global Limiting:** 100 requests per 15 minutes per IP
- **JWT Validation:** Specific error codes (TOKEN_MISSING, TOKEN_EXPIRED, TOKEN_INVALID)
- **Fail-Fast:** Server exits if JWT_SECRET not set

## Database

Uses SQLite (`mirlind.db`) with better-sqlite3.

Tables auto-created on first run:
- `users` - User accounts
- `player_stats` - XP, levels, pillars
- `body_measurements` - Weight, measurements
- `workouts` - Gym sessions
- `german_progress` - Anki, Language Transfer
- `finance_entries` - Expenses
- `daily_protocol` - Routine tracking

## Scripts

```bash
npm start      # Production
npm run dev    # Development (nodemon)
```

See [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for full technical documentation.
