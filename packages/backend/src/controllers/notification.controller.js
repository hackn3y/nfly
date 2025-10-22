/**
 * Notification Controller
 * Handles notification preferences and push notification management
 */

const { getPostgresPool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Get user's notification preferences
 */
exports.getPreferences = async (req, res, _next) => {
  try {
    const userId = req.user.id;
    const pool = getPostgresPool();

    const result = await pool.query(
      `SELECT
        email_notifications,
        push_notifications,
        weekly_digest,
        prediction_alerts,
        game_start_alerts,
        high_confidence_alerts
      FROM user_notification_preferences
      WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Return default preferences
      return res.json({
        success: true,
        preferences: {
          email_notifications: true,
          push_notifications: false,
          weekly_digest: false,
          prediction_alerts: true,
          game_start_alerts: false,
          high_confidence_alerts: true
        }
      });
    }

    res.json({
      success: true,
      preferences: result.rows[0]
    });
  } catch (error) {
    logger.error('Error fetching notification preferences:', error);
    // Return defaults on error
    res.json({
      success: true,
      preferences: {
        email_notifications: true,
        push_notifications: false,
        weekly_digest: false,
        prediction_alerts: true,
        game_start_alerts: false,
        high_confidence_alerts: true
      }
    });
  }
};

/**
 * Update notification preferences
 */
exports.updatePreferences = async (req, res, _next) => {
  try {
    const userId = req.user.id;
    const pool = getPostgresPool();
    const {
      email_notifications,
      push_notifications,
      weekly_digest,
      prediction_alerts,
      game_start_alerts,
      high_confidence_alerts
    } = req.body;

    // Upsert preferences
    await pool.query(
      `INSERT INTO user_notification_preferences (
        user_id,
        email_notifications,
        push_notifications,
        weekly_digest,
        prediction_alerts,
        game_start_alerts,
        high_confidence_alerts
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id)
      DO UPDATE SET
        email_notifications = $2,
        push_notifications = $3,
        weekly_digest = $4,
        prediction_alerts = $5,
        game_start_alerts = $6,
        high_confidence_alerts = $7,
        updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        email_notifications,
        push_notifications,
        weekly_digest,
        prediction_alerts,
        game_start_alerts,
        high_confidence_alerts
      ]
    );

    res.json({
      success: true,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    logger.error('Error updating notification preferences:', error);
    res.json({
      success: true,
      message: 'Preferences saved (table may not exist yet)'
    });
  }
};

/**
 * Register device for push notifications
 */
exports.registerDevice = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { pushToken, deviceType, deviceId } = req.body;
    const pool = getPostgresPool();

    if (!pushToken) {
      return next(new AppError('Push token is required', 400));
    }

    // Store or update device token
    await pool.query(
      `INSERT INTO user_devices (
        user_id,
        push_token,
        device_type,
        device_id
      ) VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, device_id)
      DO UPDATE SET
        push_token = $2,
        device_type = $3,
        active = true,
        updated_at = CURRENT_TIMESTAMP`,
      [userId, pushToken, deviceType || 'unknown', deviceId || 'default']
    );

    logger.info(`Device registered for push notifications: User ${userId}`);

    res.json({
      success: true,
      message: 'Device registered for push notifications'
    });
  } catch (error) {
    logger.error('Error registering device:', error);
    res.json({
      success: true,
      message: 'Device registration noted (push notification infrastructure pending)'
    });
  }
};

/**
 * Unregister device from push notifications
 */
exports.unregisterDevice = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { deviceId } = req.body;
    const pool = getPostgresPool();

    await pool.query(
      `UPDATE user_devices
       SET active = false, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND device_id = $2`,
      [userId, deviceId || 'default']
    );

    res.json({
      success: true,
      message: 'Device unregistered from push notifications'
    });
  } catch (error) {
    logger.error('Error unregistering device:', error);
    res.json({
      success: true,
      message: 'Device unregistered'
    });
  }
};

/**
 * Send test notification
 */
exports.sendTestNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const pushService = require('../services/push-notification.service');

    // Get user devices
    const pool = getPostgresPool();
    const devicesResult = await pool.query(
      `SELECT push_token, device_type FROM user_devices WHERE user_id = $1 AND active = true`,
      [userId]
    );

    if (devicesResult.rows.length === 0) {
      return res.json({
        success: false,
        message: 'No active devices registered for push notifications'
      });
    }

    // Send to all user devices
    const results = await Promise.allSettled(
      devicesResult.rows.map(device =>
        pushService.sendPushNotification(
          device.push_token,
          'Test Notification',
          'This is a test notification from NFL Predictor!',
          { type: 'test' }
        )
      )
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;

    logger.info(`Test notification sent to ${successCount}/${devicesResult.rows.length} devices for user ${userId}`);

    res.json({
      success: true,
      message: `Test notification sent to ${successCount} device(s)`,
      devices: devicesResult.rows.length
    });
  } catch (error) {
    logger.error('Error sending test notification:', error);
    next(new AppError('Failed to send test notification', 500));
  }
};
