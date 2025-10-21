require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('🔄 Starting database migrations...');

    // First, run init.sql if tables don't exist
    const initPath = path.join(__dirname, '../../db/init.sql');
    if (fs.existsSync(initPath)) {
      console.log('🔄 Checking if base schema exists...');

      const { rows } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'users'
        );
      `);

      if (!rows[0].exists) {
        console.log('🔄 Running initial schema setup (init.sql)...');
        const initSQL = fs.readFileSync(initPath, 'utf8');
        await client.query(initSQL);
        console.log('✅ Initial schema created successfully');
      } else {
        console.log('✅ Base schema already exists, skipping init.sql');
      }
    }

    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of already executed migrations
    const { rows: executed } = await client.query('SELECT name FROM migrations');
    const executedMigrations = executed.map(row => row.name);

    // Get migration files
    const migrationsDir = path.join(__dirname, '../../db/migrations');

    if (!fs.existsSync(migrationsDir)) {
      console.log('⚠️  No migrations directory found at:', migrationsDir);
      console.log('✅ Skipping migrations');
      return;
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('ℹ️  No migration files found');
      console.log('✅ Migrations complete');
      return;
    }

    let migrationsRun = 0;

    // Run pending migrations
    for (const file of migrationFiles) {
      if (executedMigrations.includes(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`🔄 Running migration: ${file}`);

      const migrationSQL = fs.readFileSync(
        path.join(migrationsDir, file),
        'utf8'
      );

      await client.query('BEGIN');

      try {
        await client.query(migrationSQL);
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`✅ Completed: ${file}`);
        migrationsRun++;
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Failed: ${file}`);
        console.error(error.message);
        throw error;
      }
    }

    if (migrationsRun === 0) {
      console.log('ℹ️  All migrations already executed');
    } else {
      console.log(`✅ Successfully ran ${migrationsRun} migration(s)`);
    }

    console.log('✅ Database migrations complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations
runMigrations()
  .then(() => {
    console.log('✅ Migration process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration process failed:', error);
    process.exit(1);
  });
