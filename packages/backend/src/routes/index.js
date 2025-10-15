const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const predictionRoutes = require('./prediction.routes');
const gematriaRoutes = require('./gematria.routes');
const userRoutes = require('./user.routes');
const subscriptionRoutes = require('./subscription.routes');

// API documentation
router.get('/', (req, res) => {
  res.json({
    message: 'NFL Predictor API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      predictions: '/api/predictions',
      gematria: '/api/gematria',
      users: '/api/users',
      subscriptions: '/api/subscriptions'
    },
    documentation: '/api/docs'
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/predictions', predictionRoutes);
router.use('/gematria', gematriaRoutes);
router.use('/users', userRoutes);
router.use('/subscriptions', subscriptionRoutes);

module.exports = router;
