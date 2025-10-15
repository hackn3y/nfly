const express = require('express');
const router = express.Router();
const gematriaController = require('../controllers/gematria.controller');
const { protect, requireSubscription } = require('../middleware/auth');

/**
 * @route   POST /api/gematria/calculate
 * @desc    Calculate gematria value for text
 * @access  Private
 */
router.post('/calculate', protect, gematriaController.calculateGematria);

/**
 * @route   GET /api/gematria/game/:gameId
 * @desc    Get gematria analysis for a game
 * @access  Private (Premium)
 */
router.get(
  '/game/:gameId',
  protect,
  requireSubscription('premium', 'pro'),
  gematriaController.getGameGematria
);

/**
 * @route   GET /api/gematria/player/:playerId
 * @desc    Get gematria profile for a player
 * @access  Private (Premium)
 */
router.get(
  '/player/:playerId',
  protect,
  requireSubscription('premium', 'pro'),
  gematriaController.getPlayerGematria
);

/**
 * @route   GET /api/gematria/team/:teamId
 * @desc    Get gematria analysis for a team
 * @access  Private (Premium)
 */
router.get(
  '/team/:teamId',
  protect,
  requireSubscription('premium', 'pro'),
  gematriaController.getTeamGematria
);

/**
 * @route   POST /api/gematria/match
 * @desc    Find number matches and patterns
 * @access  Private (Pro only)
 */
router.post(
  '/match',
  protect,
  requireSubscription('pro'),
  gematriaController.findMatches
);

module.exports = router;
