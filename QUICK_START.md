# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Git Commands (Important!)
```bash
# Remove sensitive files from git tracking
git rm --cached backend/.env
git rm --cached backend/mirlind.db
git rm -r --cached mirlind-protocol-react/dist
git add .gitignore
git commit -m "security: remove sensitive files from git"
```

### Step 2: Install Dependencies
```bash
cd backend
npm install
cd ../mirlind-protocol-react
npm install
```

### Step 3: Start the App
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd mirlind-protocol-react
npm run dev
```

---

## ✅ Verification

Check these URLs:
- Frontend: http://localhost:5173
- Backend Health: http://localhost:3001/api/health

---

## 📁 What's Changed?

### Security
- JWT secret rotated
- Rate limiting added
- `.env` files protected

### Backend
- Modular structure (10 files instead of 1)
- Rate limiting: 5 auth attempts / 15 min
- Better error handling

### Frontend
- ProtocolView split into 7 components
- CardsView split into 4 components
- Data extracted to JSON files
- Logger utility added

---

## 🆘 Troubleshooting

### "JWT_SECRET required"
Add to `backend/.env`:
```env
JWT_SECRET=your-secret-key-here-min-32-chars
```

### "Cannot find module './json/*.json'"
Check `tsconfig.app.json` has:
```json
"resolveJsonModule": true
```

### Rate limiting too strict
Temporarily disable in `backend/src/index.js`:
```javascript
// app.use(globalLimiter);
```

---

## 📚 Full Documentation

- `MIGRATION_GUIDE.md` - Complete migration instructions
- `COMPLETE_REFACTORING_REPORT.md` - Detailed report
- `REFACTORING_SUMMARY.md` - Summary of changes

---

Done! 🎉
