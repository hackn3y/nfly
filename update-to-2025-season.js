// Update 2024 games to 2025 season
const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres:nwXMRSbjeeTxsEjtQuAxihKGDXtlPtZA@nozomi.proxy.rlwy.net:51326/railway';
const pool = new Pool({ connectionString: DATABASE_URL });

async function updateSeason() {
  console.log('🔄 Updating 2024 season games to 2025...\n');

  try {
    // Delete predictions for 2025 games first
    const deletePred2025 = await pool.query(
      'DELETE FROM predictions WHERE game_id IN (SELECT id FROM games WHERE season = 2025)'
    );
    console.log(`Deleted ${deletePred2025.rowCount} predictions for 2025 games`);

    // Delete the old 2025 Week 10 games
    const deleteGames = await pool.query(
      'DELETE FROM games WHERE season = 2025'
    );
    console.log(`Deleted ${deleteGames.rowCount} existing 2025 games`);

    // Delete all 2024 predictions (they'll regenerate on demand)
    const deletePred2024 = await pool.query(
      'DELETE FROM predictions WHERE game_id IN (SELECT id FROM games WHERE season = 2024)'
    );
    console.log(`Deleted ${deletePred2024.rowCount} predictions for 2024 games\n`);

    // Update all 2024 games to 2025
    const updateResult = await pool.query(`
      UPDATE games
      SET season = 2025,
          game_date = game_date + INTERVAL '1 year',
          status = 'scheduled'
      WHERE season = 2024
    `);

    console.log(`✅ Updated ${updateResult.rowCount} games to 2025 season\n`);

    // Show summary
    const summary = await pool.query(`
      SELECT week, COUNT(*) as count
      FROM games
      WHERE season = 2025
      GROUP BY week
      ORDER BY week
    `);

    console.log('📊 2025 Season Games:');
    summary.rows.forEach(row => {
      console.log(`  Week ${row.week}: ${row.count} games`);
    });

    console.log('\n✅ Update complete! Refresh your browser.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

updateSeason();
