/**
 * Bankroll Tracker Controller
 * Handles user betting history, bankroll management, and statistics
 */

const { getPostgresPool } = require('../config/database');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

/**
 * @desc    Get user's current bankroll and stats
 * @route   GET /api/bankroll
 * @access  Private
 */
exports.getBankroll = async (req, res, next) => {
  try {
    const pool = getPostgresPool();
    const userId = req.user.id;

    // Get comprehensive bankroll stats using database function
    const statsResult = await pool.query(
      'SELECT * FROM get_user_bankroll_stats($1)',
      [userId]
    );

    if (statsResult.rows.length === 0) {
      return next(new AppError('User not found', 404));
    }

    const stats = statsResult.rows[0];

    // Get recent bankroll history (last 30 days)
    const historyResult = await pool.query(
      `SELECT * FROM bankroll_history
       WHERE user_id = $1
       AND created_at >= NOW() - INTERVAL '30 days'
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        stats: {
          currentBalance: parseFloat(stats.current_balance || 0),
          totalBets: parseInt(stats.total_bets || 0),
          totalWagered: parseFloat(stats.total_wagered || 0),
          totalWon: parseInt(stats.total_won || 0),
          totalLost: parseInt(stats.total_lost || 0),
          totalPending: parseInt(stats.total_pending || 0),
          winRate: parseFloat(stats.win_rate || 0),
          profitLoss: parseFloat(stats.profit_loss || 0),
          roi: parseFloat(stats.roi || 0)
        },
        history: historyResult.rows
      }
    });
  } catch (error) {
    logger.error(`Error getting bankroll: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Initialize or update user's bankroll
 * @route   POST /api/bankroll/initialize
 * @access  Private
 */
exports.initializeBankroll = async (req, res, next) => {
  try {
    const pool = getPostgresPool();
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return next(new AppError('Valid amount is required', 400));
    }

    // Update user's bankroll
    await pool.query(
      `UPDATE users
       SET bankroll = $1,
           initial_bankroll = $1,
           bankroll_updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [amount, userId]
    );

    // Record in history
    await pool.query(
      `INSERT INTO bankroll_history (user_id, balance, change_amount, change_type, notes)
       VALUES ($1, $2, $3, 'deposit', 'Initial bankroll setup')`,
      [userId, amount, amount]
    );

    logger.info(`User ${userId} initialized bankroll with $${amount}`);

    res.json({
      success: true,
      data: {
        bankroll: parseFloat(amount),
        message: 'Bankroll initialized successfully'
      }
    });
  } catch (error) {
    logger.error(`Error initializing bankroll: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Place a new bet
 * @route   POST /api/bankroll/bet
 * @access  Private (Pro tier)
 */
exports.placeBet = async (req, res, next) => {
  try {
    const pool = getPostgresPool();
    const userId = req.user.id;
    const { gameId, betType, amount, odds, pick, confidenceScore, notes } = req.body;

    // Validation
    if (!betType || !amount || !odds || !pick) {
      return next(new AppError('Bet type, amount, odds, and pick are required', 400));
    }

    if (amount <= 0) {
      return next(new AppError('Bet amount must be positive', 400));
    }

    // Check user has sufficient bankroll
    const userResult = await pool.query(
      'SELECT bankroll FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return next(new AppError('User not found', 404));
    }

    const currentBankroll = parseFloat(userResult.rows[0].bankroll || 0);

    if (currentBankroll < amount) {
      return next(new AppError('Insufficient bankroll', 400));
    }

    // Calculate potential win
    let potentialWin;
    if (odds > 0) {
      // American odds positive (e.g., +150)
      potentialWin = (amount * odds) / 100;
    } else {
      // American odds negative (e.g., -150)
      potentialWin = (amount * 100) / Math.abs(odds);
    }

    // Insert bet
    const betResult = await pool.query(
      `INSERT INTO bets (
        user_id, game_id, bet_type, amount, odds, potential_win,
        pick, confidence_score, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [userId, gameId, betType, amount, odds, potentialWin, pick, confidenceScore, notes]
    );

    const bet = betResult.rows[0];

    logger.info(`User ${userId} placed bet ${bet.id} for $${amount}`);

    res.status(201).json({
      success: true,
      data: bet
    });
  } catch (error) {
    logger.error(`Error placing bet: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get user's betting history
 * @route   GET /api/bankroll/bets
 * @access  Private (Pro tier)
 */
exports.getBets = async (req, res, next) => {
  try {
    const pool = getPostgresPool();
    const userId = req.user.id;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT b.*, g.home_team_id, g.away_team_id, g.game_date,
             ht.name as home_team_name, ht.abbreviation as home_team_abbr,
             at.name as away_team_name, at.abbreviation as away_team_abbr
      FROM bets b
      LEFT JOIN games g ON b.game_id = g.id
      LEFT JOIN teams ht ON g.home_team_id = ht.id
      LEFT JOIN teams at ON g.away_team_id = at.id
      WHERE b.user_id = $1
    `;

    const params = [userId];

    if (status) {
      query += ` AND b.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY b.placed_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    logger.error(`Error getting bets: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get single bet details
 * @route   GET /api/bankroll/bets/:id
 * @access  Private (Pro tier)
 */
exports.getBet = async (req, res, next) => {
  try {
    const pool = getPostgresPool();
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `SELECT b.*, g.home_team_id, g.away_team_id, g.game_date, g.status as game_status,
              ht.name as home_team_name, ht.abbreviation as home_team_abbr,
              at.name as away_team_name, at.abbreviation as away_team_abbr
       FROM bets b
       LEFT JOIN games g ON b.game_id = g.id
       LEFT JOIN teams ht ON g.home_team_id = ht.id
       LEFT JOIN teams at ON g.away_team_id = at.id
       WHERE b.id = $1 AND b.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return next(new AppError('Bet not found', 404));
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error(`Error getting bet: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Settle a bet (mark as won/lost/push)
 * @route   PUT /api/bankroll/bets/:id/settle
 * @access  Private (Pro tier)
 */
exports.settleBet = async (req, res, next) => {
  try {
    const pool = getPostgresPool();
    const userId = req.user.id;
    const { id } = req.params;
    const { status, result } = req.body;

    if (!['won', 'lost', 'push'].includes(status)) {
      return next(new AppError('Invalid status. Must be won, lost, or push', 400));
    }

    // Get bet details
    const betResult = await pool.query(
      'SELECT * FROM bets WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (betResult.rows.length === 0) {
      return next(new AppError('Bet not found', 404));
    }

    const bet = betResult.rows[0];

    if (bet.status !== 'pending') {
      return next(new AppError('Bet has already been settled', 400));
    }

    // Calculate result amount
    let resultAmount = 0;
    if (status === 'won') {
      resultAmount = parseFloat(bet.potential_win);
    } else if (status === 'lost') {
      resultAmount = -parseFloat(bet.amount);
    } else if (status === 'push') {
      resultAmount = 0; // No change for push
    }

    // Update bet (trigger will update bankroll automatically)
    const updateResult = await pool.query(
      `UPDATE bets
       SET status = $1, result = $2, settled_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [status, resultAmount, id, userId]
    );

    logger.info(`User ${userId} settled bet ${id} as ${status} with result $${resultAmount}`);

    res.json({
      success: true,
      data: updateResult.rows[0]
    });
  } catch (error) {
    logger.error(`Error settling bet: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Cancel a pending bet
 * @route   DELETE /api/bankroll/bets/:id
 * @access  Private (Pro tier)
 */
exports.cancelBet = async (req, res, next) => {
  try {
    const pool = getPostgresPool();
    const userId = req.user.id;
    const { id } = req.params;

    // Check bet exists and is pending
    const betResult = await pool.query(
      'SELECT * FROM bets WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (betResult.rows.length === 0) {
      return next(new AppError('Bet not found', 404));
    }

    if (betResult.rows[0].status !== 'pending') {
      return next(new AppError('Can only cancel pending bets', 400));
    }

    // Update bet to cancelled
    await pool.query(
      `UPDATE bets SET status = 'cancelled' WHERE id = $1`,
      [id]
    );

    logger.info(`User ${userId} cancelled bet ${id}`);

    res.json({
      success: true,
      message: 'Bet cancelled successfully'
    });
  } catch (error) {
    logger.error(`Error cancelling bet: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get bankroll history with filters
 * @route   GET /api/bankroll/history
 * @access  Private (Pro tier)
 */
exports.getBankrollHistory = async (req, res, next) => {
  try {
    const pool = getPostgresPool();
    const userId = req.user.id;
    const { changeType, startDate, endDate, limit = 100, offset = 0 } = req.query;

    let query = 'SELECT * FROM bankroll_history WHERE user_id = $1';
    const params = [userId];

    if (changeType) {
      query += ` AND change_type = $${params.length + 1}`;
      params.push(changeType);
    }

    if (startDate) {
      query += ` AND created_at >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND created_at <= $${params.length + 1}`;
      params.push(endDate);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    logger.error(`Error getting bankroll history: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Add manual adjustment to bankroll (deposit/withdrawal)
 * @route   POST /api/bankroll/adjust
 * @access  Private (Pro tier)
 */
exports.adjustBankroll = async (req, res, next) => {
  try {
    const pool = getPostgresPool();
    const userId = req.user.id;
    const { amount, type, notes } = req.body;

    if (!amount || !type) {
      return next(new AppError('Amount and type are required', 400));
    }

    if (!['deposit', 'withdrawal', 'adjustment'].includes(type)) {
      return next(new AppError('Invalid type. Must be deposit, withdrawal, or adjustment', 400));
    }

    // Get current bankroll
    const userResult = await pool.query(
      'SELECT bankroll FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return next(new AppError('User not found', 404));
    }

    const currentBankroll = parseFloat(userResult.rows[0].bankroll || 0);
    const changeAmount = parseFloat(amount);

    // For withdrawals, make amount negative
    const finalChangeAmount = type === 'withdrawal' ? -Math.abs(changeAmount) : changeAmount;
    const newBankroll = currentBankroll + finalChangeAmount;

    if (newBankroll < 0) {
      return next(new AppError('Adjustment would result in negative bankroll', 400));
    }

    // Update bankroll
    await pool.query(
      `UPDATE users
       SET bankroll = $1, bankroll_updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [newBankroll, userId]
    );

    // Record in history
    await pool.query(
      `INSERT INTO bankroll_history (user_id, balance, change_amount, change_type, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, newBankroll, finalChangeAmount, type, notes || `Manual ${type}`]
    );

    logger.info(`User ${userId} ${type} of $${Math.abs(finalChangeAmount)}, new balance: $${newBankroll}`);

    res.json({
      success: true,
      data: {
        previousBalance: currentBankroll,
        changeAmount: finalChangeAmount,
        newBalance: newBankroll
      }
    });
  } catch (error) {
    logger.error(`Error adjusting bankroll: ${error.message}`);
    next(error);
  }
};

/**
 * @desc    Get bankroll performance analytics
 * @route   GET /api/bankroll/analytics
 * @access  Private (Pro tier)
 */
exports.getAnalytics = async (req, res, next) => {
  try {
    const pool = getPostgresPool();
    const userId = req.user.id;
    const { period = '30' } = req.query; // days

    // Get performance by bet type
    const betTypeResult = await pool.query(
      `SELECT
        bet_type,
        COUNT(*) as total_bets,
        SUM(amount) as total_wagered,
        COUNT(CASE WHEN status = 'won' THEN 1 END) as wins,
        COUNT(CASE WHEN status = 'lost' THEN 1 END) as losses,
        SUM(result) as profit_loss,
        CASE
          WHEN COUNT(CASE WHEN status IN ('won', 'lost') THEN 1 END) > 0
          THEN (COUNT(CASE WHEN status = 'won' THEN 1 END)::DECIMAL / COUNT(CASE WHEN status IN ('won', 'lost') THEN 1 END) * 100)
          ELSE 0
        END as win_rate
      FROM bets
      WHERE user_id = $1
        AND placed_at >= NOW() - INTERVAL '${period} days'
      GROUP BY bet_type`,
      [userId]
    );

    // Get daily performance
    const dailyResult = await pool.query(
      `SELECT
        DATE(placed_at) as date,
        COUNT(*) as bets,
        SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as wins,
        SUM(result) as profit_loss
      FROM bets
      WHERE user_id = $1
        AND placed_at >= NOW() - INTERVAL '${period} days'
      GROUP BY DATE(placed_at)
      ORDER BY date DESC`,
      [userId]
    );

    // Get overall stats for period
    const periodResult = await pool.query(
      `SELECT
        COUNT(*) as total_bets,
        SUM(amount) as total_wagered,
        SUM(result) as total_profit_loss,
        AVG(amount) as avg_bet_size,
        MAX(result) as biggest_win,
        MIN(result) as biggest_loss
      FROM bets
      WHERE user_id = $1
        AND placed_at >= NOW() - INTERVAL '${period} days'`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        period: `${period} days`,
        byBetType: betTypeResult.rows,
        dailyPerformance: dailyResult.rows,
        periodStats: periodResult.rows[0] || {}
      }
    });
  } catch (error) {
    logger.error(`Error getting analytics: ${error.message}`);
    next(error);
  }
};

module.exports = exports;
