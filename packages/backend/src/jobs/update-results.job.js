/**
 * Update Results Job
 * Checks completed games and updates prediction accuracy
 */

const { getPostgresPool } = require('../config/database');
const logger = require('../utils/logger');

class ResultsUpdater {
  /**
   * Update results for completed games
   */
  async updateCompletedGames() {
    const pool = getPostgresPool();

    try {
      logger.info('Starting results update job...');

      // Get all predictions for games that have finished
      const query = `
        SELECT
          p.id as prediction_id,
          p.game_id,
          p.predicted_winner,
          p.confidence_score,
          p.prediction_type,
          g.home_team_id,
          g.away_team_id,
          g.home_score,
          g.away_score,
          g.spread,
          g.status
        FROM predictions p
        JOIN games g ON p.game_id = g.id
        WHERE g.status = 'final'
          AND p.result IS NULL
          AND g.home_score IS NOT NULL
          AND g.away_score IS NOT NULL
      `;

      const result = await pool.query(query);
      const predictions = result.rows;

      if (predictions.length === 0) {
        logger.info('No predictions to update');
        return {
          updated: 0,
          correct: 0,
          incorrect: 0
        };
      }

      logger.info(`Found ${predictions.length} predictions to update`);

      let correct = 0;
      let incorrect = 0;

      // Update each prediction
      for (const pred of predictions) {
        const isCorrect = this.checkPrediction(pred);

        await pool.query(
          `UPDATE predictions
           SET result = $1,
               is_correct = $2,
               actual_winner = $3,
               actual_margin = $4,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $5`,
          [
            isCorrect ? 'correct' : 'incorrect',
            isCorrect,
            pred.home_score > pred.away_score ? pred.home_team_id : pred.away_team_id,
            Math.abs(pred.home_score - pred.away_score),
            pred.prediction_id
          ]
        );

        if (isCorrect) {
          correct++;
        } else {
          incorrect++;
        }
      }

      // Update user accuracy stats
      await this.updateUserAccuracyStats();

      // Update model accuracy stats
      await this.updateModelAccuracyStats();

      logger.info(`Results updated: ${correct} correct, ${incorrect} incorrect`);

      return {
        updated: predictions.length,
        correct,
        incorrect,
        accuracy: (correct / predictions.length * 100).toFixed(2)
      };
    } catch (error) {
      logger.error(`Error updating results: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if prediction was correct
   */
  checkPrediction(pred) {
    const actualWinner = pred.home_score > pred.away_score ? pred.home_team_id : pred.away_team_id;

    // Straight winner prediction
    if (pred.prediction_type === 'winner' || pred.prediction_type === 'ml_ensemble') {
      return pred.predicted_winner === actualWinner;
    }

    // Against the spread
    if (pred.prediction_type === 'spread' && pred.spread) {
      const homeScoreWithSpread = pred.home_score + parseFloat(pred.spread);
      const predictedCover = pred.predicted_winner === pred.home_team_id;
      const actualCover = homeScoreWithSpread > pred.away_score;
      return predictedCover === actualCover;
    }

    // Default to winner
    return pred.predicted_winner === actualWinner;
  }

  /**
   * Update user accuracy statistics
   */
  async updateUserAccuracyStats() {
    const pool = getPostgresPool();

    try {
      // Calculate accuracy for each user
      await pool.query(`
        UPDATE users u
        SET
          total_predictions = (SELECT COUNT(*) FROM predictions WHERE user_id = u.id),
          correct_predictions = (SELECT COUNT(*) FROM predictions WHERE user_id = u.id AND is_correct = true),
          accuracy_rate = (
            SELECT ROUND(
              CAST(COUNT(*) FILTER (WHERE is_correct = true) AS DECIMAL) /
              NULLIF(COUNT(*), 0) * 100,
              2
            )
            FROM predictions
            WHERE user_id = u.id AND result IS NOT NULL
          )
      `);

      logger.info('User accuracy stats updated');
    } catch (error) {
      logger.error(`Error updating user stats: ${error.message}`);
    }
  }

  /**
   * Update model performance statistics
   */
  async updateModelAccuracyStats() {
    const pool = getPostgresPool();

    try {
      // Calculate accuracy by prediction type
      const result = await pool.query(`
        SELECT
          prediction_type,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_correct = true) as correct,
          ROUND(
            CAST(COUNT(*) FILTER (WHERE is_correct = true) AS DECIMAL) /
            NULLIF(COUNT(*), 0) * 100,
            2
          ) as accuracy,
          AVG(confidence_score) as avg_confidence
        FROM predictions
        WHERE result IS NOT NULL
        GROUP BY prediction_type
      `);

      const stats = result.rows;

      // Store in model_stats table or cache
      for (const stat of stats) {
        await pool.query(
          `INSERT INTO model_stats (
            model_type,
            total_predictions,
            correct_predictions,
            accuracy_rate,
            avg_confidence,
            last_updated
          ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
          ON CONFLICT (model_type)
          DO UPDATE SET
            total_predictions = $2,
            correct_predictions = $3,
            accuracy_rate = $4,
            avg_confidence = $5,
            last_updated = CURRENT_TIMESTAMP`,
          [
            stat.prediction_type,
            stat.total,
            stat.correct,
            stat.accuracy,
            stat.avg_confidence
          ]
        );
      }

      logger.info('Model accuracy stats updated');
    } catch (error) {
      // Table might not exist yet, create it
      logger.info('Creating model_stats table...');
      await this.createModelStatsTable();
      // Retry
      await this.updateModelAccuracyStats();
    }
  }

  /**
   * Create model_stats table if it doesn't exist
   */
  async createModelStatsTable() {
    const pool = getPostgresPool();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS model_stats (
        id SERIAL PRIMARY KEY,
        model_type VARCHAR(50) UNIQUE NOT NULL,
        total_predictions INTEGER DEFAULT 0,
        correct_predictions INTEGER DEFAULT 0,
        accuracy_rate DECIMAL(5,2) DEFAULT 0,
        avg_confidence DECIMAL(5,4) DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    logger.info('model_stats table created');
  }

  /**
   * Get transparency dashboard data
   */
  async getTransparencyStats() {
    const pool = getPostgresPool();

    try {
      // Overall stats
      const overall = await pool.query(`
        SELECT
          COUNT(*) as total_predictions,
          COUNT(*) FILTER (WHERE is_correct = true) as correct,
          ROUND(
            CAST(COUNT(*) FILTER (WHERE is_correct = true) AS DECIMAL) /
            NULLIF(COUNT(*), 0) * 100,
            2
          ) as accuracy,
          AVG(confidence_score) as avg_confidence
        FROM predictions
        WHERE result IS NOT NULL
      `);

      // By model type
      const byModel = await pool.query(`
        SELECT
          prediction_type,
          COUNT(*) as total,
          ROUND(
            CAST(COUNT(*) FILTER (WHERE is_correct = true) AS DECIMAL) /
            NULLIF(COUNT(*), 0) * 100,
            2
          ) as accuracy
        FROM predictions
        WHERE result IS NOT NULL
        GROUP BY prediction_type
      `);

      // By confidence level
      const byConfidence = await pool.query(`
        SELECT
          CASE
            WHEN confidence_score >= 0.8 THEN 'Very High (80%+)'
            WHEN confidence_score >= 0.7 THEN 'High (70-80%)'
            WHEN confidence_score >= 0.6 THEN 'Medium (60-70%)'
            ELSE 'Low (<60%)'
          END as confidence_level,
          COUNT(*) as total,
          ROUND(
            CAST(COUNT(*) FILTER (WHERE is_correct = true) AS DECIMAL) /
            NULLIF(COUNT(*), 0) * 100,
            2
          ) as accuracy
        FROM predictions
        WHERE result IS NOT NULL AND confidence_score IS NOT NULL
        GROUP BY confidence_level
        ORDER BY MIN(confidence_score) DESC
      `);

      // Recent performance (last 30 days)
      const recent = await pool.query(`
        SELECT
          DATE(p.created_at) as date,
          COUNT(*) as predictions,
          ROUND(
            CAST(COUNT(*) FILTER (WHERE p.is_correct = true) AS DECIMAL) /
            NULLIF(COUNT(*), 0) * 100,
            2
          ) as accuracy
        FROM predictions p
        JOIN games g ON p.game_id = g.id
        WHERE g.status = 'final'
          AND p.result IS NOT NULL
          AND p.created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(p.created_at)
        ORDER BY date DESC
      `);

      return {
        overall: overall.rows[0],
        byModel: byModel.rows,
        byConfidence: byConfidence.rows,
        recentPerformance: recent.rows
      };
    } catch (error) {
      logger.error(`Error getting transparency stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get "when to trust" recommendations
   */
  async getWhenToTrustRecommendations() {
    const pool = getPostgresPool();

    try {
      const result = await pool.query(`
        SELECT
          CASE
            WHEN confidence_score >= 0.75 THEN 'HIGH_CONFIDENCE'
            WHEN confidence_score >= 0.65 THEN 'MEDIUM_CONFIDENCE'
            ELSE 'LOW_CONFIDENCE'
          END as trust_level,
          ROUND(
            CAST(COUNT(*) FILTER (WHERE is_correct = true) AS DECIMAL) /
            NULLIF(COUNT(*), 0) * 100,
            2
          ) as accuracy,
          COUNT(*) as sample_size
        FROM predictions
        WHERE result IS NOT NULL AND confidence_score IS NOT NULL
        GROUP BY trust_level
      `);

      const recommendations = result.rows.map(row => {
        if (row.trust_level === 'HIGH_CONFIDENCE' && row.accuracy >= 70) {
          return {
            level: row.trust_level,
            accuracy: row.accuracy,
            recommendation: 'Strong bet - historically accurate at this confidence level',
            sampleSize: row.sample_size
          };
        } else if (row.trust_level === 'MEDIUM_CONFIDENCE' && row.accuracy >= 60) {
          return {
            level: row.trust_level,
            accuracy: row.accuracy,
            recommendation: 'Proceed with caution - moderate historical accuracy',
            sampleSize: row.sample_size
          };
        } else {
          return {
            level: row.trust_level,
            accuracy: row.accuracy,
            recommendation: 'For entertainment only - lower historical accuracy',
            sampleSize: row.sample_size
          };
        }
      });

      return recommendations;
    } catch (error) {
      logger.error(`Error getting trust recommendations: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ResultsUpdater();
