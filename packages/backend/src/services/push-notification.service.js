/**
 * Push Notification Service
 * Send push notifications to mobile devices using Expo Push Notifications
 */

const { Expo } = require('expo-server-sdk');
const { getPostgresPool } = require('../config/database');
const logger = require('../utils/logger');

class PushNotificationService {
  constructor() {
    this.expo = new Expo();
  }

  /**
   * Save user's push token
   */
  async savePushToken(userId, pushToken) {
    try {
      if (!Expo.isExpoPushToken(pushToken)) {
        logger.warn(`Invalid Expo push token: ${pushToken}`);
        return { success: false, error: 'Invalid push token' };
      }

      const pool = getPostgresPool();
      await pool.query(
        `UPDATE users
         SET push_token = $1, push_token_updated_at = NOW()
         WHERE id = $2`,
        [pushToken, userId]
      );

      logger.info(`Saved push token for user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error saving push token: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification to a single user
   */
  async sendToUser(userId, notification) {
    try {
      const pool = getPostgresPool();
      const result = await pool.query(
        'SELECT push_token, push_notifications FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: 'User not found' };
      }

      const user = result.rows[0];

      // Check if user has push notifications enabled
      if (!user.push_notifications) {
        logger.info(`Push notifications disabled for user ${userId}`);
        return { success: false, error: 'Push notifications disabled' };
      }

      if (!user.push_token) {
        return { success: false, error: 'No push token registered' };
      }

      return await this.sendPushNotification(user.push_token, notification);
    } catch (error) {
      logger.error(`Error sending push to user ${userId}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendToMultipleUsers(userIds, notification) {
    try {
      const pool = getPostgresPool();
      const result = await pool.query(
        `SELECT push_token
         FROM users
         WHERE id = ANY($1)
           AND push_token IS NOT NULL
           AND push_notifications = true`,
        [userIds]
      );

      const pushTokens = result.rows.map(row => row.push_token);

      if (pushTokens.length === 0) {
        return { success: false, error: 'No valid push tokens found' };
      }

      return await this.sendBatchNotifications(pushTokens, notification);
    } catch (error) {
      logger.error(`Error sending batch push: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification to a single token
   */
  async sendPushNotification(pushToken, { title, body, data = {} }) {
    try {
      const message = {
        to: pushToken,
        sound: 'default',
        title,
        body,
        data,
        priority: 'high'
      };

      const chunks = this.expo.chunkPushNotifications([message]);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          logger.error(`Error sending push notification chunk: ${error.message}`);
        }
      }

      // Check for errors
      const hasErrors = tickets.some(ticket => ticket.status === 'error');

      if (hasErrors) {
        const errorTicket = tickets.find(t => t.status === 'error');
        logger.error(`Push notification error: ${errorTicket.message}`);
        return { success: false, error: errorTicket.message, tickets };
      }

      logger.info(`Push notification sent successfully`);
      return { success: true, tickets };
    } catch (error) {
      logger.error(`Error sending push notification: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notifications to multiple tokens
   */
  async sendBatchNotifications(pushTokens, { title, body, data = {} }) {
    try {
      const messages = pushTokens
        .filter(token => Expo.isExpoPushToken(token))
        .map(token => ({
          to: token,
          sound: 'default',
          title,
          body,
          data,
          priority: 'high'
        }));

      if (messages.length === 0) {
        return { success: false, error: 'No valid push tokens' };
      }

      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          logger.error(`Error sending batch chunk: ${error.message}`);
        }
      }

      const successCount = tickets.filter(t => t.status === 'ok').length;
      const errorCount = tickets.filter(t => t.status === 'error').length;

      logger.info(`Batch push sent: ${successCount} success, ${errorCount} errors`);

      return {
        success: true,
        sent: successCount,
        failed: errorCount,
        tickets
      };
    } catch (error) {
      logger.error(`Error sending batch notifications: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send new predictions notification
   */
  async notifyNewPredictions(week, season, gameCount) {
    try {
      const pool = getPostgresPool();
      const result = await pool.query(
        `SELECT id, push_token
         FROM users
         WHERE push_token IS NOT NULL
           AND push_notifications = true
           AND prediction_alerts = true`
      );

      const pushTokens = result.rows.map(row => row.push_token);

      if (pushTokens.length === 0) {
        logger.info('No users to notify for new predictions');
        return { success: true, sent: 0 };
      }

      return await this.sendBatchNotifications(pushTokens, {
        title: `Week ${week} Predictions Ready!`,
        body: `${gameCount} NFL games with ML predictions now available`,
        data: {
          type: 'new_predictions',
          week,
          season,
          gameCount,
          screen: 'Predictions'
        }
      });
    } catch (error) {
      logger.error(`Error notifying new predictions: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send favorite team game notification
   */
  async notifyFavoriteTeamGame(teamId, game) {
    try {
      const pool = getPostgresPool();
      const result = await pool.query(
        `SELECT u.id, u.push_token, t.name as team_name
         FROM users u
         JOIN user_favorite_teams uft ON u.id = uft.user_id
         JOIN teams t ON uft.team_id = t.id
         WHERE uft.team_id = $1
           AND u.push_token IS NOT NULL
           AND u.push_notifications = true`,
        [teamId]
      );

      if (result.rows.length === 0) {
        return { success: true, sent: 0 };
      }

      const teamName = result.rows[0].team_name;
      const pushTokens = result.rows.map(row => row.push_token);

      return await this.sendBatchNotifications(pushTokens, {
        title: `${teamName} Game Today!`,
        body: `${game.awayTeam} @ ${game.homeTeam}`,
        data: {
          type: 'favorite_team_game',
          gameId: game.id,
          teamId,
          screen: 'GameDetails'
        }
      });
    } catch (error) {
      logger.error(`Error notifying favorite team game: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send high confidence pick notification
   */
  async notifyHighConfidencePick(prediction) {
    try {
      const pool = getPostgresPool();
      const result = await pool.query(
        `SELECT push_token
         FROM users
         WHERE push_token IS NOT NULL
           AND push_notifications = true
           AND subscription_tier IN ('premium', 'pro')`
      );

      const pushTokens = result.rows.map(row => row.push_token);

      if (pushTokens.length === 0) {
        return { success: true, sent: 0 };
      }

      return await this.sendBatchNotifications(pushTokens, {
        title: '🔥 High Confidence Pick!',
        body: `${prediction.predictedWinner} (${(prediction.confidence * 100).toFixed(0)}% confidence)`,
        data: {
          type: 'high_confidence',
          gameId: prediction.gameId,
          confidence: prediction.confidence,
          screen: 'GameDetails'
        }
      });
    } catch (error) {
      logger.error(`Error notifying high confidence pick: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send accuracy milestone notification
   */
  async notifyAccuracyMilestone(userId, accuracy, totalPredictions) {
    try {
      return await this.sendToUser(userId, {
        title: '🎯 Milestone Achieved!',
        body: `You've reached ${accuracy}% accuracy across ${totalPredictions} predictions!`,
        data: {
          type: 'milestone',
          accuracy,
          totalPredictions,
          screen: 'MyStatistics'
        }
      });
    } catch (error) {
      logger.error(`Error notifying milestone: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new PushNotificationService();
