# NFL Predictor - Quickstart Guide

Get your NFL Predictor app running in **15 minutes**!

---

## ✅ Prerequisites

- Node.js 18+
- PostgreSQL 14+ running
- MongoDB 6+ running (or Docker)
- Redis (optional, for caching)

---

## 🚀 Quick Setup (Development)

### Step 1: Install Dependencies

```bash
# Install backend packages
cd packages/backend
npm install

# Install ML service packages
cd ../ml-service
pip install -r requirements.txt
```

### Step 2: Database Setup

```bash
# Create PostgreSQL database
createdb nfl_predictor -U postgres

# Create user
psql -U postgres -c "CREATE USER nfluser WITH PASSWORD 'nflpass123';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE nfl_predictor TO nfluser;"

# Run ALL migrations
cd packages/backend
psql -U nfluser -d nfl_predictor -f db/migrations/001_add_espn_game_id.sql
psql -U nfluser -d nfl_predictor -f db/migrations/002_add_user_role.sql
psql -U nfluser -d nfl_predictor -f db/migrations/003_add_stripe_fields.sql
psql -U nfluser -d nfl_predictor -f db/migrations/004_add_accuracy_tracking.sql
psql -U nfluser -d nfl_predictor -f db/migrations/005_add_email_preferences.sql
psql -U nfluser -d nfl_predictor -f db/migrations/006_add_password_reset.sql
```

### Step 3: Environment Configuration

Create `.env` file in `packages/backend`:

```bash
# Server
PORT=4100
NODE_ENV=development

# Database
DATABASE_URL=postgresql://nfluser:nflpass123@localhost:5432/nfl_predictor
MONGODB_URI=mongodb://localhost:27017/nfl_gematria
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10

# ML Service
ML_SERVICE_URL=http://localhost:5000

# Stripe (get from https://stripe.com)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
STRIPE_PRICE_STARTER=price_starter_id
STRIPE_PRICE_PREMIUM=price_premium_id
STRIPE_PRICE_PRO=price_pro_id

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=NFL Predictor <noreply@nflpredictor.com>

# Frontend
FRONTEND_URL=http://localhost:4100

# Job Scheduler
ENABLE_SCHEDULER=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 4: Start Services

```bash
# Terminal 1: Start backend
cd packages/backend
npm run dev

# Terminal 2: Start ML service
cd packages/ml-service
python -m uvicorn main:app --reload --port 5000

# Terminal 3: Start mobile app
cd packages/mobile
npx expo start
```

---

## 📊 Initial Data Setup

### 1. Create Test Admin User

```bash
curl -X POST http://localhost:4100/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123",
    "firstName": "Admin",
    "lastName": "User",
    "dateOfBirth": "1990-01-01"
  }'

# Make user admin
psql -U nfluser -d nfl_predictor -c "UPDATE users SET role = 'admin' WHERE email = 'admin@test.com';"
```

### 2. Sync NFL Data

```bash
# Login and get token
curl -X POST http://localhost:4100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}'

# Save the token, then sync current week
curl -X GET http://localhost:4100/api/nfl-data/sync \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Fetch Historical Data (for ML training)

```bash
# This runs in background and takes ~30 minutes
curl -X POST http://localhost:4100/api/nfl-data/historical \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"startSeason": 2020, "endSeason": 2024}'

# Check progress
psql -U nfluser -d nfl_predictor -c "SELECT season, COUNT(*) FROM games GROUP BY season ORDER BY season;"
```

### 4. Train ML Models

```bash
cd packages/ml-service
python training/train_models.py

# This will:
# - Load historical games from database
# - Train Random Forest, XGBoost, Neural Network
# - Save models to ml-service/models/
# - Output accuracy scores
```

---

## 🧪 Testing

### Test API Endpoints

```bash
# Health check
curl http://localhost:4100/health

# Get current games
curl http://localhost:4100/api/nfl-data/games/current

# Get subscription tiers
curl http://localhost:4100/api/subscriptions/tiers

# Get transparency stats (public)
curl http://localhost:4100/api/transparency/stats
```

### Test Admin Functions

```bash
# Get system stats
curl http://localhost:4100/api/admin/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Manually trigger results update
curl -X POST http://localhost:4100/api/admin/jobs/update-results/run \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Check job scheduler status
curl http://localhost:4100/api/admin/jobs/status \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 💳 Stripe Setup (for Payments)

### 1. Create Stripe Account

1. Go to https://stripe.com and sign up
2. Navigate to Dashboard → Developers → API Keys
3. Copy your **Secret Key** (starts with `sk_test_`)
4. Copy your **Publishable Key** (starts with `pk_test_`)

### 2. Create Products

1. Go to Dashboard → Products
2. Create 3 recurring products:

**Starter Plan:**
- Name: Starter
- Price: $9.99/month
- Copy the Price ID (starts with `price_`)

**Premium Plan:**
- Name: Premium
- Price: $19.99/month
- Copy the Price ID

**Pro Plan:**
- Name: Pro
- Price: $49.99/month
- Copy the Price ID

3. Update `.env` with all Price IDs

### 3. Setup Webhooks

1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
5. Copy the **Signing Secret** (starts with `whsec_`)
6. Update `STRIPE_WEBHOOK_SECRET` in `.env`

### 4. Test Webhook Locally

```bash
# Install Stripe CLI
npm install -g stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:4100/api/webhooks/stripe

