// Clear old predictions so they regenerate with team stats
const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://postgres:nwXMRSbjeeTxsEjtQuAxihKGDXtlPtZA@nozomi.proxy.rlwy.net:51326/railway';
const pool = new Pool({ connectionString: DATABASE_URL });

async function clearPredictions() {
  console.log('🗑️  Clearing old predictions...\n');

  try {
    const result = await pool.query('DELETE FROM predictions');
    console.log(`✅ Deleted ${result.rowCount} old predictions\n`);

    console.log('📝 Summary:');
    console.log('  - Old predictions cleared');
    console.log('  - Games now have team IDs');
    console.log('  - ML service will fetch team stats');
    console.log('  - Predictions will vary by matchup!\n');

    console.log('🔄 Next steps:');
    console.log('  1. Restart ML service in Railway dashboard');
    console.log('  2. Open mobile app and navigate to any week');
    console.log('  3. Predictions will be generated on-demand with real team stats\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

clearPredictions();
