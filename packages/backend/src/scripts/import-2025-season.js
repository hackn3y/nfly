require('dotenv').config();
const axios = require('axios');
const { connectPostgres, getPostgresPool } = require('../config/database');
const logger = require('../utils/logger');

// NFL 2025 Season Schedule (sample - would normally fetch from ESPN API)
const SEASON_2025_SCHEDULE = [
  // Week 1
  { week: 1, home: 'Kansas City Chiefs', away: 'Baltimore Ravens', date: '2025-09-04T20:20:00' },
  { week: 1, home: 'Buffalo Bills', away: 'New York Jets', date: '2025-09-07T13:00:00' },
  { week: 1, home: 'Cincinnati Bengals', away: 'Cleveland Browns', date: '2025-09-07T13:00:00' },
  { week: 1, home: 'Houston Texans', away: 'Indianapolis Colts', date: '2025-09-07T13:00:00' },

  // Week 2
  { week: 2, home: 'Philadelphia Eagles', away: 'Atlanta Falcons', date: '2025-09-11T20:15:00' },
  { week: 2, home: 'Dallas Cowboys', away: 'New Orleans Saints', date: '2025-09-14T13:00:00' },
  { week: 2, home: 'Green Bay Packers', away: 'Minnesota Vikings', date: '2025-09-14T13:00:00' },
  { week: 2, home: 'San Francisco 49ers', away: 'Los Angeles Rams', date: '2025-09-14T16:25:00' },

  // Week 3
  { week: 3, home: 'Tampa Bay Buccaneers', away: 'Denver Broncos', date: '2025-09-18T20:15:00' },
  { week: 3, home: 'Miami Dolphins', away: 'Seattle Seahawks', date: '2025-09-21T13:00:00' },
  { week: 3, home: 'Detroit Lions', away: 'Arizona Cardinals', date: '2025-09-21T13:00:00' },
  { week: 3, home: 'Las Vegas Raiders', away: 'Pittsburgh Steelers', date: '2025-09-21T16:05:00' },

  // Week 4
  { week: 4, home: 'Chicago Bears', away: 'Los Angeles Rams', date: '2025-09-25T20:15:00' },
  { week: 4, home: 'Tennessee Titans', away: 'Miami Dolphins', date: '2025-09-28T13:00:00' },
  { week: 4, home: 'New England Patriots', away: 'San Francisco 49ers', date: '2025-09-28T16:25:00' },
  { week: 4, home: 'New York Giants', away: 'Dallas Cowboys', date: '2025-09-28T20:20:00' },

  // Week 5
  { week: 5, home: 'New York Jets', away: 'Denver Broncos', date: '2025-10-02T20:15:00' },
  { week: 5, home: 'Atlanta Falcons', away: 'Tampa Bay Buccaneers', date: '2025-10-05T13:00:00' },
  { week: 5, home: 'Carolina Panthers', away: 'Chicago Bears', date: '2025-10-05T13:00:00' },
  { week: 5, home: 'Jacksonville Jaguars', away: 'Indianapolis Colts', date: '2025-10-05T13:00:00' },

  // Week 6
  { week: 6, home: 'Seattle Seahawks', away: 'San Francisco 49ers', date: '2025-10-09T20:15:00' },
  { week: 6, home: 'Baltimore Ravens', away: 'Washington Commanders', date: '2025-10-12T13:00:00' },
  { week: 6, home: 'Cleveland Browns', away: 'Philadelphia Eagles', date: '2025-10-12T13:00:00' },
  { week: 6, home: 'Houston Texans', away: 'New England Patriots', date: '2025-10-12T13:00:00' },

  // Week 7
  { week: 7, home: 'New Orleans Saints', away: 'Denver Broncos', date: '2025-10-16T20:15:00' },
  { week: 7, home: 'Arizona Cardinals', away: 'Los Angeles Chargers', date: '2025-10-19T13:00:00' },
  { week: 7, home: 'Detroit Lions', away: 'Minnesota Vikings', date: '2025-10-19T13:00:00' },
  { week: 7, home: 'Green Bay Packers', away: 'Houston Texans', date: '2025-10-19T13:00:00' },

  // Week 8
  { week: 8, home: 'Los Angeles Rams', away: 'Minnesota Vikings', date: '2025-10-23T20:15:00' },
  { week: 8, home: 'Atlanta Falcons', away: 'Tampa Bay Buccaneers', date: '2025-10-26T13:00:00' },
  { week: 8, home: 'Baltimore Ravens', away: 'Cleveland Browns', date: '2025-10-26T13:00:00' },
  { week: 8, home: 'Indianapolis Colts', away: 'Houston Texans', date: '2025-10-26T13:00:00' },

  // Week 9
  { week: 9, home: 'New York Jets', away: 'Houston Texans', date: '2025-10-30T20:15:00' },
  { week: 9, home: 'Chicago Bears', away: 'Arizona Cardinals', date: '2025-11-02T13:00:00' },
  { week: 9, home: 'New Orleans Saints', away: 'Carolina Panthers', date: '2025-11-02T13:00:00' },
  { week: 9, home: 'Miami Dolphins', away: 'Buffalo Bills', date: '2025-11-02T13:00:00' },

  // Week 11
  { week: 11, home: 'Pittsburgh Steelers', away: 'Baltimore Ravens', date: '2025-11-13T20:15:00' },
  { week: 11, home: 'Cleveland Browns', away: 'New Orleans Saints', date: '2025-11-16T13:00:00' },
  { week: 11, home: 'Jacksonville Jaguars', away: 'Detroit Lions', date: '2025-11-16T13:00:00' },
  { week: 11, home: 'Las Vegas Raiders', away: 'Miami Dolphins', date: '2025-11-16T16:05:00' },

  // Week 12
  { week: 12, home: 'Chicago Bears', away: 'Minnesota Vikings', date: '2025-11-20T20:15:00' },
  { week: 12, home: 'Detroit Lions', away: 'Indianapolis Colts', date: '2025-11-23T13:00:00' },
  { week: 12, home: 'Dallas Cowboys', away: 'New York Giants', date: '2025-11-23T16:30:00' },
  { week: 12, home: 'Green Bay Packers', away: 'Miami Dolphins', date: '2025-11-23T20:20:00' },
];

async function importSeasonSchedule() {
  await connectPostgres();
  const pool = getPostgresPool();

  logger.info('Starting 2025 season schedule import...');

  let imported = 0;
  let skipped = 0;

  for (const game of SEASON_2025_SCHEDULE) {
    try {
      // Check if game already exists
      const existing = await pool.query(
        'SELECT id FROM games WHERE season = $1 AND week = $2 AND home_team = $3 AND away_team = $4',
        [2025, game.week, game.home, game.away]
      );

      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }

      // Insert game
      await pool.query(
        `INSERT INTO games (
          season, week, game_date, home_team, away_team, status
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [2025, game.week, game.date, game.home, game.away, 'scheduled']
      );

      imported++;
      logger.info(`✅ Imported Week ${game.week}: ${game.home} vs ${game.away}`);
    } catch (error) {
      logger.error(`❌ Error importing game: ${error.message}`);
    }
  }

  logger.info(`\n✅ Import complete!`);
  logger.info(`   - Imported: ${imported} games`);
  logger.info(`   - Skipped: ${skipped} games (already exist)`);

  await pool.end();
}

importSeasonSchedule().catch(error => {
  logger.error('Failed to import schedule:', error);
  process.exit(1);
});
