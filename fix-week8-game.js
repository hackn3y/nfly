// Fix Week 8 Vikings vs Chargers game
const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres:nwXMRSbjeeTxsEjtQuAxihKGDXtlPtZA@nozomi.proxy.rlwy.net:51326/railway';
const pool = new Pool({ connectionString: DATABASE_URL });

async function fixGame() {
  console.log('🔧 Fixing Week 8 game...\n');

  try {
    // Find the incorrect game
    const result = await pool.query(
      `SELECT id, home_team, away_team FROM games
       WHERE season = 2025 AND week = 8
       AND home_team = 'Los Angeles Rams' AND away_team = 'Minnesota Vikings'`
    );

    if (result.rows.length === 0) {
      console.log('❌ Game not found');
      return;
    }

    const gameId = result.rows[0].id;
    console.log(`Found game ID: ${gameId}`);
    console.log(`Current: ${result.rows[0].home_team} vs ${result.rows[0].away_team}`);

    // Update to correct matchup
    await pool.query(
      `UPDATE games
       SET home_team = $1, away_team = $2
       WHERE id = $3`,
      ['Minnesota Vikings', 'Los Angeles Chargers', gameId]
    );

    console.log(`✅ Updated to: Minnesota Vikings vs Los Angeles Chargers\n`);

    // Delete the old prediction if it exists
    await pool.query('DELETE FROM predictions WHERE game_id = $1', [gameId]);
    console.log('🗑️  Deleted old prediction (will regenerate on next view)\n');

    console.log('✅ Fix complete! Refresh your browser and check Week 8.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixGame();
