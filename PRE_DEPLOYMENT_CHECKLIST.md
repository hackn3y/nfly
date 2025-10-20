# Pre-Deployment Checklist

Complete this checklist before deploying to production.

## ✅ Environment Configuration

### Backend Environment Variables
- [ ] `NODE_ENV=production`
- [ ] `PORT=4100`
- [ ] `JWT_SECRET` - Strong 64-character random string (generated with crypto)
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `MONGODB_URI` - MongoDB connection string
- [ ] `REDIS_URL` - Redis connection string
- [ ] `FRONTEND_URL` - Your production domain
- [ ] `ML_SERVICE_URL` - ML service URL (internal)

### Stripe Configuration (✅ Already Done)
- [x] `STRIPE_SECRET_KEY` - Live secret key
- [x] `STRIPE_PUBLISHABLE_KEY` - Live publishable key
- [x] `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- [x] `STRIPE_PRICE_STARTER` - Starter tier price ID
- [x] `STRIPE_PRICE_PREMIUM` - Premium tier price ID
- [x] `STRIPE_PRICE_PRO` - Pro tier price ID

### Email Configuration (✅ Already Done)
- [x] `SMTP_HOST` - SMTP server
- [x] `SMTP_PORT` - SMTP port
- [x] `SMTP_USER` - Email username
- [x] `SMTP_PASS` - Email password/app password
- [x] `EMAIL_FROM` - From address

### ML Service Environment Variables
- [ ] `DATABASE_URL` - Same as backend
- [ ] `REDIS_URL` - Same as backend
- [ ] `MODEL_PATH=/app/models`
- [ ] `DEBUG=false`
- [ ] `WORKERS=4`

---

## ✅ Security Checklist

- [ ] All `.env` files are in `.gitignore`
- [ ] No secrets committed to git repository
- [ ] Strong JWT secret generated (64+ characters)
- [ ] All default passwords changed
- [ ] CORS configured for production domain only
- [ ] Rate limiting enabled (100 req/15min default)
- [ ] Helmet.js security headers enabled
- [ ] HTTPS enforced (Railway handles this automatically)
- [ ] Stripe webhook signature verification enabled

---

## ✅ Code Quality

- [ ] All linting errors resolved (`npm run lint`)
- [ ] No console.log statements in production code
- [ ] Error handling implemented for all routes
- [ ] Input validation on all endpoints
- [ ] Database queries properly parameterized (SQL injection prevention)
- [ ] Authentication middleware applied to protected routes

---

## ✅ Database Setup

- [ ] PostgreSQL database created
- [ ] MongoDB database created
- [ ] Redis instance created
- [ ] Migrations run successfully (`npm run migrate`)
- [ ] Seed data loaded (optional: `node src/scripts/seed-simple.js`)
- [ ] Database backups configured (Railway handles automatically)

---

## ✅ Testing

### Local Testing
- [ ] Backend starts without errors (`npm run dev:backend`)
- [ ] ML service starts without errors (`npm run dev:ml`)
- [ ] Health check returns 200: `curl http://localhost:4100/health`
- [ ] User registration works
- [ ] User login works
- [ ] Email sent on registration
- [ ] JWT authentication works
- [ ] Protected routes reject unauthenticated requests

### API Testing
- [ ] Test registration: `POST /api/auth/register`
- [ ] Test login: `POST /api/auth/login`
- [ ] Test predictions: `GET /api/predictions/upcoming`
- [ ] Test gematria: `POST /api/gematria/calculate`
- [ ] Test profile: `GET /api/users/me`

---

## ✅ Deployment Platform

### Railway Setup
- [ ] Railway account created
- [ ] GitHub repository connected
- [ ] Backend service configured
- [ ] ML service configured
- [ ] PostgreSQL database added
- [ ] MongoDB database added (or Atlas configured)
- [ ] Redis database added
- [ ] All environment variables set
- [ ] Services linked properly

### Networking
- [ ] ML service set to private (no public access)
- [ ] Backend public domain generated
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (auto via Railway)

---

## ✅ External Services

### Stripe
- [x] Account created and verified
- [x] Products created (Free, Premium $9.99, Pro $29.99)
- [ ] Webhook endpoint configured: `https://your-domain.com/api/webhooks/stripe`
- [ ] Webhook events selected:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_succeeded`
  - [ ] `invoice.payment_failed`
- [ ] Test payment processed successfully

### Email
- [x] Email service configured (Gmail/SendGrid)
- [ ] Test email sent successfully
- [ ] Email templates reviewed
- [ ] From address verified (if using SendGrid)

---

## ✅ Monitoring & Logging

- [ ] Error logging working (check Railway logs)
- [ ] Health checks configured
- [ ] Uptime monitoring set up (optional: UptimeRobot)
- [ ] Error tracking set up (optional: Sentry)

---

## ✅ Mobile App Configuration

- [ ] Update API URL in `packages/mobile/src/services/api.js`
- [ ] Change from `http://localhost:4100` to production URL
- [ ] Test mobile app connects to production API
- [ ] Rebuild mobile app for production

---

## ✅ Documentation

- [x] README.md updated
- [x] API documentation complete
- [x] Deployment guide created
- [x] Environment variables documented
- [ ] Known issues documented (if any)

---

## ✅ Legal & Compliance

### Terms of Service
- [ ] Terms of Service created
- [ ] Privacy Policy created
- [ ] Responsible gambling disclaimers added
- [ ] Age verification (21+) implemented
- [ ] 1-800-GAMBLER helpline displayed

### Data Protection
- [ ] GDPR compliance reviewed (if EU users)
- [ ] CCPA compliance reviewed (California users)
- [ ] Data retention policy defined
- [ ] User data deletion process implemented

---

## ✅ Git & Version Control

- [ ] All changes committed
- [ ] Commit messages descriptive
- [ ] No sensitive files tracked
- [ ] `.gitignore` properly configured
- [ ] Code pushed to GitHub/GitLab
- [ ] Repository set to private (recommended)

---

## ✅ Final Pre-Launch

- [ ] All above sections completed
- [ ] Production environment variables verified
- [ ] Test account created and tested
- [ ] Stripe test payment successful
- [ ] Email notifications working
- [ ] ML predictions returning results
- [ ] Admin access verified
- [ ] Error handling tested
- [ ] Rate limiting tested
- [ ] CORS working correctly

---

## 🚀 Ready to Deploy!

Once all items are checked:

1. **Commit final changes:**
   ```bash
   git add .
   git commit -m "Production ready - all pre-deployment checks complete"
   git push
   ```

2. **Deploy to Railway:**
   - Follow `RAILWAY_DEPLOYMENT.md`
   - Deploy takes ~10-15 minutes

3. **Post-deployment verification:**
   - Test all critical endpoints
   - Verify email notifications
   - Test payment flow
   - Check logs for errors

---

## Generated Secrets

**JWT Secret** (keep secure!):
```
2vTa1+78jyKBjKf6M39qMNFJ+E2t75ABtLkQKjl1kav9sTHUWhumnixLhx7JzPQjDl2qg+mU74NZbtxmmcfZ7g==
```

To generate a new one:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

---

## Support

Issues during deployment? Check:
1. `RAILWAY_DEPLOYMENT.md` - Step-by-step guide
2. `DEPLOYMENT_GUIDE.md` - General deployment info
3. Railway logs - Click service → Deployments → View Logs
4. Railway Discord - https://discord.gg/railway

---

**Last Updated:** January 2025
