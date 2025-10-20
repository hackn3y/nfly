/**
 * Subscription Tier Middleware
 * Check user subscription level and enforce tier limits
 */

const { AppError } = require('./errorHandler');
const { getPostgresPool } = require('../config/database');
const logger = require('../utils/logger');

// Subscription tier limits
const TIER_LIMITS = {
  free: {
    predictionsPerDay: 3,
    features: ['basic_predictions', 'gematria_analysis'],
    rateLimit: 10 // requests per minute
  },
  starter: {
    predictionsPerDay: 20,
    features: ['basic_predictions', 'gematria_analysis', 'ml_predictions', 'email_alerts', 'historical_trends'],
    rateLimit: 30
  },
  premium: {
    predictionsPerDay: -1, // unlimited
    features: ['basic_predictions', 'gematria_analysis', 'ml_predictions', 'email_alerts', 'historical_trends', 'player_props', 'confidence_scores', 'api_access', 'custom_alerts'],
    rateLimit: 100
  },
  pro: {
    predictionsPerDay: -1, // unlimited
    features: ['basic_predictions', 'gematria_analysis', 'ml_predictions', 'email_alerts', 'historical_trends', 'player_props', 'confidence_scores', 'api_access', 'custom_alerts', 'live_predictions', 'advanced_stats', 'bankroll_tracker'],
    rateLimit: 200
  }
};

/**
 * Check if user's subscription tier includes a feature
 */
const requireFeature = (...features) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authorized', 401));
    }

    const userTier = req.user.subscription_tier || 'free';
    const tierFeatures = TIER_LIMITS[userTier]?.features || [];

    // Check if user has all required features
    const hasAllFeatures = features.every(feature => tierFeatures.includes(feature));

    if (!hasAllFeatures) {
      const missingFeatures = features.filter(f => !tierFeatures.includes(f));

      return next(new AppError(
        `This feature requires a higher subscription tier. Missing: ${missingFeatures.join(', ')}`,
        403
      ));
    }

    next();
  };
};

/**
 * Check daily prediction limit
 */
const checkPredictionLimit = async (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authorized', 401));
  }

  const userTier = req.user.subscription_tier || 'free';
  const dailyLimit = TIER_LIMITS[userTier]?.predictionsPerDay || 0;

  // Unlimited predictions
  if (dailyLimit === -1) {
    return next();
  }

  const pool = getPostgresPool();

  try {
    // Count predictions made today
    const result = await pool.query(
      `SELECT COUNT(*) as count
       FROM predictions
       WHERE user_id = $1
         AND created_at >= CURRENT_DATE
         AND created_at < CURRENT_DATE + INTERVAL '1 day'`,
      [req.user.id]
    );

    const todayCount = parseInt(result.rows[0].count);

    if (todayCount >= dailyLimit) {
      return next(new AppError(
        `Daily prediction limit reached (${dailyLimit}). Upgrade your subscription for more predictions.`,
        429
      ));
    }

    // Add remaining count to request
    req.predictionsRemaining = dailyLimit - todayCount;
    next();
  } catch (error) {
    logger.error(`Error checking prediction limit: ${error.message}`);
    next(error);
  }
};

/**
 * Check if subscription is active and not past due
 */
const requireActiveSubscription = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authorized', 401));
  }

  const subscriptionStatus = req.user.subscription_status || 'active';

  if (subscriptionStatus === 'cancelled' || subscriptionStatus === 'past_due') {
    return next(new AppError(
      'Your subscription is not active. Please update your payment method or resubscribe.',
      403
    ));
  }

  next();
};

/**
 * Get tier info for user
 */
const getTierInfo = (tier = 'free') => {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
};

/**
 * Middleware to attach tier info to request
 */
const attachTierInfo = (req, res, next) => {
  if (req.user) {
    const tier = req.user.subscription_tier || 'free';
    req.tierInfo = getTierInfo(tier);
  }
  next();
};

/**
 * Check if user can access API endpoints
 */
const requireAPIAccess = (req, res, next) => {
  return requireFeature('api_access')(req, res, next);
};

/**
 * Check if user can access player props
 */
const requirePlayerProps = (req, res, next) => {
  return requireFeature('player_props')(req, res, next);
};

/**
 * Check if user can access live predictions
 */
const requireLivePredictions = (req, res, next) => {
  return requireFeature('live_predictions')(req, res, next);
};

/**
 * Check if user can access advanced stats
 */
const requireAdvancedStats = (req, res, next) => {
  return requireFeature('advanced_stats')(req, res, next);
};

/**
 * Rate limiting based on tier
 */
const tierRateLimit = async (req, res, next) => {
  if (!req.user) {
    return next();
  }

  const tier = req.user.subscription_tier || 'free';
  const limit = TIER_LIMITS[tier]?.rateLimit || 10;

  // Store in Redis (if available) or in-memory
  // This is a simplified version - use express-rate-limit with custom store in production
  req.tierRateLimit = limit;
  next();
};

module.exports = {
  requireFeature,
  checkPredictionLimit,
  requireActiveSubscription,
  getTierInfo,
  attachTierInfo,
  requireAPIAccess,
  requirePlayerProps,
  requireLivePredictions,
  requireAdvancedStats,
  tierRateLimit,
  TIER_LIMITS
};
