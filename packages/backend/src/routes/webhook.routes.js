/**
 * Webhook Routes
 * Stripe webhook endpoint (must use raw body)
 */

const express = require('express');
const { handleStripeWebhook } = require('../webhooks/stripe.webhooks');

const router = express.Router();

// Stripe webhook endpoint
// IMPORTANT: This route needs raw body, not JSON parsed
// Configure in server.js before bodyParser.json()
router.post('/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

module.exports = router;
