// Check what weeks have games
const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres:nwXMRSbjeeTxsEjtQuAxihKGDXtlPtZA@nozomi.proxy.rlwy.net:51326/railway';
const pool = new Pool({ connectionString: DATABASE_URL });

async function checkWeeks() {
  try {
    const result = await pool.query(`
      SELECT season, week, COUNT(*) as game_count
      FROM games
      GROUP BY season, week
      ORDER BY season DESC, week
    `);

    console.log('📊 Games in database:\n');
    result.rows.forEach(row => {
      console.log(`  Season ${row.season}, Week ${row.week}: ${row.game_count} games`);
    });

    console.log(`\nTotal: ${result.rows.length} weeks with games`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkWeeks();
