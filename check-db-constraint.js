// Check what status values the database allows
const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres:nwXMRSbjeeTxsEjtQuAxihKGDXtlPtZA@nozomi.proxy.rlwy.net:51326/railway';
const pool = new Pool({ connectionString: DATABASE_URL });

async function checkConstraint() {
  try {
    // Get constraint definition
    const constraintQuery = `
      SELECT
        conname as constraint_name,
        pg_get_constraintdef(c.oid) as constraint_def
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      JOIN pg_class cl ON cl.oid = c.conrelid
      WHERE conname = 'games_status_check'
      AND cl.relname = 'games'
    `;

    const result = await pool.query(constraintQuery);

    if (result.rows.length > 0) {
      console.log('Constraint definition:');
      console.log(result.rows[0].constraint_def);
    } else {
      console.log('No constraint found');
    }

    // Also check what existing status values are in the database
    console.log('\nExisting status values in database:');
    const statusQuery = await pool.query(`
      SELECT DISTINCT status, COUNT(*) as count
      FROM games
      GROUP BY status
      ORDER BY status
    `);

    statusQuery.rows.forEach(row => {
      console.log(`  "${row.status}": ${row.count} games`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkConstraint();
