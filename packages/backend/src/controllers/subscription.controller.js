const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getPostgresPool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    features: ['Basic predictions', 'Weekly game analysis', 'Community access']
  },
  premium: {
    name: 'Premium',
    price: 9.99,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    features: [
      'All Free features',
      'Advanced ML predictions',
      'Gematria analysis',
      'Historical data',
      'Injury reports',
      'Weather integration',
      'Ad-free experience'
    ]
  },
  pro: {
    name: 'Pro',
    price: 29.99,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      'All Premium features',
      'Parlay optimizer',
      'Custom alerts',
      'API access',
      'Priority support',
      'Advanced gematria patterns',
      'Betting strategies'
    ]
  }
};

// Get subscription tiers
exports.getTiers = (req, res) => {
  res.json({
    success: true,
    data: SUBSCRIPTION_TIERS
  });
};

// Create checkout session
exports.createCheckout = async (req, res, next) => {
  try {
    const { tier } = req.body;

    if (!['premium', 'pro'].includes(tier)) {
      return next(new AppError('Invalid subscription tier', 400));
    }

    const tierInfo = SUBSCRIPTION_TIERS[tier];

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: req.user.email,
      line_items: [
        {
          price: tierInfo.priceId,
          quantity: 1
        }
      ],
      success_url: `${process.env.APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/subscription/cancel`,
      metadata: {
        userId: req.user.id,
        tier: tier
      }
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    });
  } catch (error) {
    logger.error('Error creating checkout session:', error);
    next(error);
  }
};

// Handle Stripe webhooks
exports.handleWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const pool = getPostgresPool();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { userId, tier } = session.metadata;

        // Update user subscription
        await pool.query(
          `UPDATE users
           SET subscription_tier = $1,
               stripe_customer_id = $2,
               subscription_status = 'active',
               updated_at = NOW()
           WHERE id = $3`,
          [tier, session.customer, userId]
        );

        logger.info(`User ${userId} subscribed to ${tier}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await pool.query(
          `UPDATE users
           SET subscription_tier = 'free',
               subscription_status = 'canceled',
               updated_at = NOW()
           WHERE stripe_customer_id = $1`,
          [subscription.customer]
        );
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await pool.query(
          `UPDATE users
           SET subscription_status = 'past_due',
               updated_at = NOW()
           WHERE stripe_customer_id = $1`,
          [invoice.customer]
        );
        break;
      }

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    next(error);
  }
};

// Get current subscription
exports.getCurrentSubscription = async (req, res, next) => {
  try {
    const pool = getPostgresPool();
    const result = await pool.query(
      `SELECT subscription_tier, subscription_status, stripe_customer_id
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    const user = result.rows[0];
    const tierInfo = SUBSCRIPTION_TIERS[user.subscription_tier];

    res.json({
      success: true,
      data: {
        tier: user.subscription_tier,
        status: user.subscription_status,
        ...tierInfo
      }
    });
  } catch (error) {
    next(error);
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res, next) => {
  try {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [req.user.id]
    );

    const { stripe_customer_id } = result.rows[0];

    if (!stripe_customer_id) {
      return next(new AppError('No active subscription found', 404));
    }

    // Get Stripe subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: stripe_customer_id,
      status: 'active'
    });

    if (subscriptions.data.length === 0) {
      return next(new AppError('No active subscription found', 404));
    }

    // Cancel at period end
    await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true
    });

    await pool.query(
      `UPDATE users
       SET subscription_status = 'canceling',
           updated_at = NOW()
       WHERE id = $1`,
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Subscription will be canceled at the end of billing period'
    });
  } catch (error) {
    logger.error('Error canceling subscription:', error);
    next(error);
  }
};

// Resume subscription
exports.resumeSubscription = async (req, res, next) => {
  try {
    const pool = getPostgresPool();
    const result = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [req.user.id]
    );

    const { stripe_customer_id } = result.rows[0];

    if (!stripe_customer_id) {
      return next(new AppError('No subscription found', 404));
    }

    // Get Stripe subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: stripe_customer_id,
      status: 'active'
    });

    if (subscriptions.data.length === 0) {
      return next(new AppError('No active subscription found', 404));
    }

    // Resume subscription
    await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: false
    });

    await pool.query(
      `UPDATE users
       SET subscription_status = 'active',
           updated_at = NOW()
       WHERE id = $1`,
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Subscription resumed successfully'
    });
  } catch (error) {
    logger.error('Error resuming subscription:', error);
    next(error);
  }
};
