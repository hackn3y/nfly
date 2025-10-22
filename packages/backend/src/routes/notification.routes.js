/**
 * Notification Routes
 * Manage user notification preferences and push notification tokens
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const notificationController = require('../controllers/notification.controller');

/**
 * @route   GET /api/notifications/preferences
 * @desc    Get user's notification preferences
 * @access  Private
 */
router.get('/preferences', protect, notificationController.getPreferences);

/**
 * @route   PUT /api/notifications/preferences
 * @desc    Update notification preferences
 * @access  Private
 */
router.put('/preferences', protect, notificationController.updatePreferences);

/**
 * @route   POST /api/notifications/register-device
 * @desc    Register device for push notifications
 * @access  Private
 */
router.post('/register-device', protect, notificationController.registerDevice);

/**
 * @route   POST /api/notifications/unregister-device
 * @desc    Unregister device from push notifications
 * @access  Private
 */
router.post('/unregister-device', protect, notificationController.unregisterDevice);

/**
 * @route   POST /api/notifications/test
 * @desc    Send test notification (for development)
 * @access  Private
 */
router.post('/test', protect, notificationController.sendTestNotification);

module.exports = router;
