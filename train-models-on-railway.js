// Train ML models on Railway
const axios = require('axios');

const ML_SERVICE_URL = 'https://nfl-predictor-ml-production.up.railway.app';

async function trainModels() {
  console.log('🎯 Training ML models on Railway...\n');
  console.log('This will take several minutes to complete.\n');

  try {
    console.log('Calling ML service training endpoint...');

    const response = await axios.post(
      `${ML_SERVICE_URL}/api/models/train`,
      {},
      {
        timeout: 600000, // 10 minutes timeout
        onUploadProgress: () => {
          process.stdout.write('.');
        }
      }
    );

    console.log('\n\n✅ Training complete!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('\n❌ Error training models:', error.message);

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

trainModels();