# In another terminal, trigger test events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
```

---

## 📧 Email Setup

### Option 1: Gmail (Easiest for Development)

1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Go to App Passwords
4. Generate password for "Mail"
5. Use in `.env`:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

### Option 2: SendGrid (Recommended for Production)

1. Sign up at https://sendgrid.com
2. Create API Key
3. Use in `.env`:

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Option 3: Skip Email (Development Only)

Leave SMTP vars empty - emails will just be logged to console.

---

## 📅 Automated Jobs

The scheduler automatically runs these jobs:

| Job | Schedule | Purpose |
|-----|----------|---------|
| Results Update | Every hour | Check completed games, update accuracy |
| NFL Data Sync | 8 AM & 8 PM | Fetch latest games from ESPN |
| Weekly Summary | Mondays 9 AM | Email users their performance |
| Cache Cleanup | Daily 3 AM | Remove old gematria calculations |

To disable scheduler:
```bash
ENABLE_SCHEDULER=false
```

To run jobs manually:
```bash
# Via API
curl -X POST http://localhost:4100/api/admin/jobs/update-results/run \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Via Python
node
> const scheduler = require('./src/jobs/scheduler')
> await scheduler.runJob('results')
```

---

## 🔍 Monitoring & Debugging

### Check Logs

```bash
# Backend logs
tail -f packages/backend/logs/combined.log

# Errors only
tail -f packages/backend/logs/error.log
```

### Database Queries

```bash
# Total users
psql -U nfluser -d nfl_predictor -c "SELECT COUNT(*) FROM users;"

# Subscription breakdown
psql -U nfluser -d nfl_predictor -c "SELECT subscription_tier, COUNT(*) FROM users GROUP BY subscription_tier;"

# Prediction accuracy
psql -U nfluser -d nfl_predictor -c "SELECT * FROM v_transparency_stats;"

# Recent predictions
psql -U nfluser -d nfl_predictor -c "SELECT * FROM predictions ORDER BY created_at DESC LIMIT 10;"
```

---

## 🐛 Common Issues

### "Cannot connect to database"

```bash
# Check PostgreSQL is running
pg_isready

# If not, start it
# Windows: Services → PostgreSQL → Start
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### "Module not found"

```bash
# Reinstall dependencies
cd packages/backend
rm -rf node_modules
npm install
```

### "Stripe webhooks not working"

- Check webhook signing secret matches
- Ensure route is BEFORE body parser
- Use Stripe CLI for local testing
- Check Stripe Dashboard → Developers → Webhooks for errors

### "Emails not sending"

- Check SMTP credentials
- For Gmail, use App Password, not account password
- Check email service logs in console
- Try test email:

```javascript
const emailService = require('./src/services/email.service');
await emailService.sendWelcomeEmail('test@example.com', 'Test User');
```

---

## 🎯 Next Steps

### For Development:
1. ✅ Complete this quickstart
2. ✅ Sync NFL data
3. ✅ Train ML models
4. ✅ Test all API endpoints
5. Build frontend UI
6. Integrate mobile app

### For Production:
1. Change all secrets/passwords
2. Set up HTTPS/SSL
3. Use managed databases (AWS RDS, MongoDB Atlas)
4. Configure proper email service (SendGrid, Mailgun)
5. Set up monitoring (Sentry, DataDog)
6. Deploy backend (AWS, Heroku, Digital Ocean)
7. Deploy mobile app (App Store, Google Play)

---

## 📚 Documentation

- **[FEATURES_UPDATE_PART_2.md](./FEATURES_UPDATE_PART_2.md)** - Complete feature documentation
- **[NEW_FEATURES_IMPLEMENTED.md](./NEW_FEATURES_IMPLEMENTED.md)** - NFL data & admin features
- **[SECURITY_AUDIT.md](./SECURITY_AUDIT.md)** - Security best practices
- **[WHATS_MISSING.md](./WHATS_MISSING.md)** - Roadmap and future features

---

## 💡 Tips

- **Start small:** Get basic predictions working first
- **Test locally:** Use Stripe test mode and test email accounts
- **Monitor logs:** Always check logs when things don't work
- **Use admin panel:** The `/api/admin` endpoints help manage everything
- **Backup database:** Regularly backup your PostgreSQL database

---

## 🆘 Need Help?

Check the logs:
```bash
# Backend
tail -f packages/backend/logs/combined.log

# Specific service
DEBUG=* npm run dev
```

Database issues:
```bash
# Check connections
psql -U nfluser -d nfl_predictor -c "SELECT COUNT(*) FROM pg_stat_activity;"

# Check table sizes
psql -U nfluser -d nfl_predictor -c "\dt+"
```

---

**You're all set! Your NFL Predictor app is ready to make predictions** 🏈🎯
