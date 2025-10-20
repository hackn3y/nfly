# NFL Predictor - Scripts Guide

Quick reference for all batch scripts to manage your NFL Predictor application.

---

## 🚀 Quick Start

### Start Everything
```bash
start-all.bat
```
This will:
1. ✅ Check if Docker is running
2. ✅ Start Docker containers (PostgreSQL, MongoDB, Redis, ML Service)
3. ✅ Check and free ports if needed (4100, 8100)
4. ✅ Start Backend API (port 4100)
5. ✅ Start Mobile App (port 8100)
6. ✅ Run health checks
7. ✅ Display all URLs and test credentials

**New Features:**
- 🔍 Automatic Docker check
- 🔧 Automatic port conflict resolution
- 🏥 Health checks for all services
- 🎨 Color-coded output (green = success, red = error)
- 📋 Shows test account credentials
- 🪟 Better window titles for easy identification

---

## 🛑 Stop Everything
```bash
stop-all.bat
```
This will:
1. ✅ Close Backend API and Mobile App windows
2. ✅ Kill processes on ports 4100, 8100, 8081
3. ✅ Stop Docker containers
4. ✅ Optional: Remove data volumes (asks for confirmation)
5. ✅ Verify everything stopped correctly

**New Features:**
- 🎯 Targets only NFL Predictor processes (won't kill other projects)
- ⚠️ Optional data cleanup (asks before deleting)
- ✔️ Verification checks
- 🔍 Shows warnings if something didn't stop

---

## 📊 Check Status
```bash
status.bat
```
Interactive status checker and quick launcher.

**Shows:**
- 🐳 Docker status
- 📦 Container status (PostgreSQL, MongoDB, Redis, ML Service)
- 🌐 Backend API status and health
- 🤖 ML Service status and health
- 📱 Mobile App status
- 💾 Database ports (5432, 27017, 6379)

**Quick Actions:**
- [1] Start all services
- [2] Stop all services
- [3] Restart services
- [4] View logs
- [5] Open admin dashboard
- [6] Open mobile app
- [R] Refresh status
- [Q] Quit

**New Features:**
- 🔄 Real-time status checking
- 🏥 Health check integration
- 🎯 Quick actions menu
- 🌐 One-click browser launch

---

## 📝 Script Details

### start-all.bat

**What it starts:**
| Service | Port | URL |
|---------|------|-----|
| Backend API | 4100 | http://localhost:4100 |
| Admin Dashboard | 4100 | http://localhost:4100/admin.html |
| ML Service | 5000 | http://localhost:5000 |
| Mobile App | 8100 | http://localhost:8100 |
| PostgreSQL | 5432 | localhost:5432 |
| MongoDB | 27017 | localhost:27017 |
| Redis | 6379 | localhost:6379 |

**Prerequisites:**
- ✅ Docker Desktop installed and running
- ✅ Node.js installed
- ✅ npm packages installed (`npm install` in root)

**What happens if something fails:**
- Docker not running → Shows error, exits
- Port in use → Automatically kills process and retries
- Container fails → Shows error, continues with other services
- Service not responding → Shows warning, continues

**Color codes:**
- 🟢 Green (0A) = Success
- 🔵 Blue (0B) = Backend API window
- 🟡 Yellow (0E) = Mobile App window
- 🔴 Red (0C) = Errors

---

### stop-all.bat

**What it stops:**
1. Backend API window (by title)
2. Mobile App window (by title)
3. Processes on port 4100 (Backend)
4. Processes on port 8100 (Mobile App)
5. Processes on port 8081 (Metro bundler)
6. Docker containers

**Safe shutdown:**
- ✅ Only kills NFL Predictor processes
- ✅ Won't affect other projects
- ✅ Preserves data by default
- ✅ Asks before deleting volumes

**Data cleanup options:**
```
Do you want to remove Docker volumes (deletes all data)? (y/N):
```
- Type `y` → Removes all database data
- Type `n` or Enter → Keeps all data

**Verification:**
After stopping, checks:
- Port 4100 is free
- Port 8100 is free
- No NFL containers running

---

### status.bat

**Real-time monitoring:**
- Updates on demand (press R to refresh)
- Health checks via HTTP
- Port scanning
- Container inspection

**Interactive menu:**
Press number keys to execute actions immediately.

**Usage tips:**
1. Run before starting to check what's already running
2. Run after starting to verify everything started correctly
3. Use quick actions for common tasks
4. Keep it open while developing for easy monitoring

---

## 🆘 Troubleshooting

### "Docker is not running"
**Problem:** Docker Desktop is not started
**Solution:**
```bash
1. Open Docker Desktop
2. Wait for it to fully start (whale icon stops animating)
3. Run start-all.bat again
```

### "Port 4100 is already in use"
**Problem:** Backend API is already running or port is blocked
**Solution 1 (Automatic):**
```bash
# start-all.bat now handles this automatically!
# It will kill the process and retry
```
**Solution 2 (Manual):**
```bash
# Find what's using the port
netstat -ano | findstr :4100

# Kill it manually
taskkill /F /PID <PID_NUMBER>
```

### "Service not responding"
**Problem:** Service started but not healthy
**Solution:**
```bash
1. Check the terminal window for errors
2. Look for these logs:
   - "✅ PostgreSQL connected"
   - "✅ MongoDB connected"
   - "✅ Redis connected"
3. If databases not connected, wait 10 more seconds
4. If still failing, run stop-all.bat then start-all.bat
```

### "Container already exists"
**Problem:** Old containers from previous run
**Solution:**
```bash
# Remove all containers and volumes
docker-compose down -v

# Or use stop-all.bat and choose 'y' to remove volumes
```

### Services start but immediately crash
**Problem:** Missing dependencies or environment variables
**Solution:**
```bash
# Check if .env files exist
ls packages/backend/.env
ls packages/ml-service/.env

# If missing, copy from examples
cp packages/backend/.env.example packages/backend/.env

# Install dependencies
npm install
```

---

## 💡 Tips & Tricks

### Faster startup (if databases already running)
```bash
# Just start backend and mobile
cd packages/backend
start cmd /k "npm run dev"

cd ../mobile
start cmd /k "npx expo start --port 8100"
```

### View real-time logs
```bash
# Backend logs
docker logs -f nfl-backend

# ML Service logs
docker logs -f nfl-ml-service

# All containers
docker-compose logs -f
```

### Quick restart just one service
```bash
# Restart Backend only
taskkill /F /FI "WINDOWTITLE eq *Backend API*"
cd packages/backend && npm run dev

# Restart Mobile only
taskkill /F /FI "WINDOWTITLE eq *Mobile App*"
cd packages/mobile && npx expo start --port 8100
```

### Database access
```bash
# PostgreSQL
docker exec -it nfl-postgres psql -U nfl_user -d nfl_predictions

# MongoDB
docker exec -it nfl-mongodb mongosh

# Redis
docker exec -it nfl-redis redis-cli
```

### Clean slate (nuclear option)
```bash
# Stop everything and remove all data
stop-all.bat
# Choose 'y' when asked about volumes

# Remove Docker images too
docker-compose down -v --rmi all

# Then start fresh
start-all.bat
```

---

## 🎯 Common Workflows

### Daily Development
```bash
# Morning
start-all.bat

# Work on code...

# Evening
stop-all.bat
# Choose 'n' to keep data
```

### Testing Changes
```bash
# Make code changes

# Restart affected service
# (Backend changes)
taskkill /F /FI "WINDOWTITLE eq *Backend*"
cd packages/backend && npm run dev

# OR full restart
stop-all.bat
start-all.bat
```

### Demo/Presentation
```bash
# Start everything
start-all.bat

# Open browsers
start http://localhost:4100/admin.html
start http://localhost:8100

# Check status
status.bat
```

### Fresh Database
```bash
# Stop with cleanup
stop-all.bat
# Choose 'y' to remove volumes

# Start fresh
start-all.bat

# Re-seed data
cd packages/backend
npm run seed
```

---

## 📚 Related Documentation

- **README.md** - Main project documentation
- **QUICKSTART.md** - Getting started guide
- **DEPLOYMENT_GUIDE.md** - Production deployment
- **IMPLEMENTATION_COMPLETE.md** - Feature list
- **PROJECT_STATUS.md** - Current status

---

## 🔗 Quick Links

After starting services:

| Service | URL |
|---------|-----|
| Mobile App | http://localhost:8100 |
| Backend API | http://localhost:4100/api |
| Admin Dashboard | http://localhost:4100/admin.html |
| ML Service Docs | http://localhost:5000/docs |
| Backend Health | http://localhost:4100/health |
| ML Health | http://localhost:5000/health |

**Test Account:**
- Email: `test@nflpredictor.com`
- Password: `password123`

---

**Last Updated:** October 20, 2025
**Scripts Version:** 2.0
