/**
 * Authentication Middleware Tests
 */

const jwt = require('jsonwebtoken');
const { protect, requireSubscription, restrictTo } = require('../../../src/middleware/auth');
const { AppError } = require('../../../src/middleware/errorHandler');

// Mock database
jest.mock('../../../src/config/database', () => ({
  getPostgresPool: jest.fn(() => ({
    query: jest.fn()
  }))
}));

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('protect middleware', () => {
    it('should fail if no token provided', async () => {
      await protect(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toContain('Not authorized');
    });

    it('should fail with invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await protect(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should succeed with valid token', async () => {
      const { getPostgresPool } = require('../../../src/config/database');
      const mockPool = getPostgresPool();

      const testUser = {
        id: '123',
        email: 'test@example.com',
        subscription_tier: 'free'
      };

      mockPool.query.mockResolvedValue({
        rows: [testUser]
      });

      const token = jwt.sign({ id: testUser.id }, process.env.JWT_SECRET);
      req.headers.authorization = `Bearer ${token}`;

      await protect(req, res, next);

      expect(req.user).toMatchObject(testUser);
      expect(next).toHaveBeenCalledWith();
    });

    it('should fail if user not found in database', async () => {
      const { getPostgresPool } = require('../../../src/config/database');
      const mockPool = getPostgresPool();

      mockPool.query.mockResolvedValue({ rows: [] });

      const token = jwt.sign({ id: '999' }, process.env.JWT_SECRET);
      req.headers.authorization = `Bearer ${token}`;

      await protect(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('requireSubscription middleware', () => {
    beforeEach(() => {
      req.user = {
        id: '123',
        email: 'test@example.com',
        subscription_tier: 'free'
      };
    });

    it('should allow free tier access to free content', () => {
      const middleware = requireSubscription('free');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny free tier access to premium content', () => {
      const middleware = requireSubscription('premium');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(403);
    });

    it('should allow premium tier access to premium content', () => {
      req.user.subscription_tier = 'premium';
      const middleware = requireSubscription('premium');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should allow pro tier access to all content', () => {
      req.user.subscription_tier = 'pro';

      const freeMiddleware = requireSubscription('free');
      freeMiddleware(req, res, next);
      expect(next).toHaveBeenCalledWith();

      next.mockClear();
      const premiumMiddleware = requireSubscription('premium');
      premiumMiddleware(req, res, next);
      expect(next).toHaveBeenCalledWith();

      next.mockClear();
      const proMiddleware = requireSubscription('pro');
      proMiddleware(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should handle multiple tier requirements', () => {
      req.user.subscription_tier = 'premium';
      const middleware = requireSubscription('premium', 'pro');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('restrictTo middleware', () => {
    beforeEach(() => {
      req.user = {
        id: '123',
        email: 'test@example.com',
        role: 'user'
      };
    });

    it('should allow user with correct role', () => {
      const middleware = restrictTo('user');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny user with wrong role', () => {
      const middleware = restrictTo('admin');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(403);
    });

    it('should allow admin role', () => {
      req.user.role = 'admin';
      const middleware = restrictTo('admin');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should handle multiple role requirements', () => {
      req.user.role = 'moderator';
      const middleware = restrictTo('user', 'moderator', 'admin');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });
});
