# V1 → V2 Migration Plan

## Executive Summary

| Component | V1 Status | V2 Status | Actual State |
|-----------|-----------|-----------|--------------|
| **Backend** | Express + SQLite | Rust + Actix-web + PostgreSQL | ✅ **COMPLETE** - 50+ endpoints active |
| **Frontend** | React + Vite + Tailwind v4 | Next.js 15 + React 19 + Tailwind v4 | 🚧 **PARTIAL** - Auth done, features pending |
| **Database** | SQLite | PostgreSQL | ✅ **COMPLETE** - Full schema migrated |
| **Auth** | JWT | JWT (custom Rust) | ✅ **COMPLETE** - Register/Login/Refresh working |

> **Reality Check**: Backend V2 is production-ready with 50+ endpoints. Frontend V2 has auth working but needs feature pages migrated from V1.

---

## Current Architecture

### Backend (✅ COMPLETE)
```
Port: 3000
Stack: Rust + Actix-web + PostgreSQL + SQLx
Features:
  ✅ Auth (JWT with refresh tokens)
  ✅ Rate limiting (10 req/min auth)
  ✅ WebSocket broker at /api/ws
  ✅ 50+ REST endpoints
  ✅ Multipart file uploads (photos)
  ✅ AI integration (chat, memory, RAG, voice)
```

### Frontend V1 (✅ LEGACY - Reference)
```
Port: 5173 (dev) / static (prod)
Stack: React 19 + Vite + Tailwind v4 + React Router
Location: mirlind-protocol-react/
Status: Feature-complete, has dist/ build
Features: All 8 phases implemented
```

### Frontend V2 (🚧 IN PROGRESS)
```
Port: 3003 (dev)
Stack: Next.js 15.1.7 + React 19 + Tailwind v4 + App Router
Location: apps/web/
Status: Auth complete, dashboard scaffolded
Missing: All feature pages
```

---

## Migration Checklist

### Phase 1: Foundation (✅ DONE)
- [x] Rust gateway with Actix-web
- [x] PostgreSQL schema + migrations
- [x] JWT auth system
- [x] Rate limiting middleware
- [x] WebSocket broker
- [x] Next.js 15 project setup
- [x] Auth context + API client
- [x] Login/register pages

### Phase 2: Core Features (🚧 PRIORITY)

#### Player/Dashboard
| Feature | V1 Location | V2 Status | Effort |
|---------|-------------|-----------|--------|
| Player Stats Card | `PlayerStats.tsx` | ⬜ Not started | Medium |
| XP/Level Display | `CharacterProfileView.tsx` | ⬜ Not started | Low |
| Activity Chart | `AnalyticsView.tsx` | ⬜ Not started | High |
| Streak Counter | `ProtocolView.tsx` | ⬜ Not started | Medium |

#### Body HQ
| Feature | V1 Location | V2 Status | Effort |
|---------|-------------|-----------|--------|
| Measurements Form | `BodyHQView.tsx` | ⬜ Not started | Medium |
| Weight Chart | `BodyHQView.tsx` | ⬜ Not started | High |
| Photo Upload | `PhotoProgress.tsx` | ⬜ Not started | High |
| Gallery View | `PhotoProgress.tsx` | ⬜ Not started | Medium |

#### Mind HQ
| Feature | V1 Location | V2 Status | Effort |
|---------|-------------|-----------|--------|
| Meditation Timer | `MeditationView.tsx` | ⬜ Not started | Medium |
| Protocol Checklist | `ProtocolView.tsx` | ⬜ Not started | Medium |
| Fang Yuan Teachings | `FangYuanView.tsx` | ⬜ Not started | Low |
| Journal Entry | `JournalView.tsx` | ⬜ Not started | Medium |

#### Career HQ
| Feature | V1 Location | V2 Status | Effort |
|---------|-------------|-----------|--------|
| Job Applications | `CareerHQView.tsx` | ⬜ Not started | High |
| Pipeline Stats | `CareerHQView.tsx` | ⬜ Not started | Medium |
| Curriculum Tree | `SkillsRoadmapView.tsx` | ⬜ Not started | High |
| Module Progress | `SkillsRoadmapView.tsx` | ⬜ Not started | Medium |

