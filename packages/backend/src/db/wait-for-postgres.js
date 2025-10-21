require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

const maxRetries = 30; // 30 retries
const retryDelay = 2000; // 2 seconds

async function waitForPostgres(retries = 0) {
  try {
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL is ready!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    if (retries >= maxRetries) {
      console.error(`❌ Failed to connect to PostgreSQL after ${maxRetries} attempts`);
      console.error('Error:', error.message);
      process.exit(1);
    }

    console.log(`⏳ Waiting for PostgreSQL... (attempt ${retries + 1}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, retryDelay));
    return waitForPostgres(retries + 1);
  }
}

console.log('🔍 Checking PostgreSQL connection...');
waitForPostgres();
