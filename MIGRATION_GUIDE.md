# Migration Guide - Complete Project Refactoring

## 🚀 Overview

This guide covers all the changes made to the gamified-life project including security fixes, code quality improvements, and architectural refactoring.

---

## ⚡ Immediate Actions Required

### 1. Git Commands (Run These First)

```bash
# Remove sensitive files from git tracking
git rm --cached backend/.env
git rm --cached backend/mirlind.db
git rm -r --cached mirlind-protocol-react/dist

# Stage the updated .gitignore
git add .gitignore

# Commit the removal
git commit -m "security: remove sensitive files from git tracking"
```

### 2. Install New Dependencies

```bash
# Backend
 cd backend
 npm install

# Frontend (if needed)
cd ../mirlind-protocol-react
npm install
```

### 3. Verify Environment Variables

**backend/.env** (should already be updated):
```env
# Database
DATABASE_URL=postgresql://postgres:password123@localhost:5432/mirlind_protocol

# JWT Secret (this was rotated - new random 64-char string)
JWT_SECRET=7MipVWaTLz6HNGQjreKhIoXZkvS9uty045YglcmRUs2DqfFAB8n1PwEbO3xdCJ

# Server Port
PORT=3001
```

**mirlind-protocol-react/.env**:
```env
VITE_API_URL=http://localhost:3001/api
```

---

## 📁 Project Structure Changes

### Before
```
gamified-life/
├── backend/
│   ├── server.js          # 1024 lines - monolithic
│   ├── package.json
│   └── ...
├── mirlind-protocol-react/
│   ├── src/
│   │   ├── data/
│   │   │   ├── skills.ts      # 611 lines
│   │   │   ├── roadmap.ts     # 600+ lines
│   │   │   └── challenges.ts
│   │   ├── views/
│   │   │   ├── ProtocolView.tsx   # 920 lines
│   │   │   ├── CardsView.tsx      # 603 lines
│   │   │   └── ...
│   │   └── ...
│   └── ...
└── ...
```

### After
```
gamified-life/
├── backend/
│   ├── server.js              # Kept as backup
│   ├── src/
│   │   ├── index.js           # New entry point
│   │   ├── database/
│   │   │   └── index.js       # Database module
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT middleware
│   │   └── routes/
│   │       ├── index.js       # Route aggregator
│   │       ├── auth.js        # Auth routes + rate limiting
│   │       ├── player.js
│   │       ├── body.js
│   │       ├── german.js
│   │       ├── finance.js
│   │       └── protocol.js
│   └── package.json           # Updated
├── mirlind-protocol-react/
│   ├── src/
│   │   ├── data/
│   │   │   ├── json/              # NEW: JSON data files
│   │   │   │   ├── skills.json
│   │   │   │   └── roadmap.json
│   │   │   ├── skills.ts          # Now imports from JSON
│   │   │   └── roadmap.ts         # Now imports from JSON
│   │   ├── views/
│   │   │   ├── protocol/          # NEW: ProtocolView modules
│   │   │   │   ├── types.ts
│   │   │   │   ├── DailyProtocolTab.tsx
│   │   │   │   ├── BodyTrackingTab.tsx
│   │   │   │   ├── GermanTab.tsx
│   │   │   │   ├── CodeTab.tsx
│   │   │   │   ├── FinanceTab.tsx
│   │   │   │   ├── WeeklyTab.tsx
│   │   │   │   └── index.ts
│   │   │   ├── cards/             # NEW: CardsView modules
│   │   │   │   ├── types.ts
│   │   │   │   ├── CodingRoadmapTab.tsx
│   │   │   │   ├── MindsetTab.tsx
│   │   │   │   ├── ModuleDetailModal.tsx
│   │   │   │   └── index.ts
│   │   │   ├── ProtocolView.tsx   # Reduced to ~730 lines
│   │   │   └── CardsView.tsx      # Reduced to ~105 lines
│   │   ├── utils/
│   │   │   └── logger.ts          # NEW: Logger utility
│   │   └── ...
│   └── ...
└── ...
```

