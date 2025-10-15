const mongoose = require('mongoose');
const { getRedisClient } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Gematria calculation methods
const GEMATRIA_METHODS = {
  english: {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
    J: 10, K: 11, L: 12, M: 13, N: 14, O: 15, P: 16, Q: 17, R: 18,
    S: 19, T: 20, U: 21, V: 22, W: 23, X: 24, Y: 25, Z: 26
  },
  pythagorean: {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
    J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
    S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8
  },
  chaldean: {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 8, G: 3, H: 5, I: 1,
    J: 1, K: 2, L: 3, M: 4, N: 5, O: 7, P: 8, Q: 1, R: 2,
    S: 3, T: 4, U: 6, V: 6, W: 6, X: 5, Y: 1, Z: 7
  }
};

// Calculate gematria value
function calculateValue(text, method = 'english') {
  const cipher = GEMATRIA_METHODS[method];
  if (!cipher) {
    throw new Error(`Invalid method: ${method}`);
  }

  let total = 0;
  const normalized = text.toUpperCase().replace(/[^A-Z]/g, '');

  for (const char of normalized) {
    total += cipher[char] || 0;
  }

  return total;
}

// Calculate reduction (keep adding digits until single digit)
function reduceToSingleDigit(num) {
  while (num > 9) {
    num = String(num).split('').reduce((sum, digit) => sum + parseInt(digit), 0);
  }
  return num;
}

// Calculate gematria for text
exports.calculateGematria = async (req, res, next) => {
  try {
    const { text, methods = ['english', 'pythagorean', 'chaldean'] } = req.body;

    if (!text || typeof text !== 'string') {
      return next(new AppError('Valid text required', 400));
    }

    const results = {};

    for (const method of methods) {
      if (GEMATRIA_METHODS[method]) {
        const value = calculateValue(text, method);
        results[method] = {
          value,
          reduced: reduceToSingleDigit(value)
        };
      }
    }

    res.json({
      success: true,
      data: {
        text,
        results
      }
    });
  } catch (error) {
    logger.error('Error calculating gematria:', error);
    next(error);
  }
};

// Get gematria analysis for a game
exports.getGameGematria = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const redis = getRedisClient();
    const cacheKey = `gematria:game:${gameId}`;

    // Try cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    // Get game info from database
    const { getPostgresPool } = require('../config/database');
    const pool = getPostgresPool();

    const gameResult = await pool.query(
      `SELECT id, home_team, away_team, game_date, venue, home_coach, away_coach
       FROM games WHERE id = $1`,
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      return next(new AppError('Game not found', 404));
    }

    const game = gameResult.rows[0];

    // Calculate gematria for various elements
    const analysis = {
      homeTeam: {
        name: game.home_team,
        ...calculateAllMethods(game.home_team)
      },
      awayTeam: {
        name: game.away_team,
        ...calculateAllMethods(game.away_team)
      },
      venue: {
        name: game.venue,
        ...calculateAllMethods(game.venue)
      },
      gameDate: {
        date: game.game_date,
        numerology: analyzeDateNumerology(game.game_date)
      },
      coaches: {
        home: calculateAllMethods(game.home_coach || ''),
        away: calculateAllMethods(game.away_coach || '')
      },
      patterns: findPatterns(game)
    };

    // Cache for 1 hour
    await redis.setEx(cacheKey, 3600, JSON.stringify(analysis));

    res.json({
      success: true,
      data: analysis,
      cached: false
    });
  } catch (error) {
    logger.error('Error getting game gematria:', error);
    next(error);
  }
};

// Get player gematria profile
exports.getPlayerGematria = async (req, res, next) => {
  try {
    const { playerId } = req.params;

    // TODO: Fetch player data from database
    // For now, return placeholder
    res.json({
      success: true,
      data: {
        message: 'Player gematria analysis coming soon',
        playerId
      }
    });
  } catch (error) {
    logger.error('Error getting player gematria:', error);
    next(error);
  }
};

// Get team gematria analysis
exports.getTeamGematria = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    // TODO: Fetch team data and analyze
    res.json({
      success: true,
      data: {
        message: 'Team gematria analysis coming soon',
        teamId
      }
    });
  } catch (error) {
    logger.error('Error getting team gematria:', error);
    next(error);
  }
};

// Find number matches and patterns
exports.findMatches = async (req, res, next) => {
  try {
    const { number, context } = req.body;

    if (!number) {
      return next(new AppError('Number required', 400));
    }

    // TODO: Search database for matching gematria values
    res.json({
      success: true,
      data: {
        number,
        matches: [],
        message: 'Pattern matching coming soon'
      }
    });
  } catch (error) {
    logger.error('Error finding matches:', error);
    next(error);
  }
};

// Helper: Calculate all gematria methods
function calculateAllMethods(text) {
  const results = {};
  for (const method in GEMATRIA_METHODS) {
    const value = calculateValue(text, method);
    results[method] = {
      value,
      reduced: reduceToSingleDigit(value)
    };
  }
  return results;
}

// Helper: Analyze date numerology
function analyzeDateNumerology(date) {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();

  const lifePath = reduceToSingleDigit(day + month + year);
  const dayNumber = reduceToSingleDigit(day);
  const monthNumber = reduceToSingleDigit(month);

  return {
    lifePath,
    day: dayNumber,
    month: monthNumber,
    year: year
  };
}

// Helper: Find patterns in game data
function findPatterns(game) {
  const patterns = [];

  // Compare team name values
  const homeValue = calculateValue(game.home_team);
  const awayValue = calculateValue(game.away_team);

  if (homeValue === awayValue) {
    patterns.push({
      type: 'equal_values',
      description: 'Both teams have equal gematria values',
      significance: 'high'
    });
  }

  const diff = Math.abs(homeValue - awayValue);
  if (diff % 11 === 0) {
    patterns.push({
      type: 'master_number',
      description: 'Difference is a multiple of 11 (master number)',
      significance: 'medium'
    });
  }

  return patterns;
}
