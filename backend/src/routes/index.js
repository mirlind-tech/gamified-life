const express = require('express');
const authRoutes = require('./auth');
const playerRoutes = require('./player');
const bodyRoutes = require('./body');
const germanRoutes = require('./german');
const financeRoutes = require('./finance');
const protocolRoutes = require('./protocol');
const codeRoutes = require('./code');
const workoutRoutes = require('./workouts');

const router = express.Router();

// Health check (public)
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), database: 'SQLite' });
});

// Mount all route modules
router.use('/auth', authRoutes);
router.use('/player', playerRoutes);
router.use('/body', bodyRoutes);
router.use('/german', germanRoutes);
router.use('/finance', financeRoutes);
router.use('/protocol', protocolRoutes);
router.use('/code', codeRoutes);
router.use('/workouts', workoutRoutes);

module.exports = router;