---

## 🔒 Security Improvements

### 1. Secrets Rotation
- **JWT Secret**: Changed from `mirlind-protocol-secret-key-2026` to new 64-char random string
- **Action Required**: Users with existing tokens will need to re-login

### 2. Rate Limiting Added
```javascript
// Auth endpoints: 5 attempts per 15 minutes
// Global API: 100 requests per 15 minutes per IP
```

### 3. JWT Error Handling
- Specific error codes: `TOKEN_MISSING`, `TOKEN_EXPIRED`, `TOKEN_INVALID`
- Fail-fast if `JWT_SECRET` not set

### 4. Environment Variables Protected
- `.env` files added to `.gitignore`
- Database files (`*.db`) added to `.gitignore`
- Build outputs (`dist/`) in `.gitignore`

---

## 🏗️ Code Quality Improvements

### 1. Duplicate Interfaces Consolidated

**Before**:
```typescript
// User interface defined in 3 places
// authApi.ts, authTypes.ts, AuthContext.tsx
```

**After**:
```typescript
// Single source in authTypes.ts
// Others import from there
```

### 2. Skill Interface Renamed

**Before**:
```typescript
// Two different Skill interfaces causing confusion
```

**After**:
```typescript
Skill           // RPG game skills (types/index.ts)
MasterySkill    // Real-world skills (data/skills.ts)
```

### 3. Logger Utility

**Before**:
```typescript
console.error('Failed to load:', error);
```

**After**:
```typescript
import { logger } from '../utils/logger';
logger.error('Failed to load:', error);  // Respects NODE_ENV
```

---

## 📊 Component Refactoring

### ProtocolView.tsx
| Metric | Before | After |
|--------|--------|-------|
| Lines | ~920 | ~730 |
| Components | 7 (in one file) | 7 (separate files) |
| Maintainability | ⭐⭐ | ⭐⭐⭐⭐⭐ |

### CardsView.tsx
| Metric | Before | After |
|--------|--------|-------|
| Lines | ~603 | ~105 |
| Components | 4 (in one file) | 4 (separate files) |
| Maintainability | ⭐⭐ | ⭐⭐⭐⭐⭐ |

### Data Files
| File | Before | After |
|------|--------|-------|
| skills.ts | 611 lines | 107 lines (+ JSON) |
| roadmap.ts | 600+ lines | ~100 lines (+ JSON) |

---

## 🔄 API Changes

### Backend Entry Point
```bash
# Before
node server.js

# After
node src/index.js
# or
npm start  # (updated in package.json)
```

