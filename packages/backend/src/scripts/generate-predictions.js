/**
 * Generate Predictions Script
 * Generates ML predictions for upcoming games
 * Usage: npm run generate:predictions [limit]
 * Example: npm run generate:predictions 10 (generate for next 10 games)
 */

require('dotenv').config();
const axios = require('axios');
const { connectPostgres, getPostgresPool, getRedisClient } = require('../config/database');
const logger = require('../utils/logger');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

async function generatePredictions(limit = null) {
  const pool = getPostgresPool();

  try {
    console.log('🔮 NFL Prediction Generator');
    console.log('===========================\n');

    // Step 1: Get upcoming games without predictions
    console.log('📋 Step 1: Finding upcoming games...');

    let query = `
      SELECT g.id, g.espn_id, g.home_team, g.away_team, g.game_date, g.week, g.season
      FROM games g
      LEFT JOIN predictions p ON g.id = p.game_id
      WHERE g.status = 'scheduled'
        AND g.game_date > NOW()
        AND p.id IS NULL
      ORDER BY g.game_date
    `;

    if (limit) {
      query += ` LIMIT ${parseInt(limit)}`;
    }

    const gamesResult = await pool.query(query);
    const games = gamesResult.rows;

    if (games.length === 0) {
      console.log('✅ No games need predictions. All upcoming games already have predictions!\n');
      return;
    }

    console.log(`Found ${games.length} games needing predictions\n`);

    // Step 2: Generate predictions via ML service
    console.log('🤖 Step 2: Generating predictions via ML service...');

    let successCount = 0;
    let errorCount = 0;

    for (const game of games) {
      try {
        console.log(`  ${game.away_team} @ ${game.home_team} (${new Date(game.game_date).toLocaleDateString()})...`);

        // Call ML service to generate prediction
        const response = await axios.get(
          `${ML_SERVICE_URL}/api/predictions/game/${game.id}`,
          {
            timeout: 30000 // 30 second timeout for ML processing
          }
        );

        const prediction = response.data;

        // Store prediction in database
        await pool.query(
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
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
          [
            game.id,
            prediction.predicted_score?.home || null,
            prediction.predicted_score?.away || null,
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

        console.log(`  ✅ Generated (${(prediction.confidence * 100).toFixed(1)}% confidence)`);
        successCount++;

        // Small delay to avoid overwhelming ML service
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
        logger.error(`Error generating prediction for game ${game.id}:`, err);
        errorCount++;
      }
    }

    console.log(`\n✅ Generated ${successCount} predictions`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} predictions failed\n`);
    }

    // Step 3: Clear cache so new predictions are visible
    console.log('🗑️  Step 3: Clearing prediction cache...');
    const redis = getRedisClient();
    if (redis) {
      const keys = await redis.keys('predictions:*');
      const mlKeys = await redis.keys('ml:predictions:*');
      const allKeys = [...keys, ...mlKeys];

      if (allKeys.length > 0) {
        await redis.del(...allKeys);
        console.log(`✅ Cleared ${allKeys.length} cache keys\n`);
      } else {
        console.log('✅ No cache to clear\n');
      }
    }

    // Step 4: Summary
    console.log('📊 Prediction Summary');
    console.log('====================\n');

    const stats = await pool.query(`
      SELECT
        COUNT(*) as total_predictions,
        AVG(confidence)::numeric(10,2) as avg_confidence,
        COUNT(*) FILTER (WHERE confidence >= 0.70) as high_confidence,
        COUNT(*) FILTER (WHERE confidence >= 0.60 AND confidence < 0.70) as medium_confidence,
        COUNT(*) FILTER (WHERE confidence < 0.60) as low_confidence
      FROM predictions p
      JOIN games g ON p.game_id = g.id
      WHERE g.status = 'scheduled' AND g.game_date > NOW()
    `);

    const summary = stats.rows[0];
    console.log(`Total Predictions: ${summary.total_predictions}`);
    console.log(`Average Confidence: ${summary.avg_confidence}%`);
    console.log('');
    console.log('Confidence Distribution:');
    console.log(`  🔥 High (≥70%):   ${summary.high_confidence} predictions`);
    console.log(`  ⚡ Medium (60-70%): ${summary.medium_confidence} predictions`);
    console.log(`  ⚠️  Low (<60%):    ${summary.low_confidence} predictions`);
    console.log('');

    // Get featured predictions (highest confidence)
    const featuredResult = await pool.query(`
      SELECT
        g.home_team,
        g.away_team,
        g.game_date,
        p.predicted_winner,
        p.confidence,
        p.spread_prediction
      FROM predictions p
      JOIN games g ON p.game_id = g.id
      WHERE g.status = 'scheduled' AND g.game_date > NOW()
      ORDER BY p.confidence DESC
      LIMIT 5
    `);

    if (featuredResult.rows.length > 0) {
      console.log('⭐ Featured Predictions (Highest Confidence):');
      featuredResult.rows.forEach((pred, i) => {
        const winner = pred.predicted_winner === 'home' ? pred.home_team : pred.away_team;
        const spread = pred.spread_prediction;
        console.log(`  ${i + 1}. ${pred.away_team} @ ${pred.home_team}`);
        console.log(`     Winner: ${winner} (${(pred.confidence * 100).toFixed(1)}% confidence)`);
        console.log(`     Spread: ${spread > 0 ? '+' : ''}${spread}`);
        console.log('');
      });
    }

    console.log('🎉 Prediction generation completed!\n');
    console.log('Next steps:');
    console.log('1. View in app: GET /api/predictions/upcoming');
    console.log('2. Check featured picks: GET /api/predictions/upcoming?minConfidence=0.70');
    console.log('3. Get weekly predictions: GET /api/predictions/weekly?week=10&season=2024\n');

  } catch (error) {
    console.error('❌ Error generating predictions:', error.message);
    logger.error('Prediction generation error:', error);
    throw error;
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const limit = args[0] ? parseInt(args[0]) : null;
  return { limit };
}

// Run if called directly
if (require.main === module) {
  const { limit } = parseArgs();

  // Check if ML service is running
  axios.get(`${ML_SERVICE_URL}/health`)
    .then(() => {
      console.log('✅ ML Service is running\n');
      return connectPostgres();
    })
    .then(() => generatePredictions(limit))
    .then(() => {
      console.log('✅ Generation complete');
      process.exit(0);
    })
    .catch((error) => {
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ ML Service is not running!');
        console.error(`   Please start it first: npm run dev:ml`);
      } else {
        console.error('❌ Generation failed:', error.message);
      }
      process.exit(1);
    });
}

module.exports = generatePredictions;
