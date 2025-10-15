# Quick Start Guide

## Prerequisites Check

Before starting, make sure you have:

- [x] **Node.js 18+** - Download from https://nodejs.org/
- [x] **Python 3.10+** - Download from https://www.python.org/
- [ ] **Docker Desktop** - Download from https://www.docker.com/products/docker-desktop
- [ ] **Git** (optional) - Download from https://git-scm.com/

Check your installations:
```bash
node --version   # Should be v18 or higher
python --version # Should be 3.10 or higher
docker --version # Install if not present
```

---

## Option 1: Automated Setup (Windows)

### Step 1: Run Setup Script
```bash
setup.bat
```

This will:
- Install all Node.js dependencies
- Install all Python dependencies
- Create necessary directories

### Step 2: Install Docker Desktop
1. Download from https://www.docker.com/products/docker-desktop
2. Install and start Docker Desktop
3. Wait for Docker to fully start (check system tray icon)

### Step 3: Start All Services
```bash
start-services.bat
```

This will open 4 windows:
- Databases (Docker)
- Backend API (Node.js)
- ML Service (Python)
- Mobile App (Expo)

---

## Option 2: Manual Setup

### Step 1: Install Dependencies

**Backend:**
```bash
cd packages/backend
npm install
cd ../..
```

**ML Service:**
```bash
cd packages/ml-service
pip install -r requirements.txt
cd ../..
```

**Mobile App:**
```bash
cd packages/mobile
npm install
cd ../..
```

### Step 2: Start Docker Services

Install Docker Desktop if you haven't:
- Download: https://www.docker.com/products/docker-desktop
- Start Docker Desktop
- Wait for it to be ready (green light in system tray)

Then start the databases:
```bash
docker-compose up -d
```

Wait 10-15 seconds for databases to initialize.

### Step 3: Start Backend API

Open a new terminal:
```bash
cd packages/backend
npm run dev
```

Backend will start on http://localhost:3000

### Step 4: Start ML Service

Open another terminal:
```bash
cd packages/ml-service
python app.py
```

ML Service will start on http://localhost:5000

### Step 5: Start Mobile App

Open another terminal:
```bash
cd packages/mobile
npm start
```

Expo will open. Press:
- `a` for Android emulator
- `i` for iOS simulator (Mac only)
- `w` for web browser
- Or scan QR code with Expo Go app on your phone

---

## Verification

### Check if services are running:

**Backend API:**
```bash
curl http://localhost:3000/health
```
Expected: `{"status":"healthy"...}`

**ML Service:**
```bash
curl http://localhost:5000/health
```
Expected: `{"status":"healthy"...}`

**Databases:**
```bash
docker ps
```
Expected: 3 containers running (postgres, mongodb, redis)

---

## Testing the App

### 1. Test Backend API

**Register a user:**
```bash
curl -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\",\"firstName\":\"John\",\"lastName\":\"Doe\",\"dateOfBirth\":\"1990-01-01\"}"
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

Save the token from the response.

**Get predictions (replace YOUR_TOKEN):**
```bash
curl http://localhost:3000/api/predictions/upcoming ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Test ML Service

Visit: http://localhost:5000/docs

This opens Swagger UI where you can test all ML endpoints.

### 3. Test Mobile App

1. Open the Expo app
2. Try registering a new account
3. Navigate through the tabs
4. Test the gematria calculator

---

## Troubleshooting

### Port Already in Use

**Kill processes on specific ports:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use npx
npx kill-port 3000 3001 5000 8081
```

### Docker Not Starting

1. Make sure Docker Desktop is installed and running
2. Check Docker Desktop settings
3. Try restarting Docker Desktop
4. Run: `docker-compose down` then `docker-compose up -d`

### Database Connection Failed

```bash
# Check if databases are running
docker ps

# View database logs
docker-compose logs postgres
docker-compose logs mongodb
docker-compose logs redis

# Restart databases
docker-compose restart
```

### Module Not Found Errors

```bash
# Backend
cd packages/backend && npm install

# ML Service
cd packages/ml-service && pip install -r requirements.txt

# Mobile
cd packages/mobile && npm install
```

### Python Dependencies Fail

Make sure you have Python 3.10+:
```bash
python --version
```

If you have multiple Python versions:
```bash
py -3.10 -m pip install -r requirements.txt
```

---

## Next Steps

Once everything is running:

1. **Explore the API** - Visit http://localhost:3000/api
2. **Check ML Docs** - Visit http://localhost:5000/docs
3. **Use the Mobile App** - Register, explore predictions, try gematria
4. **Read the docs:**
   - `README.md` - Project overview
   - `SETUP.md` - Detailed setup
   - `PROJECT_SUMMARY.md` - Complete feature list

---

## Development Workflow

**Watch Logs:**
- Backend: Check the terminal window
- ML Service: Check the terminal window
- Docker: `docker-compose logs -f`

**Restart Services:**
- Backend: Ctrl+C in terminal, then `npm run dev`
- ML Service: Ctrl+C in terminal, then `python app.py`
- Databases: `docker-compose restart`

**Stop Everything:**
```bash
# Stop Docker services
docker-compose down

# Stop all running terminals (Ctrl+C in each)
```

---

## Mobile App on Your Phone

1. Install "Expo Go" app from App/Play Store
2. Make sure your phone and computer are on same WiFi
3. Scan the QR code from Expo
4. App will load on your phone

---

## Need Help?

- Check `SETUP.md` for detailed documentation
- Check `PROJECT_SUMMARY.md` for features
- Review error logs in terminal windows
- Make sure all prerequisites are installed

**Happy predicting! 🏈**
