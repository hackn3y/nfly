/**
 * Subscription Routes
 * Endpoints for managing subscriptions
 */

const express = require('express');
const { protect } = require('../middleware/auth');
const subscriptionService = require('../services/subscription.service');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * Get available subscription tiers
 * GET /api/subscriptions/tiers
 */
router.get('/tiers', (req, res) => {
  res.json({
    success: true,
    tiers: [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        features: [
          '3 predictions per day',
          'Basic gematria analysis',
          'Public prediction history'
        ]
      },
      {
        id: 'starter',
        name: 'Starter',
        price: 9.99,
        priceId: process.env.STRIPE_PRICE_STARTER,
        features: [
          '20 predictions per day',
          'Advanced ML predictions',
          'Gematria + ML ensemble',
          'Email alerts',
          'Historical trends'
        ]
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 19.99,
        priceId: process.env.STRIPE_PRICE_PREMIUM,
        features: [
          'Unlimited predictions',
          'Player prop bets',
          'Confidence scores',
          'API access',
          'Custom alerts',
          'Priority support'
        ]
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 49.99,
        priceId: process.env.STRIPE_PRICE_PRO,
        features: [
          'Everything in Premium',
          'Live game predictions',
          'Advanced statistics',
          'Betting bankroll tracker',
          'Discord community',
          'Early feature access'
        ]
      }
    ]
  });
});

// All routes below require authentication
router.use(protect);

/**
 * Create checkout session
 * POST /api/subscriptions/checkout
 * Body: { tier: 'starter' | 'premium' | 'pro' }
 */
router.post('/checkout', async (req, res, next) => {
  try {
    const { tier } = req.body;
    const userId = req.user.id;

    if (!tier || !['starter', 'premium', 'pro'].includes(tier)) {
      return next(new AppError('Invalid subscription tier', 400));
    }

    // Map tier to Stripe price ID
    const priceMap = {
      starter: process.env.STRIPE_PRICE_STARTER,
      premium: process.env.STRIPE_PRICE_PREMIUM,
      pro: process.env.STRIPE_PRICE_PRO
    };

    const priceId = priceMap[tier];

    if (!priceId) {
      return next(new AppError('Price ID not configured for this tier', 500));
    }

    // Create checkout session
    const session = await subscriptionService.createCheckoutSession(
      userId,
      priceId,
      `${process.env.FRONTEND_URL}/subscription/success`,
      `${process.env.FRONTEND_URL}/subscription/cancelled`
    );

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Create customer portal session
 * POST /api/subscriptions/portal
 */
router.post('/portal', async (req, res, next) => {
  try {
    const session = await subscriptionService.createPortalSession(
      req.user.id,
      `${process.env.FRONTEND_URL}/account`
    );

    res.json({
      success: true,
      url: session.url
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get current subscription details
 * GET /api/subscriptions/current
 */
router.get('/current', async (req, res, next) => {
  try {
    const details = await subscriptionService.getSubscriptionDetails(req.user.id);

    res.json({
      success: true,
      subscription: details
    });
  } catch (error) {
    // If error getting subscription details, return free tier as default
    console.error('Error getting subscription details:', error.message);
    res.json({
      success: true,
      subscription: {
        tier: 'free',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        priceId: null
      }
    });
  }
});

/**
 * Cancel subscription
 * POST /api/subscriptions/cancel
 */
router.post('/cancel', async (req, res, next) => {
  try {
    const subscription = await subscriptionService.cancelSubscription(req.user.id);

    res.json({
      success: true,
      message: 'Subscription will be cancelled at period end',
      cancelAt: new Date(subscription.current_period_end * 1000)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Reactivate subscription
 * POST /api/subscriptions/resume
 */
router.post('/resume', async (req, res, next) => {
  try {
    await subscriptionService.reactivateSubscription(req.user.id);

    res.json({
      success: true,
      message: 'Subscription reactivated'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Change subscription plan
 * POST /api/subscriptions/change
 * Body: { newTier: 'starter' | 'premium' | 'pro' }
 */
router.post('/change', async (req, res, next) => {
  try {
    const { newTier } = req.body;

    if (!newTier || !['starter', 'premium', 'pro'].includes(newTier)) {
      return next(new AppError('Invalid subscription tier', 400));
    }

    // Map tier to price ID
    const priceMap = {
      starter: process.env.STRIPE_PRICE_STARTER,
      premium: process.env.STRIPE_PRICE_PREMIUM,
      pro: process.env.STRIPE_PRICE_PRO
    };

    const newPriceId = priceMap[newTier];

    const subscription = await subscriptionService.changeSubscriptionPlan(
      req.user.id,
      newPriceId
    );

    res.json({
      success: true,
      message: 'Subscription plan changed',
      newTier
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get payment history
 * GET /api/subscriptions/payments
 */
router.get('/payments', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const payments = await subscriptionService.getPaymentHistory(req.user.id, limit);

    res.json({
      success: true,
      payments
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
