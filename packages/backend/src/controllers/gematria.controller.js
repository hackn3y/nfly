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
    const redis = getRedisClient();
    const cacheKey = `gematria:player:${playerId}`;

    // Try cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    // Fetch player data from database
    const { getPostgresPool } = require('../config/database');
    const pool = getPostgresPool();

    const playerResult = await pool.query(
      `SELECT p.*, t.name as team_name, t.abbreviation as team_abbr
       FROM players p
       LEFT JOIN teams t ON p.team_id = t.id
       WHERE p.id = $1`,
      [playerId]
    );

    if (playerResult.rows.length === 0) {
      return next(new AppError('Player not found', 404));
    }

    const player = playerResult.rows[0];

    // Calculate gematria for player attributes
    const analysis = {
      player: {
        id: player.id,
        name: player.name,
        position: player.position,
        jerseyNumber: player.jersey_number,
        team: player.team_name
      },
      nameAnalysis: calculateAllMethods(player.name),
      positionAnalysis: calculateAllMethods(player.position || ''),
      jerseyNumerology: player.jersey_number ? {
        number: player.jersey_number,
        reduced: reduceToSingleDigit(player.jersey_number),
        significance: getNumberSignificance(player.jersey_number)
      } : null,
      teamConnection: player.team_name ? calculateAllMethods(player.team_name) : null,
      insights: generatePlayerInsights(player)
    };

    // Cache for 1 hour
    await redis.setEx(cacheKey, 3600, JSON.stringify(analysis));

    res.json({
      success: true,
      data: analysis,
      cached: false
    });
  } catch (error) {
    logger.error('Error getting player gematria:', error);
    // If players table doesn't exist, return helpful message
    if (error.message && error.message.includes('relation "players" does not exist')) {
      return res.json({
        success: true,
        data: {
          message: 'Player database not yet configured. Run migrations to enable player gematria analysis.',
          playerId: req.params.playerId
        }
      });
    }
    next(error);
  }
};

// Get team gematria analysis
exports.getTeamGematria = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const redis = getRedisClient();
    const cacheKey = `gematria:team:${teamId}`;

    // Try cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        data: JSON.parse(cached),
        cached: true
      });
    }

    // Fetch team data
    const { getPostgresPool } = require('../config/database');
    const pool = getPostgresPool();

    const teamResult = await pool.query(
      `SELECT * FROM teams WHERE id = $1`,
      [teamId]
    );

    if (teamResult.rows.length === 0) {
      return next(new AppError('Team not found', 404));
    }

    const team = teamResult.rows[0];

    // Get team's recent performance for context
    const recentGames = await pool.query(
      `SELECT COUNT(*) as total_games,
              SUM(CASE WHEN (home_team_id = $1 AND home_score > away_score) OR
                           (away_team_id = $1 AND away_score > home_score) THEN 1 ELSE 0 END) as wins
       FROM games
       WHERE (home_team_id = $1 OR away_team_id = $1)
         AND status = 'final'
         AND season >= EXTRACT(YEAR FROM CURRENT_DATE) - 1`,
      [teamId]
    );

    const stats = recentGames.rows[0];

    // Calculate gematria for team attributes
    const analysis = {
      team: {
        id: team.id,
        name: team.name,
        abbreviation: team.abbreviation,
        location: team.location,
        mascot: team.mascot,
        conference: team.conference,
        division: team.division
      },
      teamNameAnalysis: calculateAllMethods(team.name),
      mascotAnalysis: team.mascot ? calculateAllMethods(team.mascot) : null,
      locationAnalysis: team.location ? calculateAllMethods(team.location) : null,
      abbreviationAnalysis: calculateAllMethods(team.abbreviation),
      divisionAnalysis: calculateAllMethods(team.division || ''),
      recentPerformance: {
        totalGames: parseInt(stats.total_games),
        wins: parseInt(stats.wins),
        winRate: stats.total_games > 0 ? (stats.wins / stats.total_games * 100).toFixed(1) : 0
      },
      insights: generateTeamInsights(team, stats)
    };

    // Cache for 1 hour
    await redis.setEx(cacheKey, 3600, JSON.stringify(analysis));

    res.json({
      success: true,
      data: analysis,
      cached: false
    });
  } catch (error) {
    logger.error('Error getting team gematria:', error);
    next(error);
  }
};

