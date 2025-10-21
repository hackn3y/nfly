require('dotenv').config();
const axios = require('axios');
const { connectPostgres, getPostgresPool } = require('../config/database');
const logger = require('../utils/logger');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

async function generatePredictionsForAllWeeks() {
  await connectPostgres();
  const pool = getPostgresPool();

  logger.info('Generating predictions for all weeks with games...');

  try {
    // Get all weeks that have games
    const result = await pool.query(`
      SELECT DISTINCT season, week, COUNT(*) as game_count
      FROM games
      WHERE season = 2025
      GROUP BY season, week
      ORDER BY week
    `);

    logger.info(`Found ${result.rows.length} weeks with games`);

    for (const row of result.rows) {
      const { season, week, game_count } = row;
      logger.info(`\n📅 Processing Week ${week} (${game_count} games)...`);

      try {
        // Get games for this week
        const gamesResult = await pool.query(
          'SELECT id, home_team, away_team FROM games WHERE season = $1 AND week = $2',
          [season, week]
        );

        let successCount = 0;
        let errorCount = 0;

        for (const game of gamesResult.rows) {
          try {
            // Call ML service to generate prediction
            logger.info(`  Predicting game ${game.id}: ${game.home_team} vs ${game.away_team}`);

            const prediction = await axios.get(
              `${ML_SERVICE_URL}/api/predictions/game/${game.id}`,
              { timeout: 30000 }
            );

            successCount++;
            logger.info(`  ✅ Prediction generated`);
          } catch (error) {
            errorCount++;
            logger.error(`  ❌ Error: ${error.message}`);
          }
        }

        logger.info(`Week ${week} complete: ${successCount} success, ${errorCount} errors`);
      } catch (error) {
        logger.error(`Error processing week ${week}: ${error.message}`);
      }
    }

    logger.info('\n✅ All predictions generated!');
  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await pool.end();
  }
}

generatePredictionsForAllWeeks().catch(error => {
  logger.error('Script failed:', error);
  process.exit(1);
});
