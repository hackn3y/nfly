/**
 * Notification Jobs
 * Scheduled jobs for sending email and push notifications
 */

const { getPostgresPool } = require('../config/database');
const emailService = require('../services/email.service');
const pushService = require('../services/push-notification.service');
const logger = require('../utils/logger');

/**
 * Send weekly digest emails to subscribed users
 * Runs: Every Monday at 9:00 AM
 */
exports.sendWeeklyDigest = async () => {
  try {
    logger.info('Starting weekly digest job...');
    const pool = getPostgresPool();

    // Get users who want weekly digest
    const usersResult = await pool.query(`
      SELECT u.id, u.email, u.first_name, u.subscription_tier
      FROM users u
      LEFT JOIN user_notification_preferences unp ON u.id = unp.user_id
      WHERE (unp.weekly_digest = true OR unp.weekly_digest IS NULL)
        AND (unp.email_notifications = true OR unp.email_notifications IS NULL)
        AND u.deleted_at IS NULL
        AND u.email_verified = true
    `);

    logger.info(`Sending weekly digest to ${usersResult.rows.length} users`);

    // Get user stats for each user
    for (const user of usersResult.rows) {
      try {
        // Get user's weekly stats
        const statsResult = await pool.query(`
          SELECT
            COUNT(*) as total_predictions,
            SUM(CASE WHEN correct = true THEN 1 ELSE 0 END) as correct_predictions,
            CASE
              WHEN COUNT(*) > 0 THEN
                CAST(SUM(CASE WHEN correct = true THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*)
              ELSE 0
            END as accuracy
          FROM prediction_history
          WHERE user_id = $1
            AND created_at >= NOW() - INTERVAL '7 days'
        `, [user.id]);

        const stats = statsResult.rows[0] || { total_predictions: 0, correct_predictions: 0, accuracy: 0 };

        // Get upcoming games
        const gamesResult = await pool.query(`
          SELECT home_team, away_team, game_time
          FROM games
          WHERE game_time >= NOW()
            AND game_time <= NOW() + INTERVAL '7 days'
            AND status = 'scheduled'
          ORDER BY game_time
          LIMIT 5
        `);

        await emailService.sendWeeklySummary(
          user.email,
          user.first_name,
          {
            totalPredictions: stats.total_predictions,
            correctPredictions: stats.correct_predictions,
            accuracy: stats.accuracy,
            upcomingGames: gamesResult.rows
          }
        );

        logger.info(`Weekly digest sent to user ${user.id}`);
      } catch (error) {
        logger.error(`Failed to send weekly digest to user ${user.id}:`, error);
      }
    }

    logger.info('Weekly digest job completed');
  } catch (error) {
    logger.error('Error in weekly digest job:', error);
  }
};

/**
 * Send high confidence prediction alerts
 * Runs: Every hour during NFL season
 */
