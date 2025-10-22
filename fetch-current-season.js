// Fetch the CURRENT ongoing 2024-2025 NFL season
const axios = require('axios');
const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres:nwXMRSbjeeTxsEjtQuAxihKGDXtlPtZA@nozomi.proxy.rlwy.net:51326/railway';
const pool = new Pool({ connectionString: DATABASE_URL });

// Map ESPN status values to database values
function mapEspnStatus(espnStatus) {
  const statusMap = {
    'STATUS_SCHEDULED': 'scheduled',
    'STATUS_IN_PROGRESS': 'in_progress',
    'STATUS_FINAL': 'final',
    'STATUS_POSTPONED': 'postponed',
    'STATUS_CANCELED': 'canceled',
    'STATUS_CANCELLED': 'canceled',
  };

  return statusMap[espnStatus] || 'scheduled';
}

async function fetchCurrentSeason() {
  console.log('🏈 Fetching CURRENT 2025 NFL Season (ongoing)...\n');
  console.log('Today is October 21, 2025 - fetching real games!\n');

  try {
    // First, clear out the old shifted data
    console.log('Clearing old data...');
    await pool.query('DELETE FROM predictions');
    await pool.query('DELETE FROM games');
    console.log('✅ Cleared\n');

    let totalImported = 0;

    // Fetch weeks 1-18 of the CURRENT 2025 season
    for (let week = 1; week <= 18; week++) {
      try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2025&seasontype=2&week=${week}`;

        console.log(`Fetching Week ${week}...`);
        const response = await axios.get(url, { timeout: 10000 });

        const events = response.data.events || [];

        if (events.length === 0) {
          console.log(`  No games found (season hasn't reached this week yet)\n`);
          continue;
        }

        console.log(`  Found ${events.length} games`);

        for (const event of events) {
          const competition = event.competitions[0];
          const homeTeam = competition.competitors.find(t => t.homeAway === 'home');
          const awayTeam = competition.competitors.find(t => t.homeAway === 'away');

          // Get actual scores if game is complete
          const homeScore = homeTeam.score || null;
          const awayScore = awayTeam.score || null;

          // Map ESPN status to database status
          const espnStatus = competition.status.type.name;
          const dbStatus = mapEspnStatus(espnStatus);

          // Debug: Log the status mapping
          console.log(`    ${homeTeam.team.displayName} vs ${awayTeam.team.displayName}: "${espnStatus}" -> "${dbStatus}"`);

          await pool.query(
            `INSERT INTO games (
              season, week, game_date, home_team, away_team,
              status, home_score, away_score
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              2025, // Current season
              week,
              event.date,
              homeTeam.team.displayName,
              awayTeam.team.displayName,
              dbStatus,
              homeScore,
              awayScore
            ]
          );

          totalImported++;
        }

        console.log(`  ✅ Imported ${events.length} games\n`);

        // Wait to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`  ❌ Error fetching week ${week}:`, error.message);
        console.error(`  Full error:`, error);
      }
    }

    console.log(`\n✅ Import complete! Imported ${totalImported} games from current 2025 season`);
    console.log('\nNote: This is the ACTUAL ongoing 2025 NFL season (October 21, 2025).');
    console.log('Past weeks will show final scores, future weeks will show as scheduled.\n');

  } catch (error) {
    console.error('Fatal error:', error.message);
  } finally {
    await pool.end();
  }
}

fetchCurrentSeason();