#### Skills HQ
| Feature | V1 Location | V2 Status | Effort |
|---------|-------------|-----------|--------|
| Skill Categories | `SkillsView.tsx` | ⬜ Not started | Medium |
| Challenges List | `ChallengesView.tsx` | ⬜ Not started | Medium |
| Weekly Plan | `WeeklyPlanView.tsx` | ⬜ Not started | Medium |
| Code Tracking | `CodeView.tsx` | ⬜ Not started | Medium |
| German Learning | `GermanHQView.tsx` | ⬜ Not started | Medium |

#### Finance HQ
| Feature | V1 Location | V2 Status | Effort |
|---------|-------------|-----------|--------|
| Finance Overview | `FinanceHQView.tsx` | ⬜ Not started | Medium |
| CAPs Display | `FinanceHQView.tsx` | ⬜ Not started | Low |

#### AI Coach
| Feature | V1 Location | V2 Status | Effort |
|---------|-------------|-----------|--------|
| Chat Interface | `CoachView.tsx` | ⬜ Not started | High |
| Voice Input | `CoachView.tsx` | ⬜ Not started | High |
| Memory Browser | `CoachView.tsx` | ⬜ Not started | Medium |

### Phase 3: Polish (⏳ FUTURE)
- [ ] WebSocket integration for real-time updates
- [ ] PWA support
- [ ] Mobile app (Capacitor/React Native)
- [ ] E2E tests
- [ ] Performance optimization

---

## API Endpoint Inventory

### Auth (✅ V2 Ready)
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

### Player (✅ V2 Ready)
```
GET  /api/player/stats
PUT  /api/player/stats
POST /api/player/add-xp
POST /api/player/activity
```

### Body (✅ V2 Ready)
```
GET  /api/body/latest
GET  /api/weight
POST /api/weight
GET  /api/weight/chart
GET  /api/photos
POST /api/photos
GET  /api/photos/stats
```

### Protocol (✅ V2 Ready)
```
GET  /api/protocol/streak
GET  /api/protocol/{date}
POST /api/protocol
GET  /api/retention/status
```

### Skills & Curriculum (✅ V2 Ready)
```
GET  /api/skills
GET  /api/skills/{key}
PUT  /api/skills/{key}
GET  /api/curriculum/stats
GET  /api/curriculum/skills
GET  /api/curriculum/skills/{key}
PUT  /api/curriculum/modules/{id}
```

### Career (✅ V2 Ready)
```
GET  /api/jobs
POST /api/jobs
GET  /api/jobs/stats
PUT  /api/jobs/goals
GET  /api/jobs/{id}
PUT  /api/jobs/{id}
DELETE /api/jobs/{id}
```

### AI (✅ V2 Ready)
```
POST /api/ai/chat
POST /api/ai/memory/upsert
POST /api/ai/memory/search
POST /api/ai/rag/query
POST /api/ai/voice/transcribe
```

### Challenges & Fang Yuan (✅ V2 Ready)
```
GET  /api/challenges
POST /api/challenges/join
POST /api/challenges/progress
GET  /api/fang-yuan/principles
GET  /api/fang-yuan/daily
POST /api/fang-yuan/quiz
```

### Weekly & Analytics (✅ V2 Ready)
```
GET  /api/weekly/plan
GET  /api/weekly/review
GET  /api/adaptive/profile
GET  /api/adaptive/recommendation
GET  /api/analytics/trends
GET  /api/outcomes
```

### WebSocket (✅ V2 Ready)
```
WS /api/ws
```

---

## Migration Strategy

### Option A: Component-by-Component (Recommended)
Migrate one HQ/feature at a time from V1 to V2.

**Pros:**
- Can run V1 and V2 side-by-side
- Lower risk
- Incremental testing

**Cons:**
- Longer migration timeline
- Need to maintain two codebases temporarily

