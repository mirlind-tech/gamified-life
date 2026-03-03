# Phase 2: Database Migration - Setup Guide

> PostgreSQL setup and data migration from SQLite

---

## Prerequisites

- Docker Desktop running
- Rust toolchain installed
- Existing SQLite database at `backend/mirlind.db`

---

## Quick Start

### 1. Start PostgreSQL & Redis

```powershell
# Navigate to project
cd c:\Users\mirli\gamified-life

# Start containers
docker-compose up -d postgres redis

# Verify
 docker-compose ps
```

### 2. Database Schema is Auto-Applied

The schema in `infrastructure/postgres/init/01_schema.sql` is automatically executed when PostgreSQL starts.

### 3. Verify Database Connection

```powershell
# Set environment variables
$env:DATABASE_URL = "postgres://postgres:postgres@localhost:5432/mirlind"
$env:REDIS_URL = "redis://localhost:6379"
$env:JWT_SECRET = "your-super-secret-key-minimum-256-bits-long"

# Test with psql (if available)
psql $env:DATABASE_URL -c "\dt"
```

---

## Migration: SQLite → PostgreSQL

### Option 1: Using the Rust Migration Tool

```powershell
# Set required environment variables
$env:SQLITE_URL = "sqlite:backend/mirlind.db"
$env:DATABASE_URL = "postgres://postgres:postgres@localhost:5432/mirlind"

# Run migration
cargo run --bin migrate -p gateway
```

### Option 2: Manual SQL Migration

If you prefer manual control:

```powershell
# Export SQLite to SQL
sqlite3 backend/mirlind.db ".dump" > migration.sql

# Edit migration.sql to convert SQLite syntax to PostgreSQL
# Then run:
psql $env:DATABASE_URL < migration.sql
```

---

## Database Schema Overview

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts & profiles |
| `user_settings` | User preferences |
| `sessions` | Active login sessions |
| `gamification_stats` | XP, levels, streaks |
| `xp_history` | Detailed XP log |
| `achievements` | Unlocked badges |

### 5 Pillars Tables

| Table | Pillar | Data |
|-------|--------|------|
| `body_measurements` | Body | Weight, measurements |
| `workouts` | Body | Exercise logs |
| `meditation_sessions` | Mind | Meditation tracking |
| `journal_entries` | Mind | Daily journal |
| `principle_progress` | Mind | Fang Yuan principles |
| `german_sessions` | German | Study sessions |
| `german_vocabulary` | German | Vocabulary |
| `coding_sessions` | Code | Coding hours |
| `code_skills` | Code | Skill progress |
| `finance_entries` | Finance | Expenses/income |
| `finance_profiles` | Finance | Budget settings |

### Planning Tables

| Table | Purpose |
|-------|---------|
| `daily_protocol` | Daily check-ins |
| `weekly_plans` | Weekly objectives |
| `weekly_reviews` | Weekly reflection |

---

## Accessing the Database

### Adminer (Web UI)

```
URL: http://localhost:8080
Server: postgres
Username: postgres
Password: postgres
Database: mirlind
```

### Command Line

```powershell
# Using psql
psql postgres://postgres:postgres@localhost:5432/mirlind

# Common commands:
\dt          # List tables
\d users     # Describe users table
\q           # Quit
```

---

## Environment Variables

```bash
# Required
DATABASE_URL=postgres://postgres:postgres@localhost:5432/mirlind
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-key-minimum-256-bits-long

# Optional
GATEWAY_HOST=127.0.0.1
GATEWAY_PORT=3000
```

---

## Troubleshooting

### Docker not starting

```powershell
# Check Docker Desktop is running
Get-Process | Where-Object { $_.ProcessName -like "*docker*" }

# Restart Docker Desktop
```

### Migration fails

```powershell
# Check SQLite database exists
Test-Path backend/mirlind.db

# Check PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs postgres
```

### Connection refused

```powershell
# Wait for PostgreSQL to be ready
Start-Sleep -Seconds 10

# Or check health
docker-compose exec postgres pg_isready -U postgres
```

---

## Next Steps

After database is set up:

1. **Run the migration** to transfer your existing data
2. **Update the gateway** to use PostgreSQL for auth
3. **Test all endpoints** with real database
4. **Phase 3**: Add messaging service

---

## Backup & Restore

### Backup PostgreSQL

```powershell
docker-compose exec postgres pg_dump -U postgres mirlind > backup.sql
```

### Restore PostgreSQL

```powershell
docker-compose exec -T postgres psql -U postgres mirlind < backup.sql
```

---

*Phase 2 provides the foundation for all future features. A solid database layer is essential for scaling.*
