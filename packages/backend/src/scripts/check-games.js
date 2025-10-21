require('dotenv').config();
const { connectPostgres, getPostgresPool } = require('../config/database');

async function checkGames() {
  try {
    await connectPostgres();
    const pool = getPostgresPool();

    console.log('Current date:', new Date().toISOString().split('T')[0]);
    console.log('\n📅 Games by Week (2024 Season):\n');

    // Get games by week
    const weekStats = await pool.query(`
      SELECT
        week,
        COUNT(*) as total_games,
        COUNT(CASE WHEN game_date > NOW() THEN 1 END) as upcoming,
        COUNT(CASE WHEN status = 'final' THEN 1 END) as completed,
        MIN(game_date) as first_game,
        MAX(game_date) as last_game
      FROM games
      WHERE season = 2024
      GROUP BY week
      ORDER BY week DESC
      LIMIT 10
    `);

    weekStats.rows.forEach(row => {
      const weekNum = row.week || 'Unknown';
      console.log(`Week ${weekNum}: ${row.total_games} games (${row.upcoming} upcoming, ${row.completed} completed)`);
      console.log(`  ${new Date(row.first_game).toLocaleDateString()} - ${new Date(row.last_game).toLocaleDateString()}`);
    });

    // Check predictions
    console.log('\n🔮 Predictions Status:\n');
    const predStats = await pool.query(`
      SELECT
        COUNT(DISTINCT p.id) as total_predictions,
        COUNT(DISTINCT CASE WHEN g.game_date > NOW() THEN p.id END) as upcoming_predictions,
        COUNT(DISTINCT CASE WHEN g.status = 'final' AND p.id IS NOT NULL THEN p.id END) as predictions_with_results
      FROM predictions p
      JOIN games g ON p.game_id = g.id
      WHERE g.season = 2024
    `);

    const stats = predStats.rows[0];
    console.log(`Total predictions: ${stats.total_predictions}`);
    console.log(`For upcoming games: ${stats.upcoming_predictions}`);
    console.log(`For completed games: ${stats.predictions_with_results}`);

    // Find current week
    console.log('\n📍 Current Week:\n');
    const currentWeek = await pool.query(`
      SELECT DISTINCT week, COUNT(*) as games
      FROM games
      WHERE season = 2024
        AND game_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
      GROUP BY week
      ORDER BY week
    `);

    if (currentWeek.rows.length > 0) {
      currentWeek.rows.forEach(row => {
        console.log(`Week ${row.week}: ${row.games} games this week`);
      });
    } else {
      console.log('No games in the next 7 days');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkGames();