**Timeline:** 2-3 weeks

### Option B: Big Bang
Build all V2 pages at once, then switch.

**Pros:**
- Clean cutover
- Consistent architecture

**Cons:**
- High risk
- All-or-nothing deployment
- Longer time without updates

**Timeline:** 4-6 weeks

### Option C: Feature Flags
Build V2 features behind flags, gradually enable.

**Pros:**
- Safest approach
- Instant rollback
- Can A/B test

**Cons:**
- Most complex setup
- Requires flag infrastructure

**Timeline:** 3-4 weeks

---

## Recommended Approach: Option A

### Week 1: Core Dashboard
1. Port `PlayerStats` component
2. Create dashboard layout with sidebar
3. Add player stats API integration
4. Add XP/Level display

### Week 2: Body & Protocol
1. Port `BodyHQView` with measurements
2. Port `ProtocolView` with checklist
3. Add weight chart
4. Test photo upload

### Week 3: Career & Skills
1. Port `CareerHQView` with job tracker
2. Port `SkillsRoadmapView` with curriculum
3. Add curriculum progress tracking
4. Add job pipeline stats

### Week 4: AI & Polish
1. Port `CoachView` with chat
2. Add voice transcription
3. Add Fang Yuan teachings
4. Final testing & bug fixes

---

## Technical Considerations

### V1 → V2 Component Mapping

```typescript
// V1 (React Router)
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/dashboard');

// V2 (Next.js App Router)
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/dashboard');
```

```typescript
// V1 (API calls)
import { api } from '../services/api';
const data = await api.get('/player/stats');

// V2 (API calls - same!)
import { api } from '@/lib/api';
const data = await api.getPlayerStats();
```

### Styling
Both use Tailwind v4 with similar configs. Copy-paste compatible.

### State Management
V1 uses React Context. V2 already has AuthContext. Extend pattern for other state.

### Animation
V1 uses Framer Motion. V2 needs to add Framer Motion dependency.

---

## Deployment Plan

### Development
```bash
# Terminal 1: Backend
cd services/gateway
cargo run --bin gateway

# Terminal 2: Frontend V2
cd apps/web
npm run dev  # Port 3003
```

### Production
```bash
# Build frontend
cd apps/web
npm run build

# Serve via Next.js or export static
cd services/gateway
./target/release/gateway  # Port 3000
```

### Docker (Future)
```yaml
version: '3.8'
services:
  gateway:
    build: ./services/gateway
    ports: ["3000:3000"]
  web:
    build: ./apps/web
    ports: ["3002:3002"]
  postgres:
    image: postgres:16
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| API breaking changes | Low | High | Both use same API client patterns |
| Styling inconsistencies | Low | Medium | Same Tailwind v4 config |
| Missing V1 features | Medium | Medium | Comprehensive checklist above |
| Performance regression | Low | Medium | Next.js 15 is faster than Vite for SSR |
| Auth token issues | Low | High | JWT format unchanged |

---

## Success Criteria

- [ ] All V1 features work in V2
- [ ] Lighthouse score > 90
- [ ] No console errors
- [ ] Auth persists correctly
- [ ] Mobile responsive
- [ ] Dark mode works
- [ ] WebSocket connects

---

## Quick Start for Developers

```bash
# 1. Start backend
cd services/gateway
cargo run --bin gateway

# 2. In new terminal, start frontend V2
cd apps/web
npm install
npm run dev

# 3. Open http://localhost:3003
# 4. Login with test credentials
# 5. Verify auth works

# 6. Compare with V1 (reference)
cd mirlind-protocol-react
npm run dev  # Port 5173
```

---

## Next Steps

1. **Immediate**: Port Dashboard/PlayerStats component
2. **This Week**: Body HQ + Protocol
3. **Next Week**: Career HQ + Skills
4. **Following Week**: AI Coach + Polish
5. **Deploy**: Switch DNS from V1 to V2

---

*Plan created: 2026-02-28*
*Backend V2: 100% Complete*
*Frontend V2: 15% Complete (Auth only)*
