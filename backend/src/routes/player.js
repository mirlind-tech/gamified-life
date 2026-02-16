const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get player stats (protected) - auto-creates if not found
router.get('/stats', authenticateToken, (req, res) => {
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
router.post('/add-xp', authenticateToken, (req, res) => {
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
router.put('/stats', authenticateToken, (req, res) => {
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
router.post('/activity', authenticateToken, (req, res) => {
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

module.exports = router;
