/**
 * Bankroll Controller Unit Tests
 */

const bankrollController = require('../../../src/controllers/bankroll.controller');
const { AppError } = require('../../../src/middleware/errorHandler');

// Mock dependencies
jest.mock('../../../src/config/database');
jest.mock('../../../src/utils/logger');

const { getPostgresPool } = require('../../../src/config/database');

describe('Bankroll Controller', () => {
  let req, res, next, mockPool;

  beforeEach(() => {
    req = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        subscription_tier: 'pro'
      },
      body: {},
      params: {},
      query: {}
    };

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    next = jest.fn();

    mockPool = {
      query: jest.fn()
    };

    getPostgresPool.mockReturnValue(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBankroll', () => {
    it('should return bankroll stats successfully', async () => {
      const mockStats = {
        current_balance: '1000.00',
        total_bets: '10',
        total_wagered: '500.00',
        total_won: '6',
        total_lost: '4',
        total_pending: '0',
        win_rate: '60.00',
        profit_loss: '500.00',
        roi: '100.00'
      };

      const mockHistory = [
        { id: '1', change_amount: '100.00', change_type: 'bet_won' },
        { id: '2', change_amount: '-50.00', change_type: 'bet_lost' }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: [mockStats] })
        .mockResolvedValueOnce({ rows: mockHistory });

      await bankrollController.getBankroll(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          stats: {
            currentBalance: 1000,
            totalBets: 10,
            totalWagered: 500,
            totalWon: 6,
            totalLost: 4,
            totalPending: 0,
            winRate: 60,
            profitLoss: 500,
            roi: 100
          },
          history: mockHistory
        }
      });
    });

    it('should return 404 if user not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await bankrollController.getBankroll(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  describe('initializeBankroll', () => {
    it('should initialize bankroll successfully', async () => {
      req.body = { amount: 1000 };

      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // Update query
        .mockResolvedValueOnce({ rows: [] }); // History insert

      await bankrollController.initializeBankroll(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          bankroll: 1000,
          message: 'Bankroll initialized successfully'
        }
      });
    });

    it('should reject invalid amount', async () => {
      req.body = { amount: -100 };

      await bankrollController.initializeBankroll(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toContain('Valid amount is required');
    });

    it('should reject zero amount', async () => {
      req.body = { amount: 0 };

      await bankrollController.initializeBankroll(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('placeBet', () => {
    beforeEach(() => {
      req.body = {
        gameId: 123,
        betType: 'spread',
        amount: 50,
        odds: -110,
        pick: 'Chiefs -3.5',
        confidenceScore: 75
      };
    });

    it('should place bet successfully', async () => {
      // Mock: check user bankroll
      mockPool.query.mockResolvedValueOnce({
        rows: [{ bankroll: '1000.00' }]
      });

      // Mock: insert bet
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'bet-123',
          user_id: req.user.id,
          game_id: 123,
          bet_type: 'spread',
          amount: '50.00',
          odds: '-110.00',
          potential_win: '45.45',
          pick: 'Chiefs -3.5',
          status: 'pending'
        }]
      });

      await bankrollController.placeBet(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: 'bet-123',
          bet_type: 'spread'
        })
      });
    });

    it('should reject bet with insufficient bankroll', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ bankroll: '25.00' }] // Less than bet amount
      });

      await bankrollController.placeBet(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toContain('Insufficient bankroll');
    });

    it('should reject bet without required fields', async () => {
      req.body = { amount: 50 }; // Missing other required fields

      await bankrollController.placeBet(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should calculate potential win correctly for positive odds', async () => {
      req.body.odds = 150; // Positive American odds

      mockPool.query.mockResolvedValueOnce({
        rows: [{ bankroll: '1000.00' }]
      });

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'bet-123',
          potential_win: '75.00' // 50 * 150 / 100 = 75
        }]
      });

      await bankrollController.placeBet(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('settleBet', () => {
    beforeEach(() => {
      req.params = { id: 'bet-123' };
      req.body = { status: 'won', result: 45.45 };
    });

    it('should settle bet as won', async () => {
      // Mock: get bet
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'bet-123',
          user_id: req.user.id,
          amount: '50.00',
          potential_win: '45.45',
          status: 'pending'
        }]
      });

      // Mock: update bet
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'bet-123',
          status: 'won',
          result: '45.45'
        }]
      });

      await bankrollController.settleBet(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: 'bet-123',
          status: 'won'
        })
      });
    });

    it('should not settle already settled bet', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'bet-123',
          status: 'won' // Already settled
        }]
      });

      await bankrollController.settleBet(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toContain('already been settled');
    });

    it('should reject invalid settlement status', async () => {
      req.body.status = 'invalid';

      await bankrollController.settleBet(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('getAnalytics', () => {
    it('should return betting analytics', async () => {
      const mockBetTypeData = [
        { bet_type: 'spread', total_bets: '5', win_rate: '60.00' }
      ];

      const mockDailyData = [
        { date: '2025-01-20', bets: '3', wins: '2', profit_loss: '50.00' }
      ];

      const mockPeriodStats = {
        total_bets: '10',
        total_wagered: '500.00',
        total_profit_loss: '100.00',
        avg_bet_size: '50.00',
        biggest_win: '100.00',
        biggest_loss: '-50.00'
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: mockBetTypeData })
        .mockResolvedValueOnce({ rows: mockDailyData })
        .mockResolvedValueOnce({ rows: [mockPeriodStats] });

      await bankrollController.getAnalytics(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          period: '30 days',
          byBetType: mockBetTypeData,
          dailyPerformance: mockDailyData,
          periodStats: mockPeriodStats
        }
      });
    });
  });
});
