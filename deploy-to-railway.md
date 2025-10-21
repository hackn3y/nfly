# Quick Railway Deployment

Your project: **extraordinary-warmth**

## Easiest Method: Use Railway Dashboard

### Step 1: Open Railway Dashboard
https://railway.app → extraordinary-warmth

### Step 2: Find Your Backend Service
Look for the service running your Node.js backend

### Step 3: Run Commands via Variables

Add this to your backend service's **Start Command** (in Settings):

```bash
npm run migrate && npm run seed && npm start
```

This will:
1. Run migrations on every deploy
2. Seed database if empty
3. Start the backend

### Step 4: Redeploy

Click "Deploy" button to trigger a new deployment.

---

## Alternative: Use Railway Run (From Project Root)

```bash
# From the root of your project
cd C:\Users\PC\Documents\nfly

# Run migration
railway run npm run migrate

# If it asks for service, just press Enter to use default

# Seed database
railway run npm run seed
```

---

## Check What Services You Have

```bash
cd C:\Users\PC\Documents\nfly
railway status
```

This will show all services in your project.

---

## Verify It Works

```bash
# Check backend health
curl https://nfl-predictorbackend-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

---

## Environment Variables to Check

Make sure these are set in Railway Dashboard → Backend Service → Variables:

- `DATABASE_URL` (auto-set by Railway)
- `MONGODB_URI` (auto-set by Railway)
- `REDIS_URL` (auto-set by Railway)
- `NODE_ENV=production`
- `JWT_SECRET=<your-secret>`
- `STRIPE_SECRET_KEY=<your-key>`

---

## Quick Test

After deployment, test your app:

1. Visit your Netlify mobile app
2. Register a new account
3. You should see predictions!

If you don't see predictions, run seed:
```bash
railway run npm run seed
```
