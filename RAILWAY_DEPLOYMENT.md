# Railway Deployment Guide

Complete guide to deploy NFL Predictor to Railway.app

## Prerequisites

- ✅ Stripe account configured
- ✅ Email (Gmail/SendGrid) configured
- ✅ Code committed to GitHub
- 💳 Credit card for Railway (free $5 credit, then ~$20/month)

---

## Step-by-Step Deployment

### 1. Prepare Your Repository (5 minutes)

#### Commit All Changes
```bash
git add .
git commit -m "Prepare for production deployment"
git push origin master
```

#### Create GitHub Repository (if not already)
1. Go to https://github.com/new
2. Name: `nfl-predictor`
3. Make it **private** (recommended for now)
4. Click "Create repository"
5. Push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/nfl-predictor.git
git branch -M main
git push -u origin main
```

---

### 2. Sign Up for Railway (2 minutes)

1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub
4. Authorize Railway to access your repositories

---

### 3. Create a New Project (15 minutes)

#### A. Create Backend Service

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose `nfl-predictor`
4. Railway will auto-detect it as a Node.js project

#### B. Configure Backend Service

1. Click on the service → "Settings"
2. **Root Directory**: Leave blank (monorepo detected)
3. **Build Command**: `cd packages/backend && npm install`
4. **Start Command**: `cd packages/backend && npm start`
5. **Port**: `4100`

#### C. Add Environment Variables

Click "Variables" tab and add ALL of these:

```bash
# Copy from your .env.production.example
NODE_ENV=production
PORT=4100
FRONTEND_URL=https://your-railway-app.up.railway.app

