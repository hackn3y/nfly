# NFL Predictor - Setup Guide

## What We've Built So Far

### Backend Services ✅
- **Node.js/Express API** - RESTful API with authentication, predictions, gematria, subscriptions
- **Python/FastAPI ML Service** - Machine learning predictions with ensemble models
- **PostgreSQL Database** - Structured data (users, games, predictions, stats)
- **MongoDB** - Gematria calculations and caching
- **Redis** - Caching layer for performance
- **Docker Compose** - Development environment orchestration

### Features Implemented
1. **Authentication System**
   - JWT-based auth
   - Age verification (21+)
   - Password reset flow

2. **Prediction Engine**
   - Random Forest, XGBoost, Neural Network models
   - Ensemble predictions
   - Feature engineering pipeline
   - Parlay optimizer

3. **Gematria Analysis**
   - English, Pythagorean, Chaldean ciphers
   - Pattern recognition
   - Game/team/player analysis

4. **Subscription Management**
   - Stripe integration
   - 3-tier system (Free, Premium $9.99, Pro $29.99)
   - Webhook handling

5. **Data Pipeline**
   - Extensible data fetching framework
   - Ready for ESPN, Odds API, Weather API integration

## Quick Start

### Prerequisites
```bash
# Install Node.js 18+
node --version

# Install Python 3.10+
python --version

# Install Docker Desktop
docker --version
```

### Installation Steps

**1. Install Dependencies**
```bash
# Root dependencies
npm install

# Backend dependencies
cd packages/backend
npm install
cd ../..

# ML Service dependencies
cd packages/ml-service
pip install -r requirements.txt
cd ../..
```

**2. Set Up Environment Variables**

Create `.env` files in each service:

**packages/backend/.env**
```env
PORT=4100
NODE_ENV=development
DATABASE_URL=postgresql://nfluser:nflpass123@localhost:5432/nfl_predictor
MONGODB_URI=mongodb://nfluser:nflpass123@localhost:27017/nfl_gematria
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-change-this
ML_SERVICE_URL=http://localhost:5000
STRIPE_SECRET_KEY=sk_test_your_key
```

**packages/ml-service/.env**
```env
PORT=5000
DEBUG=True
DATABASE_URL=postgresql://nfluser:nflpass123@localhost:5432/nfl_predictor
REDIS_URL=redis://localhost:6379
ODDS_API_KEY=your-odds-api-key
WEATHER_API_KEY=your-openweather-key
```

**3. Start Services**

**Option A: Using Docker (Recommended)**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Option B: Manual Start**
```bash
# Terminal 1 - Databases
docker-compose up postgres mongodb redis -d

# Terminal 2 - Backend API
cd packages/backend
npm run dev

# Terminal 3 - ML Service
cd packages/ml-service
python app.py

# Terminal 4 - Mobile App (when ready)
cd packages/mobile
npm start
```

**4. Initialize Database**
```bash
# The database will auto-initialize with the schema and NFL teams
# Check if it's working:
curl http://localhost:4100/health
curl http://localhost:5000/health
```

### Testing the API

**Register a User**
```bash
curl -X POST http://localhost:4100/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-01"
  }'
```

**Login**
```bash
curl -X POST http://localhost:4100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Get Predictions** (use token from login)
```bash
curl http://localhost:4100/api/predictions/upcoming \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Calculate Gematria**
```bash
curl -X POST http://localhost:4100/api/gematria/calculate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Kansas City Chiefs",
    "methods": ["english", "pythagorean", "chaldean"]
  }'
```

## API Documentation

Once services are running:
- Backend API: http://localhost:4100/api
- ML Service: http://localhost:5000/docs (Swagger UI)

## Next Steps

### Mobile App (React Native) - IN PROGRESS
The mobile app will include:
- Authentication flow
- Predictions dashboard
- Gematria calculator
- Subscription management
- Betting tools and parlay optimizer

### Data Integration

The backend now pulls live schedules, odds, injuries, and team stats through the ML service. Configure the following keys to enable all feeds:

1. **ESPN Scoreboard** – no key required (public).
2. **The Odds API** – set `ODDS_API_KEY` in `packages/ml-service/.env`.
3. **OpenWeather** (current conditions) – set `WEATHER_API_KEY` in `packages/ml-service/.env`.

Trigger a full refresh after setting keys:

```bash
# From packages/ml-service
python scripts/update_data.py --season 2025 --week 7

# Or call the FastAPI endpoint directly
curl -X POST http://localhost:5000/api/data/update/all \
  -H "Content-Type: application/json" \
  -d '{"season": 2025, "week": 7, "include_weather": true, "include_odds": true}'
```

The Node backend exposes the ingested data at `/api/nfl-data`, and the nightly cron job keeps schedules in sync.

### ML Model Training - TODO
1. Collect historical NFL game data (2010-2024)
2. Train models on real data
3. Backtest predictions
4. Optimize model weights
5. Set up automated retraining

## Project Structure

```
nfly/
├── packages/
│   ├── backend/              # Node.js API
│   │   ├── src/
│   │   │   ├── controllers/  # Business logic
│   │   │   ├── routes/       # API routes
│   │   │   ├── middleware/   # Auth, error handling
│   │   │   ├── config/       # Database connections
│   │   │   └── utils/        # Logger, helpers
│   │   └── db/
│   │       └── init.sql      # Database schema
│   │
│   ├── ml-service/           # Python ML API
│   │   ├── api/              # FastAPI routes
│   │   ├── services/         # ML models, predictions
│   │   ├── utils/            # Database, logger
│   │   └── models/           # Trained model files
│   │
│   └── mobile/               # React Native app (next)
│
├── docker-compose.yml        # Services orchestration
├── package.json              # Root dependencies
└── README.md                 # Project overview
```

## Tech Stack Summary

**Backend**
- Node.js + Express
- PostgreSQL (structured data)
- MongoDB (gematria cache)
- Redis (caching)
- JWT authentication
- Stripe payments

**ML Service**
- Python + FastAPI
- scikit-learn, XGBoost
- TensorFlow/PyTorch
- Pandas, NumPy
- Feature engineering

**Mobile** (Coming Next)
- React Native
- Redux/Context
- React Navigation
- Victory Native (charts)
- Stripe React Native SDK

## Troubleshooting

**Port already in use**
```bash
# Kill process on port 4100
npx kill-port 4100

# Or change PORT in .env files
```

**Database connection failed**
```bash
# Check if containers are running
docker ps

# Restart databases
docker-compose restart postgres mongodb redis
```

**ML models not found**
```bash
# Train models
curl -X POST http://localhost:5000/api/models/train
```

## License
MIT
