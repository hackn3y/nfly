// This script triggers the setup on Railway by calling the backend API
const axios = require('axios');

const BACKEND_URL = 'https://nfl-predictorbackend-production.up.railway.app';
const ML_SERVICE_URL = 'https://nfl-predictor-ml-production.up.railway.app';

const SEASON_SCHEDULE = [
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

async function setup() {
  console.log('🏈 Setting up weeks via Railway backend API...\n');
  console.log('This will take 2-3 minutes. Please wait...\n');

  let success = 0;
  let errors = 0;

  for (const game of SEASON_SCHEDULE) {
    try {
      console.log(`Week ${game.week}: ${game.home} vs ${game.away}...`);

      // Call ML service directly to generate prediction
      // This will create the game if it doesn't exist
      const response = await axios.post(`${ML_SERVICE_URL}/api/predictions/generate`, {
        season: 2025,
        week: game.week,
        home_team: game.home,
        away_team: game.away,
        game_date: game.date
      }, {
        timeout: 30000
      });

      success++;
      console.log(`✅ Done`);
    } catch (error) {
      errors++;
      const msg = error.response?.data?.detail || error.message;
      console.error(`❌ ${msg}`);
    }
  }

  console.log(`\n📊 Complete: ${success} success, ${errors} errors\n`);

  if (success > 0) {
    console.log('🎉 Setup complete! Refresh your browser and navigate through the weeks.\n');
  }
}

setup().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
