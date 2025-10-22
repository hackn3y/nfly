const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const leaderboardController = require('../controllers/leaderboard.controller');

// Get leaderboard rankings
router.get('/', protect, leaderboardController.getLeaderboard);

module.exports = router;