// Find number matches and patterns
exports.findMatches = async (req, res, next) => {
  try {
    const { number, context = 'all' } = req.body;

    if (!number) {
      return next(new AppError('Number required', 400));
    }

    const { getPostgresPool } = require('../config/database');
    const pool = getPostgresPool();

    const matches = {
      number: parseInt(number),
      reduced: reduceToSingleDigit(parseInt(number)),
      significance: getNumberSignificance(parseInt(number)),
      teams: [],
      games: [],
      patterns: []
    };

    // Search teams whose names match this gematria value
    if (context === 'all' || context === 'teams') {
      const teams = await pool.query(`SELECT * FROM teams`);

      for (const team of teams.rows) {
        const teamValue = calculateValue(team.name);
        if (teamValue === parseInt(number) || reduceToSingleDigit(teamValue) === reduceToSingleDigit(parseInt(number))) {
          matches.teams.push({
            id: team.id,
            name: team.name,
            gematriaValue: teamValue,
            reduced: reduceToSingleDigit(teamValue),
            exactMatch: teamValue === parseInt(number)
          });
        }
      }
    }

    // Search recent games with this pattern
    if (context === 'all' || context === 'games') {
      const games = await pool.query(`
        SELECT id, home_team, away_team, game_date, home_score, away_score
        FROM games
        WHERE status = 'final'
        ORDER BY game_date DESC
        LIMIT 100
      `);

      for (const game of games.rows) {
        const homeValue = calculateValue(game.home_team);
        const awayValue = calculateValue(game.away_team);
        const totalScore = (game.home_score || 0) + (game.away_score || 0);

        if (homeValue === parseInt(number) || awayValue === parseInt(number) ||
            reduceToSingleDigit(homeValue) === reduceToSingleDigit(parseInt(number)) ||
            reduceToSingleDigit(awayValue) === reduceToSingleDigit(parseInt(number)) ||
            totalScore === parseInt(number)) {
          matches.games.push({
            id: game.id,
            homeTeam: game.home_team,
            awayTeam: game.away_team,
            homeValue: homeValue,
            awayValue: awayValue,
            totalScore: totalScore,
            date: game.game_date,
            matchType: getMatchType(parseInt(number), homeValue, awayValue, totalScore)
          });
        }
      }
    }

    // Detect patterns
    matches.patterns = detectNumerologicalPatterns(parseInt(number));

    res.json({
      success: true,
      data: matches
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

// Helper: Get number significance
function getNumberSignificance(num) {
  const masterNumbers = [11, 22, 33, 44, 55, 66, 77, 88, 99];
  if (masterNumbers.includes(num)) {
    return `Master Number ${num} - Powerful spiritual significance`;
  }

  const reduced = reduceToSingleDigit(num);
  const meanings = {
    1: 'Leadership, independence, new beginnings',
    2: 'Balance, partnership, diplomacy',
    3: 'Creativity, expression, joy',
    4: 'Stability, foundation, hard work',
    5: 'Change, freedom, adventure',
    6: 'Harmony, responsibility, nurturing',
    7: 'Spirituality, introspection, wisdom',
    8: 'Power, abundance, success',
    9: 'Completion, humanitarianism, wisdom'
  };

  return meanings[reduced] || 'Unknown significance';
}

// Helper: Generate player insights
function generatePlayerInsights(player) {
  const insights = [];

  // Jersey number insights
  if (player.jersey_number) {
    const reduced = reduceToSingleDigit(player.jersey_number);
    insights.push(`Jersey #${player.jersey_number} reduces to ${reduced}: ${getNumberSignificance(player.jersey_number)}`);
  }

  // Name value insights
  const nameValue = calculateValue(player.name);
  insights.push(`Name gematria value: ${nameValue}`);

  return insights;
}

// Helper: Generate team insights
function generateTeamInsights(team, stats) {
  const insights = [];

  const nameValue = calculateValue(team.name);
  const reduced = reduceToSingleDigit(nameValue);

  insights.push(`Team name value: ${nameValue}, reduced to ${reduced}`);

  if (stats.total_games > 0) {
    const winRate = (stats.wins / stats.total_games * 100).toFixed(1);
    insights.push(`Recent performance: ${stats.wins}W-${stats.total_games - stats.wins}L (${winRate}% win rate)`);
  }

  return insights;
}

// Helper: Get match type for pattern search
function getMatchType(number, homeValue, awayValue, totalScore) {
  const types = [];

  if (homeValue === number) types.push('home_team_exact');
  if (awayValue === number) types.push('away_team_exact');
  if (totalScore === number) types.push('total_score_exact');

  const reduced = reduceToSingleDigit(number);
  if (reduceToSingleDigit(homeValue) === reduced) types.push('home_team_reduced');
  if (reduceToSingleDigit(awayValue) === reduced) types.push('away_team_reduced');

  return types.join(', ');
}

// Helper: Detect numerological patterns
function detectNumerologicalPatterns(number) {
  const patterns = [];

  // Master numbers
  if ([11, 22, 33, 44, 55, 66, 77, 88, 99].includes(number)) {
    patterns.push({
      type: 'master_number',
      description: `${number} is a master number`,
      significance: 'very_high'
    });
  }

  // Repeating digits
  const numStr = number.toString();
  if (numStr.length > 1 && new Set(numStr).size === 1) {
    patterns.push({
      type: 'repeating_digits',
      description: 'All digits are the same',
      significance: 'high'
    });
  }

  // Sequential digits
  if (numStr.length === 3) {
    const digits = numStr.split('').map(d => parseInt(d));
    if (digits[1] === digits[0] + 1 && digits[2] === digits[1] + 1) {
      patterns.push({
        type: 'sequential',
        description: 'Sequential ascending digits',
        significance: 'medium'
      });
    }
  }

  // Multiples of 7 (lucky number)
  if (number % 7 === 0 && number !== 0) {
    patterns.push({
      type: 'multiple_of_seven',
      description: 'Multiple of 7 (lucky number)',
      significance: 'low'
    });
  }

  return patterns;
}
