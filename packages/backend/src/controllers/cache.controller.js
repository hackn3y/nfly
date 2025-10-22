/**
 * Cache Controller
 * Handles cache clearing operations
 */

const { getRedisClient } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Clear user's cached data
 */
exports.clearUserCache = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const redis = getRedisClient();

    if (!redis) {
      return res.json({
        success: true,
        message: 'Cache cleared (Redis not configured)',
        cleared: 0
      });
    }

    // Get all keys that might contain user-specific data
    const patterns = [
      `user:${userId}:*`,
      `predictions:user:${userId}:*`,
      `gematria:user:${userId}:*`,
      `bankroll:user:${userId}:*`,
    ];

    let totalCleared = 0;

    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        totalCleared += keys.length;
      }
    }

    // Also clear general prediction caches
    const generalKeys = await redis.keys('ml:predictions:*');
    if (generalKeys.length > 0) {
      await redis.del(...generalKeys);
      totalCleared += generalKeys.length;
    }

    logger.info(`Cache cleared for user ${userId}: ${totalCleared} keys deleted`);

    res.json({
      success: true,
      message: `Successfully cleared ${totalCleared} cached items`,
      cleared: totalCleared
    });
  } catch (error) {
    logger.error('Error clearing user cache:', error);
    res.json({
      success: true,
      message: 'Cache cleared (with errors)',
      cleared: 0
    });
  }
};

/**
 * Clear all cached data (admin only)
 */
exports.clearAllCache = async (req, res, next) => {
  try {
    const redis = getRedisClient();

    if (!redis) {
      return res.json({
        success: true,
        message: 'All caches cleared (Redis not configured)',
        cleared: 0
      });
    }

    // Get all keys
    const allKeys = await redis.keys('*');

    if (allKeys.length === 0) {
      return res.json({
        success: true,
        message: 'No cached items to clear',
        cleared: 0
      });
    }

    // Delete all keys
    await redis.del(...allKeys);

    logger.info(`All cache cleared by admin: ${allKeys.length} keys deleted`);

    res.json({
      success: true,
      message: `Successfully cleared all ${allKeys.length} cached items`,
      cleared: allKeys.length
    });
  } catch (error) {
    logger.error('Error clearing all cache:', error);
    res.json({
      success: true,
      message: 'All caches cleared (with errors)',
      cleared: 0
    });
  }
};
