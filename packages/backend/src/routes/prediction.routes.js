const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/prediction.controller');
const { protect, requireSubscription } = require('../middleware/auth');
const {
  checkPredictionLimit,
  requireFeature,
  requirePlayerProps,
  requireLivePredictions,
  requireAdvancedStats,
  attachTierInfo
} = require('../middleware/subscriptionCheck');

// Attach tier info to all routes
router.use(protect, attachTierInfo);

/**
 * @route   GET /api/predictions/upcoming
 * @desc    Get predictions for upcoming games
 * @access  Private (counts toward daily limit)
 */
router.get('/upcoming', checkPredictionLimit, predictionController.getUpcomingPredictions);

/**
 * @route   GET /api/predictions/game/:gameId
 * @desc    Get detailed prediction for specific game
 * @access  Private (counts toward daily limit)
 */
router.get('/game/:gameId', checkPredictionLimit, predictionController.getGamePrediction);

/**
 * @route   GET /api/predictions/weekly
 * @desc    Get predictions for the current week
 * @access  Private (counts toward daily limit)
 */
router.get('/weekly', checkPredictionLimit, predictionController.getWeeklyPredictions);

/**
 * @route   GET /api/predictions/history
 * @desc    Get prediction history and accuracy
 * @access  Private (Premium+ feature)
 */
router.get(
  '/history',
  requireFeature('historical_trends'),
  predictionController.getPredictionHistory
);

/**
 * @route   GET /api/predictions/player-props
 * @desc    Get player prop predictions
 * @access  Private (Premium+ only)
 */
router.get(
  '/player-props',
  requirePlayerProps,
  predictionController.getPlayerProps
);

/**
 * @route   GET /api/predictions/props/:gameId
 * @desc    Get player prop predictions for specific game
 * @access  Private (Premium+ only)
 */
router.get(
  '/props/:gameId',
  requirePlayerProps,
  predictionController.getPlayerProps
);

/**
 * @route   GET /api/predictions/props
 * @desc    Get all player prop predictions
 * @access  Private (Premium+ only)
 */
router.get(
  '/props',
  requirePlayerProps,
  predictionController.getPlayerProps
);

/**
 * @route   GET /api/predictions/live
 * @desc    Get live in-game predictions
 * @access  Private (Pro only)
 */
router.get(
  '/live',
  requireLivePredictions,
  predictionController.getLivePredictions
);

/**
 * @route   POST /api/predictions/parlay
 * @desc    Optimize parlay selections
 * @access  Private (Pro only)
 */
router.post(
  '/parlay',
  requireFeature('advanced_stats'),
  predictionController.optimizeParlay
);

/**
 * @route   GET /api/predictions/stats
 * @desc    Get model performance statistics
 * @access  Private (Premium+)
 */
router.get(
  '/stats',
  requireAdvancedStats,
  predictionController.getModelStats
);

module.exports = router;
