/**
 * Import NFL Season Script
 * Imports complete NFL season schedule from ESPN API
 * Usage: npm run import:season [season] [week]
 * Example: npm run import:season 2024 (imports all weeks)
 *          npm run import:season 2024 10 (imports week 10 only)
 */

require('dotenv').config();
const { connectPostgres, getPostgresPool } = require('../config/database');
const espnApi = require('../services/espn-api.service');
const logger = require('../utils/logger');

const CURRENT_SEASON = 2024;
const TOTAL_WEEKS = 18; // Regular season weeks

async function importSeason(season = CURRENT_SEASON, specificWeek = null) {
  const pool = getPostgresPool();

  try {
    console.log('🏈 NFL Season Import Tool');
    console.log('==========================\n');
    console.log(`Season: ${season}`);
    console.log(`Week: ${specificWeek || 'All weeks (1-' + TOTAL_WEEKS + ')'}\n`);

    // Step 1: Import all NFL teams
    console.log('📋 Step 1: Importing NFL teams...');
    const teams = await espnApi.getTeams();
    let teamsImported = 0;

    for (const team of teams) {
      try {
        // First, try to update existing team by abbreviation
        const updateResult = await pool.query(
          `UPDATE teams SET
            espn_id = $1,
            name = $2,
            short_name = $3,
            nickname = $4,
            location = $5,
            conference = $6,
            division = $7,
            color = $8,
            alternate_color = $9,
            logo = $10,
            updated_at = NOW()
          WHERE abbreviation = $11
          RETURNING id`,
          [
            team.espnId,
            team.name,
            team.shortName,
            team.nickname,
            team.location,
            team.conference,
            team.division,
            team.color,
            team.alternateColor,
            team.logo,
            team.abbreviation
          ]
        );

        // If no team was updated, insert new one
        if (updateResult.rowCount === 0) {
          await pool.query(
            `INSERT INTO teams (
              espn_id, name, abbreviation, short_name, nickname, location,
              conference, division, color, alternate_color, logo,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
            ON CONFLICT (abbreviation) DO UPDATE SET
              espn_id = EXCLUDED.espn_id,
              name = EXCLUDED.name,
              logo = EXCLUDED.logo,
              updated_at = NOW()`,
            [
              team.espnId,
              team.name,
              team.abbreviation,
              team.shortName,
              team.nickname,
              team.location,
              team.conference,
              team.division,
              team.color,
              team.alternateColor,
              team.logo
            ]
          );
        }
        teamsImported++;
      } catch (err) {
        logger.error(`Error importing team ${team.name}:`, err.message);
      }
    }
    console.log(`✅ Imported ${teamsImported} teams\n`);

    // Step 2: Import games
    console.log('🏈 Step 2: Importing games...');

    const weeks = specificWeek ? [specificWeek] : Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1);
    let totalGamesImported = 0;

    for (const week of weeks) {
      try {
        console.log(`  Week ${week}...`);
        const games = await espnApi.getGamesForWeek(season, week);

        for (const game of games) {
          try {
            // Get team IDs from database
            const homeTeamResult = await pool.query(
              'SELECT id FROM teams WHERE espn_id = $1',
              [game.homeTeam.id]
            );
            const awayTeamResult = await pool.query(
              'SELECT id FROM teams WHERE espn_id = $1',
              [game.awayTeam.id]
            );

            if (homeTeamResult.rows.length === 0 || awayTeamResult.rows.length === 0) {
              console.log(`    ⚠️  Skipping game: Teams not found in database`);
              continue;
            }

            const homeTeamId = homeTeamResult.rows[0].id;
            const awayTeamId = awayTeamResult.rows[0].id;

            // Map ESPN status to database status
            let dbStatus = 'scheduled';
            if (game.status === 'in') {
              dbStatus = 'in_progress';
            } else if (game.status === 'post') {
              dbStatus = 'final';
            } else if (game.status === 'scheduled' || game.status === 'pre') {
              dbStatus = 'scheduled';
            }

            // Insert or update game
            await pool.query(
              `INSERT INTO games (
                espn_id, home_team_id, away_team_id, home_team, away_team,
                home_abbreviation, away_abbreviation,
                game_date, week, season, game_type, status,
                home_score, away_score,
                venue, venue_city, venue_state, is_indoor,
                weather_temperature, weather_conditions,
                spread, over_under, odds_provider,
                broadcast_network,
                created_at, updated_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, NOW(), NOW()
              )
              ON CONFLICT (espn_id) DO UPDATE SET
                status = EXCLUDED.status,
                home_score = CASE WHEN EXCLUDED.home_score IS NOT NULL THEN EXCLUDED.home_score ELSE games.home_score END,
                away_score = CASE WHEN EXCLUDED.away_score IS NOT NULL THEN EXCLUDED.away_score ELSE games.away_score END,
                spread = EXCLUDED.spread,
                over_under = EXCLUDED.over_under,
                weather_temperature = EXCLUDED.weather_temperature,
                weather_conditions = EXCLUDED.weather_conditions,
                updated_at = NOW()
              RETURNING id`,
              [
                game.espnId,
                homeTeamId,
                awayTeamId,
                game.homeTeam.name,
                game.awayTeam.name,
                game.homeTeam.abbreviation,
                game.awayTeam.abbreviation,
                game.gameDate,
                game.week,
                game.season,
                'regular', // game_type
                dbStatus, // mapped status
                game.homeTeam.score || null,
                game.awayTeam.score || null,
                game.venue?.name,
                game.venue?.city,
                game.venue?.state,
                game.venue?.indoor || false,
                game.weather?.temperature,
                game.weather?.conditions,
                game.odds?.spread,
                game.odds?.overUnder,
                game.odds?.provider,
                game.broadcasts?.[0]?.network
              ]
            );

            totalGamesImported++;
          } catch (err) {
            logger.error(`Error importing game ${game.espnId}:`, err.message);
          }
        }

        console.log(`  ✅ Week ${week}: ${games.length} games imported`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err) {
        logger.error(`Error fetching week ${week}:`, err.message);
      }
    }

    console.log(`\n✅ Total games imported: ${totalGamesImported}\n`);

    // Step 3: Summary
    console.log('📊 Import Summary');
    console.log('================\n');

    const stats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'scheduled') as upcoming,
        COUNT(*) FILTER (WHERE status = 'in') as in_progress,
        COUNT(*) FILTER (WHERE status = 'post') as completed,
        COUNT(*) as total
      FROM games
      WHERE season = $1
    `, [season]);

    const summary = stats.rows[0];
    console.log(`Season ${season} Games:`);
    console.log(`  📅 Upcoming:     ${summary.upcoming}`);
    console.log(`  ⚡ In Progress:  ${summary.in_progress}`);
    console.log(`  ✅ Completed:    ${summary.completed}`);
    console.log(`  📊 Total:        ${summary.total}`);
    console.log('');

    // Get next upcoming game
    const nextGame = await pool.query(`
      SELECT home_team, away_team, game_date
      FROM games
      WHERE status = 'scheduled' AND game_date > NOW()
      ORDER BY game_date
      LIMIT 1
    `);

    if (nextGame.rows.length > 0) {
      const game = nextGame.rows[0];
      console.log(`🎯 Next Game: ${game.away_team} @ ${game.home_team}`);
      console.log(`   ${new Date(game.game_date).toLocaleString()}`);
      console.log('');
    }

    console.log('🎉 Season import completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Generate predictions: npm run generate:predictions');
    console.log('2. View predictions: GET /api/predictions/upcoming');
    console.log('3. Check specific game: GET /api/predictions/game/:gameId\n');

  } catch (error) {
    console.error('❌ Error importing season:', error.message);
    logger.error('Season import error:', error);
    throw error;
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const season = args[0] ? parseInt(args[0]) : CURRENT_SEASON;
  const week = args[1] ? parseInt(args[1]) : null;

  return { season, week };
}

// Run if called directly
if (require.main === module) {
  const { season, week } = parseArgs();

  connectPostgres()
    .then(() => importSeason(season, week))
    .then(() => {
      console.log('✅ Import complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Import failed:', error);
      process.exit(1);
    });
}

module.exports = importSeason;
