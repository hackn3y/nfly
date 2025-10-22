// Check predictions for a specific week
const { Pool } = require('pg');
const axios = require('axios');

const DATABASE_URL = 'postgresql://postgres:nwXMRSbjeeTxsEjtQuAxihKGDXtlPtZA@nozomi.proxy.rlwy.net:51326/railway';
const ML_SERVICE_URL = 'https://nfl-predictor-ml-production.up.railway.app';

const pool = new Pool({ connectionString: DATABASE_URL });

async function checkPredictions() {
  try {
    const week = 8;
    const season = 2025;

    console.log(`\n📊 Checking Week ${week} predictions...\n`);

    // Get games from database
    const gamesResult = await pool.query(
      'SELECT id, home_team, away_team FROM games WHERE season = $1 AND week = $2 ORDER BY id LIMIT 3',
      [season, week]
    );

    console.log(`Found ${gamesResult.rows.length} games in database\n`);

    // Check predictions for first 3 games
    for (const game of gamesResult.rows) {
      console.log(`\nGame ${game.id}: ${game.home_team} vs ${game.away_team}`);
      console.log('---');

      // Check if prediction exists in database
      const predResult = await pool.query(
        'SELECT * FROM predictions WHERE game_id = $1',
        [game.id]
      );

      if (predResult.rows.length > 0) {
        const pred = predResult.rows[0];
        console.log('Database prediction:');
        console.log(`  Predicted winner: ${pred.predicted_winner}`);
        console.log(`  Home win prob: ${pred.home_win_probability}`);
        console.log(`  Away win prob: ${pred.away_win_probability}`);
        console.log(`  Confidence: ${pred.confidence}`);
        console.log(`  Predicted spread: ${pred.predicted_spread}`);
      } else {
        console.log('No prediction in database yet');
      }

      // Try to get prediction from ML service
      try {
        console.log('\nCalling ML service...');
        const mlResponse = await axios.get(
          `${ML_SERVICE_URL}/api/predictions/game/${game.id}`,
          { timeout: 30000 }
        );

        console.log('ML service response:');
        console.log(`  Status: ${mlResponse.status}`);
        console.log(`  Winner: ${mlResponse.data.predicted_winner}`);
        console.log(`  Home win prob: ${mlResponse.data.home_win_probability}`);
        console.log(`  Away win prob: ${mlResponse.data.away_win_probability}`);
        console.log(`  Confidence: ${mlResponse.data.confidence}`);
        console.log(`  Spread: ${mlResponse.data.predicted_spread}`);
      } catch (mlError) {
        console.log(`ML service error: ${mlError.message}`);
        if (mlError.response) {
          console.log(`Response status: ${mlError.response.status}`);
          console.log(`Response data:`, JSON.stringify(mlError.response.data, null, 2));
        }
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkPredictions();
