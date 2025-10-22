const axios = require('axios');
const { getPostgresPool, getRedisClient } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

// Get upcoming game predictions
exports.getUpcomingPredictions = async (req, res, next) => {
  try {
    let redis;
    try {
      redis = getRedisClient();
    } catch (err) {
      // Redis not available, continue without cache
      redis = null;
    }

    const cacheKey = 'predictions:upcoming';

    // Try cache first (if Redis is available)
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          data: JSON.parse(cached),
          cached: true
        });
      }
    }

    // Call ML service
    const mlResponse = await axios.get(`${ML_SERVICE_URL}/api/predictions/upcoming`, {
      timeout: 10000
    });

    const predictions = mlResponse.data;

    // Cache for 30 minutes (if Redis is available)
    if (redis) {
      await redis.setEx(cacheKey, 1800, JSON.stringify(predictions));
    }

    res.json({
      success: true,
      data: predictions,
      cached: false
    });
  } catch (error) {
    logger.error('Error fetching upcoming predictions:', error);
    next(new AppError('Failed to fetch predictions', 500));
  }
};

// Get detailed game prediction
exports.getGamePrediction = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    let redis;
    try {
      redis = getRedisClient();
    } catch (err) {
      redis = null;
    }

    const cacheKey = `prediction:game:${gameId}`;

    // Try cache (if Redis is available)
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          data: JSON.parse(cached),
          cached: true
        });
      }
    }

    // Call ML service
    const mlResponse = await axios.get(`${ML_SERVICE_URL}/api/predictions/game/${gameId}`, {
      timeout: 10000
    });

    const prediction = mlResponse.data;

    // Cache for 15 minutes (if Redis is available)
    if (redis) {
      await redis.setEx(cacheKey, 900, JSON.stringify(prediction));
    }

    res.json({
      success: true,
      data: prediction,
      cached: false
    });
  } catch (error) {
    logger.error(`Error fetching game ${req.params.gameId} prediction:`, error);
    next(new AppError('Failed to fetch game prediction', 500));
  }
};

// Get weekly predictions
exports.getWeeklyPredictions = async (req, res, next) => {
  try {
    const { week, season } = req.query;

    const mlResponse = await axios.get(`${ML_SERVICE_URL}/api/predictions/weekly`, {
      params: { week, season },
      timeout: 10000
    });

    res.json({
      success: true,
      data: mlResponse.data
    });
  } catch (error) {
    logger.error('Error fetching weekly predictions:', error);
    next(new AppError('Failed to fetch weekly predictions', 500));
  }
};

// Get prediction history
exports.getPredictionHistory = async (req, res, next) => {
  try {
    const pool = getPostgresPool();

    const result = await pool.query(
      `SELECT
        p.id, p.game_id, p.predicted_winner, p.confidence, p.actual_winner,
        p.prediction_correct, p.created_at,
        g.home_team, g.away_team, g.game_date
       FROM predictions p
       JOIN games g ON p.game_id = g.id
       WHERE p.user_id = $1
       ORDER BY g.game_date DESC
       LIMIT 100`,
      [req.user.id]
    );

    const history = result.rows;
    const totalPredictions = history.length;
    const correctPredictions = history.filter(p => p.prediction_correct).length;
    const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;

    res.json({
      success: true,
      data: {
        history,
        stats: {
          total: totalPredictions,
          correct: correctPredictions,
          accuracy: accuracy.toFixed(2)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching prediction history:', error);
    next(error);
  }
};

// Optimize parlay
exports.optimizeParlay = async (req, res, next) => {
  try {
    const { gameIds, maxSelections = 5, targetOdds } = req.body;

    if (!gameIds || !Array.isArray(gameIds)) {
      return next(new AppError('Valid game IDs array required', 400));
    }

    // Call ML service parlay optimizer
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/api/predictions/parlay`, {
      game_ids: gameIds,
      max_selections: maxSelections,
      target_odds: targetOdds
    }, {
      timeout: 15000
    });

    res.json({
      success: true,
      data: mlResponse.data
    });
  } catch (error) {
    logger.error('Error optimizing parlay:', error);
    next(new AppError('Failed to optimize parlay', 500));
  }
};

// Get model performance stats
exports.getModelStats = async (req, res, next) => {
  try {
    const redis = getRedisClient();
    const cacheKey = 'model:stats';

    // Try cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    // Call ML service
    const mlResponse = await axios.get(`${ML_SERVICE_URL}/api/models/stats`, {
      timeout: 10000
    });

    const stats = mlResponse.data;

    // Cache for 1 hour
    await redis.setEx(cacheKey, 3600, JSON.stringify(stats));

    res.json({
      success: true,
      data: stats,
      cached: false
    });
  } catch (error) {
    logger.error('Error fetching model stats:', error);
    next(new AppError('Failed to fetch model statistics', 500));
  }
};

/**
 * Get live in-progress game predictions
 */
exports.getLivePredictions = async (req, res, next) => {
  try {
    const pool = getPostgresPool();

    // Get games that are currently in progress
    const gamesQuery = `
      SELECT
        g.id as game_id,
        g.season,
        g.week,
        g.home_team,
        g.away_team,
        g.home_score,
        g.away_score,
        g.game_date,
        g.status,
        g.period,
        p.predicted_winner,
        p.home_win_probability,
        p.away_win_probability,
        p.confidence_score as confidence,
        p.spread_prediction,
        p.over_under_prediction,
        p.predicted_score
      FROM games g
      LEFT JOIN predictions p ON g.id = p.game_id
      WHERE g.status = 'in_progress'
      ORDER BY g.game_date ASC
    `;

    const result = await pool.query(gamesQuery);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.game_id,
        game_id: row.game_id,
        season: row.season,
        week: row.week,
        home_team: row.home_team,
        away_team: row.away_team,
        home_score: row.home_score || 0,
        away_score: row.away_score || 0,
        game_date: row.game_date,
        status: row.status,
        period: row.period,
        prediction: {
          predicted_winner: row.predicted_winner,
          home_win_probability: row.home_win_probability,
          away_win_probability: row.away_win_probability,
          confidence: row.confidence,
          spread_prediction: row.spread_prediction,
          over_under_prediction: row.over_under_prediction,
          predicted_score: row.predicted_score
        }
      }))
    });
  } catch (error) {
    logger.error('Error fetching live predictions:', error);
    next(new AppError('Failed to fetch live predictions', 500));
  }
};

/**
 * Get player prop predictions
 */
exports.getPlayerProps = async (req, res, _next) => {
  try {
    const { gameId } = req.params;
    const pool = getPostgresPool();

    // For now, return empty array with message that this feature is coming
    // In production, this would query player_props table and ML predictions

    let query = `
      SELECT
        pp.id,
        pp.game_id,
        pp.player_name,
        pp.team,
        pp.prop_type,
        pp.line,
        pp.prediction,
        pp.recommendation,
        pp.confidence,
        pp.key_factors
      FROM player_props pp
      WHERE 1=1
    `;

    const params = [];

    if (gameId) {
      params.push(gameId);
      query += ` AND pp.game_id = $${params.length}`;
    }

    query += ' ORDER BY pp.confidence DESC, pp.player_name ASC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      message: result.rows.length === 0 ? 'No player props available. This feature requires ML service enhancement.' : undefined
    });
  } catch (error) {
    // If table doesn't exist, return empty array
    logger.info('Player props table may not exist:', error.message);
    res.json({
      success: true,
      data: [],
      message: 'Player props feature is not yet configured'
    });
  }
};
