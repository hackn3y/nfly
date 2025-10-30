// Generate sample predictions for all games in all weeks
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://nfluser:nflpass123@localhost:5432/nfl_predictor'
});

// Generate realistic-looking confidence scores
function generateConfidence() {
  // Most predictions should be between 0.50 and 0.75
  const base = 0.50 + Math.random() * 0.25;
  return parseFloat(base.toFixed(2));
}

// Generate predicted scores based on confidence
function generateScore(isWinner, confidence) {
  if (isWinner) {
    // Winner scores typically 20-35 points
    return Math.floor(20 + Math.random() * 15);
  } else {
    // Loser scores typically 14-28 points
    // Closer games when confidence is lower
    const maxDiff = confidence > 0.65 ? 14 : 7;
    return Math.floor(17 + Math.random() * maxDiff);
  }
}

// Generate spread prediction
function generateSpread(homeWinProb) {
  if (homeWinProb > 0.55) {
    // Home team favored
    return -1 * Math.floor(1 + (homeWinProb - 0.5) * 20);
  } else {
    // Away team favored
    return Math.floor(1 + (0.5 - homeWinProb) * 20);
  }
}

async function generateAllPredictions() {
  try {
    console.log('🏈 Generating predictions for all 2025 games...\n');

    // Get all games without predictions
    const gamesResult = await pool.query(`
      SELECT g.id, g.home_team, g.away_team, g.week, g.season
      FROM games g
      LEFT JOIN predictions p ON g.id = p.game_id
      WHERE g.season = 2025 AND p.id IS NULL
      ORDER BY g.week, g.id
    `);

    const games = gamesResult.rows;
    console.log(`Found ${games.length} games without predictions\n`);

    let created = 0;
    const weekCounts = {};

    for (const game of games) {
      // Random home win probability (40-60% for competitive games)
      const homeWinProb = 0.40 + Math.random() * 0.20;
      const confidence = generateConfidence();

      // Determine winner
      const homeWins = homeWinProb > 0.5;
      const predictedWinner = homeWins ? game.home_team : game.away_team;

      // Generate scores
      const homeScore = generateScore(homeWins, confidence);
      const awayScore = generateScore(!homeWins, confidence);

      // Generate betting lines
      const spread = generateSpread(homeWinProb);
      const total = homeScore + awayScore;
      const overUnder = total + Math.floor(Math.random() * 5) - 2; // Slight variance

      // Insert prediction
      await pool.query(`
        INSERT INTO predictions (
          game_id,
          predicted_winner,
          confidence,
          predicted_home_score,
          predicted_away_score,
          spread_prediction,
          over_under_prediction,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
        game.id,
        predictedWinner,
        confidence,
        homeScore,
        awayScore,
        spread,
        overUnder
      ]);

      // Track by week
      weekCounts[game.week] = (weekCounts[game.week] || 0) + 1;
      created++;

      if (created % 10 === 0) {
        console.log(`✅ Generated ${created} predictions...`);
      }
    }

    console.log(`\n✅ Successfully generated ${created} predictions!\n`);
    console.log('📊 Predictions per week:');
    for (let week = 1; week <= 18; week++) {
      if (weekCounts[week]) {
        console.log(`   Week ${week}: ${weekCounts[week]} predictions`);
      }
    }

    // Verify total predictions
    const totalResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM predictions p
      JOIN games g ON p.game_id = g.id
      WHERE g.season = 2025
    `);

    console.log(`\n💾 Total 2025 predictions in database: ${totalResult.rows[0].total}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

generateAllPredictions();
