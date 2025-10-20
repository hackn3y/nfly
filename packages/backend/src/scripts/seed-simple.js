/**
 * Simple Seed Script
 * Adds minimal sample data via direct pool queries with basic schema
 */

require('dotenv').config();
const { connectPostgres, getPostgresPool } = require('../config/database');

async function seedSimple() {
  let pool;

  try {
    await connectPostgres();
    pool = getPostgresPool();

    console.log('🌱 Seeding simple sample data...\n');

    // Sample NFL teams
    const teams = [
      { name: 'Kansas City Chiefs', abbreviation: 'KC' },
      { name: 'Buffalo Bills', abbreviation: 'BUF' },
      { name: 'San Francisco 49ers', abbreviation: 'SF' },
      { name: 'Philadelphia Eagles', abbreviation: 'PHI' },
      { name: 'Dallas Cowboys', abbreviation: 'DAL' },
      { name: 'Miami Dolphins', abbreviation: 'MIA' },
    ];

    console.log('Adding teams...');
    for (const team of teams) {
      await pool.query(
        `INSERT INTO teams (name, abbreviation, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         ON CONFLICT (abbreviation) DO NOTHING`,
        [team.name, team.abbreviation]
      );
    }
    console.log('✅ Teams added\n');

    // Get team IDs
    const teamsResult = await pool.query('SELECT id, abbreviation, name FROM teams');
    const teamMap = {};
    const teamNames = {};
    teamsResult.rows.forEach(row => {
      teamMap[row.abbreviation] = row.id;
      teamNames[row.abbreviation] = row.name;
    });

    // Sample upcoming games
    const today = new Date();
    const games = [
      {
        home: 'KC', away: 'BUF',
        date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        home: 'SF', away: 'DAL',
        date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        home: 'PHI', away: 'MIA',
        date: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),
      },
    ];

    console.log('Adding games...');
    for (const game of games) {
      await pool.query(
        `INSERT INTO games (
          home_team_id, away_team_id, home_team, away_team,
          game_date, week, season, game_type, status,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 10, 2025, 'regular', 'scheduled', NOW(), NOW())`,
        [
          teamMap[game.home],
          teamMap[game.away],
          teamNames[game.home],
          teamNames[game.away],
          game.date
        ]
      );
    }
    console.log('✅ Games added\n');

    console.log('🎉 Sample data seeded successfully!\n');
    console.log('Summary:');
    console.log(`- ${teams.length} teams`);
    console.log(`- ${games.length} upcoming games`);
    console.log('\nYou can now:');
    console.log('- View upcoming games in the app');
    console.log('- ML service will generate predictions automatically');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run if called directly
if (require.main === module) {
  seedSimple()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedSimple;
