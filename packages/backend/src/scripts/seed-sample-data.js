/**
 * Seed Sample Data
 * Adds sample NFL games and predictions for testing
 */

require('dotenv').config();
const { connectPostgres, getPostgresPool } = require('../config/database');

async function seedSampleData() {
  const pool = getPostgresPool();

  try {
    console.log('🌱 Starting to seed sample data...');

    // Sample NFL teams
    const teams = [
      { name: 'Kansas City Chiefs', abbreviation: 'KC', conference: 'AFC', division: 'West' },
      { name: 'Buffalo Bills', abbreviation: 'BUF', conference: 'AFC', division: 'East' },
      { name: 'San Francisco 49ers', abbreviation: 'SF', conference: 'NFC', division: 'West' },
      { name: 'Philadelphia Eagles', abbreviation: 'PHI', conference: 'NFC', division: 'East' },
      { name: 'Dallas Cowboys', abbreviation: 'DAL', conference: 'NFC', division: 'East' },
      { name: 'Miami Dolphins', abbreviation: 'MIA', conference: 'AFC', division: 'East' },
      { name: 'Baltimore Ravens', abbreviation: 'BAL', conference: 'AFC', division: 'North' },
      { name: 'Detroit Lions', abbreviation: 'DET', conference: 'NFC', division: 'North' },
    ];

    // Insert teams
    console.log('📋 Inserting teams...');
    for (const team of teams) {
      await pool.query(
        `INSERT INTO teams (name, abbreviation, conference, division, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (abbreviation) DO NOTHING`,
        [team.name, team.abbreviation, team.conference, team.division]
      );
    }
    console.log('✅ Teams inserted');

    // Get team IDs
    const teamsResult = await pool.query('SELECT id, abbreviation FROM teams');
    const teamMap = {};
    teamsResult.rows.forEach(row => {
      teamMap[row.abbreviation] = row.id;
    });

    // Sample upcoming games
    const today = new Date();
    const games = [
      {
        home: 'KC',
        away: 'BUF',
        date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        week: 10,
        season: 2025,
        venue: 'Arrowhead Stadium'
      },
      {
        home: 'SF',
        away: 'DAL',
        date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
        week: 10,
        season: 2025,
        venue: "Levi's Stadium"
      },
      {
        home: 'PHI',
        away: 'MIA',
        date: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),
        week: 10,
        season: 2025,
        venue: 'Lincoln Financial Field'
      },
      {
        home: 'DET',
        away: 'BAL',
        date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
        week: 10,
        season: 2025,
        venue: 'Ford Field'
      },
    ];

    console.log('🏈 Inserting games...');
    const gameIds = [];

    // Get full team info for names
    const teamNames = {};
    teams.forEach(t => teamNames[t.abbreviation] = t.name);

    for (const game of games) {
      const result = await pool.query(
        `INSERT INTO games (
          home_team_id, away_team_id, home_team, away_team,
          game_date, week, season, game_type,
          venue, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'regular', $8, 'scheduled', NOW(), NOW())
        RETURNING id`,
        [
          teamMap[game.home],
          teamMap[game.away],
          teamNames[game.home],
          teamNames[game.away],
          game.date,
          game.week,
          game.season,
          game.venue
        ]
      );

      if (result.rows.length > 0) {
        gameIds.push(result.rows[0].id);
      }
    }
    console.log(`✅ ${gameIds.length} games inserted`);

    // Sample predictions for the games
    console.log('🔮 Inserting sample predictions...');
    const predictions = [
      {
        homeScore: 31,
        awayScore: 24,
        winner: 'home',
        spread: -6.5,
        overUnder: 54.5,
        confidence: 0.72,
        keyFactors: ['Home field advantage', 'Strong offense', 'Defensive momentum']
      },
      {
        homeScore: 28,
        awayScore: 21,
        winner: 'home',
        spread: -7.0,
        overUnder: 48.5,
        confidence: 0.68,
        keyFactors: ['Elite QB play', 'Rushing attack', 'Red zone efficiency']
      },
      {
        homeScore: 24,
        awayScore: 27,
        winner: 'away',
        spread: -3.0,
        overUnder: 51.0,
        confidence: 0.65,
        keyFactors: ['Offensive firepower', 'Secondary weakness', 'Tempo advantage']
      },
      {
        homeScore: 30,
        awayScore: 28,
        winner: 'home',
        spread: -2.5,
        overUnder: 57.5,
        confidence: 0.58,
        keyFactors: ['Close matchup', 'Injury concerns', 'Weather factor']
      },
    ];

    for (let i = 0; i < gameIds.length && i < predictions.length; i++) {
      const pred = predictions[i];
      await pool.query(
        `INSERT INTO predictions (
          game_id, predicted_home_score, predicted_away_score,
          predicted_winner, spread_prediction, over_under_prediction,
          confidence_score, key_factors, model_version,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ensemble-v1', NOW(), NOW())`,
        [
          gameIds[i],
          pred.homeScore,
          pred.awayScore,
          pred.winner,
          pred.spread,
          pred.overUnder,
          pred.confidence,
          JSON.stringify(pred.keyFactors)
        ]
      );
    }
    console.log('✅ Predictions inserted');

    // Add some historical predictions for the test user
    console.log('📊 Adding prediction history for test user...');
    const userResult = await pool.query(
      `SELECT id FROM users WHERE email = 'test@nflpredictor.com' LIMIT 1`
    );

    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;

      // Create some past games (completed)
      const pastDate1 = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000); // 1 week ago
      const pastDate2 = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000); // 2 weeks ago

      const pastGames = [
        {
          home: 'KC', away: 'BUF', date: pastDate1,
          homeScore: 28, awayScore: 24,
          predictedHome: 31, predictedAway: 24,
          wasCorrect: true
        },
        {
          home: 'SF', away: 'DAL', date: pastDate1,
          homeScore: 21, awayScore: 24,
          predictedHome: 28, predictedAway: 21,
          wasCorrect: false
        },
        {
          home: 'PHI', away: 'MIA', date: pastDate2,
          homeScore: 31, awayScore: 17,
          predictedHome: 27, predictedAway: 20,
          wasCorrect: true
        },
      ];

      for (const pg of pastGames) {
        // Insert past game
        const gameResult = await pool.query(
          `INSERT INTO games (
            home_team_id, away_team_id, home_team, away_team,
            game_date, week, season, game_type,
            home_score, away_score, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, 8, 2025, 'regular', $6, $7, 'final', NOW(), NOW())
          RETURNING id`,
          [teamMap[pg.home], teamMap[pg.away], teamNames[pg.home], teamNames[pg.away], pg.date, pg.homeScore, pg.awayScore]
        );

        const gameId = gameResult.rows[0].id;

        // Insert prediction
        const predWinner = pg.predictedHome > pg.predictedAway ? 'home' : 'away';
        await pool.query(
          `INSERT INTO predictions (
            game_id, predicted_home_score, predicted_away_score,
            predicted_winner, confidence_score, model_version,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, 0.70, 'ensemble-v1', NOW(), NOW())`,
          [gameId, pg.predictedHome, pg.predictedAway, predWinner]
        );

        // Note: user_predictions table may not exist yet, skipping for now
      }

      console.log('✅ Prediction history added for test user');
    }

    console.log('');
    console.log('🎉 Sample data seeding completed successfully!');
    console.log('');
    console.log('Summary:');
    console.log('- 8 NFL teams');
    console.log('- 4 upcoming games');
    console.log('- 4 predictions for upcoming games');
    console.log('- 3 historical games with predictions');
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    console.error(error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  connectPostgres()
    .then(() => seedSampleData())
    .then(() => {
      console.log('✅ Seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedSampleData;
