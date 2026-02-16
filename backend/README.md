# Mirlind Protocol Backend

SQLite-based Express API for the Mirlind Protocol application.

## Quick Start

```bash
npm install
npm run dev
```

Server runs on http://localhost:3001

## Environment Variables

Create `.env` file:
```
PORT=3001
JWT_SECRET=your-secret-key
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (protected)

### Player
- `GET /api/player/stats` - Get player stats (protected)
- `POST /api/player/add-xp` - Add XP with leveling (protected)
- `PUT /api/player/stats` - Update stats (protected)
- `POST /api/player/activity` - Track activity (protected)

### Health
- `GET /api/health` - Health check

## Database

Uses SQLite (`mirlind.db`) with better-sqlite3.
Tables are auto-created on first run.
