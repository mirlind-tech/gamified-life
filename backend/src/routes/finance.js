const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ============================================================================
// Finance Routes (protected)
// ============================================================================

// Get finance entries for a date range
router.get('/', authenticateToken, (req, res) => {
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
router.post('/', authenticateToken, (req, res) => {
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
router.delete('/:id', authenticateToken, (req, res) => {
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
router.get('/summary', authenticateToken, (req, res) => {
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

module.exports = router;
