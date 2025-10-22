// Populate home_team_id and away_team_id in games table
const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres:nwXMRSbjeeTxsEjtQuAxihKGDXtlPtZA@nozomi.proxy.rlwy.net:51326/railway';
const pool = new Pool({ connectionString: DATABASE_URL });

async function populateTeamIds() {
  console.log('🔗 Populating team IDs in games table...\n');

  try {
    // Update home_team_id by matching home_team name with teams.name
    console.log('Updating home_team_id...');
    const homeResult = await pool.query(`
      UPDATE games g
      SET home_team_id = t.id
      FROM teams t
      WHERE g.home_team = t.name
      AND g.home_team_id IS NULL
    `);
    console.log(`✅ Updated ${homeResult.rowCount} home_team_id values\n`);

    // Update away_team_id by matching away_team name with teams.name
    console.log('Updating away_team_id...');
    const awayResult = await pool.query(`
      UPDATE games g
      SET away_team_id = t.id
      FROM teams t
      WHERE g.away_team = t.name
      AND g.away_team_id IS NULL
    `);
    console.log(`✅ Updated ${awayResult.rowCount} away_team_id values\n`);

    // Verify
    const check = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(home_team_id) as with_home_id,
        COUNT(away_team_id) as with_away_id
      FROM games
      WHERE season = 2025
    `);

    console.log('📊 Verification:');
    console.log(`  Total games: ${check.rows[0].total}`);
    console.log(`  With home_team_id: ${check.rows[0].with_home_id}`);
    console.log(`  With away_team_id: ${check.rows[0].with_away_id}\n`);

    if (check.rows[0].with_home_id < check.rows[0].total) {
      console.log('⚠️  Some games still missing team IDs');
      console.log('Checking which teams are not matching...\n');

      const missing = await pool.query(`
        SELECT DISTINCT home_team
        FROM games
        WHERE season = 2025
        AND home_team_id IS NULL
        UNION
        SELECT DISTINCT away_team
        FROM games
        WHERE season = 2025
        AND away_team_id IS NULL
        ORDER BY 1
      `);

      if (missing.rows.length > 0) {
        console.log('Teams not found in teams table:');
        missing.rows.forEach(row => {
          console.log(`  - ${row.home_team}`);
        });
      }
    } else {
      console.log('✅ All games now have team IDs!');
      console.log('\n💡 Next step: Restart ML service to regenerate predictions with team stats');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

populateTeamIds();
