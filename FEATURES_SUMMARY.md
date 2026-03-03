# Gamified Life - Features Overview

Complete overview of the application's features and systems.

---

## 🎓 Skills Tree

**Purpose:** Master 12 real-world skills like backflip, guitar, juggling, salsa, etc.

### Features
- 12 skills across 5 categories
- 3 stages per skill with micro-goals (Foundation → Progression → Execution)
- 40 hours estimated per skill (10h + 15h + 15h)
- Progress tracking with stage completion
- Category filtering and status filtering
- Skill detail modal with resources
- LocalStorage persistence

### Skills by Category

| Category | Skills |
|----------|--------|
| **Physical** | Backflip, Handstand, Muscle Up |
| **Creative** | Play Guitar Song, Beatbox, Juggling |
| **Social** | Salsa Basic, Magic Card Trick |
| **Mental** | Speed Reading, Memory Palace |
| **Survival** | Essential Knots, Fire Making |

---

## 🏆 Challenges System

**Purpose:** 7-day and 30-day competitive challenges with motivational quotes.

### Features
- Daily challenges tab (3 random challenges per day)
- Special challenges tab (long-term quests)
- Streak tracking
- Progress stats (daily %, streak, XP earned)
- Confetti celebration on completion
- Fang Yuan & Baki Hanma quotes

### Special Challenges

| Challenge | Duration | Type | Difficulty | XP Reward |
|-----------|----------|------|------------|-----------|
| The Ice Demon | 7 days | Physical | 4/5 | 500 XP |
| Code Marathon | 30 days | Craft | 3/5 | 1000 XP |
| Digital Detox War | 7 days | Discipline | 5/5 | 750 XP |
| German Conquest | 14 days | Social | 4/5 | 700 XP |
| Baki Body Forge | 30 days | Physical | 4/5 | 1200 XP |
| Fang Yuan Mindset | 7 days | Mental | 5/5 | 800 XP |

---

## 🧠 Fang Yuan Mindset System

**Purpose:** Teach and enforce Fang Yuan principles from *Reverend Insanity*.

### Features
- 12 unlockable principles
- Daily teaching rotation
- Quiz system to test understanding
- Progressive unlocking based on XP earned
- Detailed explanations and real-world applications

### Principles

| # | Principle | Unlock Requirement |
|---|-----------|-------------------|
| 1 | Strength is the Only Virtue | Starting |
| 2 | Detach from Emotion | Starting |
| 3 | Sacrifice Present for Future | Starting |
| 4 | Be Ruthless with Yourself | 500 XP |
| 5 | Only the Useful Matter | 1000 XP |
| 6 | Regret is for the Weak | 1500 XP |
| 7 | Think 10 Moves Ahead | 2000 XP |
| 8 | Pain is the Price | 2500 XP |
| 9 | The World is for Exploitation | 3000 XP |
| 10 | Adapt and Overcome | 3500 XP |
| 11 | No Permanent Enemies | 4000 XP |
| 12 | Always Keep Hidden Cards | 5000 XP |

---

## 👤 Character Profile

**Purpose:** Central dashboard for tracking life progress across all domains.

### Features
- **Weekly Scorecard**: 6 categories (Body, Mind, German, Code, Finance, Protocol)
  - Weighted scoring system aligned to current priority stack
  - Score range: 0-60
  - Target: 48+ weekly (minimum), 54+ preferred
  - Week navigation with historical data
  - Status indicators: EXCELLENT / GOOD / AVERAGE / CRISIS
- **B1 German Countdown**: deadline tracking component (currently date-based, configurable plan target)
  - Urgency status indicators
  - Checkpoint tracking (Apr 30, Jun 1, Sep 30)
- **Savings Progress**: EUR 6,000 goal by Aug 31, 2027 (aggressive realistic path)
  - Progress bar with checkpoints
  - Current amount tracking
- **Job Hunt Tracker**: 60 applications and 8 interviews by Jul 31, 2026
  - Pipeline tracking (Saved, Applied, Interview, Offer, Rejected)
  - Daily/weekly pace calculation

---

## 📸 Photo Progress

**Purpose:** Weekly body transformation photo tracking with comparison tools.

### Features
- Upload front, side, and back photos weekly
- Before/after comparison slider
- Timeline carousel view
- Quick compare (first vs latest)
- Stats: weeks logged, current weight, change tracking
- Milestone badges (First Photo, 4 Weeks, 12 Weeks, etc.)
- LocalStorage persistence

---

## 📊 Charts & Analytics

**Purpose:** Visual tracking of weight and XP history.

### Weight Tracker
- Time range filtering (1M / 3M / 6M / 1Y)
- SVG line chart visualization
- Stats: Current, Change, Lowest, Average
- Add/delete weight entries
- History log with notes

### XP History
- Time range filtering (7D / 30D / 90D)
- Daily XP bar chart
- Stats: Total XP, Daily Average, Best Day
- Breakdown by source (Daily Quest, Pillar, Principle, Challenge, Skill)

