/**
 * Integration tests for prediction routes
 */

const request = require('supertest');
const express = require('express');
const axios = require('axios');
const { getPostgresPool, getRedisClient } = require('../../src/config/database');

// Mock dependencies before requiring routes
jest.mock('axios');
jest.mock('../../src/config/database');
jest.mock('../../src/utils/logger');

// Mock auth middleware before it's required by routes
jest.mock('../../src/middleware/auth', () => ({
  protect: (req, res, next) => {
    req.user = {
      id: 'test-user-123',
      email: 'test@example.com',
      subscription_tier: 'pro'
    };
    next();
  },
  requireSubscription: () => (req, res, next) => next(),
  restrictTo: () => (req, res, next) => next()
}));

// Mock subscription middleware
jest.mock('../../src/middleware/subscriptionCheck', () => ({
  checkPredictionLimit: (req, res, next) => next(),
  requireFeature: () => (req, res, next) => next(),
  requirePlayerProps: (req, res, next) => next(),
  requireLivePredictions: (req, res, next) => next(),
  requireAdvancedStats: (req, res, next) => next(),
  attachTierInfo: (req, res, next) => {
    req.tierInfo = { tier: 'pro', features: [] };
    next();
  }
}));

describe('Prediction Routes Integration', () => {
  let app;
  let mockPool, mockRedis;

  beforeAll(() => {
    // Create Express app with routes
    app = express();
    app.use(express.json());

    // Mock database connections
    mockPool = {
      query: jest.fn()
    };

    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      setEx: jest.fn().mockResolvedValue('OK')
    };

    getPostgresPool.mockReturnValue(mockPool);
    getRedisClient.mockReturnValue(mockRedis);

    // Load routes after mocks are set up
    const predictionRoutes = require('../../src/routes/prediction.routes');
    app.use('/api/predictions', predictionRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/predictions/upcoming', () => {
    it('should return upcoming predictions from cache', async () => {
      const cachedPredictions = [
        {
          game_id: 1,
          home_team: 'Chiefs',
          away_team: 'Bills',
          predicted_winner: 'Chiefs',
          confidence: 0.75
        }
      ];

      mockRedis.get.mockResolvedValue(JSON.stringify(cachedPredictions));

      const response = await request(app)
        .get('/api/predictions/upcoming')

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.cached).toBe(true);
      expect(response.body.data).toEqual(cachedPredictions);
    });

    it('should fetch from ML service if cache miss', async () => {
      const mlPredictions = [
        {
          game_id: 1,
          home_team: 'Chiefs',
          away_team: 'Bills',
          predicted_winner: 'Chiefs',
          confidence: 0.75
        }
      ];

      mockRedis.get.mockResolvedValue(null);
      axios.get.mockResolvedValue({ data: mlPredictions });

      const response = await request(app)
        .get('/api/predictions/upcoming')

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.cached).toBe(false);
      expect(response.body.data).toEqual(mlPredictions);
      expect(mockRedis.setEx).toHaveBeenCalled();
    });

    it('should handle ML service errors gracefully', async () => {
      mockRedis.get.mockResolvedValue(null);
      axios.get.mockRejectedValue(new Error('ML service down'));

      const response = await request(app)
        .get('/api/predictions/upcoming')

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/predictions/game/:gameId', () => {
    it('should return game prediction with details', async () => {
      const gamePrediction = {
        game_id: 123,
        home_team: 'Chiefs',
        away_team: 'Bills',
        predicted_winner: 'Chiefs',
        predicted_home_score: 28.5,
        predicted_away_score: 24.2,
        confidence: 0.72,
        spread_prediction: -4.3,
        over_under_prediction: 52.7
      };

      mockRedis.get.mockResolvedValue(null);
      axios.get.mockResolvedValue({ data: gamePrediction });

      const response = await request(app)
        .get('/api/predictions/game/123')

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(gamePrediction);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/game/123'),
        expect.any(Object)
      );
    });

    it('should use cached prediction if available', async () => {
      const cachedPrediction = {
        game_id: 123,
        predicted_winner: 'Chiefs'
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(cachedPrediction));

      const response = await request(app)
        .get('/api/predictions/game/123')

      expect(response.status).toBe(200);
      expect(response.body.cached).toBe(true);
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/predictions/weekly', () => {
    it('should return weekly predictions with query params', async () => {
      const weeklyPredictions = [
        { game_id: 1, predicted_winner: 'Chiefs' },
        { game_id: 2, predicted_winner: 'Bills' },
        { game_id: 3, predicted_winner: 'Packers' }
      ];

      axios.get.mockResolvedValue({ data: weeklyPredictions });

      const response = await request(app)
        .get('/api/predictions/weekly?week=10&season=2025')

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(weeklyPredictions);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/weekly'),
        expect.objectContaining({
          params: { week: '10', season: '2025' }
        })
      );
    });
  });

  describe('GET /api/predictions/history', () => {
    it('should return user prediction history with stats', async () => {
      const historyRows = [
        {
          id: 1,
          game_id: 101,
          predicted_winner: 'Chiefs',
          actual_winner: 'Chiefs',
          prediction_correct: true,
          home_team: 'Chiefs',
          away_team: 'Bills',
          confidence: 0.75,
          game_date: '2025-01-20'
        },
        {
          id: 2,
          game_id: 102,
          predicted_winner: 'Packers',
          actual_winner: 'Cowboys',
          prediction_correct: false,
          home_team: 'Packers',
          away_team: 'Cowboys',
          confidence: 0.65,
          game_date: '2025-01-21'
        }
      ];

      mockPool.query.mockResolvedValue({ rows: historyRows });

      const response = await request(app)
        .get('/api/predictions/history')

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.history).toHaveLength(2);
      expect(response.body.data.stats).toEqual({
        total: 2,
        correct: 1,
        accuracy: '50.00'
      });
    });

    it('should handle empty history', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get('/api/predictions/history')

      expect(response.status).toBe(200);
      expect(response.body.data.stats.accuracy).toBe('0.00');
    });
  });

  describe('POST /api/predictions/parlay', () => {
    it('should optimize parlay with valid input', async () => {
      const parlayRequest = {
        gameIds: [1, 2, 3],
        maxSelections: 3,
        targetOdds: 5.0
      };

      const parlayResult = {
        picks: [
          { game_id: 1, pick: 'Chiefs -3.5', confidence: 0.72 },
          { game_id: 2, pick: 'Bills ML', confidence: 0.68 },
          { game_id: 3, pick: 'Over 48.5', confidence: 0.75 }
        ],
        total_confidence: 0.72,
        expected_payout: 5.2
      };

      axios.post.mockResolvedValue({ data: parlayResult });

      const response = await request(app)
        .post('/api/predictions/parlay')
        .send(parlayRequest);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.picks).toHaveLength(3);
      expect(response.body.data.total_confidence).toBe(0.72);
    });

    it('should reject invalid input', async () => {
      const response = await request(app)
        .post('/api/predictions/parlay')
        .send({ gameIds: 'not-an-array' });

      expect(response.status).toBe(400);
    });

    it('should reject missing gameIds', async () => {
      const response = await request(app)
        .post('/api/predictions/parlay')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/predictions/stats', () => {
    it('should return model performance statistics', async () => {
      const modelStats = {
        overall_accuracy: 0.72,
        total_predictions: 1500,
        confidence_avg: 0.68,
        spread_accuracy: 0.65,
        moneyline_accuracy: 0.75,
        over_under_accuracy: 0.58
      };

      mockRedis.get.mockResolvedValue(null);
      axios.get.mockResolvedValue({ data: modelStats });

      const response = await request(app)
        .get('/api/predictions/stats')

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(modelStats);
    });

    it('should use cached stats if available', async () => {
      const cachedStats = {
        overall_accuracy: 0.72,
        total_predictions: 1500
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(cachedStats));

      const response = await request(app)
        .get('/api/predictions/stats')

      expect(response.status).toBe(200);
      expect(response.body.cached).toBe(true);
      expect(axios.get).not.toHaveBeenCalled();
    });
  });
});
