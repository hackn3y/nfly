/**
 * Tests for user controller
 */

const userController = require('../../../src/controllers/user.controller');
const { getPostgresPool } = require('../../../src/config/database');
const { AppError } = require('../../../src/middleware/errorHandler');

jest.mock('../../../src/config/database');
jest.mock('../../../src/utils/logger');

describe('User Controller', () => {
  let req, res, next;
  let mockPool;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: { id: 'user-123' }
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };

    next = jest.fn();

    mockPool = {
      query: jest.fn()
    };
    getPostgresPool.mockReturnValue(mockPool);

    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      const userProfile = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        subscription_tier: 'premium',
        created_at: '2025-01-01',
        last_login: '2025-01-20'
      };

      mockPool.query.mockResolvedValue({ rows: [userProfile] });

      await userController.getProfile(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, email'),
        [req.user.id]
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: userProfile
      });
    });

    it('should return 404 if user not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await userController.getProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toBe('User not found');
      expect(next.mock.calls[0][0].statusCode).toBe(404);
    });

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'));

      await userController.getProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      req.body = {
        firstName: 'Jane',
        lastName: 'Smith'
      };

      const updatedProfile = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'Jane',
        last_name: 'Smith'
      };

      mockPool.query.mockResolvedValue({ rows: [updatedProfile] });

      await userController.updateProfile(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        ['Jane', 'Smith', req.user.id]
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: updatedProfile
      });
    });

    it('should update only first name if last name not provided', async () => {
      req.body = { firstName: 'Jane' };

      const updatedProfile = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'Jane',
        last_name: 'Doe'
      };

      mockPool.query.mockResolvedValue({ rows: [updatedProfile] });

      await userController.updateProfile(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('COALESCE'),
        ['Jane', undefined, req.user.id]
      );
    });

    it('should handle database errors', async () => {
      req.body = { firstName: 'Jane' };
      mockPool.query.mockRejectedValue(new Error('Database error'));

      await userController.updateProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      const preferences = {
        notifications: true,
        theme: 'dark',
        language: 'en'
      };

      mockPool.query.mockResolvedValue({
        rows: [{ preferences }]
      });

      await userController.getPreferences(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT preferences'),
        [req.user.id]
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: preferences
      });
    });

    it('should return empty object if no preferences set', async () => {
      mockPool.query.mockResolvedValue({ rows: [{}] });

      await userController.getPreferences(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {}
      });
    });

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'));

      await userController.getPreferences(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences successfully', async () => {
      const preferences = {
        notifications: false,
        theme: 'light',
        language: 'es'
      };

      req.body = { preferences };

      mockPool.query.mockResolvedValue({ rows: [] });

      await userController.updatePreferences(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET preferences'),
        [JSON.stringify(preferences), req.user.id]
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: preferences
      });
    });

    it('should handle database errors', async () => {
      req.body = { preferences: { theme: 'dark' } };
      mockPool.query.mockRejectedValue(new Error('Database error'));

      await userController.updatePreferences(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getFavorites', () => {
    it('should return user favorite teams', async () => {
      const favorites = [
        {
          id: 1,
          name: 'Kansas City Chiefs',
          abbreviation: 'KC',
          conference: 'AFC',
          division: 'West'
        },
        {
          id: 2,
          name: 'Buffalo Bills',
          abbreviation: 'BUF',
          conference: 'AFC',
          division: 'East'
        }
      ];

      mockPool.query.mockResolvedValue({ rows: favorites });

      await userController.getFavorites(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('JOIN user_favorites'),
        [req.user.id]
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: favorites
      });
    });

    it('should return empty array if no favorites', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await userController.getFavorites(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: []
      });
    });

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'));

      await userController.getFavorites(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('addFavorite', () => {
    it('should add team to favorites successfully', async () => {
      req.params.teamId = '5';

      mockPool.query.mockResolvedValue({ rows: [] });

      await userController.addFavorite(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_favorites'),
        [req.user.id, '5']
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Team added to favorites'
      });
    });

    it('should handle duplicate favorites gracefully', async () => {
      req.params.teamId = '5';
      mockPool.query.mockResolvedValue({ rows: [] });

      await userController.addFavorite(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT'),
        [req.user.id, '5']
      );
    });

    it('should handle database errors', async () => {
      req.params.teamId = '5';
      mockPool.query.mockRejectedValue(new Error('Database error'));

      await userController.addFavorite(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('removeFavorite', () => {
    it('should remove team from favorites successfully', async () => {
      req.params.teamId = '5';

      mockPool.query.mockResolvedValue({ rows: [] });

      await userController.removeFavorite(req, res, next);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM user_favorites'),
        [req.user.id, '5']
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Team removed from favorites'
      });
    });

    it('should handle database errors', async () => {
      req.params.teamId = '5';
      mockPool.query.mockRejectedValue(new Error('Database error'));

      await userController.removeFavorite(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