---

## 💻 Tech Stack Curriculum

**Purpose:** Complete 10-skill curriculum for full-stack mastery.

### The 10 Skills
| Skill | Modules | Hours | Key Topics |
|-------|---------|-------|------------|
| **JavaScript** | 9 | 30h | Variables, Functions, Async, DOM, ES6+ |
| **TypeScript** | 4 | 12h | Types, Interfaces, Generics, Config |
| **React** | 5 | 25h | Hooks, State, Effects, Router, Testing |
| **Node.js** | 6 | 20h | Express, Middleware, Auth, Security |
| **PostgreSQL** | 4 | 15h | Schema, Queries, Relations, Optimization |
| **Git** | 4 | 10h | Branching, Merging, Rebase, Workflows |
| **Docker** | 3 | 12h | Images, Compose, Volumes, Deployment |
| **System Design** | 4 | 20h | Architecture, Scalability, Microservices |
| **Rust** | 3 | 25h | Ownership, Structs, Lifetimes, Async |
| **Python** | 3 | 20h | Syntax, Data Science, Django, Scripting |

**Total: 40+ modules, 100+ topics, 200+ hours**

### Features
- Progress tracking per module
- Prerequisites system
- Hours tracking
- Phase-based learning path
- Module notes and custom hours

---

## 💻 JavaScript Coding Roadmap

**Purpose:** Structured learning path for JavaScript mastery.

### Features
- 3 phases: Fundamentals → Core Concepts → Advanced
- 10 modules with estimated hours
- Topic breakdown with code examples
- Progress tracking with prerequisites
- Completion status for each module

### Phase 1: Fundamentals
- Variables & Types (2h)
- Operators & Control Flow (2h)
- Functions Basics (3h)

### Phase 2: Core Concepts
- Scope & Closures (4h) - prerequisites: functions
- this & Context (3h) - prerequisites: functions
- Prototypes & Inheritance (4h) - prerequisites: this
- Asynchronous JavaScript (5h) - prerequisites: functions

### Phase 3: Advanced
- Higher-Order Functions (3h)
- DOM Manipulation (4h)
- ES6+ Features (3h)

---

## 📋 Daily Protocol Tracking

**Purpose:** Track daily routine completion.

### Tracked Items
- 05:00 Wake up
- German study completed
- Gym workout
- Coding hours
- 22:00 Sleep
- Daily notes

### Features
- Daily checklist
- Weekly streak calculation
- Protocol heatmap
- Historical data view
- Priority messaging aligned to: Job Ready -> Finance -> Coding Depth -> Body -> German

---

## 💪 Body Tracking

**Purpose:** Track physical transformation.

### Features
- Body measurements (weight, biceps, chest, etc.)
- Workout logging
- Photo progress tracking
- Baki-inspired workout routines
- Measurement history charts

---

## 🇩🇪 German Learning

**Purpose:** Track German progress from current level toward job + residency needs.

### Features
- Anki integration (cards, time, streak)
- Language Transfer progress
- Radio hours tracking
- Tandem session logging
- Vocabulary counter
- B1 countdown timer

---

## 💰 Finance Tracking

**Purpose:** Track expenses and savings.

### Features
- Daily expense logging
- Budget categories
- Weekly/Monthly summaries
- Editable finance profile inputs (income, fixed costs, food budget, savings, goal)
- Savings progress and runway calculations
- Kosovo apartment commitment integrated in monthly fixed costs
- One-click monthly planned savings update

---

## 🎯 The 5 Pillars

The app is built around 5 core life domains:

| Pillar | Name | Color | Description |
|--------|------|-------|-------------|
| ⚡ Craft | Technical | #06b6d4 | JavaScript, React, Node.js |
| 💪 Vessel | Physical | #ec4899 | Gym, Nutrition, Sleep |
| 🗣️ Tongue | Language | #8b5cf6 | German A1- to job-ready communication |
| 🧠 Principle | Mental | #a855f7 | Focus, Discipline |
| 💰 Capital | Financial | #10b981 | Budget, Savings |

---

## 📱 Additional Features

### Gamification
- XP and leveling system
- Achievement badges
- Weekly scorecards
- Streak tracking
- Confetti celebrations

### Focus Mode
- Timer with binaural beats
- Ambient sounds (study, work, workout, creative, meditate)
- Session logging
- Progress tracking

### Journal
- Daily reflections
- Gratitude practice
- Intention setting
- Lesson capture

### Meditation
- Guided sessions
- Breathing exercises
- Progress tracking

---

## 📁 Related Documentation

- [README.md](README.md) - Main project overview
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Technical documentation
- [docs/TRANSFORMATION.md](docs/TRANSFORMATION.md) - Personal mission blueprint
- [docs/REFACTORING.md](docs/REFACTORING.md) - Technical changes

---

*Last Updated: February 19, 2026*
