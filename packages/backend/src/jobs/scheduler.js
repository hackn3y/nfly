/**
 * Job Scheduler
 * Automated tasks using node-cron
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const resultsUpdater = require('./update-results.job');
const nflDataService = require('../services/nfl-data.service');

class JobScheduler {
  constructor() {
    this.jobs = [];
  }

  /**
   * Start all scheduled jobs
   */
  start() {
    logger.info('Starting job scheduler...');

    // Update game results every hour
    this.scheduleResultsUpdate();

    // Sync NFL data twice daily (8 AM and 8 PM)
    this.scheduleNFLDataSync();

    // Send weekly summaries (Mondays at 9 AM)
    this.scheduleWeeklySummaries();

    // Clean up old cache data daily
    this.scheduleCacheCleanup();

    logger.info(`${this.jobs.length} jobs scheduled`);
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    logger.info('All scheduled jobs stopped');
  }

  /**
   * Update game results every hour
   */
  scheduleResultsUpdate() {
    // Run every hour
    const job = cron.schedule('0 * * * *', async () => {
      try {
        logger.info('[CRON] Running results update...');
        const result = await resultsUpdater.updateCompletedGames();
        logger.info(`[CRON] Results updated: ${result.updated} predictions`);
      } catch (error) {
        logger.error(`[CRON] Results update failed: ${error.message}`);
      }
    });

    this.jobs.push(job);
    logger.info('Scheduled: Results update (hourly)');
  }

  /**
   * Sync NFL data twice daily
   */
  scheduleNFLDataSync() {
    // Run at 8 AM and 8 PM
    const job = cron.schedule('0 8,20 * * *', async () => {
      try {
        logger.info('[CRON] Syncing NFL data...');
        await nflDataService.syncCurrentWeek();
        logger.info('[CRON] NFL data synced successfully');
      } catch (error) {
        logger.error(`[CRON] NFL data sync failed: ${error.message}`);
      }
    });

    this.jobs.push(job);
    logger.info('Scheduled: NFL data sync (8 AM & 8 PM)');
  }

  /**
   * Send weekly summaries
   */
  scheduleWeeklySummaries() {
    // Run Mondays at 9 AM
    const job = cron.schedule('0 9 * * 1', async () => {
      try {
        logger.info('[CRON] Sending weekly summaries...');
        await this.sendWeeklySummaries();
        logger.info('[CRON] Weekly summaries sent');
      } catch (error) {
        logger.error(`[CRON] Weekly summaries failed: ${error.message}`);
      }
    });

    this.jobs.push(job);
    logger.info('Scheduled: Weekly summaries (Mondays 9 AM)');
  }

  /**
   * Clean up old cache data
   */
  scheduleCacheCleanup() {
    // Run daily at 3 AM
    const job = cron.schedule('0 3 * * *', async () => {
      try {
        logger.info('[CRON] Cleaning up cache...');
        await this.cleanupCache();
        logger.info('[CRON] Cache cleanup completed');
      } catch (error) {
        logger.error(`[CRON] Cache cleanup failed: ${error.message}`);
      }
    });

    this.jobs.push(job);
    logger.info('Scheduled: Cache cleanup (daily 3 AM)');
  }

  /**
   * Send weekly summaries to all users
   */
  async sendWeeklySummaries() {
    const { getPostgresPool } = require('../config/database');
    const emailService = require('../services/email.service');
    const pool = getPostgresPool();

    try {
      // Get all users who want weekly emails
      const usersResult = await pool.query(`
        SELECT id, email, total_predictions, correct_predictions, accuracy_rate
        FROM users
        WHERE is_active = true
          AND total_predictions > 0
          AND email_notifications = true
      `);

      for (const user of usersResult.rows) {
        // Get this week's predictions
        const weekResult = await pool.query(`
          SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE is_correct = true) as correct
          FROM predictions p
          JOIN games g ON p.game_id = g.id
          WHERE p.user_id = $1
            AND g.status = 'final'
            AND p.created_at >= CURRENT_DATE - INTERVAL '7 days'
        `, [user.id]);

        const weekData = weekResult.rows[0];

        if (weekData.total > 0) {
          const accuracy = ((weekData.correct / weekData.total) * 100).toFixed(1);

          await emailService.sendWeeklySummary(
            user.email,
            {
              total: weekData.total,
              correct: weekData.correct
            },
            accuracy
          );
        }
      }

      logger.info(`Sent weekly summaries to ${usersResult.rows.length} users`);
    } catch (error) {
      logger.error(`Error sending weekly summaries: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clean up old cache data
   */
  async cleanupCache() {
    const { getMongoClient } = require('../config/database');

    try {
      const client = getMongoClient();
      const db = client.db('nfl_gematria');

      // Delete gematria calculations older than 30 days
      const result = await db.collection('calculations').deleteMany({
        calculated_at: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });

      logger.info(`Cleaned up ${result.deletedCount} old cache entries`);
    } catch (error) {
      logger.error(`Error cleaning cache: ${error.message}`);
    }
  }

  /**
   * Run a job immediately (for testing)
   */
  async runJob(jobName) {
    switch (jobName) {
      case 'results':
        return await resultsUpdater.updateCompletedGames();
      case 'nfl-sync':
        return await nflDataService.syncCurrentWeek();
      case 'weekly-summary':
        return await this.sendWeeklySummaries();
      case 'cache-cleanup':
        return await this.cleanupCache();
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }
}

// Export singleton instance
const scheduler = new JobScheduler();

module.exports = scheduler;
