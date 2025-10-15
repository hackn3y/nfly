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
