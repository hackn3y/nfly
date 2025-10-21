/**
 * Database Seeding Entry Point
 */

require('dotenv').config();
const { connectPostgres } = require('../config/database');
const seedSampleData = require('../scripts/seed-sample-data');

// Run the seed
connectPostgres()
  .then(() => seedSampleData())
  .then(() => {
    console.log('✅ Seeding complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