# Generate new JWT secret (run locally):
# node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
JWT_SECRET=<paste_generated_secret_here>
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Stripe (your real keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PREMIUM=price_...
STRIPE_PRICE_PRO=price_...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=NFL Predictor <noreply@nflpredictor.com>

# Features
ENABLE_SCHEDULER=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Database URLs (we'll add these next)
DATABASE_URL=${{Postgres.DATABASE_URL}}
MONGODB_URI=${{MongoDB.MONGODB_URI}}
REDIS_URL=${{Redis.REDIS_URL}}
ML_SERVICE_URL=http://${{ml-service.RAILWAY_PRIVATE_DOMAIN}}:8080
```

---

### 4. Add Database Services (10 minutes)

#### A. Add PostgreSQL

1. In your project, click "New" → "Database"
2. Select "PostgreSQL"
3. Railway will create it automatically
4. Name it: `Postgres`
5. It will auto-generate `DATABASE_URL` variable

#### B. Add MongoDB

**Option 1: Railway Plugin (if available)**
1. Click "New" → "Database"
2. Select "MongoDB" (if available)

**Option 2: MongoDB Atlas (Recommended - Free Tier)**
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create free cluster
3. Create database user
4. Whitelist IP: `0.0.0.0/0` (allow all - Railway has dynamic IPs)
5. Get connection string
6. Add to Railway variables: `MONGODB_URI=mongodb+srv://...`

#### C. Add Redis

1. Click "New" → "Database"
2. Select "Redis"
3. Railway will create it automatically
4. Name it: `Redis`
5. It will auto-generate `REDIS_URL` variable

---

### 5. Add ML Service (10 minutes)

1. In your project, click "New" → "GitHub Repo"
2. Select same `nfl-predictor` repo
3. Railway creates a new service

#### Configure ML Service

1. Click service → "Settings"
2. **Dockerfile Path**: `Dockerfile.ml`
3. **Root Directory**: Leave blank
4. **Port**: `8080` (Railway sets PORT=8080 automatically)

#### Add ML Environment Variables

```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
MODEL_PATH=/app/models
DEBUG=false
WORKERS=2
LOG_LEVEL=info
PREDICTIONS_CACHE_TTL=1800
STATS_CACHE_TTL=3600
```

---

### 6. Configure Networking (5 minutes)

#### Make ML Service Private

1. Click ML Service → "Settings"
2. Under "Networking"
3. **Disable** "Public Domain"
4. ML service now only accessible internally via `${{ML_Service.RAILWAY_PRIVATE_URL}}`

#### Get Backend Public URL

1. Click Backend service → "Settings"
2. Under "Networking" → "Public Domain"
3. Click "Generate Domain"
4. You'll get: `nfl-predictor-production.up.railway.app`
5. Copy this URL

#### Update Backend Environment Variables

1. Go back to Backend → "Variables"
2. Update `FRONTEND_URL` to the Railway URL

---

### 7. Initialize Database (5 minutes)

#### Run Migrations

**Option 1: One-time Job**
1. In Railway project, click "New"
2. Select "Empty Service"
3. Add these variables:
   ```bash
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```
4. In settings, set:
   - **Build Command**: `cd packages/backend && npm install`
   - **Start Command**: `cd packages/backend && npm run migrate`
5. Deploy once, then delete this service

**Option 2: Locally (if DATABASE_URL is accessible)**
```bash
# Set DATABASE_URL from Railway
export DATABASE_URL="postgresql://..."
cd packages/backend
npm run migrate
```

#### Seed Initial Data (Optional)

Same process but with:
- **Start Command**: `cd packages/backend && node src/scripts/seed-simple.js`

---

### 8. Deploy! (2 minutes)

1. Railway auto-deploys on git push
2. Or click "Deploy" button on each service
3. Wait for builds to complete (5-10 minutes first time)

**Monitor Deployment:**
- Click each service → "Deployments" tab
- Watch build logs
- Check for errors

---

### 9. Test Your Deployment (5 minutes)

#### Test Health Endpoints

```bash
# Replace with your Railway URL
curl https://nfl-predictor-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T...",
  "uptime": 123.45
}
```

#### Test User Registration

```bash
curl -X POST https://YOUR-RAILWAY-URL.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "name": "Test User"
  }'
```

#### Test Login

```bash
curl -X POST https://YOUR-RAILWAY-URL.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

#### Test ML Service (Internal)

```bash
# This should work from backend, test predictions endpoint:
curl https://YOUR-RAILWAY-URL.up.railway.app/api/predictions/upcoming \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 10. Configure Stripe Webhooks (5 minutes)

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://YOUR-RAILWAY-URL.up.railway.app/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy webhook signing secret
6. Add to Railway variables: `STRIPE_WEBHOOK_SECRET=whsec_...`

---

### 11. Set Up Custom Domain (Optional - 10 minutes)

#### Add Domain to Railway

1. Click Backend service → "Settings"
2. Under "Networking" → "Custom Domain"
3. Enter: `api.yourdomain.com`
4. Railway provides DNS records

#### Configure DNS

1. Go to your domain registrar (Namecheap, GoDaddy, etc.)
2. Add CNAME record:
   ```
   Type: CNAME
   Name: api
   Value: <railway-provided-value>
   TTL: 3600
   ```

#### SSL Certificate

Railway automatically provisions SSL certificates via Let's Encrypt (free!)

---

## Post-Deployment Checklist

- [ ] ✅ Backend service running
- [ ] ✅ ML service running
- [ ] ✅ PostgreSQL connected
- [ ] ✅ MongoDB connected
- [ ] ✅ Redis connected
- [ ] ✅ Health check returns 200
- [ ] ✅ User can register
- [ ] ✅ User can login
- [ ] ✅ Email sent on registration
- [ ] ✅ Stripe webhook configured
- [ ] ✅ Custom domain configured (if applicable)

---

## Monitoring & Maintenance

### View Logs

1. Click service → "Deployments"
2. Click latest deployment
3. View real-time logs

### View Metrics

1. Click service → "Metrics"
2. See CPU, Memory, Network usage

### Auto-Deploy on Push

Railway automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature X"
git push
```

### Environment Variables

To update environment variables:
1. Click service → "Variables"
2. Edit/add variables
3. Service auto-redeploys

### Scaling

**Vertical Scaling (More Resources):**
1. Click service → "Settings"
2. Under "Resources" (if available)
3. Increase RAM/CPU

**Horizontal Scaling (More Instances):**
- Railway Pro plan required (~$20/month)
- Enable in service settings

---

## Costs

### Railway Pricing

**Hobby Plan (Pay-as-you-go)**
- $5 free credit/month
- $0.000463/GB-hour RAM
- $0.000231/vCPU-hour

**Estimated Monthly Cost:**

| Component | RAM | vCPU | Hours/month | Cost |
|-----------|-----|------|-------------|------|
| Backend | 512MB | 0.5 | 730 | ~$5 |
| ML Service | 1GB | 1.0 | 730 | ~$12 |
| PostgreSQL | 256MB | 0.5 | 730 | ~$3 |
| Redis | 256MB | 0.5 | 730 | ~$3 |
| **Total** | | | | **~$23/month** |

**Pro Plan**: $20/month + usage (better performance, more features)

### Database Alternatives (Free Tiers)

**MongoDB Atlas**: Free 512MB
**Upstash Redis**: Free 10K commands/day
**Railway Postgres**: Included in usage pricing

**Optimized Cost (using free tiers):**
- Railway Backend + ML: ~$17/month
- MongoDB Atlas: Free
- Upstash Redis: Free
- **Total: ~$17/month**

---

## Troubleshooting

### Deployment Failed

**Check build logs:**
1. Click service → "Deployments"
2. Click failed deployment
3. Check "Build Logs" tab

**Common issues:**
- Missing `package.json` in subdirectory
- Wrong build/start commands
- Missing environment variables

### Database Connection Failed

**Check connection strings:**
```bash
# In Railway service, click "Variables"
# Verify DATABASE_URL format:
postgresql://user:password@host:port/database
```

**Check database status:**
1. Click database service
2. Ensure it's "Active"

### Service Crashes

**View runtime logs:**
1. Click service → "Deployments"
2. Click "View Logs"

**Common causes:**
- Missing environment variables
- Database connection timeout
- Port already in use (shouldn't happen on Railway)

### ML Service Can't Connect (502 Bad Gateway)

**Verify private domain URL:**
```bash
# Backend should use:
ML_SERVICE_URL=http://${{ml-service.RAILWAY_PRIVATE_DOMAIN}}:8080
```

Where `ml-service` is the exact name of your ML service in Railway.

**Not** the public URL! The ML service should be private-only for security.

---

## Rollback Deployment

If something goes wrong:

1. Click service → "Deployments"
2. Find last working deployment
3. Click "..." → "Redeploy"

---

## Security Best Practices

- ✅ Use strong JWT_SECRET (64+ char random)
- ✅ Never commit `.env` files
- ✅ Keep dependencies updated
- ✅ Enable CORS only for your domain
- ✅ Use Stripe webhook signature verification
- ✅ Keep ML service private (no public access)
- ✅ Use environment variables for all secrets
- ✅ Enable rate limiting
- ✅ Monitor error logs regularly

---

## Next Steps

After successful deployment:

1. **Test Everything**
   - Create test user account
   - Subscribe to premium tier
   - Test all API endpoints
   - Verify emails arrive

2. **Update Mobile App**
   - Change API URL in `packages/mobile/src/services/api.js`
   - Rebuild mobile app

3. **Marketing**
   - Add custom domain
   - Create landing page
   - Start beta testing

4. **Monitor**
   - Set up error tracking (Sentry)
   - Monitor Railway metrics
   - Track user signups

---

## Support

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app

---

**🚀 You're ready to deploy!**

Start with Step 1 and work through sequentially. The whole process takes about 60-90 minutes.
