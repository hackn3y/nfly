# Railway Deployment - Quick Start Guide

Your code is already deployed on Railway! This guide will help you populate the production database and get predictions working.

## 🎯 Your Current Setup

- **GitHub**: https://github.com/hackn3y/nfly
- **Railway Backend**: https://nfl-predictorbackend-production.up.railway.app
- **Netlify Frontend**: Your mobile web app

**Status**: ✅ Code deployed, database needs to be populated

---

## Step 1: Install Railway CLI (5 minutes)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

This will open your browser to authenticate.

---

## Step 2: Link to Your Project (2 minutes)

```bash
# Navigate to your project
cd C:\Users\PC\Documents\nfly

# Link to Railway project
railway link

# Select your project: nfl-predictorbackend-production
```

---

## Step 3: Run Migrations on Railway (2 minutes)

```bash
# Run database migrations
railway run --service backend npm run migrate
```

**Expected output**:
```
🔄 Running migration: 001_add_espn_game_id.sql
✅ Completed: 001_add_espn_game_id.sql
...
✅ Successfully ran 10 migration(s)
✅ Database migrations complete!
```

---

## Step 4: Seed Production Database (3 minutes)

### Option A: Sample Data (Quick - Recommended for Testing)

```bash
railway run --service backend npm run seed
```

**What this does**:
- ✅ Creates 8 NFL teams
- ✅ Creates 4 upcoming sample games
- ✅ Creates 4 predictions with confidence scores
- ✅ Ready to test immediately

### Option B: Real ESPN Data (Takes longer)

```bash
# Import 2024 NFL season (272 games)
railway run --service backend npm run import:season 2024

# Note: These will be completed games from the past
# For future games, ESPN will need to release 2025 schedule
```

---

## Step 5: Verify It Works (2 minutes)

### Check Backend Health

```bash
curl https://nfl-predictorbackend-production.up.railway.app/health
```

**Expected response**:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "mongodb": "connected"
}
```

### Check Predictions (Without Auth)

```bash
# This should return 401 Unauthorized - which is GOOD!
curl https://nfl-predictorbackend-production.up.railway.app/api/predictions/upcoming
```

**Expected**:
```json
{
  "success": false,
  "message": "No token provided"
}
```

This means authentication is working! Users need to login first.

---

## Step 6: Test in Mobile App (5 minutes)

Your Netlify mobile app is already configured to connect to Railway:

**app.json already has**:
```json
"apiUrl": "https://nfl-predictorbackend-production.up.railway.app/api"
```

### Test the Flow:

1. **Open your Netlify app** in browser
2. **Register a new account**
3. **Login**
4. **View predictions** - You should see the 4 sample games!

---

## 🔄 Daily Updates (Optional)

To keep predictions fresh, you can run these manually or set up cron jobs:

### Manual Updates

```bash
# Update game scores
railway run --service backend npm run import:season 2024

# Regenerate predictions
railway run --service backend npm run generate:predictions
```

### Automated Updates (Railway Cron Job)

1. Go to Railway Dashboard → Your backend service
2. Click "Settings" → "Cron Jobs"
3. Add new cron job:

**Daily at 3 AM**:
```
0 3 * * * npm run import:season 2024 && npm run generate:predictions
```

---

## 📊 Database Management

### View Database

Railway has a built-in database browser:

1. Go to Railway Dashboard
2. Click on your PostgreSQL service
3. Click "Data" tab
4. Browse tables, run queries

### Backup Database

```bash
# Manual backup
railway run pg_dump $DATABASE_URL > backup.sql
```

Railway also does automatic daily backups.

### Reset Database (If Needed)

```bash
# Drop all data and start fresh
railway run psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Re-run migrations
railway run --service backend npm run migrate

# Re-seed
railway run --service backend npm run seed
```

---

## 🐛 Troubleshooting

### "Command not found: railway"

```bash
# Reinstall Railway CLI
npm install -g @railway/cli

# Or use npx
npx @railway/cli run npm run migrate
```

### "No service found"

```bash
# Make sure you're linked to the project
railway link

# Specify service explicitly
railway run --service backend npm run migrate
```

### "Database connection failed"

Check Railway Dashboard → PostgreSQL service → Make sure DATABASE_URL is set in backend service variables.

### "Migrations already executed"

This is normal! It means your database is up to date. The migration script skips already-run migrations.

### "No predictions returned"

1. Check if database has games:
   ```bash
   railway run --service backend -- psql $DATABASE_URL -c "SELECT COUNT(*) FROM games;"
   ```

2. Check if predictions exist:
   ```bash
   railway run --service backend -- psql $DATABASE_URL -c "SELECT COUNT(*) FROM predictions;"
   ```

3. Re-seed if needed:
   ```bash
   railway run --service backend npm run seed
   ```

---

## 🚀 What's Next?

After completing these steps, your production app will have:

✅ **Working Backend** on Railway
✅ **Working Databases** (PostgreSQL, MongoDB, Redis)
✅ **4 Sample Games** with predictions
✅ **Mobile App** connecting to production backend
✅ **Authentication** working
✅ **Subscription System** ready (Stripe)

### To Add More Data:

```bash
# Import full season
railway run --service backend npm run import:season 2024

# Import specific week
railway run --service backend npm run import:season 2024 10
```

### To Generate Predictions for ML Service:

```bash
# Requires ML service to be running
railway run --service backend npm run generate:predictions
```

---

## 📱 Mobile App Updates

When you make changes to the mobile app:

```bash
# Commit and push
git add .
git commit -m "Update mobile app"
git push origin master
```

Netlify will automatically rebuild and deploy!

---

## 💰 Cost Estimate

Your current Railway setup costs approximately:

- PostgreSQL: ~$5/month
- MongoDB: ~$5/month
- Redis: ~$3/month
- Backend Service: ~$5/month
- ML Service: ~$8/month

**Total: ~$26/month**

Railway provides $5 free credit when you start.

---

## 🎯 Quick Command Reference

```bash
# Check service health
curl https://nfl-predictorbackend-production.up.railway.app/health

# Run migrations
railway run --service backend npm run migrate

# Seed database
railway run --service backend npm run seed

# Import season
railway run --service backend npm run import:season 2024

# Generate predictions
railway run --service backend npm run generate:predictions

# View logs
railway logs --service backend

# Open Railway dashboard
railway open
```

---

## ✅ Done!

Your app is now live in production!

Test it out:
- Visit your Netlify app
- Register an account
- View predictions
- Test the gematria calculator
- Try the subscription system

**Congratulations!** 🎉
