const { getPostgresPool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Get user profile
exports.getProfile = async (req, res, next) => {
  try {
    const pool = getPostgresPool();
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, subscription_tier, created_at, last_login
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return next(new AppError('User not found', 404));
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName } = req.body;
    const pool = getPostgresPool();

    const result = await pool.query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, email, first_name, last_name`,
      [firstName, lastName, req.user.id]
    );

    logger.info(`User ${req.user.id} updated profile`);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// Get user preferences
exports.getPreferences = async (req, res, next) => {
  try {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT preferences FROM users WHERE id = $1',
      [req.user.id]
    );

    const preferences = result.rows[0]?.preferences || {};

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    next(error);
  }
};

// Update user preferences
exports.updatePreferences = async (req, res, next) => {
  try {
    const { preferences } = req.body;
    const pool = getPostgresPool();

    await pool.query(
      'UPDATE users SET preferences = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(preferences), req.user.id]
    );

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    next(error);
  }
};

// Get favorite teams
exports.getFavorites = async (req, res, next) => {
  try {
    const pool = getPostgresPool();
    const result = await pool.query(
      `SELECT t.id, t.name, t.abbreviation, t.conference, t.division
       FROM teams t
       JOIN user_favorites uf ON t.id = uf.team_id
       WHERE uf.user_id = $1`,
      [req.user.id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

// Add favorite team
exports.addFavorite = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const pool = getPostgresPool();

    await pool.query(
      `INSERT INTO user_favorites (user_id, team_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, team_id) DO NOTHING`,
      [req.user.id, teamId]
    );

    res.json({
      success: true,
      message: 'Team added to favorites'
    });
  } catch (error) {
    next(error);
  }
};

// Remove favorite team
exports.removeFavorite = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const pool = getPostgresPool();

    await pool.query(
      'DELETE FROM user_favorites WHERE user_id = $1 AND team_id = $2',
      [req.user.id, teamId]
    );

    res.json({
      success: true,
      message: 'Team removed from favorites'
    });
  } catch (error) {
    next(error);
  }
};

// Export user data
exports.exportData = async (req, res, next) => {
  try {
    const { dataType } = req.params;
    const userId = req.user.id;
    const pool = getPostgresPool();

    let exportData = {};

    switch (dataType) {
      case 'predictions':
        exportData = await exportPredictions(pool, userId);
        break;
      case 'stats':
        exportData = await exportStats(pool, userId);
        break;
      case 'bankroll':
        exportData = await exportBankroll(pool, userId);
        break;
      case 'favorites':
        exportData = await exportFavorites(pool, userId);
        break;
      case 'account':
        exportData = await exportAccount(pool, userId);
        break;
      case 'all':
        exportData = {
          account: await exportAccount(pool, userId),
          stats: await exportStats(pool, userId),
          predictions: await exportPredictions(pool, userId),
          bankroll: await exportBankroll(pool, userId),
          favorites: await exportFavorites(pool, userId),
        };
        break;
      default:
        return next(new AppError('Invalid data type', 400));
    }

    res.json(exportData);
  } catch (error) {
    logger.error('Data export error:', error);
    next(error);
  }
};

async function exportPredictions(pool, userId) {
  const result = await pool.query(
    `SELECT
      ph.created_at as date,
      g.home_team,
      g.away_team,
      ph.prediction,
      ph.confidence,
      g.winner as actual_winner,
      ph.correct,
      CASE
        WHEN ph.correct = true THEN 'Win'
        WHEN ph.correct = false THEN 'Loss'
        ELSE 'Pending'
      END as result
    FROM prediction_history ph
    LEFT JOIN games g ON ph.game_id = g.id
    WHERE ph.user_id = $1
    ORDER BY ph.created_at DESC
    LIMIT 1000`,
    [userId]
  );

  return { predictions: result.rows };
}

async function exportStats(pool, userId) {
  const result = await pool.query(
    `SELECT
      COUNT(*) as total_predictions,
      SUM(CASE WHEN correct = true THEN 1 ELSE 0 END) as correct_predictions,
      CASE
        WHEN COUNT(*) > 0 THEN
          CAST(SUM(CASE WHEN correct = true THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*)
        ELSE 0
      END as accuracy
    FROM prediction_history
    WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0] || { totalPredictions: 0, correctPredictions: 0, accuracy: 0 };
}

async function exportBankroll(pool, userId) {
  const result = await pool.query(
    `SELECT
      created_at as date,
      transaction_type as type,
      amount,
      balance_after as balance,
      description
    FROM bankroll_transactions
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 1000`,
    [userId]
  );

  return { transactions: result.rows };
}

async function exportFavorites(pool, userId) {
  const result = await pool.query(
    `SELECT team_id FROM user_favorites WHERE user_id = $1`,
    [userId]
  );

  const prefsResult = await pool.query(
    `SELECT preferences FROM users WHERE id = $1`,
    [userId]
  );

  const prefs = prefsResult.rows[0]?.preferences || {};

  return {
    favoriteTeams: result.rows.map(r => r.team_id),
    notificationsEnabled: prefs.notifications_enabled || false,
    theme: prefs.theme || 'default',
  };
}

async function exportAccount(pool, userId) {
  const result = await pool.query(
    `SELECT
      first_name as "firstName",
      last_name as "lastName",
      email,
      subscription_tier as "subscriptionTier",
      created_at as "createdAt",
      last_login as "lastLogin"
    FROM users
    WHERE id = $1`,
    [userId]
  );

  return result.rows[0] || {};
}