exports.sendHighConfidenceAlerts = async () => {
  try {
    logger.info('Checking for high confidence predictions...');
    const pool = getPostgresPool();

    // Find games with high confidence predictions in next 48 hours
    const predictionsResult = await pool.query(`
      SELECT DISTINCT ON (g.id)
        g.id as game_id,
        g.home_team,
        g.away_team,
        g.game_time,
        p.predicted_winner,
        p.confidence,
        p.spread_prediction,
        p.total_prediction
      FROM games g
      INNER JOIN predictions p ON g.id = p.game_id
      WHERE g.game_time >= NOW()
        AND g.game_time <= NOW() + INTERVAL '48 hours'
        AND g.status = 'scheduled'
        AND p.confidence >= 0.65
        AND NOT EXISTS (
          SELECT 1 FROM notification_queue nq
          WHERE nq.data->>'game_id' = g.id::text
            AND nq.notification_type IN ('email', 'both')
            AND nq.status IN ('pending', 'sent')
            AND nq.created_at >= NOW() - INTERVAL '24 hours'
        )
      ORDER BY g.id, p.confidence DESC
    `);

    if (predictionsResult.rows.length === 0) {
      logger.info('No high confidence predictions to alert');
      return;
    }

    logger.info(`Found ${predictionsResult.rows.length} high confidence predictions`);

    // Get users who want high confidence alerts
    const usersResult = await pool.query(`
      SELECT u.id, u.email, u.first_name
      FROM users u
      LEFT JOIN user_notification_preferences unp ON u.id = unp.user_id
      WHERE (unp.high_confidence_alerts = true OR unp.high_confidence_alerts IS NULL)
        AND (unp.email_notifications = true OR unp.email_notifications IS NULL)
        AND u.subscription_tier IN ('premium', 'pro')
        AND u.deleted_at IS NULL
        AND u.email_verified = true
    `);

    for (const prediction of predictionsResult.rows) {
      for (const user of usersResult.rows) {
        try {
          await emailService.sendHighConfidencePick(
            user.email,
            user.first_name,
            {
              homeTeam: prediction.home_team,
              awayTeam: prediction.away_team,
              gameTime: prediction.game_time,
              predictedWinner: prediction.predicted_winner,
              confidence: prediction.confidence,
              spreadPrediction: prediction.spread_prediction,
              totalPrediction: prediction.total_prediction
            }
          );

          // Queue notification record
          await pool.query(`
            INSERT INTO notification_queue (user_id, notification_type, title, message, data, scheduled_for, sent_at, status)
            VALUES ($1, 'email', 'High Confidence Pick', 'High confidence prediction alert', $2, NOW(), NOW(), 'sent')
          `, [user.id, JSON.stringify({ game_id: prediction.game_id, confidence: prediction.confidence })]);

        } catch (error) {
          logger.error(`Failed to send high confidence alert to user ${user.id}:`, error);
        }
      }
    }

    logger.info('High confidence alerts job completed');
  } catch (error) {
    logger.error('Error in high confidence alerts job:', error);
  }
};

/**
 * Send game start notifications for favorite teams
 * Runs: Every 30 minutes during game days
 */
