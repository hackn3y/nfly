// Verify the import was successful
const { Pool } = require('pg');
require('dotenv').config({ path: './packages/backend/.env' });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not found in environment variables');
  process.exit(1);
}
const pool = new Pool({ connectionString: DATABASE_URL });

async function verify() {
  try {
    // Check total games
    const total = await pool.query('SELECT COUNT(*) FROM games WHERE season = 2025');
    console.log(`\n📊 Total 2025 season games: ${total.rows[0].count}\n`);

    // Check by status
    const byStatus = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM games
      WHERE season = 2025
      GROUP BY status
      ORDER BY status
    `);

    console.log('Games by status:');
    byStatus.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });

    // Check by week
    const byWeek = await pool.query(`
      SELECT week, COUNT(*) as count
      FROM games
      WHERE season = 2025
      GROUP BY week
      ORDER BY week
    `);

    console.log('\nGames by week:');
    byWeek.rows.forEach(row => {
      console.log(`  Week ${row.week}: ${row.count} games`);
    });

    console.log('\n✅ Import verified!\n');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

verify();
