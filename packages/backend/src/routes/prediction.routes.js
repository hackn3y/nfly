const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/prediction.controller');
const { protect, requireSubscription } = require('../middleware/auth');

/**
 * @route   GET /api/predictions/upcoming
 * @desc    Get predictions for upcoming games
 * @access  Private
 */
router.get('/upcoming', protect, predictionController.getUpcomingPredictions);

/**
 * @route   GET /api/predictions/game/:gameId
 * @desc    Get detailed prediction for specific game
 * @access  Private
 */
router.get('/game/:gameId', protect, predictionController.getGamePrediction);

/**
 * @route   GET /api/predictions/weekly
 * @desc    Get predictions for the current week
 * @access  Private
 */
router.get('/weekly', protect, predictionController.getWeeklyPredictions);

/**
 * @route   GET /api/predictions/history
 * @desc    Get prediction history and accuracy
 * @access  Private (Premium)
 */
router.get(
  '/history',
  protect,
  requireSubscription('premium', 'pro'),
  predictionController.getPredictionHistory
);

/**
 * @route   POST /api/predictions/parlay
 * @desc    Optimize parlay selections
 * @access  Private (Pro only)
 */
router.post(
  '/parlay',
  protect,
  requireSubscription('pro'),
  predictionController.optimizeParlay
);

/**
 * @route   GET /api/predictions/stats
 * @desc    Get model performance statistics
 * @access  Private (Premium)
 */
router.get(
  '/stats',
  protect,
  requireSubscription('premium', 'pro'),
  predictionController.getModelStats
);

module.exports = router;
