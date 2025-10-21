/**
 * Tests for prediction controller
 */

const predictionController = require('../../../src/controllers/prediction.controller');
const axios = require('axios');
const { getPostgresPool, getRedisClient } = require('../../../src/config/database');
const { AppError } = require('../../../src/middleware/errorHandler');

jest.mock('axios');
jest.mock('../../../src/config/database');
jest.mock('../../../src/utils/logger');

describe('Prediction Controller', () => {
  let req, res, next;
  let mockPool, mockRedis;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
      user: { id: 'user-123' }
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };

    next = jest.fn();

    // Mock Redis
    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      setEx: jest.fn().mockResolvedValue('OK')
    };
    getRedisClient.mockReturnValue(mockRedis);

    // Mock PostgreSQL pool
    mockPool = {
      query: jest.fn()
    };
    getPostgresPool.mockReturnValue(mockPool);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getUpcomingPredictions', () => {
    it('should return cached predictions if available', async () => {
      const cachedData = [
        { game_id: 1, predicted_winner: 'Chiefs', confidence: 0.75 }
      ];
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

      await predictionController.getUpcomingPredictions(req, res, next);

      expect(mockRedis.get).toHaveBeenCalledWith('predictions:upcoming');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: cachedData,
        cached: true
      });
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('should fetch from ML service if cache miss', async () => {
      const mlData = [
        { game_id: 1, predicted_winner: 'Chiefs', confidence: 0.75 }
      ];
      mockRedis.get.mockResolvedValue(null);
      axios.get.mockResolvedValue({ data: mlData });

      await predictionController.getUpcomingPredictions(req, res, next);

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/predictions/upcoming'),
        { timeout: 10000 }
      );
      expect(mockRedis.setEx).toHaveBeenCalledWith(
        'predictions:upcoming',
        1800,
        JSON.stringify(mlData)
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mlData,
        cached: false
      });
    });

    it('should handle errors from ML service', async () => {
      mockRedis.get.mockResolvedValue(null);
      axios.get.mockRejectedValue(new Error('ML service unavailable'));

      await predictionController.getUpcomingPredictions(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Failed to fetch predictions');
      expect(next.mock.calls[0][0].statusCode).toBe(500);
    });
  });

  describe('getGamePrediction', () => {
    it('should return cached game prediction if available', async () => {
      req.params.gameId = '123';
      const cachedPrediction = {
        game_id: 123,
        predicted_winner: 'Bills',
        confidence: 0.68
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedPrediction));

      await predictionController.getGamePrediction(req, res, next);

      expect(mockRedis.get).toHaveBeenCalledWith('prediction:game:123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: cachedPrediction,
        cached: true
      });
    });

    it('should fetch game prediction from ML service if cache miss', async () => {
      req.params.gameId = '123';
      const mlPrediction = {
        game_id: 123,
        predicted_winner: 'Bills',
        confidence: 0.68
      };
      mockRedis.get.mockResolvedValue(null);
      axios.get.mockResolvedValue({ data: mlPrediction });

      await predictionController.getGamePrediction(req, res, next);

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/predictions/game/123'),
        { timeout: 10000 }
      );
      expect(mockRedis.setEx).toHaveBeenCalledWith(
        'prediction:game:123',
        900,
        JSON.stringify(mlPrediction)
      );
    });
  });

  describe('getWeeklyPredictions', () => {
    it('should fetch weekly predictions with query params', async () => {
      req.query = { week: '10', season: '2025' };
      const weeklyData = [
        { game_id: 1, predicted_winner: 'Chiefs' },
        { game_id: 2, predicted_winner: 'Bills' }
      ];
      axios.get.mockResolvedValue({ data: weeklyData });

      await predictionController.getWeeklyPredictions(req, res, next);

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/predictions/weekly'),
        {
          params: { week: '10', season: '2025' },
          timeout: 10000
        }
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: weeklyData
      });
    });

    it('should handle ML service errors', async () => {
      req.query = { week: '10', season: '2025' };
      axios.get.mockRejectedValue(new Error('Service error'));

      await predictionController.getWeeklyPredictions(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('getPredictionHistory', () => {
    it('should return user prediction history with stats', async () => {
      const historyRows = [
        {
          id: 1,
          game_id: 101,
          predicted_winner: 'Chiefs',
          confidence: 0.75,
          actual_winner: 'Chiefs',
          prediction_correct: true,
          home_team: 'Chiefs',
          away_team: 'Bills',
          game_date: '2025-01-20'
        },
        {
          id: 2,
          game_id: 102,
          predicted_winner: 'Packers',
          confidence: 0.65,
          actual_winner: 'Cowboys',
          prediction_correct: false,
          home_team: 'Packers',
          away_team: 'Cowboys',
          game_date: '2025-01-21'
        }
      ];

      mockPool.query.mockResolvedValue({ rows: historyRows });

      await predictionController.getPredictionHistory(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [req.user.id]
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          history: historyRows,
          stats: {
            total: 2,
            correct: 1,
            accuracy: '50.00'
          }
        }
      });
    });

    it('should handle empty history', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await predictionController.getPredictionHistory(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          history: [],
          stats: {
            total: 0,
            correct: 0,
            accuracy: '0.00'
          }
        }
      });
    });

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'));

      await predictionController.getPredictionHistory(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('optimizeParlay', () => {
    it('should optimize parlay with valid game IDs', async () => {
      req.body = {
        gameIds: [1, 2, 3],
        maxSelections: 3,
        targetOdds: 5.0
      };

      const parlayResult = {
        picks: [
          { game_id: 1, pick: 'Chiefs -3.5', confidence: 0.72 },
          { game_id: 2, pick: 'Bills ML', confidence: 0.68 }
        ],
        total_confidence: 0.70,
        expected_payout: 4.8
      };

      axios.post.mockResolvedValue({ data: parlayResult });

      await predictionController.optimizeParlay(req, res, next);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/predictions/parlay'),
        {
          game_ids: [1, 2, 3],
          max_selections: 3,
          target_odds: 5.0
        },
        { timeout: 15000 }
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: parlayResult
      });
    });

    it('should reject invalid game IDs array', async () => {
      req.body = { gameIds: 'not-an-array' };

      await predictionController.optimizeParlay(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Valid game IDs array required');
      expect(next.mock.calls[0][0].statusCode).toBe(400);
    });

    it('should reject missing game IDs', async () => {
      req.body = {};

      await predictionController.optimizeParlay(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should handle ML service errors', async () => {
      req.body = { gameIds: [1, 2, 3] };
      axios.post.mockRejectedValue(new Error('Optimization failed'));

      await predictionController.optimizeParlay(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Failed to optimize parlay');
    });
  });

  describe('getModelStats', () => {
    it('should return cached model stats if available', async () => {
      const cachedStats = {
        accuracy: 0.72,
        total_predictions: 1500,
        confidence_avg: 0.68
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedStats));

      await predictionController.getModelStats(req, res, next);

      expect(mockRedis.get).toHaveBeenCalledWith('model:stats');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: cachedStats,
        cached: true
      });
    });

    it('should fetch model stats from ML service if cache miss', async () => {
      const mlStats = {
        accuracy: 0.72,
        total_predictions: 1500,
        confidence_avg: 0.68
      };
      mockRedis.get.mockResolvedValue(null);
      axios.get.mockResolvedValue({ data: mlStats });

      await predictionController.getModelStats(req, res, next);

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/models/stats'),
        { timeout: 10000 }
      );
      expect(mockRedis.setEx).toHaveBeenCalledWith(
        'model:stats',
        3600,
        JSON.stringify(mlStats)
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mlStats,
        cached: false
      });
    });

    it('should handle errors fetching model stats', async () => {
      mockRedis.get.mockResolvedValue(null);
      axios.get.mockRejectedValue(new Error('Stats unavailable'));

      await predictionController.getModelStats(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('Failed to fetch model statistics');
    });
  });
});
