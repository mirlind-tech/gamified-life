const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('../database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Register endpoint
router.post('/register', authLimiter, async (req, res) => {
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
router.post('/login', authLimiter, async (req, res) => {
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
router.get('/me', authenticateToken, (req, res) => {
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

module.exports = router;
