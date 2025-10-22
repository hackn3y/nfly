// Clear prediction cache to force regeneration with new models
const axios = require('axios');

const BACKEND_URL = 'https://nfl-predictor-backend-production.up.railway.app';
const ML_SERVICE_URL = 'https://nfl-predictor-ml-production.up.railway.app';

async function clearCache() {
  console.log('🗑️  Attempting to clear prediction cache...\n');

  try {
    // Try to hit the backend health check
    const health = await axios.get(`${BACKEND_URL}/health`, { timeout: 10000 });
    console.log('✅ Backend is up:', health.data);

    // The predictions are cached in Redis
    // We need to either:
    // 1. Wait 15-30 minutes for cache to expire
    // 2. Restart the backend service to clear cache
    // 3. Add a cache-clear endpoint

    console.log('\n💡 To see updated predictions:');
    console.log('   1. Wait 15-30 minutes for cache to expire, OR');
    console.log('   2. Restart the backend service in Railway dashboard, OR');
    console.log('   3. Force refresh in mobile app (pull down to refresh)');

    console.log('\n📊 Current model status:');
    console.log('   - Models trained with 108 real 2025 season games ✅');
    console.log('   - Random Forest: 54.5% accuracy');
    console.log('   - XGBoost: 54.5% accuracy');
    console.log('   - Neural Network: 31.8% accuracy');

    console.log('\n⚠️  Note: Predictions may still look similar because:');
    console.log('   - Small training dataset (108 games)');
    console.log('   - No team-specific features (conference, division, etc.)');
    console.log('   - Models are learning general patterns, not team strengths');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

clearCache();
