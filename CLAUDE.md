# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

NFL Predictor is a monorepo application combining machine learning predictions with gematria analysis for NFL games. The application consists of three main packages:

- **Backend** (Node.js/Express): API server handling authentication, subscriptions, and orchestration
- **ML Service** (Python/FastAPI): Machine learning predictions and data processing
- **Mobile** (React Native/Expo): Cross-platform mobile application

## Architecture

### Service Communication Flow

1. **Mobile App** → calls → **Backend API** (port 4100)
2. **Backend API** → calls → **ML Service** (port 5000)
3. **ML Service** → queries → **PostgreSQL** (game data, predictions)
4. **Backend** → queries → **PostgreSQL** (users, subscriptions) + **MongoDB** (gematria calculations)
5. Both services use **Redis** for caching predictions and session data

### Key Architectural Patterns

- **Subscription-based access control**: Three tiers (free, premium $9.99, pro $29.99) enforced via middleware
- **JWT authentication**: Tokens issued by backend, verified via `protect` middleware
- **Caching strategy**: ML predictions cached for 15-30 minutes in Redis to reduce compute load
- **Service separation**: ML models and data science logic isolated in Python service; business logic in Node.js backend
- **Job scheduler**: Backend runs cron jobs for data updates (disabled with `ENABLE_SCHEDULER=false`)

### Database Schema

- **PostgreSQL**: Stores NFL game data, team stats, user accounts, subscription records, predictions
- **MongoDB**: Stores gematria calculations (multiple calculation methods per game/team)
- **Redis**: Caching layer with keys like `ml:predictions:upcoming`, `ml:prediction:game:{id}`

### Authentication & Authorization

Authentication flow (packages/backend/src/middleware/auth.js):
1. `protect` middleware: Verifies JWT token, loads user from database
2. `requireSubscription(...tiers)`: Checks if user has required subscription tier
3. `restrictTo(...roles)`: Checks user role (admin, user, etc.)

Apply in route definitions:
```javascript
router.get('/premium-feature', protect, requireSubscription('premium', 'pro'), handler);
router.post('/admin-only', protect, restrictTo('admin'), handler);
```

### ML Service Architecture

Four core services (packages/ml-service/services/):
- `prediction_service.py`: Orchestrates predictions, calls models, combines with gematria
- `model_service.py`: Loads and runs ML models (Random Forest, XGBoost, Neural Networks)
- `data_service.py`: Fetches and prepares game data for predictions
- `gematria_service.py`: Calculates numerological insights

API routes expose predictions via FastAPI routers in packages/ml-service/api/

## Development Commands

### Initial Setup

```bash
# Install all dependencies (Node + Python)
npm run install:all

# Start databases (PostgreSQL, MongoDB, Redis)
npm run docker:up

# Stop databases
npm run docker:down
```

### Running Services

```bash
# Backend API (port 4100)
npm run dev:backend
# or directly:
cd packages/backend && npm run dev

# ML Service (port 5000)
npm run dev:ml
# or directly:
cd packages/ml-service && python app.py

# Mobile app (Expo port 8100)
npm run dev:mobile
# or directly:
cd packages/mobile && npm start

# Run mobile on specific platform
cd packages/mobile
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web browser
```

### Testing & Linting

```bash
# Run all workspace tests
npm test

# Run tests for specific package
cd packages/backend && npm test
cd packages/mobile && npm test

# Linting
npm run lint
cd packages/backend && npm run lint
cd packages/mobile && npm run lint
```

### Database Operations

```bash
cd packages/backend

# Run migrations
npm run migrate

# Seed data
npm run seed
```

## Environment Configuration

### Backend (.env)
Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret for JWT signing
- `ML_SERVICE_URL`: URL to ML service (default: http://localhost:5000)
- `STRIPE_SECRET_KEY`: For subscription payments
- `ENABLE_SCHEDULER`: Set to 'false' to disable cron jobs during development

### ML Service (.env)
Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `DEBUG`: Set to 'true' for auto-reload during development

### Mobile (.env)
The mobile app reads API URL from environment. Configure in code at packages/mobile/src/services/api.js

## API Structure

### Backend Routes (packages/backend/src/routes/)
- `/api/auth` - Login, register, token refresh
- `/api/predictions` - Proxies to ML service, adds subscription checks
- `/api/gematria` - Gematria calculations and insights
- `/api/users` - User profile management
- `/api/subscriptions` - Stripe subscription management
- `/api/nfl-data` - Team stats, schedules, injury reports
- `/api/webhooks` - Stripe webhooks (uses raw body parser)
- `/api/transparency` - Model accuracy tracking
- `/api/admin` - Admin-only operations

### ML Service Routes (packages/ml-service/api/)
- `/api/predictions/upcoming` - All upcoming game predictions
- `/api/predictions/game/{id}` - Single game prediction with full details
- `/api/predictions/weekly` - Predictions for specific week/season
- `/api/predictions/parlay` - Parlay optimizer
- `/api/models` - Model training and evaluation
- `/api/data` - Data ingestion and processing

## Critical Implementation Notes

### Webhook Handling
Stripe webhooks require raw body for signature verification. The backend server.js configures this:
```javascript
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
// MUST come BEFORE app.use(express.json())
```

### CORS Configuration
Backend uses permissive CORS in development, restrictive in production. Check packages/backend/src/server.js for current allowed origins.

### Rate Limiting
API routes are rate-limited (default: 100 requests per 15 minutes). Configure via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS` environment variables.

### Mobile Navigation
Two navigators based on auth state (packages/mobile/src/navigation/):
- `AuthNavigator`: Welcome, Login, Register screens
- `AppNavigator`: Bottom tabs (Home, Predictions, Gematria, Profile)

Redux manages auth state in packages/mobile/src/store/slices/authSlice.js

## Health Checks

- Backend: http://localhost:4100/health
- ML Service: http://localhost:5000/health

## API Documentation

When services are running:
- Backend Swagger docs: http://localhost:4100/api/docs (if configured)
- ML Service docs: http://localhost:5000/docs (FastAPI auto-generated)
