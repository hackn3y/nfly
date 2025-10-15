# NFL Predictor App

A modern NFL game prediction platform combining machine learning models with gematria-based analysis.

## Features

- **Machine Learning Predictions**: Advanced ML models (Random Forest, XGBoost, Neural Networks)
- **Gematria Analysis**: Multiple calculation methods for numerological insights
- **Real-time Updates**: Live injury news, weather, and line movements
- **Betting Tools**: Parlay optimizer, bankroll management, odds comparison
- **Mobile First**: React Native app for iOS and Android
- **Premium Tiers**: Free, Premium ($9.99/mo), and Pro ($29.99/mo) subscriptions

## Tech Stack

### Frontend
- React Native (mobile)
- Redux (state management)
- React Navigation
- Victory Native (charts)

### Backend
- Node.js + Express.js (API layer)
- Python + FastAPI (ML service)
- PostgreSQL (structured data)
- MongoDB (gematria calculations)
- Redis (caching)

### ML/AI
- scikit-learn
- XGBoost
- TensorFlow/PyTorch
- Pandas, NumPy

## Project Structure

```
nfly/
├── packages/
│   ├── mobile/          # React Native app
│   ├── backend/         # Node.js API server
│   └── ml-service/      # Python ML service
├── docker-compose.yml   # Local development environment
└── package.json         # Root package file
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Docker & Docker Compose
- React Native CLI
- iOS Simulator (Mac) or Android Studio

### Installation

1. **Clone and install dependencies**
```bash
npm run install:all
```

2. **Start databases with Docker**
```bash
npm run docker:up
```

3. **Start backend services**
```bash
# Terminal 1 - Node.js API
npm run dev:backend

# Terminal 2 - Python ML service
npm run dev:ml

# Terminal 3 - Mobile app
npm run dev:mobile
```

### Environment Variables

Create `.env` files in each package:

**packages/backend/.env**
```
DATABASE_URL=postgresql://nfluser:nflpass123@localhost:5432/nfl_predictor
MONGODB_URI=mongodb://nfluser:nflpass123@localhost:27017/nfl_gematria
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
ML_SERVICE_URL=http://localhost:5000
STRIPE_SECRET_KEY=sk_test_...
```

**packages/ml-service/.env**
```
DATABASE_URL=postgresql://nfluser:nflpass123@localhost:5432/nfl_predictor
REDIS_URL=redis://localhost:6379
```

## API Documentation

Once running, visit:
- Backend API: http://localhost:3000/api/docs
- ML Service: http://localhost:5000/docs

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Database Migrations
```bash
cd packages/backend
npm run migrate
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.

## Legal & Compliance

This app includes:
- Age verification (21+)
- Responsible gambling disclaimers
- State-by-state compliance
- Privacy policy (GDPR, CCPA)

**Important**: For entertainment purposes only. Past performance does not guarantee future results.

## License

MIT
