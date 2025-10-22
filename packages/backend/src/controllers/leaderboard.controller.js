const pool = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get leaderboard rankings
 * @route GET /api/leaderboard
 * @query timeframe - 'week', 'month', 'season', 'all'
 * @query limit - number of users to return (default 50)
 */
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { timeframe = 'week', limit = 50 } = req.query;
    const userId = req.user.id;

    // Build date filter based on timeframe
    let dateFilter = '';
    switch (timeframe) {
      case 'week':
        dateFilter = `AND ph.created_at >= NOW() - INTERVAL '7 days'`;
        break;
      case 'month':
        dateFilter = `AND ph.created_at >= NOW() - INTERVAL '30 days'`;
        break;
      case 'season':
        // Assuming current season started in September
        dateFilter = `AND ph.created_at >= DATE_TRUNC('year', NOW()) + INTERVAL '8 months'`;
        break;
      case 'all':
      default:
        dateFilter = '';
        break;
    }

    // Get leaderboard with user stats
    const leaderboardQuery = `
      WITH user_stats AS (
        SELECT
          u.id AS user_id,
          u.first_name,
          u.last_name,
          COUNT(ph.id) AS total_predictions,
          SUM(CASE WHEN ph.correct = true THEN 1 ELSE 0 END) AS correct_predictions,
          CASE
            WHEN COUNT(ph.id) > 0 THEN
              CAST(SUM(CASE WHEN ph.correct = true THEN 1 ELSE 0 END) AS FLOAT) / COUNT(ph.id)
            ELSE 0
          END AS accuracy
        FROM users u
        LEFT JOIN prediction_history ph ON u.id = ph.user_id
        WHERE u.deleted_at IS NULL
          ${dateFilter}
        GROUP BY u.id, u.first_name, u.last_name
        HAVING COUNT(ph.id) >= 5  -- Minimum 5 predictions to appear on leaderboard
      ),
      ranked_users AS (
        SELECT
          *,
          ROW_NUMBER() OVER (ORDER BY accuracy DESC, total_predictions DESC) AS rank
        FROM user_stats
      )
      SELECT
        user_id AS "userId",
        first_name AS "firstName",
        last_name AS "lastName",
        total_predictions AS "totalPredictions",
        correct_predictions AS "correctPredictions",
        accuracy,
        rank
      FROM ranked_users
      ORDER BY rank
      LIMIT $1
    `;

    const leaderboardResult = await pool.query(leaderboardQuery, [parseInt(limit)]);

    // Get current user's rank (even if not in top N)
    const userRankQuery = `
      WITH user_stats AS (
        SELECT
          u.id AS user_id,
          COUNT(ph.id) AS total_predictions,
          SUM(CASE WHEN ph.correct = true THEN 1 ELSE 0 END) AS correct_predictions,
          CASE
            WHEN COUNT(ph.id) > 0 THEN
              CAST(SUM(CASE WHEN ph.correct = true THEN 1 ELSE 0 END) AS FLOAT) / COUNT(ph.id)
            ELSE 0
          END AS accuracy
        FROM users u
        LEFT JOIN prediction_history ph ON u.id = ph.user_id
        WHERE u.deleted_at IS NULL
          ${dateFilter}
        GROUP BY u.id
      ),
      ranked_users AS (
        SELECT
          user_id,
          total_predictions,
          correct_predictions,
          accuracy,
          ROW_NUMBER() OVER (ORDER BY accuracy DESC, total_predictions DESC) AS rank
        FROM user_stats
        WHERE total_predictions >= 5
      )
      SELECT
        rank,
        total_predictions AS "totalPredictions",
        correct_predictions AS "correctPredictions",
        accuracy
      FROM ranked_users
      WHERE user_id = $1
    `;

    const userRankResult = await pool.query(userRankQuery, [userId]);

    res.json({
      success: true,
      timeframe,
      leaderboard: leaderboardResult.rows,
      userRank: userRankResult.rows.length > 0 ? userRankResult.rows[0] : null,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    next(new AppError('Failed to fetch leaderboard', 500));
  }
};
