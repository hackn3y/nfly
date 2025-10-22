/**
 * Admin Routes
 * Administrative functions (require admin role)
 */

const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const scheduler = require('../jobs/scheduler');
const resultsUpdater = require('../jobs/update-results.job');
const nflDataService = require('../services/nfl-data.service');

const router = express.Router();

// All routes require admin authentication
router.use(protect, restrictTo('admin'));

/**
 * Trigger manual job execution
 * POST /api/admin/jobs/:jobName/run
 */
router.post('/jobs/:jobName/run', async (req, res, next) => {
  try {
    const { jobName } = req.params;

    let result;

    switch (jobName) {
      case 'results':
      case 'update-results':
        result = await resultsUpdater.updateCompletedGames();
        break;

      case 'nfl-sync':
      case 'sync-nfl-data':
        result = await nflDataService.syncCurrentWeek();
        break;

      case 'fetch-historical': {
        const { startSeason, endSeason } = req.body;
        result = await nflDataService.fetchHistoricalData(
          startSeason || 2020,
          endSeason || new Date().getFullYear()
        );
        break;
      }

      case 'weekly-summary':
        result = await scheduler.runJob('weekly-summary');
        break;

      case 'cache-cleanup':
        result = await scheduler.runJob('cache-cleanup');
        break;

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown job: ${jobName}. Available: results, nfl-sync, fetch-historical, weekly-summary, cache-cleanup`
        });
    }

    res.json({
      success: true,
      job: jobName,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get job scheduler status
 * GET /api/admin/jobs/status
 */
router.get('/jobs/status', (req, res) => {
  res.json({
    success: true,
    scheduler: {
      running: scheduler.jobs.length > 0,
      jobCount: scheduler.jobs.length,
      jobs: [
        { name: 'update-results', schedule: 'Hourly' },
        { name: 'sync-nfl-data', schedule: '8 AM & 8 PM' },
        { name: 'weekly-summary', schedule: 'Mondays 9 AM' },
        { name: 'cache-cleanup', schedule: 'Daily 3 AM' }
      ]
    }
  });
});

/**
 * Get system statistics
 * GET /api/admin/stats
 */
router.get('/stats', async (req, res, next) => {
  try {
    const { getPostgresPool } = require('../config/database');
    const pool = getPostgresPool();

    // Get various counts
    const [users, games, predictions] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM games'),
      pool.query('SELECT COUNT(*) as count FROM predictions')
    ]);

    // Get subscription breakdown
    const subscriptions = await pool.query(`
      SELECT subscription_tier, COUNT(*) as count
      FROM users
      WHERE is_active = true
      GROUP BY subscription_tier
    `);

    // Get revenue (last 30 days)
    const revenue = await pool.query(`
      SELECT
        SUM(amount) as total,
        COUNT(*) as transactions
      FROM payments
      WHERE status = 'succeeded'
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    `);

    // Get accuracy stats
    const accuracy = await pool.query(`
      SELECT
        COUNT(*) as total_predictions,
        COUNT(*) FILTER (WHERE is_correct = true) as correct,
        ROUND(
          CAST(COUNT(*) FILTER (WHERE is_correct = true) AS DECIMAL) /
          NULLIF(COUNT(*), 0) * 100,
          2
        ) as accuracy_rate
      FROM predictions
      WHERE result IS NOT NULL
    `);

    // Count active subscriptions (non-free)
    const activeSubscriptionsCount = subscriptions.rows
      .filter(row => row.subscription_tier !== 'free')
      .reduce((sum, row) => sum + parseInt(row.count), 0);

    res.json({
      success: true,
      data: {
        users: {
          total: parseInt(users.rows[0].count),
          activeSubscriptions: activeSubscriptionsCount,
          byTier: subscriptions.rows.reduce((acc, row) => {
            acc[row.subscription_tier] = parseInt(row.count);
            return acc;
          }, {})
        },
        predictions: {
          total: parseInt(predictions.rows[0].count),
          accuracy: parseFloat(accuracy.rows[0].accuracy_rate || 0).toFixed(1)
        },
        games: parseInt(games.rows[0].count),
        revenue: {
          last30Days: revenue.rows[0].total ? parseInt(revenue.rows[0].total) / 100 : 0,
          transactions: parseInt(revenue.rows[0].transactions || 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Update user subscription tier (manual override)
 * PUT /api/admin/users/:userId/subscription
 */
router.put('/users/:userId/subscription', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { tier } = req.body;

    if (!['free', 'starter', 'premium', 'pro'].includes(tier)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tier. Must be: free, starter, premium, or pro'
      });
    }

    const { getPostgresPool } = require('../config/database');
    const pool = getPostgresPool();

    await pool.query(
      'UPDATE users SET subscription_tier = $1 WHERE id = $2',
      [tier, userId]
    );

    res.json({
      success: true,
      message: `User ${userId} updated to ${tier} tier`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get recent users
 * GET /api/admin/users
 */
router.get('/users', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const { getPostgresPool } = require('../config/database');
    const pool = getPostgresPool();

    const result = await pool.query(`
      SELECT
        id, email, first_name, last_name,
        subscription_tier, is_active, created_at,
        total_predictions, correct_predictions, accuracy_rate
      FROM users
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get recent errors/logs
 * GET /api/admin/logs
 */
router.get('/logs', async (req, res) => {
  // const limit = parseInt(req.query.limit) || 50;

  // This would read from log files or a logging service
  // For now, return a placeholder
  res.json({
    success: true,
    message: 'Log viewing not implemented yet. Check log files directly.',
    logFile: 'logs/combined.log'
  });
});

module.exports = router;
