/**
 * Jest Test Setup
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_ROUNDS = '4'; // Lower rounds for faster tests
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/nfl_predictor_test';
process.env.MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/nfl_predictor_test';
process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1';
process.env.ML_SERVICE_URL = 'http://localhost:5000';
process.env.ENABLE_SCHEDULER = 'false'; // Disable cron jobs in tests

// Increase test timeout for integration tests
jest.setTimeout(10000);

// Mock console methods to reduce test output noise (optional)
global.console = {
  ...console,
  // Keep error and warn for debugging
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
};
