const { Pool } = require('pg');

// Railway production database URL
const DATABASE_URL = process.env.DATABASE_URL || 'your-railway-database-url';

async function updateGameDates() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');

    // Update Week 8 games to be 14 days in the future
    const result = await pool.query(
      `UPDATE games
       SET game_date = game_date + INTERVAL '14 days'
       WHERE season = 2025 AND week = 8
       RETURNING id, home_team, away_team, game_date`
    );

    console.log(`✅ Updated ${result.rowCount} games`);
    result.rows.forEach(game => {
      console.log(`  Game ${game.id}: ${game.away_team} @ ${game.home_team} - ${game.game_date}`);
    });

  } catch (error) {
    console.error('❌ Error updating game dates:', error.message);
  } finally {
    await pool.end();
  }
}

updateGameDates();
