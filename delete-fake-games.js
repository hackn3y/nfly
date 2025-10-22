// Delete all the fake games we just imported
const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres:nwXMRSbjeeTxsEjtQuAxihKGDXtlPtZA@nozomi.proxy.rlwy.net:51326/railway';
const pool = new Pool({ connectionString: DATABASE_URL });

async function deleteFakeGames() {
  console.log('🗑️  Deleting fake games...\n');

  try {
    // Get count of games that will be deleted
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM games WHERE season = 2025 AND week != 10`
    );

    const count = countResult.rows[0].count;
    console.log(`Found ${count} games to delete (keeping Week 10)\n`);

    // Delete predictions first (foreign key constraint)
    const predResult = await pool.query(
      `DELETE FROM predictions WHERE game_id IN
       (SELECT id FROM games WHERE season = 2025 AND week != 10)`
    );
    console.log(`Deleted ${predResult.rowCount} predictions`);

    // Delete games
    const gameResult = await pool.query(
      `DELETE FROM games WHERE season = 2025 AND week != 10`
    );
    console.log(`Deleted ${gameResult.rowCount} games`);

    // Show what's left
    const remaining = await pool.query(
      `SELECT week, COUNT(*) as count FROM games WHERE season = 2025 GROUP BY week ORDER BY week`
    );

    console.log('\n📊 Remaining games:');
    remaining.rows.forEach(row => {
      console.log(`  Week ${row.week}: ${row.count} games`);
    });

    console.log('\n✅ Cleanup complete! Only Week 10 remains.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

deleteFakeGames();
