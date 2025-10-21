# NFL Prediction System Guide

Complete guide to importing NFL seasons and generating predictions for the NFL Predictor app.

## Table of Contents

1. [Quick Start](#quick-start)
2. [System Architecture](#system-architecture)
3. [Importing Season Data](#importing-season-data)
4. [Generating Predictions](#generating-predictions)
5. [Featured Predictions](#featured-predictions)
6. [API Endpoints](#api-endpoints)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

1. **Services Running**:
   ```bash
   # Start Docker services (PostgreSQL, MongoDB, Redis)
   npm run docker:up

   # Start Backend API (port 4100)
   npm run dev:backend

   # Start ML Service (port 5000)
   npm run dev:ml
   ```

2. **Database Migrated**:
   ```bash
   cd packages/backend
   npm run migrate
   ```

### Import Current Season & Generate Predictions

```bash
cd packages/backend

# Step 1: Import 2024 NFL season from ESPN
npm run import:season 2024

# Step 2: Generate predictions for all upcoming games
npm run generate:predictions

# Done! Predictions are now available via API
```

### View Predictions

```bash
# Get all upcoming predictions
curl http://localhost:4100/api/predictions/upcoming

# Get specific game prediction
curl http://localhost:4100/api/predictions/game/123

# Get weekly predictions
curl http://localhost:4100/api/predictions/weekly?week=10&season=2024
```

---

## System Architecture

### Data Flow

```
ESPN API → import-nfl-season.js → PostgreSQL (games, teams)
                                        ↓
                                  ML Service (prediction generation)
                                        ↓
                                  PostgreSQL (predictions)
                                        ↓
                                  Backend API (cached in Redis)
                                        ↓
                                  Mobile App / Users
```

### Key Components

1. **ESPN API Service** (`packages/backend/src/services/espn-api.service.js`)
   - Fetches real NFL data from ESPN's public API
   - Provides game schedules, team info, scores, odds, weather

2. **Import Script** (`packages/backend/src/scripts/import-nfl-season.js`)
   - Downloads complete season schedule from ESPN
   - Stores teams and games in PostgreSQL
   - Updates game scores and status automatically

3. **ML Service** (`packages/ml-service/`)
   - Python FastAPI service running machine learning models
   - Generates predictions using ensemble of models
   - Combines predictions with gematria insights

4. **Prediction Generator** (`packages/backend/src/scripts/generate-predictions.js`)
   - Calls ML service for each upcoming game
   - Stores predictions in database
   - Clears Redis cache to show new predictions

---

## Importing Season Data

### Import Entire Season

```bash
cd packages/backend
npm run import:season 2024
```

**What It Does:**
- ✅ Imports all 32 NFL teams with logos, colors, divisions
- ✅ Imports all regular season games (Weeks 1-18)
- ✅ Updates game scores and status (scheduled, in progress, completed)
- ✅ Stores odds (spread, over/under), weather, venue information
- ✅ Creates database indexes for fast queries

**Output Example:**
```
🏈 NFL Season Import Tool
==========================

Season: 2024
Week: All weeks (1-18)

📋 Step 1: Importing NFL teams...
✅ Imported 32 teams

🏈 Step 2: Importing games...
  Week 1...
  ✅ Week 1: 16 games imported
  Week 2...
  ✅ Week 2: 16 games imported
  ...

✅ Total games imported: 272

📊 Import Summary
================

Season 2024 Games:
  📅 Upcoming:     48
  ⚡ In Progress:  0
  ✅ Completed:    224
  📊 Total:        272

🎯 Next Game: Kansas City Chiefs @ Buffalo Bills
   Sun Oct 20 2024 1:00 PM

🎉 Season import completed successfully!
```

### Import Specific Week

```bash
# Import only Week 10
npm run import:season 2024 10
```

### Update Game Results

Run the import script again to update scores and status:

```bash
# Updates all games (only modifies changed data)
npm run import:season 2024
```

The script uses `ON CONFLICT DO UPDATE` so it's safe to run multiple times.

---

## Generating Predictions

### Generate Predictions for All Upcoming Games

```bash
cd packages/backend
npm run generate:predictions
```

**What It Does:**
- ✅ Finds all upcoming games without predictions
- ✅ Calls ML service to generate predictions
- ✅ Stores predictions in database
- ✅ Clears Redis cache
- ✅ Shows featured predictions (highest confidence)

**Output Example:**
```
🔮 NFL Prediction Generator
===========================

📋 Step 1: Finding upcoming games...
Found 16 games needing predictions

🤖 Step 2: Generating predictions via ML service...
  Buffalo Bills @ Kansas City Chiefs (10/20/2024)...
  ✅ Generated (72.3% confidence)
  Dallas Cowboys @ San Francisco 49ers (10/20/2024)...
  ✅ Generated (68.5% confidence)
  ...

✅ Generated 16 predictions

🗑️  Step 3: Clearing prediction cache...
✅ Cleared 8 cache keys

📊 Prediction Summary
====================

Total Predictions: 48
Average Confidence: 0.66

Confidence Distribution:
  🔥 High (≥70%):   12 predictions
  ⚡ Medium (60-70%): 28 predictions
  ⚠️  Low (<60%):    8 predictions

⭐ Featured Predictions (Highest Confidence):
  1. Buffalo Bills @ Kansas City Chiefs
     Winner: Kansas City Chiefs (72.3% confidence)
     Spread: -3.5

  2. Miami Dolphins @ Philadelphia Eagles
     Winner: Philadelphia Eagles (71.8% confidence)
     Spread: -7.0

🎉 Prediction generation completed!
```

### Generate Limited Number

```bash
# Generate predictions for next 5 games only
npm run generate:predictions 5
```

### Regenerate All Predictions

To regenerate predictions (e.g., after ML model update):

```bash
# Delete existing predictions
psql $DATABASE_URL -c "DELETE FROM predictions WHERE game_id IN (SELECT id FROM games WHERE status = 'scheduled')"

# Regenerate
npm run generate:predictions
```

---

## Featured Predictions

### What Are Featured Predictions?

Featured predictions are the **highest confidence picks** from the ML model. These represent games where:
- Model confidence ≥ 70%
- Multiple models agree on the outcome
- Key factors strongly favor one team
- Historical matchup data is strong

### How to Get Featured Predictions

#### Via API

```bash
# Get all upcoming predictions sorted by confidence
curl "http://localhost:4100/api/predictions/upcoming" | jq 'sort_by(.confidence) | reverse | .[0:5]'

# Get predictions with minimum confidence threshold
curl "http://localhost:4100/api/predictions/upcoming?minConfidence=0.70"
```

#### Via Database Query

```sql
SELECT
  g.home_team,
  g.away_team,
  g.game_date,
  p.predicted_winner,
  p.confidence_score,
  p.spread_prediction,
  p.key_factors
FROM predictions p
JOIN games g ON p.game_id = g.id
WHERE g.status = 'scheduled'
  AND g.game_date > NOW()
  AND p.confidence_score >= 0.70
ORDER BY p.confidence_score DESC
LIMIT 10;
```

### Understanding Confidence Scores

| Confidence | Interpretation | Recommended Action |
|-----------|---------------|-------------------|
| **≥ 80%** | Very High | Strong pick - model very confident |
| **70-80%** | High | Good pick - favorable matchup |
| **60-70%** | Medium | Reasonable pick - slight edge |
| **50-60%** | Low | Toss-up - model uncertain |
| **< 50%** | Very Low | Avoid - no clear edge |

### Key Factors

Each prediction includes key factors explaining the pick:

```json
{
  "game_id": 123,
  "predicted_winner": "Kansas City Chiefs",
  "confidence": 0.723,
  "key_factors": [
    "Home field advantage (+2.5 points)",
    "Quarterback rating differential (+8.5)",
    "Defensive ranking (Chiefs #3, Bills #12)",
    "Recent form (Chiefs 7-1, Bills 5-3)",
    "Weather favorable for passing game"
  ]
}
```

---

## API Endpoints

### Authentication

All prediction endpoints require authentication:

```bash
# Login to get token
curl -X POST http://localhost:4100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Response includes token
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}

# Use token in subsequent requests
curl http://localhost:4100/api/predictions/upcoming \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET /api/predictions/upcoming

Get all upcoming game predictions.

**Query Parameters:**
- `minConfidence` (optional): Filter by minimum confidence (0.0 - 1.0)
- `limit` (optional): Limit number of results

**Example:**
```bash
curl "http://localhost:4100/api/predictions/upcoming?minConfidence=0.70&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "game_id": 401547394,
      "season": 2024,
      "week": 10,
      "game_date": "2024-10-20T17:00:00Z",
      "home_team": "Kansas City Chiefs",
      "away_team": "Buffalo Bills",
      "home_abbr": "KC",
      "away_abbr": "BUF",
      "predicted_winner": "Kansas City Chiefs",
      "predicted_score": {
        "home": 31,
        "away": 24
      },
      "confidence": 0.723,
      "spread_prediction": -6.5,
      "over_under_prediction": 54.5,
      "key_factors": [
        "Home field advantage",
        "Elite QB matchup",
        "Strong defensive front"
      ],
      "gematria_insights": {...},
      "injuries": {...},
      "weather": {...}
    }
  ],
  "cached": false
}
```

### GET /api/predictions/game/:gameId

Get detailed prediction for a specific game.

**Example:**
```bash
curl http://localhost:4100/api/predictions/game/401547394 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "game_id": 401547394,
    "predicted_winner": "Kansas City Chiefs",
    "confidence": 0.723,
    "predicted_score": {
      "home": 31,
      "away": 24
    },
    "spread_prediction": -6.5,
    "over_under_prediction": 54.5,
    "model_breakdown": {
      "random_forest": 0.75,
      "xgboost": 0.71,
      "neural_network": 0.68,
      "ensemble": 0.723
    },
    "key_factors": [...],
    "gematria_insights": {...},
    "injuries": {...},
    "weather": {...},
    "venue": {...}
  }
}
```

### GET /api/predictions/weekly

Get predictions for a specific week.

**Query Parameters:**
- `week` (required): Week number (1-18)
- `season` (required): Season year (e.g., 2024)

**Example:**
```bash
curl "http://localhost:4100/api/predictions/weekly?week=10&season=2024" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### POST /api/predictions/parlay

Optimize parlay selections (Pro tier only).

**Request Body:**
```json
{
  "game_ids": [401547394, 401547395, 401547396],
  "max_selections": 5,
  "target_odds": 10.0
}
```

**Example:**
```bash
curl -X POST http://localhost:4100/api/predictions/parlay \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "game_ids": [401547394, 401547395, 401547396],
    "max_selections": 3
  }'
```

### GET /api/predictions/stats

Get model performance statistics (Premium+ only).

**Example:**
```bash
curl http://localhost:4100/api/predictions/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overall_accuracy": 0.643,
    "spread_accuracy": 0.589,
    "total_predictions": 1847,
    "correct_predictions": 1187,
    "by_confidence": {
      "high": { "accuracy": 0.721, "count": 412 },
      "medium": { "accuracy": 0.638, "count": 891 },
      "low": { "accuracy": 0.521, "count": 544 }
    }
  }
}
```

---

## Troubleshooting

### ML Service Not Running

**Error:**
```
❌ ML Service is not running!
   Please start it first: npm run dev:ml
```

**Solution:**
```bash
cd packages/ml-service
python app.py
```

### ESPN API Rate Limiting

**Error:**
```
ESPN API error (week 10): Request failed with status code 429
```

**Solution:**
The import script includes 500ms delays between requests. If you still hit rate limits:

```bash
# Import one week at a time with longer delays
npm run import:season 2024 1
sleep 60
npm run import:season 2024 2
# etc.
```

### Database Connection Error

**Error:**
```
Error: connect ECONNREFUSED
```

**Solution:**
```bash
# Make sure Docker services are running
npm run docker:up

# Check PostgreSQL is accessible
psql $DATABASE_URL -c "SELECT 1"
```

### No Games Found

**Error:**
```
Found 0 games needing predictions
```

**Reason:** All upcoming games already have predictions.

**Solution:**
```bash
# Check existing predictions
psql $DATABASE_URL -c "
  SELECT COUNT(*) FROM predictions p
  JOIN games g ON p.game_id = g.id
  WHERE g.status = 'scheduled'
"

# If you want to regenerate, delete and re-run
psql $DATABASE_URL -c "DELETE FROM predictions"
npm run generate:predictions
```

### Prediction Generation Fails

**Error:**
```
❌ Error: Failed to fetch predictions
```

**Solution:**
```bash
# Check ML service health
curl http://localhost:5000/health

# Check ML service logs
cd packages/ml-service
tail -f logs/ml-service.log

# Try generating for single game
curl http://localhost:5000/api/predictions/game/123
```

### Cache Issues

If predictions aren't updating:

```bash
# Clear Redis cache
redis-cli FLUSHALL

# Or use script
cd packages/backend
node -e "
  const { getRedisClient } = require('./src/config/database');
  const redis = getRedisClient();
  redis.flushAll().then(() => console.log('Cache cleared'));
"
```

---

## Best Practices

### 1. Daily Workflow

```bash
# Morning: Update game data and scores
npm run import:season 2024

# Generate new predictions for newly scheduled games
npm run generate:predictions

# Evening: Update final scores
npm run import:season 2024
```

### 2. Production Automation

Set up cron jobs:

```cron
# Update games and scores every 6 hours
0 */6 * * * cd /app/packages/backend && npm run import:season 2024

# Generate predictions daily at 3 AM
0 3 * * * cd /app/packages/backend && npm run generate:predictions

# Clear old cache weekly
0 0 * * 0 redis-cli FLUSHALL
```

### 3. Monitoring

```bash
# Check prediction coverage
psql $DATABASE_URL -c "
  SELECT
    COUNT(*) FILTER (WHERE p.id IS NOT NULL) as with_predictions,
    COUNT(*) FILTER (WHERE p.id IS NULL) as without_predictions
  FROM games g
  LEFT JOIN predictions p ON g.id = p.game_id
  WHERE g.status = 'scheduled' AND g.game_date > NOW()
"

# Check model accuracy
psql $DATABASE_URL -c "
  SELECT
    COUNT(*) FILTER (WHERE p.prediction_correct = true)::float /
    COUNT(*)::float as accuracy
  FROM predictions p
  JOIN games g ON p.game_id = g.id
  WHERE g.status = 'post' AND p.prediction_correct IS NOT NULL
"
```

---

## Additional Resources

- [CLAUDE.md](./CLAUDE.md) - Full project documentation
- [TESTING.md](./TESTING.md) - Testing guide
- [PERFORMANCE.md](./PERFORMANCE.md) - Performance optimization
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) - Production readiness

For questions or issues, check the logs:
- Backend: `packages/backend/logs/`
- ML Service: `packages/ml-service/logs/`
