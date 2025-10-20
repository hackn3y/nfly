# NFL Predictor 🏈

AI-powered NFL game predictions combining machine learning models with gematria analysis. Built with React Native, Node.js, Python, and multiple ML models.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-18%2B-brightgreen)](https://nodejs.org/)
[![Python Version](https://img.shields.io/badge/python-3.10%2B-blue)](https://python.org/)

## 📱 Features

### Core Predictions
- **Multi-Model ML Predictions** - Ensemble of Random Forest, XGBoost, and Neural Networks
- **Gematria Analysis** - Numerological insights using multiple cipher systems
- **Confidence Scoring** - Transparent confidence levels for each prediction
- **Game Analysis** - Detailed breakdowns with key factors

### User Features
- **Subscription Tiers** - Free, Starter ($9.99), Premium ($19.99), Pro ($49.99)
- **Prediction History** - Track your prediction accuracy over time
- **Statistics Dashboard** - Detailed performance metrics
- **Favorite Teams** - Personalized predictions for your teams
- **Profile Management** - Edit preferences and settings

### Advanced Features
- **Daily Prediction Limits** - Tier-based access control
- **Parlay Optimizer** - Optimize multi-game bets (Pro tier)
- **Historical Trends** - Season-long prediction tracking
- **API Access** - Premium+ programmatic access

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and npm
- **Python 3.10+** and pip
- **Docker** and Docker Compose
- **PostgreSQL 15+**
- **MongoDB 7+**
- **Redis 7+**

### 1. Clone and Install

```bash
# Clone repository
git clone https://github.com/yourorg/nfl-predictor.git
cd nfl-predictor

# Install all dependencies
npm run install:all
```

### 2. Start Databases

```bash
# Start PostgreSQL, MongoDB, Redis with Docker
npm run docker:up

# Or use the batch file on Windows
start-all.bat
```

### 3. Configure Environment

Create environment files:

**Backend** (`packages/backend/.env`):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nfl_predictor
MONGODB_URI=mongodb://localhost:27017/nfl_predictor
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-change-in-production
ML_SERVICE_URL=http://localhost:5000
STRIPE_SECRET_KEY=sk_test_...
```

**ML Service** (`packages/ml-service/.env`):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nfl_predictor
REDIS_URL=redis://localhost:6379
DEBUG=true
```

### 4. Seed Sample Data

```bash
cd packages/backend
node src/scripts/seed-simple.js
```

### 5. Start All Services

```bash
# Start everything (Windows)
.\start-all.bat

# Or start individually:
npm run dev:backend   # Backend API (port 4100)
npm run dev:ml        # ML Service (port 5000)
npm run dev:mobile    # Mobile App (port 8100)
```

### 6. Access the App

- **Mobile Web**: http://localhost:8100
- **Backend API**: http://localhost:4100
- **ML Service**: http://localhost:5000
- **API Docs**: http://localhost:4100/api

**Default Login:**
- Email: `test@nflpredictor.com`
- Password: `password123`

## 📁 Project Structure

```
nfl-predictor/
├── packages/
│   ├── backend/              # Node.js/Express API
│   │   ├── src/
│   │   │   ├── controllers/  # Request handlers
│   │   │   ├── middleware/   # Auth, validation
│   │   │   ├── routes/       # API endpoints
│   │   │   ├── services/     # Business logic
│   │   │   ├── scripts/      # Seed, migrations
│   │   │   └── server.js     # Entry point
│   │   └── package.json
│   │
│   ├── ml-service/           # Python/FastAPI ML
│   │   ├── api/              # API routes
│   │   ├── models/           # Trained models
│   │   ├── services/         # ML logic
│   │   ├── training/         # Training scripts
│   │   └── app.py            # Entry point
│   │
│   └── mobile/               # React Native/Expo
│       ├── src/
│       │   ├── components/   # Reusable components
│       │   ├── navigation/   # App navigation
│       │   ├── screens/      # App screens
│       │   ├── services/     # API client
│       │   ├── store/        # Redux store
│       │   └── theme/        # Styling
│       └── App.js
│
├── docker-compose.yml        # Local development
├── start-all.bat             # Windows startup
├── stop-all.bat              # Windows shutdown
├── DEPLOYMENT_GUIDE.md       # Production deployment
└── README.md                 # This file
```

## 🏗️ Architecture

### Tech Stack

**Frontend (Mobile)**
- React Native + Expo
- Redux Toolkit (state management)
- React Navigation
- React Native Paper (UI components)
- Axios (API client)

**Backend (API)**
- Node.js + Express
- PostgreSQL (main database)
- MongoDB (gematria storage)
- Redis (caching)
- Stripe (payments)
- JWT (authentication)

**ML Service**
- Python + FastAPI
- scikit-learn (Random Forest)
- XGBoost (gradient boosting)
- TensorFlow (neural networks)
- Pandas/NumPy (data processing)

### Data Flow

```
Mobile App → Backend API → ML Service → PostgreSQL/MongoDB
                ↓              ↓
            Redis Cache    Redis Cache
                ↓
          Stripe (Payments)
```

## 🚀 Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for comprehensive production deployment instructions.

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

- **Documentation**: See QUICKSTART.md and DEPLOYMENT_GUIDE.md
- **Issues**: Create an issue in this repository
- **Email**: support@nflpredictor.com

---

**Built with ❤️ for NFL fans and data enthusiasts**
