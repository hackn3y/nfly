// Check what predictions currently exist and their values
const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres:nwXMRSbjeeTxsEjtQuAxihKGDXtlPtZA@nozomi.proxy.rlwy.net:51326/railway';
const pool = new Pool({ connectionString: DATABASE_URL });

async function checkPredictions() {
  try {
    console.log('📊 Checking current predictions in database...\n');

    // Get sample predictions from Week 8
    const predictions = await pool.query(`
      SELECT
        g.id,
        g.week,
        g.home_team,
        g.away_team,
        g.home_team_id,
        g.away_team_id,
        p.predicted_winner,
        p.predicted_home_score,
        p.predicted_away_score,
        p.confidence,
        p.spread_prediction,
        p.over_under_prediction,
        p.created_at
      FROM games g
      LEFT JOIN predictions p ON g.id = p.game_id
      WHERE g.season = 2025
      AND g.status = 'scheduled'
      AND g.week = 8
      ORDER BY g.id
      LIMIT 5
    `);

    console.log(`Week 8 Predictions:\n`);

    predictions.rows.forEach(row => {
      console.log(`${row.home_team} vs ${row.away_team}`);
      console.log(`  Team IDs: home=${row.home_team_id}, away=${row.away_team_id}`);

      if (row.predicted_winner) {
        console.log(`  Winner: ${row.predicted_winner}`);
        console.log(`  Score: ${row.predicted_home_score} - ${row.predicted_away_score}`);
        console.log(`  Confidence: ${row.confidence ? (row.confidence * 100).toFixed(1) + '%' : 'N/A'}`);
        console.log(`  Spread: ${row.spread_prediction}`);
        console.log(`  Over/Under: ${row.over_under_prediction}`);
        console.log(`  Generated: ${row.created_at}`);
      } else {
        console.log(`  ⚠️  No prediction yet (will generate on demand)`);
      }
      console.log('');
    });

    // Check if all predictions have the same values
    const uniqueCheck = await pool.query(`
      SELECT
        COUNT(DISTINCT spread_prediction) as unique_spreads,
        COUNT(DISTINCT over_under_prediction) as unique_totals,
        COUNT(DISTINCT predicted_home_score) as unique_home_scores,
        COUNT(*) as total_predictions
      FROM predictions p
      JOIN games g ON p.game_id = g.id
      WHERE g.season = 2025 AND g.status = 'scheduled'
    `);

    if (uniqueCheck.rows[0].total_predictions > 0) {
      console.log('📈 Prediction Variety:');
      console.log(`  Total predictions: ${uniqueCheck.rows[0].total_predictions}`);
      console.log(`  Unique spreads: ${uniqueCheck.rows[0].unique_spreads}`);
      console.log(`  Unique totals: ${uniqueCheck.rows[0].unique_totals}`);
      console.log(`  Unique win probabilities: ${uniqueCheck.rows[0].unique_probs}\n`);

      if (uniqueCheck.rows[0].unique_spreads === 1 && uniqueCheck.rows[0].unique_totals === 1) {
        console.log('❌ All predictions are identical!');
        console.log('   This means the ML service is still using default values.\n');
      } else {
        console.log('✅ Predictions are varying by game!');
      }
    } else {
      console.log('💡 No predictions in database yet - they will be generated when you view weeks in the app\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkPredictions();
