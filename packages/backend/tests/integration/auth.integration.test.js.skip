/**
 * Authentication Integration Tests
 * Tests actual API endpoints
 */

const request = require('supertest');
const express = require('express');
const authRoutes = require('../../src/routes/auth.routes');

// Mock database
jest.mock('../../src/config/database');

const { getPostgresPool } = require('../../src/config/database');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);

  // Error handler
  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message
    });
  });

  return app;
};

describe('Auth API Integration Tests', () => {
  let app;
  let mockPool;

  beforeEach(() => {
    app = createTestApp();
    mockPool = {
      query: jest.fn()
    };
    getPostgresPool.mockReturnValue(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Mock: check if user exists (no existing user)
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      // Mock: insert new user
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: '123',
          email: 'newuser@example.com',
          first_name: 'John',
          last_name: 'Doe',
          subscription_tier: 'free'
        }]
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('email', 'newuser@example.com');
    });

    it('should reject registration with existing email', async () => {
      // Mock: user already exists
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: '456', email: 'existing@example.com' }]
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          firstName: 'Jane',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01'
        });

      expect(response.status).toBe(400);
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123', // Too short
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    const bcrypt = require('bcryptjs');

    it('should login with correct credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 4);

      // Mock: find user
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: '123',
          email: 'user@example.com',
          password_hash: hashedPassword,
          first_name: 'John',
          last_name: 'Doe',
          subscription_tier: 'premium'
        }]
      });

      // Mock: update last login
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('email', 'user@example.com');
    });

    it('should reject login with wrong password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 4);

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: '123',
          email: 'user@example.com',
          password_hash: hashedPassword
        }]
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject login with non-existent email', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
