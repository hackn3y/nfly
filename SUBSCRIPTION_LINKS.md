# 💳 NFL Predictor - Subscription Links

## 🎉 Your Stripe Payment Links are Ready!

These links allow users to subscribe without any code - just share the link!

---

## 📋 Subscription Tiers

### Premium Plan - $9.99/month
**Link**: https://buy.stripe.com/test_bJedR26O97TJ2pBaFE5EY00

**Features**:
- 20 predictions per day
- Advanced ML predictions (71% accuracy)
- Gematria + ML ensemble
- Email alerts
- Historical trends

**How to use**:
1. Share this link with users
2. They click and enter payment info
3. Automatically subscribed!

---

### Pro Plan - $29.99/month
**Link**: https://buy.stripe.com/test_5kQ7sEdcx7TJ1lx2985EY01

**Features**:
- Everything in Premium
- Unlimited predictions
- Live game predictions
- Advanced statistics
- Betting bankroll tracker
- Discord community access
- Early feature access

**How to use**:
1. Share this link with users
2. They click and enter payment info
3. Automatically subscribed!

---

## 🧪 Test the Links

### Test Card (Use in Stripe checkout):
- **Card**: `4242 4242 4242 4242`
- **Expiry**: `12/30`
- **CVC**: `123`
- **ZIP**: `12345`

### Test Email:
Use any email address - it won't actually charge in test mode!

---

## 🔗 How to Add Links to Your App

### Option 1: Mobile App Button
In your mobile app screens, add buttons:

```javascript
import { Linking } from 'react-native';

// Premium Button
<Button onPress={() => Linking.openURL('https://buy.stripe.com/test_bJedR26O97TJ2pBaFE')}>
  Subscribe to Premium
</Button>

// Pro Button
<Button onPress={() => Linking.openURL('https://buy.stripe.com/test_5kQ7sEdcx7TJ1lx298')}>
  Subscribe to Pro
</Button>
```

### Option 2: Website/Landing Page
Add HTML buttons:

```html
<!-- Premium -->
<a href="https://buy.stripe.com/test_bJedR26O97TJ2pBaFE"
   class="btn btn-premium">
  Subscribe to Premium - $9.99/mo
</a>

<!-- Pro -->
<a href="https://buy.stripe.com/test_5kQ7sEdcx7TJ1lx298"
   class="btn btn-pro">
  Subscribe to Pro - $29.99/mo
</a>
```

### Option 3: Share Directly
Just send the links via:
- Email
- Discord
- Twitter/X
- Text message
- WhatsApp

---

## 🎯 After User Subscribes

Stripe will automatically:
1. ✅ Create customer account
2. ✅ Process payment
3. ✅ Start subscription
4. ✅ Send receipt email
5. ⚠️ **Manual step needed**: Update user's subscription tier in your database

---

## 🔄 Connecting Subscriptions to Your App

Right now, when users pay via these links, you need to manually upgrade them in your database. To automate this:

### Option A: Use Stripe Webhooks (Recommended)
Your backend already has webhook support at:
- Endpoint: `http://localhost:4100/api/webhooks/stripe`
- For production, set up webhook in Stripe to your live domain

### Option B: Manual Updates (For Now)
1. User sends you their email after paying
2. You update their subscription tier:
   ```sql
   UPDATE users
   SET subscription_tier = 'premium'
   WHERE email = 'user@example.com';
   ```

---

## 💰 Revenue Tracking

Track your subscriptions in Stripe:
- Dashboard: https://dashboard.stripe.com/test/subscriptions
- See all active subscribers
- View monthly recurring revenue (MRR)
- Download reports

---

## 🚀 Go Live (Switch to Real Payments)

When ready for production:

1. **Switch Stripe to Live Mode**:
   - Toggle to "Live" mode in Stripe dashboard
   - Get live API keys (start with `sk_live_` and `pk_live_`)

2. **Create Live Payment Links**:
   - Create products in LIVE mode
   - Generate new payment links
   - Update your app with live links

3. **Update Backend**:
   - Replace test keys with live keys in `.env`
   - Restart backend

---

## 📊 Current Setup Summary

```
Test Mode:
├── Premium Link: https://buy.stripe.com/test_bJedR26O97TJ2pBaFE
├── Pro Link:     https://buy.stripe.com/test_5kQ7sEdcx7TJ1lx298
├── Test Card:    4242 4242 4242 4242
└── Status:       ✅ READY TO TEST

Live Mode:
├── Status:       ⏳ Not yet configured
└── Action:       Create when ready for real customers
```

---

## ✅ Next Steps

1. **Test the links** - Click them and complete a test payment
2. **Add to mobile app** - Add subscription buttons
3. **Share with beta users** - Get feedback
4. **Track subscriptions** - Monitor in Stripe dashboard
5. **Go live** - Switch to live mode when ready

---

## 🎉 Congratulations!

Your subscription system is ready! Users can now subscribe to:
- **Premium**: $9.99/month
- **Pro**: $29.99/month

No code required - just share the links! 🚀
