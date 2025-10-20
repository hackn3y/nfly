# Setup Checklist

Follow these steps in order to get your NFL Predictor app running.

---

## ☐ Prerequisites (Do First)

### Required Software
- [ ] **Node.js 18+** installed
  - Check: Open terminal, run `node --version`
  - Should show v18.x.x or higher
  - Download: https://nodejs.org/

- [ ] **Python 3.10+** installed
  - Check: Open terminal, run `python --version`
  - Should show 3.10.x or higher
  - Download: https://www.python.org/

- [ ] **Docker Desktop** installed and running
  - Download: https://www.docker.com/products/docker-desktop
  - Install it
  - Start Docker Desktop
  - Wait for green "running" indicator

- [ ] **Git** installed (optional but recommended)
  - Check: `git --version`
  - Download: https://git-scm.com/

---

## ☐ Step 1: Install Dependencies

### Option A: Automated (Recommended)
- [ ] Open terminal in project folder
- [ ] Run: `setup.bat`
- [ ] Wait for all dependencies to install (5-10 minutes)

### Option B: Manual
- [ ] Backend: `cd packages\backend && npm install && cd ..\..`
- [ ] ML Service: `cd packages\ml-service && pip install -r requirements.txt && cd ..\..`
- [ ] Mobile: `cd packages\mobile && npm install && cd ..\..`

---

## ☐ Step 2: Verify Environment Files

- [ ] Check `packages/backend/.env` exists
- [ ] Check `packages/ml-service/.env` exists
- [ ] Both should have database URLs and settings

---

## ☐ Step 3: Start Docker Services

- [ ] Make sure Docker Desktop is running (green in taskbar)
- [ ] Open terminal in project folder
- [ ] Run: `docker-compose up -d`
- [ ] Wait 10-15 seconds for databases to start
- [ ] Verify: Run `docker ps` - should see 3 containers

---

## ☐ Step 4: Start Application Services

### Option A: Automated (Recommended)
- [ ] Run: `start-services.bat`
- [ ] Four windows should open:
  - Backend API (port 4100)
  - ML Service (port 5000)
  - Mobile App (Expo)
  - Command prompt

### Option B: Manual (4 separate terminals)
- [ ] Terminal 1: `cd packages\backend && npm run dev`
- [ ] Terminal 2: `cd packages\ml-service && python app.py`
- [ ] Terminal 3: `cd packages\mobile && npm start`
- [ ] Wait for each to fully start before opening next

---

## ☐ Step 5: Verify Everything is Running

### Backend API
- [ ] Open browser: http://localhost:4100/health
- [ ] Should see: `{"status":"healthy"...}`

### ML Service
- [ ] Open browser: http://localhost:5000/health
- [ ] Should see: `{"status":"healthy"...}`
- [ ] Open browser: http://localhost:5000/docs
- [ ] Should see Swagger API documentation

### Databases
- [ ] Run in terminal: `docker ps`
- [ ] Should see 3 containers running:
  - nfl-postgres
  - nfl-mongodb
  - nfl-redis

### Mobile App
- [ ] Expo DevTools should open in browser
- [ ] QR code should be visible
- [ ] No red error messages

---

## ☐ Step 6: Test the Mobile App

### On Computer (Web)
- [ ] In Expo window, press `w` for web
- [ ] Browser should open with app
- [ ] Should see welcome screen

### On Phone
- [ ] Install "Expo Go" from App Store or Play Store
- [ ] Make sure phone is on same WiFi as computer
- [ ] Scan QR code from Expo window
- [ ] App should load on phone

### Test Features
- [ ] Click "Get Started" button
- [ ] Fill out registration form
- [ ] Register new account (use fake email for testing)
- [ ] Should login and see dashboard
- [ ] Navigate to "Predictions" tab
- [ ] Navigate to "Gematria" tab
- [ ] Calculate gematria (e.g., "Kansas City Chiefs")
- [ ] Navigate to "Profile" tab

---

## ☐ Step 7: Test the Backend API

