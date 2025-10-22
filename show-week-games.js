// Show what games are in a specific week
const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres:nwXMRSbjeeTxsEjtQuAxihKGDXtlPtZA@nozomi.proxy.rlwy.net:51326/railway';
const pool = new Pool({ connectionString: DATABASE_URL });

async function showWeek(week) {
  try {
    const result = await pool.query(`
      SELECT id, season, week,
             TO_CHAR(game_date, 'YYYY-MM-DD HH24:MI') as game_date,
             home_team, away_team, status
      FROM games
      WHERE season = 2025 AND week = $1
      ORDER BY game_date
    `, [week]);

    console.log(`\n📅 Week ${week} (2025 Season):\n`);

    if (result.rows.length === 0) {
      console.log('  No games found\n');
    } else {
      result.rows.forEach((game, idx) => {
        console.log(`${idx + 1}. ${game.home_team} vs ${game.away_team}`);
        console.log(`   Date: ${game.game_date} | Status: ${game.status} | ID: ${game.id}\n`);
      });
      console.log(`Total: ${result.rows.length} games\n`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Show Week 1
const week = process.argv[2] || 1;
showWeek(parseInt(week));
