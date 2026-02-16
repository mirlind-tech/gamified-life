const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ============================================================================
// Daily Protocol Routes (protected)
// ============================================================================

// Get daily protocol for a date
router.get('/:date', authenticateToken, (req, res) => {
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
router.post('/', authenticateToken, (req, res) => {
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
router.get('/streak', authenticateToken, (req, res) => {
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

module.exports = router;
