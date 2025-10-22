/**
 * Cache Management Routes
 * Endpoints for clearing server-side caches
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const cacheController = require('../controllers/cache.controller');

/**
 * @route   POST /api/cache/clear
 * @desc    Clear user's cached data
 * @access  Private
 */
router.post('/clear', protect, cacheController.clearUserCache);

/**
 * @route   POST /api/cache/clear-all
 * @desc    Clear all cached data (admin only)
 * @access  Private (Admin)
 */
router.post('/clear-all', protect, cacheController.clearAllCache);

module.exports = router;
