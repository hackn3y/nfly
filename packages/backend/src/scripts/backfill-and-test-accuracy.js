/**
 * Backfill Predictions and Test Accuracy
 * Generates predictions for completed games and calculates accuracy
 */

require('dotenv').config();
const axios = require('axios');
const { connectPostgres, getPostgresPool } = require('../config/database');
const logger = require('../utils/logger');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

async function backfillAndTestAccuracy(season, week) {
  const pool = getPostgresPool();

  try {
    console.log('🏈 Backfill Predictions & Test Accuracy');
    console.log('=======================================\n');
    console.log(`Season: ${season}, Week: ${week}\n`);

    // Step 1: Get completed games for the week
    console.log('📋 Step 1: Finding completed games...');
    const gamesResult = await pool.query(
      `SELECT id, home_team, away_team, home_score, away_score, game_date, week, season
       FROM games
       WHERE season = $1 AND week = $2 AND status = 'final'
       ORDER BY game_date`,
      [season, week]
    );

    const games = gamesResult.rows;

    if (games.length === 0) {
      console.log(`❌ No completed games found for Week ${week} of ${season} season\n`);
      return;
    }

    console.log(`Found ${games.length} completed games\n`);

    // Step 2: Generate predictions for completed games
    console.log('🤖 Step 2: Generating predictions...');

    let successCount = 0;
    let errorCount = 0;
    const predictions = [];

    for (const game of games) {
      try {
        console.log(`  ${game.away_team} @ ${game.home_team} (${game.away_score}-${game.home_score})`);

        // Call ML service to generate prediction
        const response = await axios.get(
          `${ML_SERVICE_URL}/api/predictions/game/${game.id}`,
          { timeout: 30000 }
        );

        const prediction = response.data;

        // Store prediction in database
        const result = await pool.query(
          `INSERT INTO predictions (
            game_id,
            predicted_home_score,
            predicted_away_score,
            predicted_winner,
            spread_prediction,
            over_under_prediction,
            confidence,
            ml_features,
            model_version,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
          RETURNING id`,
          [
            game.id,
            prediction.predicted_score?.home || null,
            prediction.predicted_away_score || null,
            prediction.predicted_winner,
            prediction.spread_prediction,
            prediction.over_under_prediction,
            prediction.confidence,
            JSON.stringify({
              key_factors: prediction.key_factors || [],
              model_breakdown: prediction.model_breakdown || {}
            }),
            'ensemble-v1'
          ]
        );

        // Determine actual winner
        const actualWinner = game.home_score > game.away_score ? 'home' :
                           game.away_score > game.home_score ? 'away' : 'tie';

        const correct = prediction.predicted_winner === actualWinner;

        predictions.push({
          game,
          prediction,
          actualWinner,
          correct
        });

        console.log(`    Predicted: ${prediction.predicted_winner} | Actual: ${actualWinner} | ${correct ? '✅ CORRECT' : '❌ WRONG'}`);
        successCount++;

        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (err) {
        console.log(`    ❌ Error: ${err.message}`);
        logger.error(`Error generating prediction for game ${game.id}:`, err);
        errorCount++;
      }
    }

    // Step 3: Calculate and display accuracy
    console.log(`\n📊 Accuracy Results`);
    console.log('===================\n');

    const totalPredictions = predictions.length;
    const correctPredictions = predictions.filter(p => p.correct).length;
    const accuracy = (correctPredictions / totalPredictions * 100).toFixed(1);

    console.log(`Week ${week}, ${season} Season:`);
    console.log(`Total Games: ${totalPredictions}`);
    console.log(`Correct Predictions: ${correctPredictions}`);
    console.log(`Accuracy: ${accuracy}%\n`);

    // Show breakdown
    console.log('Game-by-Game Results:');
    console.log('---------------------');
    predictions.forEach((p, i) => {
      const game = p.game;
      const pred = p.prediction;
      console.log(`${i + 1}. ${game.away_team} @ ${game.home_team}`);
      console.log(`   Final Score: ${game.away_team} ${game.away_score} - ${game.home_score} ${game.home_team}`);
      console.log(`   Predicted: ${pred.predicted_winner} (${(pred.confidence * 100).toFixed(0)}% confidence)`);
      console.log(`   Result: ${p.correct ? '✅ CORRECT' : '❌ WRONG'}`);
      console.log('');
    });

    console.log(`\n✅ Backfill complete! Accuracy: ${accuracy}%`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    logger.error('Backfill error:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const season = args[0] ? parseInt(args[0]) : 2025;
const week = args[1] ? parseInt(args[1]) : 7;

// Check if ML service is running
axios.get(`${ML_SERVICE_URL}/health`)
  .then(() => {
    console.log('✅ ML Service is running\n');
    return connectPostgres();
  })
  .then(() => backfillAndTestAccuracy(season, week))
  .catch((error) => {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ ML Service is not running!');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  });
