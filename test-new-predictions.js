// Test predictions from the newly trained models
const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres:nwXMRSbjeeTxsEjtQuAxihKGDXtlPtZA@nozomi.proxy.rlwy.net:51326/railway';
const pool = new Pool({ connectionString: DATABASE_URL });

async function testPredictions() {
  try {
    console.log('🎯 Testing predictions from newly trained models...\n');

    // Get a few upcoming games
    const games = await pool.query(`
      SELECT id, home_team, away_team, week
      FROM games
      WHERE season = 2025 AND status = 'scheduled'
      ORDER BY week, id
      LIMIT 10
    `);

    console.log(`Found ${games.rows.length} upcoming games\n`);

    // Check if predictions exist in database
    for (const game of games.rows) {
      const pred = await pool.query(
        'SELECT predicted_winner, home_win_probability, confidence FROM predictions WHERE game_id = $1',
        [game.id]
      );

      if (pred.rows.length > 0) {
        const p = pred.rows[0];
        console.log(`Week ${game.week}: ${game.home_team} vs ${game.away_team}`);
        console.log(`  Winner: ${p.predicted_winner}`);
        console.log(`  Home Win %: ${(p.home_win_probability * 100).toFixed(1)}%`);
        console.log(`  Confidence: ${(p.confidence * 100).toFixed(1)}%\n`);
      } else {
        console.log(`Week ${game.week}: ${game.home_team} vs ${game.away_team}`);
        console.log(`  No prediction yet (will be generated on demand)\n`);
      }
    }

    console.log('\n💡 To see fresh predictions:');
    console.log('   1. Open your mobile app');
    console.log('   2. Pull down to refresh on any week');
    console.log('   3. The app will fetch new predictions from the trained models\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

testPredictions();
