// Trigger model training via backend API
// The backend can access the private ML service

const axios = require('axios');

const BACKEND_URL = 'https://nfl-predictor-backend-production.up.railway.app';

async function triggerTraining() {
  console.log('🎯 Triggering model training via backend...\n');

  try {
    // First, let's try calling the backend health check
    console.log('Checking backend connection...');
    const healthCheck = await axios.get(`${BACKEND_URL}/health`, { timeout: 10000 });
    console.log('✅ Backend is healthy:', healthCheck.data);

    console.log('\nAttempting to trigger ML service training...');
    console.log('This may take 5-10 minutes...\n');

    // Call backend endpoint that will forward to ML service
    const response = await axios.post(
      `${BACKEND_URL}/api/admin/train-models`,
      {},
      {
        timeout: 600000, // 10 minutes
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ Training complete!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }

    console.log('\n⚠️  The backend might not have an admin training endpoint.');
    console.log('Alternative: Use Railway dashboard to create a one-time job.');
    console.log('See TRAIN_MODELS_ON_RAILWAY.md for instructions.');
  }
}

triggerTraining();
