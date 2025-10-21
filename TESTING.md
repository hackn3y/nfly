# Testing Guide

Comprehensive testing strategy for the NFL Predictor application.

## Overview

The project uses different testing frameworks for each package:
- **Backend** (Node.js): Jest + Supertest
- **ML Service** (Python): Pytest + pytest-cov
- **Mobile** (React Native): Jest + React Native Testing Library

## Test Coverage Goals

- **Unit Tests**: 70%+ coverage
- **Integration Tests**: Critical API endpoints
- **E2E Tests**: Key user flows (future)

---

## Backend Testing (Node.js)

### Setup

```bash
cd packages/backend
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test auth.test.js

# Run tests matching pattern
npm test -- --testNamePattern="auth"
```

### Test Structure

```
packages/backend/tests/
├── setup.js                    # Jest configuration
├── unit/
│   ├── middleware/
│   │   └── auth.test.js       # Auth middleware tests
│   └── controllers/
│       └── bankroll.controller.test.js
└── integration/
    └── auth.integration.test.js
```

### Writing Tests

**Unit Test Example:**
```javascript
describe('Auth Middleware', () => {
  it('should fail if no token provided', async () => {
    const req = { headers: {} };
    const res = {};
    const next = jest.fn();

    await protect(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
  });
});
```

**Integration Test Example:**
```javascript
describe('POST /api/auth/login', () => {
  it('should login with correct credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```

### Mocking

Backend tests mock:
- Database connections (PostgreSQL, MongoDB, Redis)
- External API calls (Stripe, ML Service)
- Email service

Example:
```javascript
jest.mock('../../src/config/database');
const { getPostgresPool } = require('../../src/config/database');

mockPool = { query: jest.fn() };
getPostgresPool.mockReturnValue(mockPool);
```

---

## ML Service Testing (Python)

### Setup

```bash
cd packages/ml-service
pip install pytest pytest-cov pytest-asyncio httpx
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov

# Run specific test file
pytest tests/test_api_predictions.py

# Run specific test
pytest tests/test_api_predictions.py::test_health_check

# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration

# Verbose output
pytest -v

# Stop on first failure
pytest -x
```

### Test Structure

```
packages/ml-service/tests/
├── __init__.py
├── conftest.py                 # Pytest fixtures
├── test_api_predictions.py     # API endpoint tests
├── test_model_service.py       # Model service tests
└── test_data_service.py        # Data service tests
```

### Writing Tests

**Unit Test Example:**
```python
@pytest.mark.unit
def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
```

**Integration Test Example:**
```python
@pytest.mark.integration
async def test_full_prediction_pipeline(mock_db, test_game_data):
    service = PredictionService()
    result = await service.get_game_prediction(1)

    assert result is not None
    assert 'confidence' in result
```

### Fixtures

Common fixtures in `conftest.py`:
- `mock_db_connection`: Mock database
- `mock_redis`: Mock Redis client
- `test_game_data`: Sample game data
- `test_prediction_response`: Sample prediction
- `client`: FastAPI test client

---

## Mobile Testing (React Native)

### Setup

```bash
cd packages/mobile
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Update snapshots
npm test -- -u
```

### Test Structure

```
packages/mobile/__tests__/
├── components/
│   ├── PredictionCard.test.js
│   └── GameCard.test.js
├── screens/
│   ├── HomeScreen.test.js
│   └── PredictionsScreen.test.js
└── store/
    └── slices/
        └── authSlice.test.js
```

### Writing Tests

**Component Test Example:**
```javascript
import { render, fireEvent } from '@testing-library/react-native';
import PredictionCard from '../src/components/PredictionCard';

describe('PredictionCard', () => {
  it('renders prediction data correctly', () => {
    const prediction = {
      predictedWinner: 'Chiefs',
      confidence: 0.75
    };

    const { getByText } = render(<PredictionCard prediction={prediction} />);

    expect(getByText('Chiefs')).toBeTruthy();
    expect(getByText('75%')).toBeTruthy();
  });
});
```

---

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Every push to `main`
- Every pull request
- Nightly builds

See `.github/workflows/test.yml`

### Pre-commit Hooks

```bash
# Install Husky
npm install -g husky

# Setup hooks
npm run prepare

# Tests run on commit
git commit -m "Your message"
```

---

## Test Database Setup

### PostgreSQL Test Database

```bash
# Create test database
createdb nfl_predictor_test

# Run migrations
DATABASE_URL=postgresql://localhost/nfl_predictor_test npm run migrate
```

### MongoDB Test Database

```bash
# MongoDB automatically creates test database on first use
MONGODB_URI=mongodb://localhost:27017/nfl_predictor_test npm test
```

### Redis Test Database

```bash
# Use database 1 for tests (default is 0)
REDIS_URL=redis://localhost:6379/1 npm test
```

---

## Best Practices

### 1. Test Isolation

Each test should be independent:
```javascript
beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();

  // Reset database state
  // Clean up test data
});

afterEach(() => {
  // Cleanup
});
```

### 2. Test Naming

Use descriptive names:
```javascript
// Good
it('should return 401 when password is incorrect')

// Bad
it('test login')
```

### 3. AAA Pattern

Arrange, Act, Assert:
```javascript
it('should create new user', async () => {
  // Arrange
  const userData = { email: 'test@example.com', password: 'pass123' };

  // Act
  const result = await createUser(userData);

  // Assert
  expect(result).toHaveProperty('id');
  expect(result.email).toBe(userData.email);
});
```

### 4. Mock External Dependencies

Always mock:
- Database connections
- External APIs
- File system operations
- Network requests
- Time-dependent functions

### 5. Test Edge Cases

Don't just test happy paths:
- Empty inputs
- Invalid data types
- Boundary conditions
- Error scenarios
- Race conditions

---

## Debugging Tests

### Backend (Jest)

```bash
# Debug specific test
node --inspect-brk node_modules/.bin/jest --runInBand auth.test.js

# Use VS Code debugger
# Add breakpoint in test file
# Run: "Debug Jest Tests" from Run menu
```

### ML Service (Pytest)

```bash
# Debug with pdb
pytest --pdb

# Drop into debugger on failure
pytest --pdb --maxfail=1

# Print output
pytest -s
```

### View Coverage Report

```bash
# Backend
npm test -- --coverage
open coverage/lcov-report/index.html

# ML Service
pytest --cov --cov-report=html
open htmlcov/index.html
```

---

## Common Issues

### Issue: Tests timing out

**Solution**: Increase timeout
```javascript
jest.setTimeout(10000);
```

### Issue: Database connection errors

**Solution**: Check test database is running
```bash
docker ps | grep postgres
```

### Issue: Mock not working

**Solution**: Ensure mock is hoisted
```javascript
jest.mock('./module', () => ({
  __esModule: true,
  default: jest.fn()
}));
```

---

## Contributing

When adding new features:

1. ✅ Write tests first (TDD)
2. ✅ Maintain 70%+ coverage
3. ✅ Update this documentation
4. ✅ Run full test suite before PR
5. ✅ Add integration tests for new endpoints

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Pytest Documentation](https://docs.pytest.org/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Supertest Guide](https://github.com/visionmedia/supertest)

---

**Last Updated**: 2025-10-21
