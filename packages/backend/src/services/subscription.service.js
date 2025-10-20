/**
 * Subscription Service
 * Handle Stripe subscription creation, updates, and cancellations
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getPostgresPool } = require('../config/database');
const logger = require('../utils/logger');

class SubscriptionService {
  /**
   * Create Stripe customer for user
   */
  async createCustomer(userId, email, name) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId: userId.toString()
        }
      });

      // Save customer ID to database
      const pool = getPostgresPool();
      await pool.query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [customer.id, userId]
      );

      logger.info(`Created Stripe customer ${customer.id} for user ${userId}`);
      return customer;
    } catch (error) {
      logger.error(`Error creating Stripe customer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(userId, priceId, successUrl, cancelUrl) {
    const pool = getPostgresPool();

    try {
      // Get or create customer
      const userResult = await pool.query(
        'SELECT stripe_customer_id, email FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      let customerId = userResult.rows[0].stripe_customer_id;
      const email = userResult.rows[0].email;

      if (!customerId) {
        const customer = await this.createCustomer(userId, email);
        customerId = customer.id;
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: userId.toString()
        }
      });

      logger.info(`Created checkout session ${session.id} for user ${userId}`);
      return session;
    } catch (error) {
      logger.error(`Error creating checkout session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create customer portal session
   */
  async createPortalSession(userId, returnUrl) {
    const pool = getPostgresPool();

    try {
      const result = await pool.query(
        'SELECT stripe_customer_id FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0 || !result.rows[0].stripe_customer_id) {
        throw new Error('No Stripe customer found for user');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: result.rows[0].stripe_customer_id,
        return_url: returnUrl,
      });

      return session;
    } catch (error) {
      logger.error(`Error creating portal session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId) {
    const pool = getPostgresPool();

    try {
      const result = await pool.query(
        'SELECT stripe_subscription_id FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0 || !result.rows[0].stripe_subscription_id) {
        throw new Error('No active subscription found');
      }

      const subscriptionId = result.rows[0].stripe_subscription_id;

      // Cancel at period end (not immediately)
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });

      logger.info(`Scheduled cancellation for subscription ${subscriptionId}`);
      return subscription;
    } catch (error) {
      logger.error(`Error cancelling subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(userId) {
    const pool = getPostgresPool();

    try {
      const result = await pool.query(
        'SELECT stripe_subscription_id FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0 || !result.rows[0].stripe_subscription_id) {
        throw new Error('No subscription found');
      }

      const subscriptionId = result.rows[0].stripe_subscription_id;

      // Remove cancellation
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false
      });

      logger.info(`Reactivated subscription ${subscriptionId}`);
      return subscription;
    } catch (error) {
      logger.error(`Error reactivating subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Change subscription plan
   */
  async changeSubscriptionPlan(userId, newPriceId) {
    const pool = getPostgresPool();

    try {
      const result = await pool.query(
        'SELECT stripe_subscription_id FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0 || !result.rows[0].stripe_subscription_id) {
        throw new Error('No active subscription found');
      }

      const subscriptionId = result.rows[0].stripe_subscription_id;

      // Get current subscription
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      // Update subscription with new price
      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'always_invoice', // Prorate charges
      });

      logger.info(`Changed subscription ${subscriptionId} to price ${newPriceId}`);
      return updatedSubscription;
    } catch (error) {
      logger.error(`Error changing subscription plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get subscription details
   */
  async getSubscriptionDetails(userId) {
    const pool = getPostgresPool();

    try {
      const result = await pool.query(
        `SELECT
          subscription_tier,
          subscription_status,
          subscription_start_date,
          subscription_end_date,
          stripe_subscription_id
        FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];

      // If has Stripe subscription, get latest details
      if (user.stripe_subscription_id && process.env.STRIPE_SECRET_KEY) {
        try {
          const subscription = await stripe.subscriptions.retrieve(
            user.stripe_subscription_id
          );

          return {
            tier: user.subscription_tier || 'free',
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            priceId: subscription.items.data[0].price.id
          };
        } catch (stripeError) {
          logger.warn(`Stripe API error for user ${userId}: ${stripeError.message}`);
          // Fall through to return local data
        }
      }

      // Return free tier as default
      return {
        tier: user.subscription_tier || 'free',
        status: user.subscription_status || 'active',
        currentPeriodStart: user.subscription_start_date || new Date(),
        currentPeriodEnd: user.subscription_end_date || null,
        cancelAtPeriodEnd: false,
        priceId: null
      };
    } catch (error) {
      logger.error(`Error getting subscription details: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(userId, limit = 10) {
    const pool = getPostgresPool();

    try {
      const result = await pool.query(
        `SELECT
          stripe_invoice_id,
          amount,
          currency,
          status,
          created_at
        FROM payments
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2`,
        [userId, limit]
      );

      return result.rows;
    } catch (error) {
      logger.error(`Error getting payment history: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new SubscriptionService();
