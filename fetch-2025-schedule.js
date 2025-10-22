// Try to fetch actual 2025 NFL schedule from ESPN
const axios = require('axios');
const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres:nwXMRSbjeeTxsEjtQuAxihKGDXtlPtZA@nozomi.proxy.rlwy.net:51326/railway';
const pool = new Pool({ connectionString: DATABASE_URL });

async function fetch2025Schedule() {
  console.log('🏈 Attempting to fetch 2025 NFL Schedule...\n');

  // Try different ESPN API endpoints for 2025 season
  const endpoints = [
    'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2025&seasontype=2',
    'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?league=nfl&year=2025&seasontype=2',
    'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025',
  ];

  for (const url of endpoints) {
    try {
      console.log(`Trying: ${url.substring(0, 80)}...`);
      const response = await axios.get(url, { timeout: 10000 });

      if (response.data.events && response.data.events.length > 0) {
        console.log(`✅ Found ${response.data.events.length} events!\n`);
        console.log('Sample event:', JSON.stringify(response.data.events[0], null, 2).substring(0, 500));
        return;
      } else if (response.data.leagues) {
        console.log('✅ Found leagues data');
        console.log(JSON.stringify(response.data, null, 2).substring(0, 500));
        return;
      } else {
        console.log('❌ No events found in response\n');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  }

  console.log('\n❌ Could not find 2025 NFL schedule from ESPN API.');
  console.log('\nThe 2025 NFL schedule may not be published yet.');
  console.log('\nOptions:');
  console.log('1. Wait until NFL releases the 2025 schedule (usually April/May 2025)');
  console.log('2. Use the 2024 season data as placeholder');
  console.log('3. Manually enter games if you have the schedule from another source');

  await pool.end();
}

fetch2025Schedule();