### Register User (via API)
Open PowerShell and run:
```powershell
$body = @{
    email = "test@example.com"
    password = "password123"
    firstName = "John"
    lastName = "Doe"
    dateOfBirth = "1990-01-01"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4100/api/auth/register" -Method POST -Body $body -ContentType "application/json"
```

- [ ] Should receive response with token and user data

### Login
```powershell
$body = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:4100/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $response.data.token
$token  # Save this for next commands
```

- [ ] Should receive token

### Get Predictions
```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:4100/api/predictions/upcoming" -Method GET -Headers $headers
```

- [ ] Should receive predictions data

### Calculate Gematria
```powershell
$body = @{
    text = "Kansas City Chiefs"
    methods = @("english", "pythagorean", "chaldean")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4100/api/gematria/calculate" -Method POST -Body $body -ContentType "application/json" -Headers $headers
```

- [ ] Should receive gematria calculations

---

## ☐ Troubleshooting

If something isn't working, check these:

### Port Already in Use
- [ ] Run: `npx kill-port 4100 5000 8100`
- [ ] Or restart your computer
- [ ] Then try starting services again

### Docker Issues
- [ ] Make sure Docker Desktop is running
- [ ] Run: `docker-compose down`
- [ ] Run: `docker-compose up -d`
- [ ] Wait 15 seconds
- [ ] Try again

### Database Connection Errors
- [ ] Check Docker is running: `docker ps`
- [ ] Check logs: `docker-compose logs postgres`
- [ ] Restart: `docker-compose restart`

### Module Not Found
- [ ] Re-run: `setup.bat`
- [ ] Or manually install in that package directory

### Mobile App Won't Load
- [ ] Clear Expo cache: `cd packages\mobile && npx expo start -c`
- [ ] Make sure backend is running
- [ ] Check that API URL in app.json is correct

---

## ☐ Optional: Configure External APIs

For real NFL data (do this later):

### The Odds API (Betting Lines)
- [ ] Sign up: https://the-odds-api.com/
- [ ] Get API key
- [ ] Add to `packages/backend/.env`: `ODDS_API_KEY=your_key`
- [ ] Add to `packages/ml-service/.env`: `ODDS_API_KEY=your_key`

### Weather API
- [ ] Sign up: https://openweathermap.org/api
- [ ] Get API key
- [ ] Add to both .env files: `WEATHER_API_KEY=your_key`

### ESPN API
- [ ] Sign up for ESPN API access
- [ ] Get API key
- [ ] Add to both .env files: `ESPN_API_KEY=your_key`

---

## ☐ Optional: Set Up Stripe (For Subscriptions)

- [ ] Sign up: https://stripe.com/
- [ ] Get test API keys from dashboard
- [ ] Add to `packages/backend/.env`:
  - `STRIPE_SECRET_KEY=sk_test_...`
  - `STRIPE_WEBHOOK_SECRET=whsec_...`
- [ ] Update mobile app with publishable key in `App.js`

---

## ✅ Success!

You'll know everything is working when:
- ✅ All 4 services are running without errors
- ✅ You can register and login in mobile app
- ✅ You can see predictions (even if mock data)
- ✅ Gematria calculator works
- ✅ API endpoints respond correctly
- ✅ No red errors in any terminal windows

---

## 🎯 Next Steps After Setup

1. **Explore the app** - Try all features
2. **Read the code** - Understand how it works
3. **Add real data** - Integrate APIs
4. **Train models** - Use historical data
5. **Customize** - Add your own features
6. **Deploy** - Put it on the cloud

---

## 📚 Documentation

- `QUICK_START.md` - Quick setup guide
- `STATUS.md` - Current status and next steps
- `SETUP.md` - Detailed technical setup
- `PROJECT_SUMMARY.md` - All features documented
- `README.md` - Project overview

---

**Having issues?** Check the Troubleshooting section above or review the error messages carefully.

**Everything working?** Congratulations! You have a fully functional NFL prediction app! 🏈🎉
