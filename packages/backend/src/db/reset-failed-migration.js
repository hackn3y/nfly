const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function resetFailedMigration() {
  const client = await pool.connect();

  try {
    console.log('🔄 Resetting any failed migrations...');

    // Remove failed migration records so they can run again
    await client.query(`
      DELETE FROM migrations
      WHERE name IN ('003_add_stripe_fields.sql', '004_add_accuracy_tracking.sql')
    `);

    console.log('✅ Migration record removed - it will run again on next deployment');

  } catch (error) {
    console.error('❌ Failed to reset migration:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

resetFailedMigration()
  .then(() => {
    console.log('✅ Reset complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  });
