const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// SQLite connection
const db = new Database('./mirlind.db');

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Initialize database
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS player_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      xp_to_next INTEGER DEFAULT 100,
      pillars TEXT DEFAULT '{}',
      skills TEXT DEFAULT '{}',
      activity_stats TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Body measurements tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS body_measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      weight REAL,
      height REAL,
      biceps REAL,
      forearms REAL,
      chest REAL,
      waist REAL,
      hips REAL,
      thighs REAL,
      calves REAL,
      shoulders REAL,
      wrist REAL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Workout tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      exercises TEXT NOT NULL,
      duration INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // German progress tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS german_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      anki_cards INTEGER DEFAULT 0,
      anki_time INTEGER DEFAULT 0,
      anki_streak INTEGER DEFAULT 0,
      total_words INTEGER DEFAULT 0,
      language_transfer BOOLEAN DEFAULT 0,
      language_transfer_lesson INTEGER DEFAULT 1,
      radio_hours REAL DEFAULT 0,
      tandem_minutes INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    )
  `);

  // Code progress tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS code_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      hours REAL DEFAULT 0,
      github_commits INTEGER DEFAULT 0,
      project TEXT,
      skills TEXT DEFAULT '[]',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    )
  `);

  // Finance tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS finance_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Daily protocol tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_protocol (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      wake05 BOOLEAN DEFAULT 0,
      german_study BOOLEAN DEFAULT 0,
      gym_workout BOOLEAN DEFAULT 0,
      coding_hours REAL DEFAULT 0,
      sleep22 BOOLEAN DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    )
  `);

  console.log('✅ Database initialized');
}

initDb();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = db.prepare(
      'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)'
    ).run(email, username, hashedPassword);

    const userId = result.lastInsertRowid;

    // Create default player stats
    const defaultPillars = JSON.stringify({
      craft: { level: 1, xp: 0, xpToNext: 100, name: 'Craft', color: '#06b6d4' },
      vessel: { level: 1, xp: 0, xpToNext: 100, name: 'Vessel', color: '#ec4899' },
      tongue: { level: 1, xp: 0, xpToNext: 100, name: 'Tongue', color: '#8b5cf6' },
      principle: { level: 1, xp: 0, xpToNext: 150, name: 'Principle', color: '#a855f7' },
      capital: { level: 1, xp: 0, xpToNext: 100, name: 'Capital', color: '#10b981' },
    });

    const defaultSkills = JSON.stringify({
      javascript: { level: 0, xp: 0, xpToNext: 100, parent: 'craft' },
      germanA1: { level: 0, xp: 0, xpToNext: 100, parent: 'tongue' },
      strength: { level: 1, xp: 0, xpToNext: 100, parent: 'vessel' },
    });

    const defaultActivityStats = JSON.stringify({
      focusSessions: 0,
      focusMinutes: 0,
      habitsCompleted: 0,
      journalEntries: 0,
      questsCompleted: 0,
    });

    db.prepare(
      'INSERT INTO player_stats (user_id, pillars, skills, activity_stats) VALUES (?, ?, ?, ?)'
    ).run(userId, defaultPillars, defaultSkills, defaultActivityStats);

    // Generate JWT
    const token = jwt.sign(
      { userId, email, username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: userId,
        email,
        username,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user (protected route)
app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, username, created_at FROM users WHERE id = ?').get(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get player stats (protected) - auto-creates if not found
app.get('/api/player/stats', authenticateToken, (req, res) => {
  try {
    let stats = db.prepare('SELECT * FROM player_stats WHERE user_id = ?').get(req.user.userId);
    
    // Auto-create stats if not found
    if (!stats) {
      const defaultPillars = JSON.stringify({
        craft: { level: 1, xp: 0, xpToNext: 100, name: 'Craft', color: '#06b6d4' },
        vessel: { level: 1, xp: 0, xpToNext: 100, name: 'Vessel', color: '#ec4899' },
        tongue: { level: 1, xp: 0, xpToNext: 100, name: 'Tongue', color: '#8b5cf6' },
        principle: { level: 1, xp: 0, xpToNext: 150, name: 'Principle', color: '#a855f7' },
        capital: { level: 1, xp: 0, xpToNext: 100, name: 'Capital', color: '#10b981' },
      });
      const defaultSkills = JSON.stringify({});
      const defaultActivityStats = JSON.stringify({
        focusSessions: 0,
        focusMinutes: 0,
        habitsCompleted: 0,
        journalEntries: 0,
        questsCompleted: 0,
        meditationMinutes: 0,
      });
      
      const result = db.prepare(
        'INSERT INTO player_stats (user_id, level, xp, xp_to_next, pillars, skills, activity_stats) VALUES (?, 1, 0, 100, ?, ?, ?)'
      ).run(req.user.userId, defaultPillars, defaultSkills, defaultActivityStats);
      
      stats = {
        id: result.lastInsertRowid,
        user_id: req.user.userId,
        level: 1,
        xp: 0,
        xp_to_next: 100,
        pillars: defaultPillars,
        skills: defaultSkills,
        activity_stats: defaultActivityStats,
      };
    }
    
    res.json({
      stats: {
        level: stats.level,
        xp: stats.xp,
        xpToNext: stats.xp_to_next,
        pillars: JSON.parse(stats.pillars),
        skills: JSON.parse(stats.skills),
        activityStats: JSON.parse(stats.activity_stats),
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add XP and handle level up (protected)
app.post('/api/player/add-xp', authenticateToken, (req, res) => {
  try {
    const { amount, type, skillId } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid XP amount' });
    }
    
    // Get current stats
    const stats = db.prepare('SELECT * FROM player_stats WHERE user_id = ?').get(req.user.userId);
    if (!stats) {
      return res.status(404).json({ error: 'Player stats not found' });
    }
    
    let { level, xp, xp_to_next, pillars, skills, activity_stats } = stats;
    pillars = JSON.parse(pillars);
    skills = JSON.parse(skills);
    activity_stats = JSON.parse(activity_stats);
    
    // Add XP
    xp += amount;
    let levelUp = false;
    let levelsGained = 0;
    
    // Check for level up
    while (xp >= xp_to_next) {
      xp -= xp_to_next;
      level += 1;
      levelsGained += 1;
      levelUp = true;
      xp_to_next = Math.floor(xp_to_next * 1.2); // 20% harder each level
    }
    
    // Update pillar XP if type specified
    if (type && pillars[type]) {
      pillars[type].xp += amount;
      if (pillars[type].xp >= pillars[type].xpToNext) {
        pillars[type].xp -= pillars[type].xpToNext;
        pillars[type].level += 1;
        pillars[type].xpToNext = Math.floor(pillars[type].xpToNext * 1.25);
      }
    }
    
    // Update skill XP if skillId specified
    if (skillId && skills[skillId]) {
      skills[skillId].xp += amount;
      if (skills[skillId].xp >= skills[skillId].xpToNext) {
        skills[skillId].xp -= skills[skillId].xpToNext;
        skills[skillId].level += 1;
        skills[skillId].xpToNext = Math.floor(skills[skillId].xpToNext * 1.3);
      }
    }
    
    // Save updated stats
    db.prepare(
      `UPDATE player_stats SET 
        level = ?,
        xp = ?,
        xp_to_next = ?,
        pillars = ?,
        skills = ?,
        activity_stats = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?`
    ).run(
      level,
      xp,
      xp_to_next,
      JSON.stringify(pillars),
      JSON.stringify(skills),
      JSON.stringify(activity_stats),
      req.user.userId
    );
    
    res.json({
      message: `+${amount} XP earned!`,
      levelUp,
      levelsGained,
      newLevel: level,
      xp,
      xpToNext: xp_to_next,
      progress: Math.floor((xp / xp_to_next) * 100),
    });
  } catch (error) {
    console.error('Add XP error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update player stats (protected)
app.put('/api/player/stats', authenticateToken, (req, res) => {
  try {
    const { level, xp, xpToNext, pillars, skills, activityStats } = req.body;
    
    const result = db.prepare(
      `UPDATE player_stats SET 
        level = COALESCE(?, level),
        xp = COALESCE(?, xp),
        xp_to_next = COALESCE(?, xp_to_next),
        pillars = COALESCE(?, pillars),
        skills = COALESCE(?, skills),
        activity_stats = COALESCE(?, activity_stats),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?`
    ).run(
      level,
      xp,
      xpToNext,
      pillars ? JSON.stringify(pillars) : null,
      skills ? JSON.stringify(skills) : null,
      activityStats ? JSON.stringify(activityStats) : null,
      req.user.userId
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Player stats not found' });
    }
    
    res.json({ message: 'Stats updated successfully' });
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Track activity (protected)
app.post('/api/player/activity', authenticateToken, (req, res) => {
  try {
    const { type, count = 1 } = req.body;
    
    const validTypes = ['focusSessions', 'focusMinutes', 'habitsCompleted', 'journalEntries', 'questsCompleted', 'meditationMinutes'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid activity type' });
    }
    
    // Get current stats
    const stats = db.prepare('SELECT activity_stats FROM player_stats WHERE user_id = ?').get(req.user.userId);
    if (!stats) {
      return res.status(404).json({ error: 'Player stats not found' });
    }
    
    const activityStats = JSON.parse(stats.activity_stats);
    activityStats[type] = (activityStats[type] || 0) + count;
    
    // Save updated activity stats
    db.prepare(
      'UPDATE player_stats SET activity_stats = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
    ).run(JSON.stringify(activityStats), req.user.userId);
    
    res.json({
      message: 'Activity tracked',
      type,
      total: activityStats[type],
    });
  } catch (error) {
    console.error('Track activity error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================================
// Body Measurements Routes (protected)
// ============================================================================

// Get all body measurements
app.get('/api/body/measurements', authenticateToken, (req, res) => {
  try {
    const measurements = db.prepare(
      'SELECT * FROM body_measurements WHERE user_id = ? ORDER BY date DESC'
    ).all(req.user.userId);
    res.json({ measurements });
  } catch (error) {
    console.error('Get measurements error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add or update body measurement (upsert)
app.post('/api/body/measurements', authenticateToken, (req, res) => {
  try {
    const { date, weight, height, biceps, forearms, chest, waist, hips, thighs, calves, shoulders, wrist, notes } = req.body;
    
    // Check if entry exists for this date
    const existing = db.prepare(
      'SELECT id FROM body_measurements WHERE user_id = ? AND date = ?'
    ).get(req.user.userId, date);
    
    if (existing) {
      // Update
      db.prepare(
        `UPDATE body_measurements SET 
         weight = ?, height = ?, biceps = ?, forearms = ?, chest = ?, waist = ?, 
         hips = ?, thighs = ?, calves = ?, shoulders = ?, wrist = ?, notes = ?
         WHERE user_id = ? AND date = ?`
      ).run(weight, height, biceps, forearms, chest, waist, hips, thighs, calves, shoulders, wrist, notes,
            req.user.userId, date);
      res.json({ message: 'Measurement updated' });
    } else {
      // Insert
      const result = db.prepare(
        `INSERT INTO body_measurements 
         (user_id, date, weight, height, biceps, forearms, chest, waist, hips, thighs, calves, shoulders, wrist, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(req.user.userId, date, weight, height, biceps, forearms, chest, waist, hips, thighs, calves, shoulders, wrist, notes);
      
      res.status(201).json({ 
        id: result.lastInsertRowid,
        message: 'Measurement recorded'
      });
    }
  } catch (error) {
    console.error('Add measurement error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get latest measurement
app.get('/api/body/latest', authenticateToken, (req, res) => {
  try {
    const measurement = db.prepare(
      'SELECT * FROM body_measurements WHERE user_id = ? ORDER BY date DESC LIMIT 1'
    ).get(req.user.userId);
    res.json({ measurement: measurement || null });
  } catch (error) {
    console.error('Get latest measurement error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================================
// Workout Routes (protected)
// ============================================================================

// Get all workouts
app.get('/api/workouts', authenticateToken, (req, res) => {
  try {
    const workouts = db.prepare(
      'SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC'
    ).all(req.user.userId);
    res.json({ workouts: workouts.map(w => ({ ...w, exercises: JSON.parse(w.exercises) })) });
  } catch (error) {
    console.error('Get workouts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add workout
app.post('/api/workouts', authenticateToken, (req, res) => {
  try {
    const { date, name, exercises, duration, notes } = req.body;
    
    const result = db.prepare(
      `INSERT INTO workouts (user_id, date, name, exercises, duration, notes)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(req.user.userId, date, name, JSON.stringify(exercises), duration, notes);
    
    res.status(201).json({ 
      id: result.lastInsertRowid,
      message: 'Workout logged'
    });
  } catch (error) {
    console.error('Add workout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get workout by ID
app.get('/api/workouts/:id', authenticateToken, (req, res) => {
  try {
    const workout = db.prepare(
      'SELECT * FROM workouts WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user.userId);
    
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    
    res.json({ ...workout, exercises: JSON.parse(workout.exercises) });
  } catch (error) {
    console.error('Get workout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================================
// German Progress Routes (protected)
// ============================================================================

// Get German progress for a date
app.get('/api/german/:date', authenticateToken, (req, res) => {
  try {
    const progress = db.prepare(
      'SELECT * FROM german_progress WHERE user_id = ? AND date = ?'
    ).get(req.user.userId, req.params.date);
    
    if (!progress) {
      return res.json({ 
        progress: {
          date: req.params.date,
          anki_cards: 0,
          anki_time: 0,
          anki_streak: 0,
          total_words: 0,
          language_transfer: false,
          language_transfer_lesson: 1,
          radio_hours: 0,
          tandem_minutes: 0,
          notes: ''
        }
      });
    }
    
    res.json({ progress });
  } catch (error) {
    console.error('Get German progress error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save German progress
app.post('/api/german', authenticateToken, (req, res) => {
  try {
    const { date, anki_cards, anki_time, anki_streak, total_words, 
            language_transfer, language_transfer_lesson, radio_hours, tandem_minutes, notes } = req.body;
    
    // Check if entry exists for this date
    const existing = db.prepare(
      'SELECT id FROM german_progress WHERE user_id = ? AND date = ?'
    ).get(req.user.userId, date);
    
    if (existing) {
      // Update
      db.prepare(
        `UPDATE german_progress SET 
         anki_cards = ?, anki_time = ?, anki_streak = ?, total_words = ?,
         language_transfer = ?, language_transfer_lesson = ?, radio_hours = ?, tandem_minutes = ?, notes = ?
         WHERE user_id = ? AND date = ?`
      ).run(anki_cards, anki_time, anki_streak, total_words, 
            language_transfer ? 1 : 0, language_transfer_lesson, radio_hours, tandem_minutes, notes,
            req.user.userId, date);
    } else {
      // Insert
      db.prepare(
        `INSERT INTO german_progress 
         (user_id, date, anki_cards, anki_time, anki_streak, total_words,
          language_transfer, language_transfer_lesson, radio_hours, tandem_minutes, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(req.user.userId, date, anki_cards, anki_time, anki_streak, total_words,
            language_transfer ? 1 : 0, language_transfer_lesson, radio_hours, tandem_minutes, notes);
    }
    
    res.json({ message: 'German progress saved' });
  } catch (error) {
    console.error('Save German progress error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get latest German progress
app.get('/api/german/latest', authenticateToken, (req, res) => {
  try {
    const progress = db.prepare(
      'SELECT * FROM german_progress WHERE user_id = ? ORDER BY date DESC LIMIT 1'
    ).get(req.user.userId);
    
    res.json({ progress: progress || null });
  } catch (error) {
    console.error('Get latest German progress error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================================
// Code Progress Routes (protected)
// ============================================================================

// Get code progress for a date
app.get('/api/code/:date', authenticateToken, (req, res) => {
  try {
    const progress = db.prepare(
      'SELECT * FROM code_progress WHERE user_id = ? AND date = ?'
    ).get(req.user.userId, req.params.date);
    
    if (!progress) {
      return res.json({ 
        progress: {
          date: req.params.date,
          hours: 0,
          github_commits: 0,
          project: '',
          skills: [],
          notes: ''
        }
      });
    }
    
    res.json({ 
      progress: {
        ...progress,
        skills: JSON.parse(progress.skills || '[]')
      }
    });
  } catch (error) {
    console.error('Get code progress error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save code progress
app.post('/api/code', authenticateToken, (req, res) => {
  try {
    const { date, hours, github_commits, project, skills, notes } = req.body;
    
    // Check if entry exists for this date
    const existing = db.prepare(
      'SELECT id FROM code_progress WHERE user_id = ? AND date = ?'
    ).get(req.user.userId, date);
    
    if (existing) {
      // Update
      db.prepare(
        `UPDATE code_progress SET 
         hours = ?, github_commits = ?, project = ?, skills = ?, notes = ?
         WHERE user_id = ? AND date = ?`
      ).run(hours, github_commits, project, JSON.stringify(skills || []), notes,
            req.user.userId, date);
    } else {
      // Insert
      db.prepare(
        `INSERT INTO code_progress 
         (user_id, date, hours, github_commits, project, skills, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(req.user.userId, date, hours, github_commits, project, JSON.stringify(skills || []), notes);
    }
    
    res.json({ message: 'Code progress saved' });
  } catch (error) {
    console.error('Save code progress error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get latest code progress
app.get('/api/code/latest', authenticateToken, (req, res) => {
  try {
    const progress = db.prepare(
      'SELECT * FROM code_progress WHERE user_id = ? ORDER BY date DESC LIMIT 1'
    ).get(req.user.userId);
    
    res.json({ 
      progress: progress ? { ...progress, skills: JSON.parse(progress.skills || '[]') } : null 
    });
  } catch (error) {
    console.error('Get latest code progress error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================================
// Finance Routes (protected)
// ============================================================================

// Get finance entries for a date range
app.get('/api/finance', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = 'SELECT * FROM finance_entries WHERE user_id = ?';
    let params = [req.user.userId];
    
    if (startDate && endDate) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    query += ' ORDER BY date DESC, created_at DESC';
    
    const entries = db.prepare(query).all(...params);
    res.json({ entries });
  } catch (error) {
    console.error('Get finance entries error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add finance entry
app.post('/api/finance', authenticateToken, (req, res) => {
  try {
    const { date, amount, category, description } = req.body;
    
    const result = db.prepare(
      `INSERT INTO finance_entries (user_id, date, amount, category, description)
       VALUES (?, ?, ?, ?, ?)`
    ).run(req.user.userId, date, amount, category, description);
    
    res.status(201).json({ 
      id: result.lastInsertRowid,
      message: 'Entry recorded'
    });
  } catch (error) {
    console.error('Add finance entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete finance entry
app.delete('/api/finance/:id', authenticateToken, (req, res) => {
  try {
    const result = db.prepare(
      'DELETE FROM finance_entries WHERE id = ? AND user_id = ?'
    ).run(req.params.id, req.user.userId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    res.json({ message: 'Entry deleted' });
  } catch (error) {
    console.error('Delete finance entry error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get finance summary
app.get('/api/finance/summary', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const summary = db.prepare(`
      SELECT 
        category,
        SUM(amount) as total,
        COUNT(*) as count
      FROM finance_entries 
      WHERE user_id = ? AND date BETWEEN ? AND ?
      GROUP BY category
    `).all(req.user.userId, startDate || '1970-01-01', endDate || '9999-12-31');
    
    const total = db.prepare(`
      SELECT SUM(amount) as total FROM finance_entries 
      WHERE user_id = ? AND date BETWEEN ? AND ?
    `).get(req.user.userId, startDate || '1970-01-01', endDate || '9999-12-31');
    
    res.json({ summary, total: total?.total || 0 });
  } catch (error) {
    console.error('Get finance summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================================
// Daily Protocol Routes (protected)
// ============================================================================

// Get daily protocol for a date
app.get('/api/protocol/:date', authenticateToken, (req, res) => {
  try {
    const protocol = db.prepare(
      'SELECT * FROM daily_protocol WHERE user_id = ? AND date = ?'
    ).get(req.user.userId, req.params.date);
    
    if (!protocol) {
      return res.json({ 
        protocol: {
          date: req.params.date,
          wake05: false,
          german_study: false,
          gym_workout: false,
          coding_hours: 0,
          sleep22: false,
          notes: ''
        }
      });
    }
    
    res.json({ protocol });
  } catch (error) {
    console.error('Get protocol error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save daily protocol
app.post('/api/protocol', authenticateToken, (req, res) => {
  try {
    const { date, wake05, german_study, gym_workout, coding_hours, sleep22, notes } = req.body;
    
    // Check if entry exists for this date
    const existing = db.prepare(
      'SELECT id FROM daily_protocol WHERE user_id = ? AND date = ?'
    ).get(req.user.userId, date);
    
    if (existing) {
      // Update
      db.prepare(
        `UPDATE daily_protocol SET 
         wake05 = ?, german_study = ?, gym_workout = ?, coding_hours = ?, sleep22 = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND date = ?`
      ).run(wake05 ? 1 : 0, german_study ? 1 : 0, gym_workout ? 1 : 0, coding_hours, sleep22 ? 1 : 0, notes,
            req.user.userId, date);
    } else {
      // Insert
      db.prepare(
        `INSERT INTO daily_protocol 
         (user_id, date, wake05, german_study, gym_workout, coding_hours, sleep22, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(req.user.userId, date, wake05 ? 1 : 0, german_study ? 1 : 0, gym_workout ? 1 : 0, coding_hours, sleep22 ? 1 : 0, notes);
    }
    
    res.json({ message: 'Protocol saved' });
  } catch (error) {
    console.error('Save protocol error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get protocol streak
app.get('/api/protocol/streak', authenticateToken, (req, res) => {
  try {
    // Get last 365 days of protocol entries
    const entries = db.prepare(`
      SELECT date, wake05, german_study, gym_workout, coding_hours, sleep22
      FROM daily_protocol 
      WHERE user_id = ? 
      ORDER BY date DESC
      LIMIT 365
    `).all(req.user.userId);
    
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (const entry of entries) {
      const completed = entry.wake05 && entry.german_study && entry.gym_workout && entry.sleep22 && entry.coding_hours >= 2;
      if (completed) {
        streak++;
      } else {
        // Only break if this is today or yesterday (allow today to be incomplete)
        const entryDate = new Date(entry.date);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) break;
      }
    }
    
    res.json({ streak });
  } catch (error) {
    console.error('Get protocol streak error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), database: 'SQLite' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💾 Using SQLite database`);
});
