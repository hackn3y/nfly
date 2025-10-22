// Import the CURRENT 2025 NFL Season
const axios = require('axios');
const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres:nwXMRSbjeeTxsEjtQuAxihKGDXtlPtZA@nozomi.proxy.rlwy.net:51326/railway';
const pool = new Pool({ connectionString: DATABASE_URL });

// Map ESPN status values to database-allowed values
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

async function importSeason() {
  console.log('🏈 Importing CURRENT 2025 NFL Season...\n');

  try {
    // Clear old data
    console.log('Clearing old data...');
    await pool.query('DELETE FROM predictions');
    await pool.query('DELETE FROM games');
    console.log('✅ Cleared\n');

    let totalImported = 0;

    // Import weeks 1-18
    for (let week = 1; week <= 18; week++) {
      try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2025&seasontype=2&week=${week}`;

        console.log(`Fetching Week ${week}...`);
        const response = await axios.get(url, { timeout: 10000 });

        const events = response.data.events || [];

        if (events.length === 0) {
          console.log(`  No games found\n`);
          continue;
        }

        console.log(`  Found ${events.length} games`);

        for (const event of events) {
          try {
            const competition = event.competitions[0];
            const homeTeam = competition.competitors.find(t => t.homeAway === 'home');
            const awayTeam = competition.competitors.find(t => t.homeAway === 'away');

            // Get scores if available
            const homeScore = homeTeam.score || null;
            const awayScore = awayTeam.score || null;

            // Map ESPN status to database status
            const espnStatus = competition.status.type.name;
            const dbStatus = mapEspnStatus(espnStatus);

            console.log(`    Importing: ${homeTeam.team.displayName} vs ${awayTeam.team.displayName} (${espnStatus} -> ${dbStatus})`);

            await pool.query(
              `INSERT INTO games (
                season, week, game_date, home_team, away_team,
                status, home_score, away_score
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                2025,
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
          } catch (gameError) {
            console.error(`    ❌ Error importing game: ${gameError.message}`);
            throw gameError; // Re-throw to see full error
          }
        }

        console.log(`  ✅ Imported ${events.length} games\n`);
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (weekError) {
        console.error(`  ❌ Error fetching week ${week}:`, weekError.message);
        console.error(`  Full error details:`, weekError);
        break; // Stop on first error so we can see what's wrong
      }
    }

    console.log(`\n✅ Import complete! Imported ${totalImported} games from 2025 season\n`);

  } catch (error) {
    console.error('Fatal error:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

importSeason();
