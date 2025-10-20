# API Keys Setup Guide

This guide will help you set up all the external API keys needed for the NFL Predictor app.

## Current Status

✅ **Database**: PostgreSQL populated with 1,351 games (2020-2025)
✅ **ML Models**: Trained and achieving 68-71% accuracy
⚠️ **External APIs**: Need real API keys (currently placeholders)

---

## Required API Keys

### 1. Stripe (Payment Processing) - REQUIRED

**Purpose**: Handle $9.99/month Premium and $29.99/month Pro subscriptions

**Steps**:
1. Go to https://dashboard.stripe.com/register
2. Create a free account
3. Navigate to **Developers** → **API Keys**
4. Copy your **Test** keys (start with `sk_test_` and `pk_test_`)
5. Create products:
   - Navigate to **Products** → **Add Product**
   - Create "Premium Plan" at $9.99/month → Copy the **Price ID** (starts with `price_`)
   - Create "Pro Plan" at $29.99/month → Copy the **Price ID**
6. Set up webhook:
   - Navigate to **Developers** → **Webhooks**
   - Add endpoint: `http://localhost:4100/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the **Webhook Secret** (starts with `whsec_`)

**Update in `.env`**:
```bash
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_SECRET_HERE
STRIPE_PRICE_PREMIUM=price_YOUR_PREMIUM_PRICE_ID_HERE
STRIPE_PRICE_PRO=price_YOUR_PRO_PRICE_ID_HERE
```

---

### 2. SendGrid (Email Service) - REQUIRED

**Purpose**: Send welcome emails, password resets, subscription notifications

**Steps**:
1. Go to https://signup.sendgrid.com/
2. Create a free account (100 emails/day free forever)
3. Complete sender verification:
   - Navigate to **Settings** → **Sender Authentication**
   - Verify a single sender email (e.g., noreply@yourdomain.com)
4. Create API key:
   - Navigate to **Settings** → **API Keys**
   - Click **Create API Key**
   - Give it **Full Access**
   - Copy the key (starts with `SG.`)

**Update in `.env`**:
```bash
SENDGRID_API_KEY=SG.YOUR_ACTUAL_KEY_HERE
SENDGRID_FROM_EMAIL=your_verified_email@yourdomain.com
SENDGRID_FROM_NAME=NFL Predictor
```

---

### 3. The Odds API (Betting Lines) - OPTIONAL

**Purpose**: Display live betting odds (spread, over/under, moneyline)

**Free Tier**: 500 requests/month

**Steps**:
1. Go to https://the-odds-api.com/
2. Sign up for free account
3. Navigate to your dashboard
4. Copy your **API Key**

**Update in `.env`**:
```bash
ODDS_API_KEY=YOUR_ACTUAL_KEY_HERE
```

**Note**: App works without this - it just won't show live odds

---

### 4. OpenWeather API (Weather Data) - OPTIONAL

**Purpose**: Weather conditions for outdoor games (wind, precipitation)

**Free Tier**: 1,000 calls/day

**Steps**:
1. Go to https://openweathermap.org/api
2. Sign up for free account
3. Navigate to **API keys** tab
4. Copy your **API Key**

**Update in `.env`**:
```bash
WEATHER_API_KEY=YOUR_ACTUAL_KEY_HERE
```

**Note**: App works without this - ML models use historical weather patterns

---

## Quick Start (Minimum Viable Setup)

For a functional app with subscriptions and email:

1. **Stripe** (10 minutes):
   - Create account
   - Copy test API keys
   - Create 2 products ($9.99 and $29.99)
   - Set up webhook

2. **SendGrid** (5 minutes):
   - Create account
   - Verify sender email
   - Copy API key

3. **Restart backend**:
   ```bash
   cd packages/backend
   npm run dev
   ```

---

## Testing Stripe Integration

Once configured, test subscriptions:

1. **Register a test user**:
   ```bash
   curl -X POST http://localhost:4100/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
   ```

2. **Create checkout session**:
   ```bash
   curl -X POST http://localhost:4100/api/subscriptions/create-checkout \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"priceId":"price_YOUR_PREMIUM_PRICE_ID"}'
   ```

3. **Use Stripe test card**:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - Zip: Any 5 digits

---

## Testing SendGrid Integration

Once configured, test emails:

```bash
# Trigger welcome email (happens automatically on registration)
curl -X POST http://localhost:4100/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"your_real_email@example.com","password":"test123","name":"Test User"}'
```

Check your inbox for the welcome email!

---

## Current Placeholders

The following keys in `packages/backend/.env` are **PLACEHOLDERS** and need to be replaced:

```bash
# ⚠️ REPLACE THESE WITH YOUR ACTUAL VALUES ⚠️
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
STRIPE_PRICE_PREMIUM=price_YOUR_PREMIUM_PRICE_ID_HERE
STRIPE_PRICE_PRO=price_YOUR_PRO_PRICE_ID_HERE
SENDGRID_API_KEY=SG.YOUR_SENDGRID_API_KEY_HERE
```

---

## Troubleshooting

### Stripe webhook not working
- Make sure webhook endpoint is `http://localhost:4100/api/webhooks/stripe`
- Verify webhook secret is correct
- Check backend logs for errors

### SendGrid emails not sending
- Verify sender email in SendGrid dashboard
- Check API key has full access
- Look for errors in backend logs: `Error sending email:`

### App works without API keys?
Yes! The app will function without optional APIs:
- **Without Stripe**: No subscriptions, all users have free tier
- **Without SendGrid**: No emails sent, but app still works
- **Without Odds API**: No live betting lines displayed
- **Without Weather API**: Uses historical weather patterns

---

## Production Deployment

When deploying to production (Railway, Heroku, AWS, etc.):

1. **Switch Stripe to live mode**:
   - Use keys starting with `sk_live_` and `pk_live_`
   - Update webhook endpoint to your production URL

2. **Verify SendGrid sender domain**:
   - Set up domain authentication for better deliverability
   - Update `SENDGRID_FROM_EMAIL` to your domain

3. **Change JWT_SECRET**:
   - Generate a strong random secret
   - Never reuse development secrets in production

4. **Set NODE_ENV**:
   ```bash
   NODE_ENV=production
   ```

---

## Summary

**Time to set up**:
- Minimum (Stripe + SendGrid): ~15 minutes
- Full setup (all APIs): ~30 minutes

**Cost**:
- Stripe: Free (2.9% + 30¢ per transaction)
- SendGrid: Free forever (100 emails/day)
- Odds API: Free (500 requests/month)
- Weather API: Free (1,000 calls/day)

**Total monthly cost**: $0 for development/testing!
