const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ============================================================================
// Body Measurements Routes (protected)
// ============================================================================

// Get all body measurements
router.get('/measurements', authenticateToken, (req, res) => {
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
router.post('/measurements', authenticateToken, (req, res) => {
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
router.get('/latest', authenticateToken, (req, res) => {
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
router.get('/workouts', authenticateToken, (req, res) => {
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
router.post('/workouts', authenticateToken, (req, res) => {
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
router.get('/workouts/:id', authenticateToken, (req, res) => {
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

module.exports = router;
