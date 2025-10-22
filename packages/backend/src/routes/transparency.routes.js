/**
 * Transparency Dashboard Routes
 * Public statistics showing prediction accuracy
 */

const express = require('express');
const resultsUpdater = require('../jobs/update-results.job');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

/**
 * Get overall transparency statistics
 * GET /api/transparency/stats
 * Public access - builds trust
 */
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await resultsUpdater.getTransparencyStats();

    res.json({
      success: true,
      stats,
      message: 'Transparency is our priority. These are real, unfiltered prediction results.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get "when to trust" recommendations
 * GET /api/transparency/trust-guide
 * Public access
 */
router.get('/trust-guide', async (req, res, next) => {
  try {
    const recommendations = await resultsUpdater.getWhenToTrustRecommendations();

    res.json({
      success: true,
      recommendations,
      disclaimer: 'Past performance does not guarantee future results. Always gamble responsibly.'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Trigger manual results update (admin only)
 * POST /api/transparency/update-results
 */
router.post('/update-results', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const result = await resultsUpdater.updateCompletedGames();

    res.json({
      success: true,
      result,
      message: `Updated ${result.updated} predictions: ${result.correct} correct, ${result.incorrect} incorrect`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
