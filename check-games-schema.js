// Check the actual games table schema
const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres:nwXMRSbjeeTxsEjtQuAxihKGDXtlPtZA@nozomi.proxy.rlwy.net:51326/railway';
const pool = new Pool({ connectionString: DATABASE_URL });

async function checkSchema() {
  try {
    // Get table structure
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'games'
      ORDER BY ordinal_position
    `);

    console.log('\n📊 Games table schema:\n');
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name.padEnd(20)} ${col.data_type.padEnd(30)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Check sample data
    const sample = await pool.query(`
      SELECT * FROM games WHERE status = 'final' LIMIT 1
    `);

    console.log('\n📝 Sample completed game:\n');
    if (sample.rows.length > 0) {
      console.log(JSON.stringify(sample.rows[0], null, 2));
    } else {
      console.log('  No completed games found');
    }

    // Count games by status
    const counts = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM games
      GROUP BY status
    `);

    console.log('\n📈 Games by status:\n');
    counts.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
