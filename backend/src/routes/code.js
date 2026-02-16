const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ============================================================================
// Code Progress Routes (protected)
// ============================================================================

// Get code progress for a date
router.get('/:date', authenticateToken, (req, res) => {
  try {
    const progress = db.prepare(
      'SELECT * FROM code_progress WHERE user_id = ? AND date = ?'
    ).get(req.user.userId, req.params.date);
    
    if (!progress) {
      return res.json({
        progress: {
          date: req.params.date,
          hours: 0,
          commits: 0,
          project: '',
          notes: ''
        }
      });
    }
    
    res.json({ progress });
  } catch (error) {
    console.error('Get code progress error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save code progress
router.post('/', authenticateToken, (req, res) => {
  try {
    const { date, hours, commits, project, notes } = req.body;
    
    // Check if entry exists
    const existing = db.prepare(
      'SELECT id FROM code_progress WHERE user_id = ? AND date = ?'
    ).get(req.user.userId, date);
    
    if (existing) {
      // Update
      db.prepare(
        `UPDATE code_progress SET 
         hours = ?, commits = ?, project = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND date = ?`
      ).run(hours, commits, project, notes, req.user.userId, date);
      res.json({ message: 'Progress updated' });
    } else {
      // Insert
      db.prepare(
        `INSERT INTO code_progress (user_id, date, hours, commits, project, notes)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(req.user.userId, date, hours, commits, project, notes);
      res.status(201).json({ message: 'Progress saved' });
    }
  } catch (error) {
    console.error('Save code progress error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get coding streak
router.get('/stats/streak', authenticateToken, (req, res) => {
  try {
    const entries = db.prepare(`
      SELECT date, hours FROM code_progress 
      WHERE user_id = ? AND hours > 0
      ORDER BY date DESC
      LIMIT 365
    `).all(req.user.userId);
    
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (const entry of entries) {
      if (entry.hours > 0) {
        streak++;
      } else {
        const entryDate = new Date(entry.date);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate - entryDate) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) break;
      }
    }
    
    res.json({ streak });
  } catch (error) {
    console.error('Get streak error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get total stats
router.get('/stats/total', authenticateToken, (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        SUM(hours) as totalHours,
        SUM(commits) as totalCommits,
        COUNT(DISTINCT date) as totalDays
      FROM code_progress 
      WHERE user_id = ?
    `).get(req.user.userId);
    
    res.json({
      totalHours: stats.totalHours || 0,
      totalCommits: stats.totalCommits || 0,
      totalDays: stats.totalDays || 0
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
