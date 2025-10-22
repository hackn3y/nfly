// Check what status ESPN returns
const axios = require('axios');

async function checkStatus() {
  try {
    const url = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2025&seasontype=2&week=1';

    console.log('Fetching Week 1 to check status values...\n');
    const response = await axios.get(url, { timeout: 10000 });

    const events = response.data.events || [];

    console.log('Status values from ESPN:\n');
    events.slice(0, 3).forEach((event, idx) => {
      const competition = event.competitions[0];
      const status = competition.status;

      console.log(`Game ${idx + 1}:`);
      console.log(`  Status name: "${status.type.name}"`);
      console.log(`  Status name (lowercase): "${status.type.name.toLowerCase()}"`);
      console.log(`  Status state: "${status.type.state}"`);
      console.log(`  Status completed: ${status.type.completed}\n`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkStatus();
