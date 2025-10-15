const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const { getPostgresPool } = require('../config/database');

// Verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const pool = getPostgresPool();
      const result = await pool.query(
        'SELECT id, email, subscription_tier, is_active FROM users WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return next(new AppError('User not found', 404));
      }

      const user = result.rows[0];

      if (!user.is_active) {
        return next(new AppError('User account is inactive', 401));
      }

      req.user = user;
      next();
    } catch (error) {
      return next(new AppError('Not authorized to access this route', 401));
    }
  } catch (error) {
    next(error);
  }
};

// Check subscription tier
const requireSubscription = (...tiers) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authorized', 401));
    }

    if (!tiers.includes(req.user.subscription_tier)) {
      return next(new AppError(
        `This feature requires ${tiers.join(' or ')} subscription`,
        403
      ));
    }

    next();
  };
};

module.exports = {
  protect,
  requireSubscription
};
