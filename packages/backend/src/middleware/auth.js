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
      console.log('[Auth Middleware] Verifying token...');
      console.log('[Auth Middleware] Token:', token.substring(0, 20) + '...');
      console.log('[Auth Middleware] JWT_SECRET exists:', !!process.env.JWT_SECRET);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('[Auth Middleware] Token verified successfully. User ID:', decoded.id);

      // Get user from database
      const pool = getPostgresPool();
      const result = await pool.query(
        'SELECT id, email, subscription_tier, is_active FROM users WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        console.log('[Auth Middleware] User not found in database:', decoded.id);
        return next(new AppError('User not found', 404));
      }

      const user = result.rows[0];
      console.log('[Auth Middleware] User found:', user.email);

      if (!user.is_active) {
        console.log('[Auth Middleware] User account is inactive:', user.email);
        return next(new AppError('User account is inactive', 401));
      }

      // Set default role if not present in database
      req.user = {
        ...user,
        role: user.role || 'user'
      };
      next();
    } catch (error) {
      console.error('[Auth Middleware] Token verification failed:', error.message);
      console.error('[Auth Middleware] Error name:', error.name);
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

// Restrict to specific roles (admin, etc.)
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authorized', 401));
    }

    const userRole = req.user.role || 'user';

    if (!roles.includes(userRole)) {
      return next(new AppError(
        'You do not have permission to perform this action',
        403
      ));
    }

    next();
  };
};

module.exports = {
  protect,
  requireSubscription,
  restrictTo
};
