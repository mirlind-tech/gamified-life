const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all workouts
router.get('/', authenticateToken, (req, res) => {
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
router.post('/', authenticateToken, (req, res) => {
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
router.get('/:id', authenticateToken, (req, res) => {
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

// Update workout
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { date, name, exercises, duration, notes } = req.body;
    
    const result = db.prepare(
      `UPDATE workouts SET 
       date = ?, name = ?, exercises = ?, duration = ?, notes = ?
       WHERE id = ? AND user_id = ?`
    ).run(date, name, JSON.stringify(exercises), duration, notes, req.params.id, req.user.userId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    
    res.json({ message: 'Workout updated' });
  } catch (error) {
    console.error('Update workout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete workout
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const result = db.prepare(
      'DELETE FROM workouts WHERE id = ? AND user_id = ?'
    ).run(req.params.id, req.user.userId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    
    res.json({ message: 'Workout deleted' });
  } catch (error) {
    console.error('Delete workout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
