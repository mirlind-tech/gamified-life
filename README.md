# Gamified Life - Mirlind Protocol

> *"Level up your life with ruthless execution."*

**Single-user build:** this app is currently designed for you only.

---

## Mission

Transform into:
- **Fang Yuan-level decision discipline**
- **Baki-level physical capability**
- **Job-ready software engineer**
- **German-speaking professional in Stuttgart**
- **Financially stable and growing**

Priority order (current):
1. Job ready
2. Finance
3. Coding depth
4. Body
5. German

---

## Current Reality (Source of Truth)

- **Work block:** 06:50-16:30 (construction)
- **Income:** EUR 2,000/month
- **Fixed costs:** EUR 1,447/month
  - Rent 620
  - Phone + internet 70
  - Gym 32
  - Laptop insurance 5
  - AI subscription 20
  - Kosovo apartment 700 (started January 2026, 10-year commitment)
- **Food budget:** EUR 320/month
- **Savings capacity:** EUR 233/month
- **Current savings:** EUR 1,400
- **Savings target:** EUR 6,000 by **August 31, 2027** (aggressive realistic path)

---

## Quick Start

```bash
# 1. Start infrastructure
docker compose up -d postgres redis

# 2. Start the Rust gateway
cargo run -p gateway

# 3. Start the Next.js app (new terminal)
cd apps/web && npm install && npm run dev
```

URLs:
- Frontend: `http://localhost:3003`
- Gateway health: `http://localhost:3000/health`
- Gateway API base: `http://localhost:3000/api`
- Postgres: `postgres://postgres:postgres@localhost:5432/mirlind`
- Redis: `redis://localhost:6379`

---

## Login Troubleshooting

If login shows a connectivity error:

1. Ensure Postgres and Redis are running: `docker compose up -d postgres redis`.
2. Ensure the gateway is running: `cargo run -p gateway`.
3. Verify the gateway health endpoint opens: `http://localhost:3000/health`.
4. Confirm frontend gateway URL in `apps/web/.env`:
   `NEXT_PUBLIC_GATEWAY_URL=http://127.0.0.1:3000`.
5. Start the Next app from `apps/web` and open `http://localhost:3003`.

---

## Daily Execution Template

```text
05:15 - Wake (no snooze)
05:20-05:50 - German (Anki + speaking)
05:50-06:20 - Breakfast + prep
06:20-06:50 - Commute
06:50-16:30 - Work (audio German + micro-review in breaks)
17:30-18:45 - Gym (4x/week) OR active recovery
19:30-21:30 - Job-ready coding deep work
21:30-22:00 - Short review + next-day setup
22:15 - Sleep target
```

Rule: app usage should stay under 10 minutes/day outside scheduled reviews.

---

## Critical Milestones

| Date | Target |
|------|--------|
| **July 31, 2026** | 60 applications, 8 interviews in pipeline |
| **December 31, 2026** | Savings around EUR 3,700+, stronger portfolio output |
| **August 31, 2027** | EUR 6,000 safety buffer complete |

---

## What the App Tracks

| Module | Tracks |
|--------|--------|
| **Body** | Workouts, measurements, progress checkpoints |
| **Mind** | Discipline reflection and weekly review |
| **German** | Anki, lessons, listening/output consistency |
| **Code** | Hours, output, job-ready project progress |
| **Finance** | Expenses, editable budget inputs, savings runway |
| **Protocol** | Daily execution and consistency |

---

## Core Execution Loop

1. **Weekly Plan** (`/weekly-plan`)  
Set objectives + daily actions for the week.

2. **Daily Execution** (`/protocol`)  
Complete actions, check in, and keep output moving.

3. **Weekly Review** (`/weekly-review`)  
Log wins/failures/lessons; next week targets auto-adjust.

4. **Adaptive Assessment** (`/assessment`)  
Baseline capacity sets difficulty factor for sustainable intensity.

5. **Insights** (`/insights`)  
Track adherence/output/outcome trends and week-change insights.

---

## AI Action Mode

`AI Coach` now supports **Action Mode**:
- Generate concrete actions from intent
- Apply actions directly to weekly objectives and daily action lists
- Apply finance caps when finance actions are generated

---

## Backup / Export

From `Account`, use **Backup / Export Data** to download your full user dataset as JSON.

---

## Retention Safeguards

- Daily reminder window (configurable in Insights)
- Missed-day recovery plan
- Minimum viable day mode to prevent streak collapse

---

## Weekly Score Rule

Weekly scorecard uses 6 categories (max 60 total points).

- **Minimum pass target:** 48+/60
- **Goal zone:** 54+/60

---

## Documentation

| Document | Purpose |
|----------|---------|
| `docs/TRANSFORMATION.md` | Personal execution blueprint |
| `FEATURES_SUMMARY.md` | Feature inventory and current behavior |
| `docs/ARCHITECTURE.md` | Technical architecture and API |
| `docs/REFACTORING.md` | Refactoring and migration history |

---

*Created: February 2026*  
*Last Updated: February 22, 2026*
