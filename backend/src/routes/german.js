const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ============================================================================
// German Progress Routes (protected)
// ============================================================================

// Get German progress for a date
router.get('/:date', authenticateToken, (req, res) => {
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
router.post('/', authenticateToken, (req, res) => {
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
router.get('/latest', authenticateToken, (req, res) => {
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

module.exports = router;
