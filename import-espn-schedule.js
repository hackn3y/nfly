// Import real NFL schedule from ESPN API
const axios = require('axios');
const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres:nwXMRSbjeeTxsEjtQuAxihKGDXtlPtZA@nozomi.proxy.rlwy.net:51326/railway';
const pool = new Pool({ connectionString: DATABASE_URL });

// ESPN's public NFL API endpoint
const ESPN_API = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';

async function fetchESPNSchedule(year, week) {
  try {
    const url = `${ESPN_API}?dates=${year}&seasontype=2&week=${week}`;
    console.log(`Fetching Week ${week} from ESPN...`);

    const response = await axios.get(url, { timeout: 10000 });
    const games = response.data.events || [];

    const parsedGames = [];

    for (const event of games) {
      const competition = event.competitions[0];
      const homeTeam = competition.competitors.find(t => t.homeAway === 'home');
      const awayTeam = competition.competitors.find(t => t.homeAway === 'away');

      parsedGames.push({
        week: week,
        season: year,
        game_date: event.date,
        home_team: homeTeam.team.displayName,
        away_team: awayTeam.team.displayName,
        home_abbr: homeTeam.team.abbreviation,
        away_abbr: awayTeam.team.abbreviation,
        status: competition.status.type.name.toLowerCase()
      });
    }

    return parsedGames;
  } catch (error) {
    console.error(`  ❌ Error fetching week ${week}:`, error.message);
    return [];
  }
}

async function importSchedule() {
  console.log('🏈 Importing 2024 NFL Schedule from ESPN...\n');
  console.log('Note: 2025 season hasn\'t started yet, importing 2024 season data\n');

  let totalImported = 0;
  let totalSkipped = 0;

  // Import weeks 1-18 of 2024 season
  for (let week = 1; week <= 18; week++) {
    const games = await fetchESPNSchedule(2024, week);

    if (games.length === 0) {
      console.log(`  No games found for Week ${week}\n`);
      continue;
    }

    console.log(`  Found ${games.length} games for Week ${week}`);

    for (const game of games) {
      try {
        // Check if game already exists
        const existing = await pool.query(
          `SELECT id FROM games WHERE season = $1 AND week = $2
           AND home_team = $3 AND away_team = $4`,
          [game.season, game.week, game.home_team, game.away_team]
        );

        if (existing.rows.length > 0) {
          totalSkipped++;
          continue;
        }

        // Insert game
        await pool.query(
          `INSERT INTO games (
            season, week, game_date, home_team, away_team,
            home_abbr, away_abbr, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            game.season, game.week, game.game_date,
            game.home_team, game.away_team,
            game.home_abbr, game.away_abbr,
            game.status
          ]
        );

        totalImported++;
      } catch (error) {
        console.error(`    ❌ Error importing ${game.home_team} vs ${game.away_team}:`, error.message);
      }
    }

    console.log(`  ✅ Week ${week} complete\n`);

    // Rate limit - wait 1 second between weeks
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('📊 Summary:');
  console.log(`  Imported: ${totalImported} games`);
  console.log(`  Skipped: ${totalSkipped} games (already exist)`);
  console.log('\n✅ Import complete!');
  console.log('\nNote: These are 2024 season games (completed). For predictions,');
  console.log('you may want to change the season to 2025 in the database.');

  await pool.end();
}

importSchedule().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