exports.sendGameStartNotifications = async () => {
  try {
    logger.info('Checking for upcoming game start notifications...');
    const pool = getPostgresPool();

    // Find games starting in next 60 minutes
    const gamesResult = await pool.query(`
      SELECT id, home_team, away_team, game_time
      FROM games
      WHERE game_time >= NOW()
        AND game_time <= NOW() + INTERVAL '60 minutes'
        AND status = 'scheduled'
    `);

    if (gamesResult.rows.length === 0) {
      logger.info('No games starting soon');
      return;
    }

    logger.info(`Found ${gamesResult.rows.length} games starting soon`);

    for (const game of gamesResult.rows) {
      // Get users who favorited either team
      const usersResult = await pool.query(`
        SELECT DISTINCT u.id, u.email, u.first_name
        FROM users u
        INNER JOIN user_favorites uf ON u.id = uf.user_id
        LEFT JOIN user_notification_preferences unp ON u.id = unp.user_id
        WHERE uf.team_id IN ($1, $2)
          AND (unp.game_start_alerts = true)
          AND (unp.email_notifications = true OR unp.email_notifications IS NULL)
          AND u.deleted_at IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM notification_queue nq
            WHERE nq.user_id = u.id
              AND nq.data->>'game_id' = $3::text
              AND nq.notification_type IN ('email', 'both')
              AND nq.status IN ('pending', 'sent')
          )
      `, [game.home_team, game.away_team, game.id]);

      // Send email notifications
      for (const user of usersResult.rows) {
        try {
          await emailService.sendGameStartReminder(
            user.email,
            user.first_name,
            {
              homeTeam: game.home_team,
              awayTeam: game.away_team,
              gameTime: game.game_time
            }
          );

          await pool.query(`
            INSERT INTO notification_queue (user_id, notification_type, title, message, data, scheduled_for, sent_at, status)
            VALUES ($1, 'email', 'Game Starting Soon', 'Your favorite team plays soon', $2, NOW(), NOW(), 'sent')
          `, [user.id, JSON.stringify({ game_id: game.id })]);

          logger.info(`Game start notification sent to user ${user.id} for game ${game.id}`);
        } catch (error) {
          logger.error(`Failed to send game start notification to user ${user.id}:`, error);
        }
      }

      // Send push notifications
      const pushUsersResult = await pool.query(`
        SELECT DISTINCT u.id, ud.push_token
        FROM users u
        INNER JOIN user_favorites uf ON u.id = uf.user_id
        INNER JOIN user_devices ud ON u.id = ud.user_id
        LEFT JOIN user_notification_preferences unp ON u.id = unp.user_id
        WHERE uf.team_id IN ($1, $2)
          AND (unp.game_start_alerts = true)
          AND (unp.push_notifications = true)
          AND ud.active = true
          AND u.deleted_at IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM notification_queue nq
            WHERE nq.user_id = u.id
              AND nq.data->>'game_id' = $3::text
              AND nq.notification_type IN ('push', 'both')
              AND nq.status IN ('pending', 'sent')
          )
      `, [game.home_team, game.away_team, game.id]);

      for (const user of pushUsersResult.rows) {
        try {
          await pushService.sendPushNotification(
            user.push_token,
            `${game.home_team} vs ${game.away_team}`,
            'Game starting in less than 1 hour!',
            { type: 'game_start', game_id: game.id }
          );

          await pool.query(`
            INSERT INTO notification_queue (user_id, notification_type, title, message, data, scheduled_for, sent_at, status)
            VALUES ($1, 'push', 'Game Starting Soon', 'Your favorite team plays soon', $2, NOW(), NOW(), 'sent')
          `, [user.id, JSON.stringify({ game_id: game.id })]);

        } catch (error) {
          logger.error(`Failed to send push notification to user ${user.id}:`, error);
        }
      }
    }

    logger.info('Game start notifications job completed');
  } catch (error) {
    logger.error('Error in game start notifications job:', error);
  }
};

/**
 * Process notification queue
 * Runs: Every 5 minutes
 */
exports.processNotificationQueue = async () => {
  try {
    const pool = getPostgresPool();

    // Get pending notifications that are due
    const notificationsResult = await pool.query(`
      SELECT nq.*, u.email, u.first_name
      FROM notification_queue nq
      INNER JOIN users u ON nq.user_id = u.id
      WHERE nq.status = 'pending'
        AND nq.scheduled_for <= NOW()
      ORDER BY nq.scheduled_for
      LIMIT 100
    `);

    if (notificationsResult.rows.length === 0) {
      return;
    }

    logger.info(`Processing ${notificationsResult.rows.length} queued notifications`);

    for (const notification of notificationsResult.rows) {
      try {
        if (notification.notification_type === 'email' || notification.notification_type === 'both') {
          // Send email (simplified - you'd use proper template here)
          await emailService.sendEmail(
            notification.email,
            notification.title,
            notification.message
          );
        }

        if (notification.notification_type === 'push' || notification.notification_type === 'both') {
          // Get user devices
          const devicesResult = await pool.query(
            `SELECT push_token FROM user_devices WHERE user_id = $1 AND active = true`,
            [notification.user_id]
          );

          for (const device of devicesResult.rows) {
            await pushService.sendPushNotification(
              device.push_token,
              notification.title,
              notification.message,
              notification.data
            );
          }
        }

        // Mark as sent
        await pool.query(
          `UPDATE notification_queue SET status = 'sent', sent_at = NOW() WHERE id = $1`,
          [notification.id]
        );

      } catch (error) {
        logger.error(`Failed to process notification ${notification.id}:`, error);
        await pool.query(
          `UPDATE notification_queue SET status = 'failed', error_message = $1 WHERE id = $2`,
          [error.message, notification.id]
        );
      }
    }

    logger.info('Notification queue processing completed');
  } catch (error) {
    logger.error('Error processing notification queue:', error);
  }
};
