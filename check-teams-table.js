// Check if teams table exists
const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres:nwXMRSbjeeTxsEjtQuAxihKGDXtlPtZA@nozomi.proxy.rlwy.net:51326/railway';
const pool = new Pool({ connectionString: DATABASE_URL });

async function checkTeams() {
  try {
    // Check if teams table exists
    const tableCheck = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'teams'
    `);

    if (tableCheck.rows.length === 0) {
      console.log('❌ No teams table found\n');
      console.log('Creating teams from games data...\n');

      // Get unique team names from games
      const teams = await pool.query(`
        SELECT DISTINCT team_name
        FROM (
          SELECT home_team as team_name FROM games
          UNION
          SELECT away_team as team_name FROM games
        ) t
        ORDER BY team_name
      `);

      console.log(`Found ${teams.rows.length} unique teams:\n`);
      teams.rows.forEach((row, idx) => {
        console.log(`  ${idx + 1}. ${row.team_name}`);
      });

      return;
    }

    console.log('✅ Teams table exists\n');

    // Check teams
    const teams = await pool.query('SELECT id, name, abbreviation FROM teams ORDER BY name');

    console.log(`Found ${teams.rows.length} teams:\n`);
    teams.rows.slice(0, 10).forEach(team => {
      console.log(`  ${team.id}: ${team.name} (${team.abbreviation || 'N/A'})`);
    });

    if (teams.rows.length > 10) {
      console.log(`  ... and ${teams.rows.length - 10} more`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTeams();
