/**
 * Tests for subscription controller
 */

const { getPostgresPool } = require('../../../src/config/database');
const { AppError } = require('../../../src/middleware/errorHandler');

// Create mock functions that will be accessible in the test
let mockCheckoutCreate, mockWebhooksConstruct, mockSubscriptionsList, mockSubscriptionsUpdate;

jest.mock('stripe', () => {
  mockCheckoutCreate = jest.fn();
  mockWebhooksConstruct = jest.fn();
  mockSubscriptionsList = jest.fn();
  mockSubscriptionsUpdate = jest.fn();

  return jest.fn(() => ({
    checkout: {
      sessions: {
        create: mockCheckoutCreate
      }
    },
    webhooks: {
      constructEvent: mockWebhooksConstruct
    },
    subscriptions: {
      list: mockSubscriptionsList,
      update: mockSubscriptionsUpdate
    }
  }));
});

jest.mock('../../../src/config/database');
jest.mock('../../../src/utils/logger');

const stripe = require('stripe');
const subscriptionController = require('../../../src/controllers/subscription.controller');

describe('Subscription Controller', () => {
  let req, res, next;
  let mockPool;

  beforeAll(() => {
    // Set environment variables once before all tests
    process.env.STRIPE_PREMIUM_PRICE_ID = 'price_premium_123';
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro_123';
    process.env.APP_URL = 'https://example.com';
  });

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      headers: {},
      user: {
        id: 'user-123',
        email: 'test@example.com'
      }
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    next = jest.fn();

    mockPool = {
      query: jest.fn()
    };
    getPostgresPool.mockReturnValue(mockPool);

    jest.clearAllMocks();
  });

  describe('getTiers', () => {
    it('should return all subscription tiers', () => {
      subscriptionController.getTiers(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          free: expect.any(Object),
          premium: expect.any(Object),
          pro: expect.any(Object)
        })
      });
    });
  });

  describe('createCheckout', () => {
    it('should create checkout session for premium tier', async () => {
      req.body = { tier: 'premium' };

      const mockSession = {
        id: 'session_123',
        url: 'https://checkout.stripe.com/session_123'
      };

      mockCheckoutCreate.mockResolvedValue(mockSession);

      await subscriptionController.createCheckout(req, res, next);

      expect(mockCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          payment_method_types: ['card'],
          customer_email: 'test@example.com',
          metadata: {
            userId: 'user-123',
            tier: 'premium'
          }
        })
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          sessionId: 'session_123',
          url: 'https://checkout.stripe.com/session_123'
        }
      });
    });

    it('should create checkout session for pro tier', async () => {
      req.body = { tier: 'pro' };

      const mockSession = {
        id: 'session_456',
        url: 'https://checkout.stripe.com/session_456'
      };

      mockCheckoutCreate.mockResolvedValue(mockSession);

      await subscriptionController.createCheckout(req, res, next);

      expect(mockCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          metadata: expect.objectContaining({
            tier: 'pro'
          })
        })
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          sessionId: 'session_456',
          url: 'https://checkout.stripe.com/session_456'
        }
      });
    });

    it('should reject invalid tier', async () => {
      req.body = { tier: 'invalid' };

      await subscriptionController.createCheckout(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Invalid subscription tier');
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should handle Stripe errors', async () => {
      req.body = { tier: 'premium' };
      mockCheckoutCreate.mockRejectedValue(
        new Error('Stripe API error')
      );

      await subscriptionController.createCheckout(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('handleWebhook', () => {
    beforeEach(() => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
      req.headers['stripe-signature'] = 'sig_123';
      req.body = Buffer.from('webhook_payload');
    });

    it('should handle checkout.session.completed event', async () => {
      const event = {
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_123',
            metadata: {
              userId: 'user-123',
              tier: 'premium'
            }
          }
        }
      };

      mockWebhooksConstruct.mockReturnValue(event);
      mockPool.query.mockResolvedValue({ rows: [] });

      await subscriptionController.handleWebhook(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        ['premium', 'cus_123', 'user-123']
      );
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    it('should handle customer.subscription.deleted event', async () => {
      const event = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            customer: 'cus_123'
          }
        }
      };

      mockWebhooksConstruct.mockReturnValue(event);
      mockPool.query.mockResolvedValue({ rows: [] });

      await subscriptionController.handleWebhook(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining(['cus_123'])
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("subscription_tier = 'free'"),
        expect.any(Array)
      );
    });

    it('should handle invoice.payment_failed event', async () => {
      const event = {
        type: 'invoice.payment_failed',
        data: {
          object: {
            customer: 'cus_123'
          }
        }
      };

      mockWebhooksConstruct.mockReturnValue(event);
      mockPool.query.mockResolvedValue({ rows: [] });

      await subscriptionController.handleWebhook(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("subscription_status = 'past_due'"),
        expect.arrayContaining(['cus_123'])
      );
    });

    it('should reject invalid webhook signature', async () => {
      mockWebhooksConstruct.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await subscriptionController.handleWebhook(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.stringContaining('Webhook Error')
      );
    });

    it('should handle unhandled event types', async () => {
      const event = {
        type: 'unknown.event.type',
        data: { object: {} }
      };

      mockWebhooksConstruct.mockReturnValue(event);

      await subscriptionController.handleWebhook(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    it('should handle database errors during webhook processing', async () => {
      const event = {
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_123',
            metadata: {
              userId: 'user-123',
              tier: 'premium'
            }
          }
        }
      };

      mockWebhooksConstruct.mockReturnValue(event);
      mockPool.query.mockRejectedValue(new Error('Database error'));

      await subscriptionController.handleWebhook(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getCurrentSubscription', () => {
    it('should return current subscription details', async () => {
      const userRow = {
        subscription_tier: 'premium',
        subscription_status: 'active',
        stripe_customer_id: 'cus_123'
      };

      mockPool.query.mockResolvedValue({ rows: [userRow] });

      await subscriptionController.getCurrentSubscription(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT subscription_tier'),
        [req.user.id]
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          tier: 'premium',
          status: 'active',
          name: 'Premium',
          price: 9.99
        })
      });
    });

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'));

      await subscriptionController.getCurrentSubscription(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel active subscription', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ stripe_customer_id: 'cus_123' }]
        })
        .mockResolvedValueOnce({ rows: [] });

      mockSubscriptionsList.mockResolvedValue({
        data: [{ id: 'sub_123', status: 'active' }]
      });

      mockSubscriptionsUpdate.mockResolvedValue({
        id: 'sub_123',
        cancel_at_period_end: true
      });

      await subscriptionController.cancelSubscription(req, res, next);

      expect(mockSubscriptionsUpdate).toHaveBeenCalledWith('sub_123', {
        cancel_at_period_end: true
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("subscription_status = 'canceling'"),
        [req.user.id]
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Subscription will be canceled at the end of billing period'
      });
    });

    it('should return error if no stripe customer ID', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ stripe_customer_id: null }]
      });

      await subscriptionController.cancelSubscription(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('No active subscription found');
    });

    it('should return error if no active subscription', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ stripe_customer_id: 'cus_123' }]
      });

      mockSubscriptionsList.mockResolvedValue({
        data: []
      });

      await subscriptionController.cancelSubscription(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('No active subscription found');
    });

    it('should handle Stripe errors', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ stripe_customer_id: 'cus_123' }]
      });

      mockSubscriptionsList.mockRejectedValue(
        new Error('Stripe API error')
      );

      await subscriptionController.cancelSubscription(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('resumeSubscription', () => {
    it('should resume canceled subscription', async () => {
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ stripe_customer_id: 'cus_123' }]
        })
        .mockResolvedValueOnce({ rows: [] });

      mockSubscriptionsList.mockResolvedValue({
        data: [{ id: 'sub_123', status: 'active' }]
      });

      mockSubscriptionsUpdate.mockResolvedValue({
        id: 'sub_123',
        cancel_at_period_end: false
      });

      await subscriptionController.resumeSubscription(req, res, next);

      expect(mockSubscriptionsUpdate).toHaveBeenCalledWith('sub_123', {
        cancel_at_period_end: false
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("subscription_status = 'active'"),
        [req.user.id]
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Subscription resumed successfully'
      });
    });

    it('should return error if no subscription found', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ stripe_customer_id: null }]
      });

      await subscriptionController.resumeSubscription(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('No subscription found');
    });

    it('should handle Stripe errors', async () => {
      mockPool.query.mockResolvedValue({
        rows: [{ stripe_customer_id: 'cus_123' }]
      });

      mockSubscriptionsList.mockRejectedValue(
        new Error('Stripe API error')
      );

      await subscriptionController.resumeSubscription(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
