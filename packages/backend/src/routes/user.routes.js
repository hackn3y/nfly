const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', protect, userController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', protect, userController.updateProfile);

/**
 * @route   GET /api/users/preferences
 * @desc    Get user preferences
 * @access  Private
 */
router.get('/preferences', protect, userController.getPreferences);

/**
 * @route   PUT /api/users/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put('/preferences', protect, userController.updatePreferences);

/**
 * @route   GET /api/users/favorites
 * @desc    Get favorite teams
 * @access  Private
 */
router.get('/favorites', protect, userController.getFavorites);

/**
 * @route   POST /api/users/favorites/:teamId
 * @desc    Add favorite team
 * @access  Private
 */
router.post('/favorites/:teamId', protect, userController.addFavorite);

/**
 * @route   DELETE /api/users/favorites/:teamId
 * @desc    Remove favorite team
 * @access  Private
 */
router.delete('/favorites/:teamId', protect, userController.removeFavorite);

/**
 * @route   POST /api/users/push-token
 * @desc    Save push notification token
 * @access  Private
 */
router.post('/push-token', protect, async (req, res, next) => {
  try {
    const { pushToken } = req.body;
    const pushService = require('../services/push-notification.service');

    const result = await pushService.savePushToken(req.user.id, pushToken);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/users/export/:dataType
 * @desc    Export user data
 * @access  Private
 */
router.get('/export/:dataType', protect, userController.exportData);

module.exports = router;
