const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/subscriptions/tiers
 * @desc    Get available subscription tiers
 * @access  Public
 */
router.get('/tiers', subscriptionController.getTiers);

/**
 * @route   POST /api/subscriptions/checkout
 * @desc    Create checkout session
 * @access  Private
 */
router.post('/checkout', protect, subscriptionController.createCheckout);

/**
 * @route   POST /api/subscriptions/webhook
 * @desc    Stripe webhook handler
 * @access  Public
 */
router.post('/webhook', express.raw({ type: 'application/json' }), subscriptionController.handleWebhook);

/**
 * @route   GET /api/subscriptions/current
 * @desc    Get current subscription
 * @access  Private
 */
router.get('/current', protect, subscriptionController.getCurrentSubscription);

/**
 * @route   POST /api/subscriptions/cancel
 * @desc    Cancel subscription
 * @access  Private
 */
router.post('/cancel', protect, subscriptionController.cancelSubscription);

/**
 * @route   POST /api/subscriptions/resume
 * @desc    Resume canceled subscription
 * @access  Private
 */
router.post('/resume', protect, subscriptionController.resumeSubscription);

module.exports = router;