### Backend Routes (Unchanged)
All API endpoints remain the same:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/player/stats`
- etc.

---

## 🧪 Testing Checklist

### Backend Tests
- [ ] Server starts without errors
- [ ] JWT_SECRET missing causes immediate exit
- [ ] Rate limiting works (try 6+ login attempts)
- [ ] All API endpoints respond correctly
- [ ] Error handling middleware works

### Frontend Tests
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] All views load correctly
- [ ] Skills tree works with MasterySkill type
- [ ] Protocol tabs switch correctly
- [ ] Cards view tabs work
- [ ] Logger suppresses logs in production

### Integration Tests
- [ ] Login works
- [ ] Register works
- [ ] Token refresh/validation works
- [ ] Data persistence works

---

## 📝 File Change Summary

### New Files Created (26)
```
.gitignore (updated)
backend/.env.example
backend/src/index.js
backend/src/database/index.js
backend/src/middleware/auth.js
backend/src/routes/index.js
backend/src/routes/auth.js
backend/src/routes/player.js
backend/src/routes/body.js
backend/src/routes/german.js
backend/src/routes/finance.js
backend/src/routes/protocol.js
mirlind-protocol-react/src/utils/logger.ts
mirlind-protocol-react/src/data/json/skills.json
mirlind-protocol-react/src/data/json/roadmap.json
mirlind-protocol-react/src/views/protocol/types.ts
mirlind-protocol-react/src/views/protocol/DailyProtocolTab.tsx
mirlind-protocol-react/src/views/protocol/BodyTrackingTab.tsx
mirlind-protocol-react/src/views/protocol/GermanTab.tsx
mirlind-protocol-react/src/views/protocol/CodeTab.tsx
mirlind-protocol-react/src/views/protocol/FinanceTab.tsx
mirlind-protocol-react/src/views/protocol/WeeklyTab.tsx
mirlind-protocol-react/src/views/protocol/index.ts
mirlind-protocol-react/src/views/cards/types.ts
mirlind-protocol-react/src/views/cards/CodingRoadmapTab.tsx
mirlind-protocol-react/src/views/cards/MindsetTab.tsx
mirlindind-protocol-react/src/views/cards/ModuleDetailModal.tsx
mirlind-protocol-react/src/views/cards/index.ts
```

### Modified Files (17)
```
backend/.env
backend/package.json
mirlind-protocol-react/.env
mirlind-protocol-react/.env.example
mirlind-protocol-react/tsconfig.app.json
mirlind-protocol-react/src/views/index.ts
mirlind-protocol-react/src/contexts/authTypes.ts
mirlind-protocol-react/src/contexts/AuthContext.tsx
mirlind-protocol-react/src/services/authApi.ts
mirlind-protocol-react/src/data/skills.ts
mirlind-protocol-react/src/data/roadmap.ts
mirlind-protocol-react/src/views/TreeView.tsx
mirlind-protocol-react/src/components/index.ts
mirlind-protocol-react/src/views/CardsView.tsx
mirlind-protocol-react/src/views/ProtocolView.tsx
mirlind-protocol-react/src/views/JournalView.tsx
mirlind-protocol-react/src/views/FocusView.tsx
mirlind-protocol-react/src/store/GameContext.tsx
mirlind-protocol-react/src/hooks/useNotifications.ts
```

---

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] All sensitive files removed from git
- [ ] New JWT secret set in production
- [ ] Database password changed (if needed)
- [ ] `npm install` run on backend
- [ ] `npm run build` succeeds on frontend

### Deployment
- [ ] Deploy backend
- [ ] Verify backend health check: `/api/health`
- [ ] Deploy frontend
- [ ] Smoke test critical paths

### Post-deployment
- [ ] Monitor error logs
- [ ] Check rate limiting is active
- [ ] Verify user tokens work (or force re-login)

---

## 🆘 Troubleshooting

### Issue: "JWT_SECRET required" error
**Solution**: Set `JWT_SECRET` environment variable

### Issue: "Cannot find module './json/skills.json'"
**Solution**: Ensure `tsconfig.app.json` has `"resolveJsonModule": true`

### Issue: Rate limiting too strict in development
**Solution**: Temporarily disable in `backend/src/index.js`:
```javascript
// Comment out for development
// app.use(globalLimiter);
```

### Issue: Import errors after component split
**Solution**: Check that all relative paths are correct (e.g., `../../data/...` from subdirectories)

---

## 📚 Additional Resources

- `REFACTORING_SUMMARY.md` - Detailed summary of all changes
- `verify-refactor.ps1` - PowerShell verification script
- `rename-frontend.ps1` - Script to rename frontend folder (optional)

---

## ✅ Final Verification

Run these commands to verify everything:

```bash
# 1. Verify git status
git status  # Should not show .env or .db files

# 2. Test backend
cd backend
npm start
# Check: http://localhost:3001/api/health

# 3. Test frontend (in new terminal)
cd mirlind-protocol-react
npm run build
npm run dev

# 4. Check browser console - should have no errors
```

---

**Last Updated**: 2026-02-16
**Version**: 1.0.0
