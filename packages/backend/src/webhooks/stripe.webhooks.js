/**
 * Stripe Webhook Handlers
 * Process subscription lifecycle events
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getPostgresPool } = require('../config/database');
const logger = require('../utils/logger');
const emailService = require('../services/email.service');

// Webhook signature verification
const verifyWebhookSignature = (req) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    return stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    throw new Error(`Webhook Error: ${err.message}`);
  }
};

// Update user subscription in database
const updateUserSubscription = async (customerId, subscriptionData) => {
  const pool = getPostgresPool();

  try {
    // Find user by Stripe customer ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE stripe_customer_id = $1',
      [customerId]
    );

    if (userResult.rows.length === 0) {
      logger.error(`User not found for customer ID: ${customerId}`);
      return;
    }

    const userId = userResult.rows[0].id;

    // Determine subscription tier from price ID
    const priceId = subscriptionData.items.data[0].price.id;
    let tier = 'free';

    if (priceId === process.env.STRIPE_PRICE_STARTER) {
      tier = 'starter';
    } else if (priceId === process.env.STRIPE_PRICE_PREMIUM) {
      tier = 'premium';
    } else if (priceId === process.env.STRIPE_PRICE_PRO) {
      tier = 'pro';
    }

    // Update user subscription
    await pool.query(
      `UPDATE users
       SET subscription_tier = $1,
           stripe_subscription_id = $2,
           subscription_status = $3,
           subscription_start_date = $4,
           subscription_end_date = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [
        tier,
        subscriptionData.id,
        subscriptionData.status,
        new Date(subscriptionData.current_period_start * 1000),
        new Date(subscriptionData.current_period_end * 1000),
        userId
      ]
    );

    logger.info(`Updated subscription for user ${userId} to ${tier}`);
  } catch (error) {
    logger.error(`Error updating subscription: ${error.message}`);
    throw error;
  }
};

// Handle subscription created
const handleSubscriptionCreated = async (subscription) => {
  logger.info(`Subscription created: ${subscription.id}`);
  await updateUserSubscription(subscription.customer, subscription);

  // Send subscription confirmation email
  const pool = getPostgresPool();
  const result = await pool.query(
    'SELECT email, subscription_tier FROM users WHERE stripe_customer_id = $1',
    [subscription.customer]
  );

  if (result.rows.length > 0) {
    const { email, subscription_tier } = result.rows[0];
    const amount = subscription.items.data[0].price.unit_amount;

    emailService.sendSubscriptionConfirmation(email, subscription_tier, amount)
      .catch(err => logger.error(`Failed to send subscription email: ${err.message}`));
  }
};

// Handle subscription updated
const handleSubscriptionUpdated = async (subscription) => {
  logger.info(`Subscription updated: ${subscription.id}`);
  await updateUserSubscription(subscription.customer, subscription);

  // Check if subscription was upgraded/downgraded
  const pool = getPostgresPool();
  const result = await pool.query(
    'SELECT email, subscription_tier FROM users WHERE stripe_subscription_id = $1',
    [subscription.id]
  );

  if (result.rows.length > 0) {
    const { email, subscription_tier } = result.rows[0];
    logger.info(`User ${email} subscription changed to ${subscription_tier}`);

    // Send subscription update notification
    const amount = subscription.items.data[0].price.unit_amount;
    emailService.sendSubscriptionConfirmation(email, subscription_tier, amount)
      .catch(err => logger.error(`Failed to send subscription update email: ${err.message}`));
  }
};

// Handle subscription deleted (cancelled)
const handleSubscriptionDeleted = async (subscription) => {
  logger.info(`Subscription deleted: ${subscription.id}`);

  const pool = getPostgresPool();

  try {
    // Downgrade to free tier
    await pool.query(
      `UPDATE users
       SET subscription_tier = 'free',
           subscription_status = 'cancelled',
           stripe_subscription_id = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE stripe_subscription_id = $1`,
      [subscription.id]
    );

    // Get user for notification
    const result = await pool.query(
      'SELECT email FROM users WHERE stripe_customer_id = $1',
      [subscription.customer]
    );

    if (result.rows.length > 0) {
      const email = result.rows[0].email;
      logger.info(`User ${email} downgraded to free tier`);

      // Send cancellation confirmation email
      const endDate = subscription.current_period_end * 1000; // Convert to milliseconds
      const priceId = subscription.items.data[0].price.id;
      let tier = 'free';
      if (priceId === process.env.STRIPE_PRICE_STARTER) tier = 'starter';
      else if (priceId === process.env.STRIPE_PRICE_PREMIUM) tier = 'premium';
      else if (priceId === process.env.STRIPE_PRICE_PRO) tier = 'pro';

      emailService.sendSubscriptionCancelled(email, tier, endDate)
        .catch(err => logger.error(`Failed to send cancellation email: ${err.message}`));
    }
  } catch (error) {
    logger.error(`Error handling subscription deletion: ${error.message}`);
    throw error;
  }
};

// Handle successful payment
const handlePaymentSucceeded = async (invoice) => {
  logger.info(`Payment succeeded: ${invoice.id}`);

  const pool = getPostgresPool();

  try {
    // Record payment in database
    await pool.query(
      `INSERT INTO payments (
        user_id,
        stripe_invoice_id,
        stripe_payment_intent_id,
        amount,
        currency,
        status,
        created_at
      ) SELECT
        id,
        $1,
        $2,
        $3,
        $4,
        'succeeded',
        CURRENT_TIMESTAMP
      FROM users WHERE stripe_customer_id = $5`,
      [
        invoice.id,
        invoice.payment_intent,
        invoice.amount_paid,
        invoice.currency,
        invoice.customer
      ]
    );

    logger.info(`Recorded payment for customer ${invoice.customer}`);

    // Send payment receipt (optional - Stripe already sends receipts)
    // Uncomment if you want custom receipt emails
    /*
    const userResult = await pool.query(
      'SELECT email FROM users WHERE stripe_customer_id = $1',
      [invoice.customer]
    );
    if (userResult.rows.length > 0) {
      const email = userResult.rows[0].email;
      // Custom receipt logic here if needed
    }
    */
  } catch (error) {
    logger.error(`Error recording payment: ${error.message}`);
  }
};

// Handle failed payment
const handlePaymentFailed = async (invoice) => {
  logger.error(`Payment failed: ${invoice.id}`);

  const pool = getPostgresPool();

  try {
    // Update subscription status
    await pool.query(
      `UPDATE users
       SET subscription_status = 'past_due',
           updated_at = CURRENT_TIMESTAMP
       WHERE stripe_customer_id = $1`,
      [invoice.customer]
    );

    // Get user for notification
    const result = await pool.query(
      'SELECT email FROM users WHERE stripe_customer_id = $1',
      [invoice.customer]
    );

    if (result.rows.length > 0) {
      const email = result.rows[0].email;
      logger.info(`Payment failed for user ${email}`);

      // Send payment failure email
      emailService.sendPaymentFailedEmail(email)
        .catch(err => logger.error(`Failed to send payment failed email: ${err.message}`));
    }
  } catch (error) {
    logger.error(`Error handling payment failure: ${error.message}`);
  }
};

// Main webhook handler
const handleStripeWebhook = async (req, res) => {
  let event;

  try {
    event = verifyWebhookSignature(req);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  logger.info(`Processing webhook event: ${event.type}`);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'checkout.session.completed':
        // Handle initial checkout completion
        const session = event.data.object;
        logger.info(`Checkout completed: ${session.id}`);
        // Subscription will be handled by subscription.created event
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error(`Error processing webhook: ${error.message}`);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

module.exports = {
  handleStripeWebhook
};
